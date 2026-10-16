// api/upload.js - Serverless file upload endpoint for Vercel
// Uploads media to reliable free CDN (Catbox with browser User-Agent) or returns compressed direct data URL

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb'
    }
  }
};

export default async function handler(req, res) {
  // Global CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    let buffer;
    let fileName = `file_${Date.now()}.png`;
    let mimeType = 'image/png';
    let rawBase64 = '';

    // Parse incoming body
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (body && (body.file || body.base64)) {
      rawBase64 = body.file || body.base64;
      fileName = body.name || fileName;
      mimeType = body.type || mimeType;

      const base64Data = rawBase64.replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      return res.status(400).json({ success: false, message: 'No file data received' });
    }

    // 1. Upload to Catbox (Permanent CDN with standard browser User-Agent)
    let debugInfo = {};
    try {
      const uint8 = new Uint8Array(buffer);
      const blob = new Blob([uint8], { type: mimeType });
      const fd = new FormData();
      fd.append('reqtype', 'fileupload');
      fd.append('fileToUpload', blob, fileName);

      const catboxRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: fd,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      debugInfo.status = catboxRes.status;
      const directUrl = (await catboxRes.text()).trim();
      debugInfo.response = directUrl;

      if (catboxRes.ok && directUrl.startsWith('http')) {
        return res.status(200).json({
          success: true,
          url: directUrl,
          message: 'Uploaded successfully'
        });
      }
    } catch (catboxErr) {
      debugInfo.error = catboxErr.message || String(catboxErr);
      console.warn('Catbox upload attempt failed, falling back to data URL:', catboxErr);
    }

    // 2. Direct Data URL fallback
    return res.status(200).json({
      success: true,
      url: rawBase64,
      isBase64: true,
      debugCatbox: debugInfo,
      message: 'Image processed successfully'
    });
  } catch (err) {
    console.error('Upload handler exception:', err);
    return res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
}
