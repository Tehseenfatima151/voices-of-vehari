import React, { useState, useRef, useEffect } from 'react';
import { isGoogleDriveUrl, extractGoogleDriveId, formatAudioUrl } from '../utils/mediaUrlHelper';
import { resolveMediaReference } from '../services/api';

export const AudioPlayer = ({
  src,
  title = '',
  placeholderText = 'Connect the final recording here'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState(() => formatAudioUrl(src));
  const audioRef = useRef(null);

  // Asynchronously resolve media: references if not already cached
  useEffect(() => {
    let active = true;
    const resolve = async () => {
      const raw = (src || '').trim();
      if (raw.startsWith('media:')) {
        const full = await resolveMediaReference(raw);
        if (active) setResolvedSrc(formatAudioUrl(full));
      } else {
        if (active) setResolvedSrc(formatAudioUrl(raw));
      }
    };
    resolve();
    return () => {
      active = false;
    };
  }, [src]);

  // If no audio is attached yet, display the placeholder
  const activeAudioUrl = (resolvedSrc || src || '').trim();
  if (!activeAudioUrl) {
    return (
      <div className="audio">
        <div className="audio-row">
          <button
            className="play"
            type="button"
            onClick={() => alert('Recording placeholder: No audio recording attached yet. Add audio via the Admin Panel!')}
            aria-label="No audio file"
            style={{ opacity: 0.65 }}
          >
            ▶
          </button>
          <div>
            <strong>Audio placeholder</strong>
            <div style={{ color: 'var(--muted)', fontSize: '13px' }}>
              {placeholderText}
            </div>
          </div>
          <div className="wave"></div>
        </div>
      </div>
    );
  }

  const trimmed = activeAudioUrl;
  const isDrive = isGoogleDriveUrl(trimmed);
  const driveId = isDrive ? extractGoogleDriveId(trimmed) : null;

  // Google Drive Audio: Render Google's native embedded streaming player (zero CORS errors, native scrubber)
  if (isDrive && driveId) {
    return (
      <div
        className="audio audio-drive-embed"
        style={{
          padding: '12px 14px',
          background: '#f8fafc',
          borderRadius: '16px',
          border: '1px solid var(--line, #dfe8f1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🎙️</span>
            <div>
              <strong style={{ fontSize: '13.5px', color: 'var(--navy)', display: 'block', lineHeight: 1.2 }}>
                {title ? `${title}` : 'Episode Audio Recording'}
              </strong>
              <span style={{ fontSize: '11px', color: '#0984e3', fontWeight: 600 }}>
                Google Drive Audio Stream
              </span>
            </div>
          </div>
          <a
            href={`https://drive.google.com/file/d/${driveId}/view`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn ghost sm"
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              height: 'auto',
              background: '#fff',
              whiteSpace: 'nowrap',
            }}
            title="Open recording in Google Drive"
          >
            Open in Drive ↗
          </a>
        </div>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '165px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            background: '#000000',
          }}
        >
          <iframe
            src={`https://drive.google.com/file/d/${driveId}/preview`}
            width="100%"
            height="165"
            frameBorder="0"
            allow="autoplay"
            style={{
              width: '100%',
              height: '165px',
              border: 0,
              display: 'block',
              background: '#000000',
            }}
            title={title || 'Google Drive Audio Stream'}
          />
        </div>
      </div>
    );
  }

  // Direct Audio URL (MP3, WAV, Catbox CDN, Uploaded file)
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Audio play prevented:', e);
        setIsPlaying(false);
      });
    }
  };

  return (
    <div className="audio">
      <div className="audio-row">
        <button
          className="play"
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <div>
          <strong style={{ display: 'block', fontSize: '14px', color: 'var(--navy)' }}>
            {isPlaying ? 'Playing episode recording...' : (title || 'Episode Audio')}
          </strong>
          <div style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '2px' }}>
            {isPlaying ? 'Click to pause' : (trimmed.startsWith('media:') ? 'Loading audio...' : 'Click to play recording')}
          </div>
        </div>
        <div className={`wave ${isPlaying ? 'playing' : ''}`}></div>
      </div>
      <audio
        ref={audioRef}
        src={trimmed}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onError={(e) => {
          console.warn('Audio playback error:', e);
          setIsPlaying(false);
        }}
        preload="metadata"
      />
    </div>
  );
};

export default AudioPlayer;
