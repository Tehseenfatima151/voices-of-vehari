/**
 * Helper utilities for formatting and resolving Google Drive and YouTube media URLs.
 */

/**
 * Extracts Google Drive file ID from various Drive URL formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://drive.google.com/uc?export=view&id=FILE_ID
 * - https://lh3.googleusercontent.com/d/FILE_ID
 */
/**
 * Checks if a given URL is a Google Drive link.
 */
export const isGoogleDriveUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('/') || trimmed.startsWith('file:')) {
    return false;
  }
  return /drive\.google\.com|googleusercontent\.com|docs\.google\.com/.test(trimmed);
};

export const extractGoogleDriveId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('/') || trimmed.startsWith('file:')) {
    return null;
  }

  // Must be a Google domain to extract drive ID
  if (!isGoogleDriveUrl(trimmed)) {
    return null;
  }

  // /file/d/FILE_ID or /d/FILE_ID
  const matchD = trimmed.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) return matchD[1];

  // ?id=FILE_ID or &id=FILE_ID
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) return matchId[1];

  return null;
};

/**
 * Converts a Google Drive share link to direct viewable image stream URL.
 * https://lh3.googleusercontent.com/d/FILE_ID serves public Drive images directly.
 */
export const getGoogleDriveImageUrl = (url) => {
  const fileId = extractGoogleDriveId(url);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return url;
};

/**
 * Converts a Google Drive link to thumbnail image URL.
 */
export const getGoogleDriveThumbnailUrl = (url, size = 1200) => {
  const fileId = extractGoogleDriveId(url);
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
  }
  return url;
};

/**
 * Converts a Google Drive link to preview embed URL suitable for iframes.
 */
export const getGoogleDriveVideoEmbedUrl = (url) => {
  const fileId = extractGoogleDriveId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return url;
};

/**
 * Converts a Google Drive link to direct audio stream URL.
 */
export const getGoogleDriveAudioUrl = (url) => {
  const fileId = extractGoogleDriveId(url);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  return url;
};

/**
 * Extracts YouTube Video ID from various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
export const extractYouTubeId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
};

/**
 * Checks if a given URL is a YouTube link.
 */
export const isYouTubeUrl = (url) => {
  return !!extractYouTubeId(url);
};

/**
 * Generates direct YouTube thumbnail URL.
 */
export const getYouTubeThumbnail = (url, quality = 'hqdefault') => {
  const id = extractYouTubeId(url);
  if (id) {
    return `https://img.youtube.com/vi/${id}/${quality}.jpg`;
  }
  return null;
};

/**
 * Generates responsive YouTube embed iframe URL.
 */
export const getYouTubeEmbedUrl = (url) => {
  const id = extractYouTubeId(url);
  if (id) {
    return `https://www.youtube.com/embed/${id}?rel=0`;
  }
  return null;
};

// In-memory cache for media items
let mediaCache = {};

export const setMediaCache = (items) => {
  if (Array.isArray(items)) {
    items.forEach((item) => {
      if (item && item.id && item.public_url) {
        mediaCache[String(item.id)] = item.public_url;
        mediaCache[`media:${item.id}`] = item.public_url;
      }
    });
  }
};

/**
 * Client-side Canvas image compressor.
 * Downscales images to suitable dimensions (maxWidth) and compresses quality,
 * resulting in lightweight WebP or JPEG (~20KB - 60KB).
 */
export const compressImageFile = (file, maxWidth = 1000, quality = 0.8) => {
  return new Promise((resolve) => {
    if (!file || typeof file !== 'object' || !file.type || !file.type.startsWith('image/')) {
      if (typeof file === 'string') return resolve(file);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mime, quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result || '');
      img.src = e.target.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

/**
 * General purpose formatter for image URLs.
 * Resolves media:id, Google Drive links, and direct URLs.
 */
export const formatImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // If it's a media reference (media:12)
  if (trimmed.startsWith('media:')) {
    if (mediaCache[trimmed]) return mediaCache[trimmed];
    const id = trimmed.replace('media:', '');
    if (mediaCache[id]) return mediaCache[id];

    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('vov_cms_media');
        if (raw) {
          const list = JSON.parse(raw);
          const found = list.find((m) => String(m.id) === id);
          if (found && found.public_url) {
            mediaCache[trimmed] = found.public_url;
            return found.public_url;
          }
        }
      } catch (_) {}
    }
    return trimmed;
  }

  if (isGoogleDriveUrl(trimmed)) {
    return getGoogleDriveImageUrl(trimmed);
  }
  return trimmed;
};

/**
 * General purpose formatter for audio URLs.
 * If given a Google Drive link, converts to playable audio stream.
 */
export const formatAudioUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (isGoogleDriveUrl(url)) {
    return getGoogleDriveAudioUrl(url);
  }
  return url;
};

/**
 * General purpose resolver for video embed URLs (YouTube or Google Drive).
 * Returns an embed URL suitable for <iframe> or null if unsupported.
 */
export const getVideoEmbedUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (isYouTubeUrl(url)) {
    return getYouTubeEmbedUrl(url);
  }
  if (isGoogleDriveUrl(url)) {
    return getGoogleDriveVideoEmbedUrl(url);
  }
  return null;
};
