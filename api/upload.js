// api/upload.js - Serverless file upload endpoint for Vercel
// Uploads media to reliable free CDN (Catbox / tmpfiles) and returns permanent direct URL

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
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

    // Parse incoming body
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (body && (body.file || body.base64)) {
      const raw = body.file || body.base64;
      fileName = body.name || fileName;
      mimeType = body.type || mimeType;

      // Extract raw base64 data
      const base64Data = raw.replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      return res.status(400).json({ success: false, message: 'No file data received' });
    }

    // 1. Primary: Upload to Catbox (permanent, fast CDN)
    try {
      const fd = new FormData();
      fd.append('reqtype', 'fileupload');
      fd.append('fileToUpload', new Blob([buffer], { type: mimeType }), fileName);

      const catboxRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: fd
      });

      if (catboxRes.ok) {
        const directUrl = (await catboxRes.text()).trim();
        if (directUrl && directUrl.startsWith('http')) {
          return res.status(200).json({
            success: true,
            url: directUrl,
            message: 'Uploaded successfully'
          });
        }
      }
    } catch (catboxErr) {
      console.warn('Catbox upload attempt failed, falling back:', catboxErr);
    }

    // 2. Secondary fallback: tmpfiles.org
    try {
      const tmpFd = new FormData();
      tmpFd.append('file', new Blob([buffer], { type: mimeType }), fileName);
      const tmpRes = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: tmpFd
      });
      if (tmpRes.ok) {
        const tmpData = await tmpRes.json();
        if (tmpData?.data?.url) {
          const directUrl = tmpData.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
          return res.status(200).json({
            success: true,
            url: directUrl,
            message: 'Uploaded successfully'
          });
        }
      }
    } catch (tmpErr) {
      console.warn('Tmpfiles upload attempt failed:', tmpErr);
    }

    return res.status(500).json({ success: false, message: 'All upload mirrors were unreachable' });
  } catch (err) {
    console.error('Upload handler exception:', err);
    return res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
}
