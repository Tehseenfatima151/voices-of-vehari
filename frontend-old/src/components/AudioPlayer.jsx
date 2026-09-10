import React, { useState, useRef } from 'react';

export const AudioPlayer = ({ src, placeholderText = 'Connect the final recording here' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!src) {
      alert('Recording placeholder: No audio file attached yet. Upload audio via the Admin Panel!');
      return;
    }

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
        <button className="play" type="button" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <div>
          <strong>{src ? (isPlaying ? 'Playing episode' : 'Episode Audio') : 'Audio placeholder'}</strong>
          <div style={{ color: 'var(--muted)', fontSize: '13px' }}>
            {src ? 'Click to play / pause' : placeholderText}
          </div>
        </div>
        <div className={`wave ${isPlaying ? 'playing' : ''}`}></div>
      </div>
      {src && (
        <audio
          ref={audioRef}
          src={src}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          preload="metadata"
        />
      )}
    </div>
  );
};

export default AudioPlayer;
