import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev middleware to handle /api/upload directly to Catbox CDN without needing a backend server on localhost
const devUploadPlugin = () => ({
  name: 'dev-upload-handler',
  configureServer(server) {
    server.middlewares.use('/api/upload', (req, res) => {
      if (req.method === 'POST') {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString());
            const rawBase64 = body.file || body.base64;
            let fileName = body.name || `media_${Date.now()}.mp3`;
            let mimeType = body.type || 'audio/mpeg';

            if (mimeType.includes('audio') || mimeType.includes('video/mpeg') || fileName.endsWith('.mp3')) {
              mimeType = 'audio/mpeg';
              if (!fileName.endsWith('.mp3') && !fileName.endsWith('.wav') && !fileName.endsWith('.ogg')) {
                fileName += '.mp3';
              }
            }

            const base64Data = rawBase64.replace(/^data:[^;]+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
            const fd = new FormData();
            fd.append('reqtype', 'fileupload');
            fd.append('fileToUpload', blob, fileName);

            const catRes = await fetch('https://catbox.moe/user/api.php', {
              method: 'POST',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
              },
              body: fd
            });

            const directUrl = (await catRes.text()).trim();
            if (catRes.ok && directUrl.startsWith('http')) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: true, url: directUrl, message: 'Uploaded successfully' }));
            }

            // Fallback to data URI with audio/mpeg
            const audioDataUri = rawBase64.replace(/^data:video\/[^;]+;/, 'data:audio/mpeg;');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, url: audioDataUri, isBase64: true }));
          } catch (err) {
            console.error('Dev upload error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
        });
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devUploadPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api/health': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      }
    }
  }
})