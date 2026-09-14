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
export const extractGoogleDriveId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // /file/d/FILE_ID or /d/FILE_ID
  const matchD = trimmed.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) return matchD[1];

  // ?id=FILE_ID or &id=FILE_ID
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) return matchId[1];

  return null;
};

/**
 * Checks if a given URL is a Google Drive link.
 */
export const isGoogleDriveUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /drive\.google\.com|googleusercontent\.com/.test(url);
};

/**
 * Converts a Google Drive share link to direct viewable image stream URL.
 * https://lh3.googleusercontent.com/d/FILE_ID serves public Drive images without CORS issues.
 */
export const getGoogleDriveImageUrl = (url) => {
  const fileId = extractGoogleDriveId(url);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
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

/**
 * General purpose formatter for image URLs.
 * If given a Google Drive link, converts to direct image URL.
 * Otherwise returns original URL.
 */
export const formatImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (isGoogleDriveUrl(url)) {
    return getGoogleDriveImageUrl(url);
  }
  return url;
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
