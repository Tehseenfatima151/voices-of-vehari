import React, { useState, useEffect } from 'react';
import api from '../services/api';
import fallbackData from '../services/fallbackData';
import { useToast } from '../context/ToastContext';
import AudioPlayer from '../components/AudioPlayer';
import { formatAudioUrl, isGoogleDriveUrl } from '../utils/mediaUrlHelper';

export const AudioTranscriptsManager = () => {
  const [activeTab, setActiveTab] = useState('episodes'); // 'episodes' | 'transcripts' | 'settings'
  const [loading, setLoading] = useState(true);
  const [podcasts, setPodcasts] = useState([]);
  const [pageData, setPageData] = useState({
    hero_eyebrow: 'Audio & transcripts',
    hero_title: 'Listen to the voice. Read the words. Practise the language.',
    hero_subtitle: 'Pair every recording with an accessible transcript and learning layer.',
    model_title: 'One episode, four learning layers.',
    model_points: [
      'Original conversation — preserve the authentic exchange.',
      'English version — support comprehension and comparison.',
      'Vocabulary — highlight useful words and phrases.',
      'Practice — add listening, speaking and reflection activities.',
    ],
    publishing_title: 'Publishing note',
    publishing_note: 'Full transcripts are verified and checked by the project team. Use this archive to listen, compare languages, and practice English conversational skills.',
    transcripts: {},
  });

  // Selected episode for transcript editing
  const [selectedPodcastId, setSelectedPodcastId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [savingTranscript, setSavingTranscript] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Active transcript form state
  const [transcriptForm, setTranscriptForm] = useState({
    original_text: '',
    english_text: '',
    vocabulary: [],
    practice_questions: [],
  });

  const { addToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [podList, audioData] = await Promise.all([
        api.getAdminPodcasts(),
        api.getAudioTranscripts(),
      ]);

      const sortedPods = Array.isArray(podList) ? podList : fallbackData.podcasts;
      setPodcasts(sortedPods);

      const mergedData = {
        ...fallbackData.audioTranscripts,
        ...(audioData || {}),
        transcripts: {
          ...(fallbackData.audioTranscripts?.transcripts || {}),
          ...(audioData?.transcripts || {}),
        },
      };
      setPageData(mergedData);

      if (sortedPods.length > 0 && !selectedPodcastId) {
        const firstId = sortedPods[0].id;
        setSelectedPodcastId(firstId);
        loadTranscriptIntoForm(firstId, mergedData.transcripts);
      }
    } catch (err) {
      console.warn('Error loading Audio & Transcripts data:', err);
      setPodcasts(fallbackData.podcasts);
      setPageData(fallbackData.audioTranscripts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadTranscriptIntoForm = (podId, allTranscripts) => {
    const tMap = allTranscripts || pageData.transcripts || {};
    const existing = tMap[podId] || tMap[String(podId)] || {};
    setTranscriptForm({
      original_text: existing.original_text || '',
      english_text: existing.english_text || '',
      vocabulary: Array.isArray(existing.vocabulary) ? existing.vocabulary : [],
      practice_questions: Array.isArray(existing.practice_questions) ? existing.practice_questions : [],
    });
  };

  const handleSelectPodcastForTranscript = (podId) => {
    setSelectedPodcastId(podId);
    loadTranscriptIntoForm(podId, pageData.transcripts);
  };

  // Direct Audio URL change for a podcast
  const handleAudioUrlChange = (podcastId, newUrl) => {
    setPodcasts((prev) =>
      prev.map((p) => (p.id === podcastId ? { ...p, audio_url: newUrl } : p))
    );
  };

  // Save podcast audio url
  const handleSaveAudioUrl = async (podcast) => {
    try {
      await api.updatePodcast(podcast.id, {
        audio_url: formatAudioUrl(podcast.audio_url),
      });
      addToast(`Audio for "${podcast.title}" saved successfully!`, 'success');
    } catch (err) {
      addToast('Failed to save audio URL: ' + (err.message || 'Error'), 'error');
    }
  };

  // Audio file upload from computer
  const handleAudioFileUpload = async (podcastId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingId(podcastId);
    try {
      const res = await api.uploadMedia(file, `Audio recording for podcast ${podcastId}`);
      if (res.success && res.data) {
        const directAudioUrl = res.data.public_url;
        setPodcasts((prev) =>
          prev.map((p) => (p.id === podcastId ? { ...p, audio_url: directAudioUrl } : p))
        );
        // Also auto-save to podcast record
        await api.updatePodcast(podcastId, { audio_url: directAudioUrl });
        addToast('Audio file uploaded and saved to episode!', 'success');
      } else {
        addToast(res.message || 'Upload failed', 'error');
      }
    } catch (err) {
      addToast('Upload failed: ' + (err.message || 'Error'), 'error');
    } finally {
      setUploadingId(null);
    }
  };

  // Vocabulary handlers
  const handleAddVocab = () => {
    setTranscriptForm((prev) => ({
      ...prev,
      vocabulary: [
        ...prev.vocabulary,
        { term: '', urdu: '', note: '' },
      ],
    }));
  };

  const handleUpdateVocab = (idx, key, val) => {
    setTranscriptForm((prev) => {
      const nextVocab = [...prev.vocabulary];
      nextVocab[idx] = { ...nextVocab[idx], [key]: val };
      return { ...prev, vocabulary: nextVocab };
    });
  };

  const handleRemoveVocab = (idx) => {
    setTranscriptForm((prev) => ({
      ...prev,
      vocabulary: prev.vocabulary.filter((_, i) => i !== idx),
    }));
  };

  // Practice questions handlers
  const handleAddQuestion = () => {
    setTranscriptForm((prev) => ({
      ...prev,
      practice_questions: [...prev.practice_questions, ''],
    }));
  };

  const handleUpdateQuestion = (idx, val) => {
    setTranscriptForm((prev) => {
      const nextQ = [...prev.practice_questions];
      nextQ[idx] = val;
      return { ...prev, practice_questions: nextQ };
    });
  };

  const handleRemoveQuestion = (idx) => {
    setTranscriptForm((prev) => ({
      ...prev,
      practice_questions: prev.practice_questions.filter((_, i) => i !== idx),
    }));
  };

  // Save transcript for current podcast
  const handleSaveCurrentTranscript = async () => {
    if (!selectedPodcastId) return;
    setSavingTranscript(true);

    const currentPod = podcasts.find((p) => p.id === selectedPodcastId);
    const updatedTranscripts = {
      ...(pageData.transcripts || {}),
      [selectedPodcastId]: {
        episode_id: selectedPodcastId,
        title: currentPod ? currentPod.title : '',
        guest: currentPod ? currentPod.guest : '',
        ...transcriptForm,
      },
    };

    const nextPayload = {
      ...pageData,
      transcripts: updatedTranscripts,
    };

    try {
      const res = await api.updateAudioTranscripts(nextPayload);
      if (res.success) {
        setPageData(nextPayload);
        addToast('Transcript layers updated successfully in database!', 'success');
      } else {
        addToast(res.message || 'Failed to save transcript', 'error');
      }
    } catch (err) {
      addToast('Error saving transcript: ' + (err.message || 'Error'), 'error');
    } finally {
      setSavingTranscript(false);
    }
  };

  // Save Page Settings
  const handleSavePageSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await api.updateAudioTranscripts(pageData);
      if (res.success) {
        addToast('Audio & Transcripts page settings saved!', 'success');
      } else {
        addToast(res.message || 'Failed to save settings', 'error');
      }
    } catch (err) {
      addToast('Error saving settings: ' + (err.message || 'Error'), 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        Loading Audio & Transcripts Manager...
      </div>
    );
  }

  const selectedPod = podcasts.find((p) => p.id === selectedPodcastId) || podcasts[0];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '24px' }}>🎧</span>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
              Audio & Transcripts Manager
            </h2>
          </div>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '14px' }}>
            Manage direct audio recordings, Google Drive audio streaming, and 4-layer interactive transcripts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href="/#audio-transcripts"
            target="_blank"
            rel="noreferrer"
            className="btn ghost sm"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>↗</span> Preview Public Page
          </a>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '24px',
          paddingBottom: '2px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('episodes')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 700,
            borderRadius: '8px 8px 0 0',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeTab === 'episodes' ? '#1e3a5f' : 'transparent',
            color: activeTab === 'episodes' ? '#ffffff' : '#64748b',
          }}
        >
          🎙️ Episode Audio & Uploads ({podcasts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transcripts')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 700,
            borderRadius: '8px 8px 0 0',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeTab === 'transcripts' ? '#1e3a5f' : 'transparent',
            color: activeTab === 'transcripts' ? '#ffffff' : '#64748b',
          }}
        >
          📝 4-Layer Transcripts
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 700,
            borderRadius: '8px 8px 0 0',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeTab === 'settings' ? '#1e3a5f' : 'transparent',
            color: activeTab === 'settings' ? '#ffffff' : '#64748b',
          }}
        >
          ⚙️ Page Settings & Headings
        </button>
      </div>

      {/* ================= TAB 1: EPISODE AUDIO & UPLOADS ================= */}
      {activeTab === 'episodes' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <div
            style={{
              padding: '14px 18px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '10px',
              color: '#0369a1',
              fontSize: '13px',
              lineHeight: 1.6,
            }}
          >
            <strong>💡 Audio Guide:</strong> You can provide direct MP3/WAV links, paste a Google Drive public audio link, or upload audio files directly from your computer. Google Drive links are automatically converted to responsive streaming preview players!
          </div>

          {podcasts.map((pod, idx) => {
            const isDrive = isGoogleDriveUrl(pod.audio_url);
            const isUploading = uploadingId === pod.id;

            return (
              <div
                key={pod.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--amber)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Episode {idx + 1} • {pod.category || 'General'}
                    </span>
                    <h3 style={{ margin: '4px 0 2px', fontSize: '18px', fontWeight: 800, color: 'var(--navy)' }}>
                      {pod.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                      Guest: <strong>{pod.guest || 'None specified'}</strong> {pod.host ? `• Host: ${pod.host}` : ''}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => {
                        handleSelectPodcastForTranscript(pod.id);
                        setActiveTab('transcripts');
                      }}
                    >
                      ✏️ Edit Transcript
                    </button>
                    <button
                      type="button"
                      className="btn primary sm"
                      onClick={() => handleSaveAudioUrl(pod)}
                    >
                      💾 Save Audio
                    </button>
                  </div>
                </div>

                {/* Audio URL Input and File Upload */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Audio Source URL (Direct MP3, Google Drive link, or Upload)
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      className="form-control"
                      style={{ flex: 1, minWidth: '260px' }}
                      value={pod.audio_url || ''}
                      onChange={(e) => handleAudioUrlChange(pod.id, e.target.value)}
                      placeholder="e.g. https://drive.google.com/file/d/... or https://.../audio.mp3"
                    />

                    <label
                      className="btn ghost sm"
                      style={{
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: isUploading ? '#e2e8f0' : '#ffffff',
                      }}
                    >
                      {isUploading ? (
                        <>
                          <span className="spinner sm" style={{ width: '14px', height: '14px' }} />
                          Uploading...
                        </>
                      ) : (
                        <>📁 Upload Audio File</>
                      )}
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav,.ogg,.m4a"
                        disabled={isUploading}
                        style={{ display: 'none' }}
                        onChange={(e) => handleAudioFileUpload(pod.id, e)}
                      />
                    </label>

                    {pod.audio_url && (
                      <button
                        type="button"
                        onClick={() => handleAudioUrlChange(pod.id, '')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#d63031',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '0 8px',
                        }}
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div style={{ fontSize: '11px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isDrive ? (
                      <span style={{ color: '#0984e3', fontWeight: 600 }}>
                        ✓ Google Drive audio detected. Native streaming preview enabled.
                      </span>
                    ) : pod.audio_url ? (
                      <span style={{ color: '#27ae60', fontWeight: 600 }}>
                        ✓ Direct audio file detected. HTML5 waveform player enabled.
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>
                        No audio configured. Public site will show audio placeholder.
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Audio Player Preview */}
                <div
                  style={{
                    padding: '12px 14px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Live Player Preview
                  </div>
                  <AudioPlayer src={formatAudioUrl(pod.audio_url)} title={pod.title} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= TAB 2: INTERACTIVE 4-LAYER TRANSCRIPTS ================= */}
      {activeTab === 'transcripts' && (
        <div>
          {/* Episode Selector */}
          <div
            style={{
              background: '#ffffff',
              padding: '18px 22px',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
              <label style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '14px', whiteSpace: 'nowrap' }}>
                Select Episode:
              </label>
              <select
                className="form-control"
                style={{ flex: 1 }}
                value={selectedPodcastId || ''}
                onChange={(e) => handleSelectPodcastForTranscript(Number(e.target.value) || e.target.value)}
              >
                {podcasts.map((pod, idx) => (
                  <option key={pod.id} value={pod.id}>
                    Episode {idx + 1}: {pod.title} {pod.guest ? `(${pod.guest})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="btn primary"
              disabled={savingTranscript}
              onClick={handleSaveCurrentTranscript}
              style={{ minWidth: '170px' }}
            >
              {savingTranscript ? 'Saving...' : '💾 Save Transcript'}
            </button>
          </div>

          {selectedPod && (
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Mini Audio Bar so editor can listen while transcribing */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>
                    🎧 Listen while transcribing: {selectedPod.title}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    Guest: {selectedPod.guest || 'None'}
                  </span>
                </div>
                <AudioPlayer src={formatAudioUrl(selectedPod.audio_url)} title={selectedPod.title} />
              </div>

              {/* Layer 1: Original Conversation */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--navy)' }}>
                      Layer 1: Original Conversation (Punjabi / Urdu / Saraiki)
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                      Preserve the authentic regional speech, dialogue exchanges, and local idioms.
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    Authentic Speech
                  </span>
                </div>
                <textarea
                  rows="6"
                  className="form-control"
                  style={{ fontFamily: 'inherit', fontSize: '14px', lineHeight: 1.6 }}
                  placeholder="Paste or write the original exchange in Urdu/Punjabi..."
                  value={transcriptForm.original_text}
                  onChange={(e) => setTranscriptForm({ ...transcriptForm, original_text: e.target.value })}
                />
              </div>

              {/* Layer 2: English Version */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--navy)' }}>
                      Layer 2: English Version (Translation & Comprehension)
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                      Accessible English translation to assist classroom reading and comparative linguistic analysis.
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    Comprehension
                  </span>
                </div>
                <textarea
                  rows="6"
                  className="form-control"
                  style={{ fontFamily: 'inherit', fontSize: '14px', lineHeight: 1.6 }}
                  placeholder="Paste or write the English translation/comprehension transcript..."
                  value={transcriptForm.english_text}
                  onChange={(e) => setTranscriptForm({ ...transcriptForm, english_text: e.target.value })}
                />
              </div>

              {/* Layer 3: Key Vocabulary */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--navy)' }}>
                      Layer 3: Key Vocabulary ({transcriptForm.vocabulary.length})
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                      Highlight vocabulary words, Urdu translations, and pedagogical usage notes from this episode.
                    </p>
                  </div>
                  <button type="button" className="btn ghost sm" onClick={handleAddVocab}>
                    + Add Vocabulary Word
                  </button>
                </div>

                {transcriptForm.vocabulary.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: '13px', fontStyle: 'italic', margin: 0 }}>
                    No vocabulary words added yet for this episode. Click "+ Add Vocabulary Word" to highlight terms.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {transcriptForm.vocabulary.map((vocab, vIdx) => (
                      <div
                        key={vIdx}
                        style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          background: '#f8fafc',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <input
                          type="text"
                          className="form-control"
                          style={{ flex: 1.2 }}
                          placeholder="Term (e.g. Oral Tradition)"
                          value={vocab.term || ''}
                          onChange={(e) => handleUpdateVocab(vIdx, 'term', e.target.value)}
                        />
                        <input
                          type="text"
                          className="form-control"
                          style={{ flex: 1.2 }}
                          placeholder="Urdu / Meaning (e.g. زبانی روایات)"
                          value={vocab.urdu || ''}
                          onChange={(e) => handleUpdateVocab(vIdx, 'urdu', e.target.value)}
                        />
                        <input
                          type="text"
                          className="form-control"
                          style={{ flex: 2 }}
                          placeholder="Context Note (e.g. Passing wisdom through speech)"
                          value={vocab.note || ''}
                          onChange={(e) => handleUpdateVocab(vIdx, 'note', e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveVocab(vIdx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#d63031',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '0 6px',
                          }}
                          title="Remove Word"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Layer 4: Practice & Discussion Questions */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--navy)' }}>
                      Layer 4: Practice & Discussion Questions ({transcriptForm.practice_questions.length})
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                      Questions and speaking tasks for classroom discussion, roleplay, or reflection.
                    </p>
                  </div>
                  <button type="button" className="btn ghost sm" onClick={handleAddQuestion}>
                    + Add Discussion Question
                  </button>
                </div>

                {transcriptForm.practice_questions.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: '13px', fontStyle: 'italic', margin: 0 }}>
                    No discussion questions added yet. Click "+ Add Discussion Question" to guide student learning.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {transcriptForm.practice_questions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          background: '#f8fafc',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: 'var(--navy)', minWidth: '24px' }}>
                          Q{qIdx + 1}.
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          style={{ flex: 1 }}
                          placeholder="e.g. In your opinion, how can modern audio recordings help preserve oral history?"
                          value={q}
                          onChange={(e) => handleUpdateQuestion(qIdx, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#d63031',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '0 6px',
                          }}
                          title="Remove Question"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Save Action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn primary"
                  disabled={savingTranscript}
                  onClick={handleSaveCurrentTranscript}
                  style={{ minWidth: '200px' }}
                >
                  {savingTranscript ? 'Saving...' : '💾 Save Transcript'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: PAGE SETTINGS & HEADINGS ================= */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSavePageSettings} style={{ display: 'grid', gap: '20px' }}>
          {/* Hero Section */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800, color: 'var(--navy)' }}>
              Page Hero Header
            </h3>
            <div className="form-group">
              <label className="form-label">Hero Eyebrow</label>
              <input
                type="text"
                className="form-control"
                value={pageData.hero_eyebrow || ''}
                onChange={(e) => setPageData({ ...pageData, hero_eyebrow: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hero Title</label>
              <input
                type="text"
                className="form-control"
                value={pageData.hero_title || ''}
                onChange={(e) => setPageData({ ...pageData, hero_title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hero Subtitle</label>
              <textarea
                rows="2"
                className="form-control"
                value={pageData.hero_subtitle || ''}
                onChange={(e) => setPageData({ ...pageData, hero_subtitle: e.target.value })}
              />
            </div>
          </div>

          {/* Transcript Model Section */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800, color: 'var(--navy)' }}>
              Transcript Model Info Section
            </h3>
            <div className="form-group">
              <label className="form-label">Model Title</label>
              <input
                type="text"
                className="form-control"
                value={pageData.model_title || ''}
                onChange={(e) => setPageData({ ...pageData, model_title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Model Points (One per line)</label>
              <textarea
                rows="5"
                className="form-control"
                value={Array.isArray(pageData.model_points) ? pageData.model_points.join('\n') : ''}
                onChange={(e) =>
                  setPageData({
                    ...pageData,
                    model_points: e.target.value.split('\n').filter((l) => l.trim().length > 0),
                  })
                }
              />
            </div>
          </div>

          {/* Publishing Note Section */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800, color: 'var(--navy)' }}>
              Publishing Note Box
            </h3>
            <div className="form-group">
              <label className="form-label">Note Box Title</label>
              <input
                type="text"
                className="form-control"
                value={pageData.publishing_title || ''}
                onChange={(e) => setPageData({ ...pageData, publishing_title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Note Box Content</label>
              <textarea
                rows="3"
                className="form-control"
                value={pageData.publishing_note || ''}
                onChange={(e) => setPageData({ ...pageData, publishing_note: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn primary" disabled={savingSettings} style={{ minWidth: '180px' }}>
              {savingSettings ? 'Saving...' : '💾 Save Page Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AudioTranscriptsManager;
