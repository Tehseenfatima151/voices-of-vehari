import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AudioPlayer from '../components/AudioPlayer';
import api from '../services/api';
import fallbackData from '../services/fallbackData';
import { useToast } from '../context/ToastContext';
import {
  formatImageUrl,
  formatAudioUrl,
  getVideoEmbedUrl,
  isYouTubeUrl,
  isGoogleDriveUrl
} from '../utils/mediaUrlHelper';

export const PublicWebsite = () => {
  // Initialize with fallbackData so page renders instantaneously with zero blocking delay
  const [data, setData] = useState(fallbackData);
  const [activeTab, setActiveTab] = useState('all'); // for podcast filter
  const [audioSearch, setAudioSearch] = useState(''); // for audio transcripts search
  const [activeVideoPodcast, setActiveVideoPodcast] = useState(null); // for video modal
  const [selectedTeacherCategory, setSelectedTeacherCategory] = useState('All'); // for teacher guide category filter
  const [activeResourceModal, setActiveResourceModal] = useState(null); // for teacher guide read more modal
  const [copiedPromptIndex, setCopiedPromptIndex] = useState(null); // for copy prompt toast feedback
  // Vocabulary page state
  const [vocabSearch, setVocabSearch] = useState('');
  const [vocabCat, setVocabCat] = useState('All');
  const [vocabLevel, setVocabLevel] = useState('All');
  
  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactIntent, setContactIntent] = useState('Suggest a guest');
  const [contactMessage, setContactMessage] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);
  const [contactFeedback, setContactFeedback] = useState(null);

  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Valid views mapping
  const validViews = [
    'index',
    'about',
    'research',
    'methodology',
    'podcasts',
    'stories',
    'learning',
    'teacher-guide',
    'audio-transcripts',
    'vocabulary',
    'gallery',
    'team',
    'outcomes',
    'news',
    'contact'
  ];

  const rawHash = location.hash ? location.hash.replace(/^#[/]?/, '') : 'index';
  const cleanHash = rawHash || 'index';

  // Map sub-section anchors to their respective parent views
  let currentView = cleanHash;
  if (cleanHash === 'teacher-resources' || cleanHash === 'activity-of-the-month') {
    currentView = 'teacher-guide';
  } else if (cleanHash === 'transcript') {
    currentView = 'audio-transcripts';
  } else if (!validViews.includes(cleanHash)) {
    currentView = 'index';
  }

  const {
    settings = {},
    hero = {},
    cards = {},
    statistics = [],
    podcasts = [],
    stories = [],
    gallery = [],
    team = [],
    team_by_role = {},
    timeline = [],
    references = [],
    teacherGuide = fallbackData.teacherGuide,
    vocabulary = fallbackData.vocabulary || [],
  } = data || {};

  const tg = teacherGuide || fallbackData.teacherGuide;

  useEffect(() => {
    let isMounted = true;
    const fetchContent = async () => {
      try {
        const result = await api.getPublicAll();
        if (isMounted && result) {
          setData(result);
        }
      } catch (err) {
        console.warn('Backend currently offline. Serving Voices of Vehari site via local fallback content.', err);
      }
    };
    fetchContent();

    const handleStorage = () => {
      if (isMounted) {
        fetchContent();
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleStorage);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleStorage);
    };
  }, []);

  // Update hash when clicking in-page internal links like href="about.html" or href="#about"
  useEffect(() => {
    const handleLinkClicks = (e) => {
      const target = e.target.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (href && href.endsWith('.html')) {
        e.preventDefault();
        const viewName = href.replace('.html', '');
        window.location.hash = `#${viewName}`;
      }
    };
    document.addEventListener('click', handleLinkClicks);
    return () => document.removeEventListener('click', handleLinkClicks);
  }, []);

  // Update document title dynamically based on view
  useEffect(() => {
    if (currentView === 'teacher-guide') {
      document.title = 'Teacher Guide | Voices of Vehari';
    } else {
      document.title = settings?.site_name ? `${settings.site_name} | Enhancing English Proficiency` : 'Voices of Vehari';
    }
  }, [currentView, settings]);

  const scrollToTeacherSection = (e, elementId) => {
    e.preventDefault();
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCopyPrompt = (promptText, index) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(promptText)
        .then(() => {
          setCopiedPromptIndex(index);
          addToast('Classroom prompt copied to clipboard!', 'success');
          setTimeout(() => setCopiedPromptIndex(null), 2500);
        })
        .catch(() => {
          addToast('Could not copy to clipboard. Please copy manually.', 'error');
        });
    } else {
      addToast('Classroom prompt copied to clipboard!', 'success');
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }

    try {
      setSubmittingContact(true);
      setContactFeedback(null);
      const res = await api.submitContact({
        name: contactName,
        email: contactEmail,
        intent: contactIntent,
        message: contactMessage
      });
      if (res && res.success) {
        const msg = res.message || 'Thank you! Your message has been received.';
        addToast(msg, 'success');
        setContactFeedback({ type: 'success', message: msg });
        setContactName('');
        setContactEmail('');
        setContactMessage('');
      } else {
        const msg = res?.message || 'Failed to submit form.';
        addToast(msg, 'error');
        setContactFeedback({ type: 'error', message: msg });
      }
    } catch (err) {
      const msg = err.message || 'The contact service is currently offline. Please email the project team directly at info@voicesofvehari.edu.pk.';
      addToast(msg, 'info');
      setContactFeedback({ type: 'info', message: msg });
    } finally {
      setSubmittingContact(false);
    }
  };

  // Filter teacher guide resources
  const filteredTeacherResources = (tg?.resources || []).filter((r) => {
    if (r.is_published === false) return false;
    if (selectedTeacherCategory === 'All') return true;
    return (r.category || '').toLowerCase() === selectedTeacherCategory.toLowerCase();
  });

  // Filter podcasts
  const filteredPodcasts = podcasts.filter((p) => {
    if (activeTab === 'all') return true;
    return (p.category || '').toLowerCase().includes(activeTab.toLowerCase());
  });

  // Filter audio & transcripts
  const filteredAudioList = podcasts.filter((p) => {
    if (!audioSearch) return true;
    const q = audioSearch.toLowerCase();
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.guest || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <Navbar settings={settings} />

      {/* ================= 1. INDEX (HOME) ================= */}
      {currentView === 'index' && (
        <section className="view" id="index" style={{ display: 'block' }}>
          {/* HERO */}
          <section className="hero">
            <div className="container hero-grid">
              <div>
                <span className="kicker">{hero.kicker || 'A research & community storytelling initiative'}</span>
                <h1>{hero.title || 'Voices of Vehari'}</h1>
                <p className="lead"><strong>{hero.lead_strong || 'Enhancing English Proficiency through Multilingual Podcasting and Cultural Storytelling.'}</strong></p>
                <p className="lead">{hero.lead_body || 'A context-based learning project that brings English, local languages, community voices and the cultural heritage of Vehari together through simple, accessible podcasts and stories.'}</p>
                <div className="actions">
                  <a className="btn primary" href={hero.primary_btn_url || '#podcasts'}>{hero.primary_btn_text || 'Explore Podcasts'}</a>
                  <a className="btn ghost" href={hero.secondary_btn_url || '#learning'}>{hero.secondary_btn_text || 'Start Learning'}</a>
                </div>
              </div>
              <div className="hero-art">
                <img
                  src={formatImageUrl(hero.hero_image_url) || '/assets/hero_art.jpeg'}
                  alt={hero.hero_image_alt || 'Illustration of young people creating podcasts and sharing stories'}
                  onError={(e) => { e.target.src = '/assets/hero_art.jpeg'; }}
                />
                <div className="logo-float">
                  <img
                    src={formatImageUrl(hero.logo_float_url) || '/assets/voices_logo.png'}
                    alt="Voices of Vehari"
                    onError={(e) => { e.target.src = '/assets/voices_logo.png'; }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* THE IDEA */}
          <section className="section">
            <div className="container">
              <div className="section-head">
                <div>
                  <span className="eyebrow">The idea</span>
                  <h2>Listen. Learn. Share. Research.</h2>
                </div>
                <p>Voices of Vehari connects English language development with the languages, stories and lived experiences of a multilingual community.</p>
              </div>
              <div className="cards">
                {(cards.home_idea || []).map((c, i) => (
                  <div key={i} className="card">
                    {c.icon && <div className="icon">{c.icon}</div>}
                    <h3>{c.title}</h3>
                    <p>{c.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PROJECT AT A GLANCE */}
          <section className="section alt">
            <div className="container">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Project at a glance</span>
                  <h2>A 12-month applied research project</h2>
                </div>
                <p>The proposal describes a mixed-methods intervention combining language-proficiency assessment with participant perspectives.</p>
              </div>
              <div className="stat-grid">
                {statistics.map((s, idx) => (
                  <div key={idx} className="stat">
                    <strong>{s.value}</strong>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
              <div className="notice" style={{ marginTop: '18px' }}>
                The proposal also describes an initial needs assessment involving 30 university students and 15 community members before the intervention. Final website statistics should be updated as the research is completed.
              </div>
            </div>
          </section>

          {/* FEATURED CONVERSATION */}
          <section className="section">
            <div className="container two-col">
              <div>
                <span className="eyebrow">Featured conversation</span>
                <h2>Women Education in Vehari</h2>
                <p className="lead">A podcast conversation exploring women's education, opportunities and challenges in the local context.</p>
                <p>
                  <span className="tag">Urdu</span>
                  <span className="tag">Education</span>
                  <span className="tag">Community</span>
                </p>
                <a className="btn primary" href="#podcasts">View Podcast</a>
              </div>
              <div className="callout">
                <h3>Guest</h3>
                <p><strong>Dr. Asma Kashif Shehzad</strong></p>
                <p>Humanities educator and featured guest for the Women Education in Vehari conversation.</p>
                <hr style={{ border: 0, borderTop: '1px solid #cce5e3', margin: '18px 0' }} />
                <h3>Learning connection</h3>
                <p>Use the episode transcript, vocabulary and discussion prompts to turn a local conversation into an English-learning activity.</p>
              </div>
            </div>
          </section>

          {/* WHY IT MATTERS */}
          <section className="section alt">
            <div className="container two-col">
              <div>
                <img
                  src="/assets/poster_culture.jpeg"
                  alt="Voices of Vehari project poster"
                  style={{ width: '100%', borderRadius: '22px', boxShadow: 'var(--shadow)' }}
                  onError={(e) => { e.target.src = '/assets/gallery_poster.jpeg'; }}
                />
              </div>
              <div>
                <span className="eyebrow">Why it matters</span>
                <h2>Culture is part of the classroom.</h2>
                <p>The project responds to the need for English learning that is interesting, context-based and culturally meaningful in a multilingual setting.</p>
                <p>It aims to help learners connect local identity with wider opportunities for communication while developing listening, speaking, vocabulary, learner autonomy and intercultural awareness.</p>
                <a className="btn ghost" href="#about">About the Project</a>
              </div>
            </div>
          </section>
        </section>
      )}

      {/* ================= 2. ABOUT ================= */}
      {currentView === 'about' && (
        <section className="view" id="about" style={{ display: 'block' }}>
          <section className="page-hero">
            <div className="container">
              <span className="eyebrow" style={{ color: '#dcecff' }}>About the project</span>
              <h1>English learning rooted in the voices of Vehari.</h1>
              <p>Voices of Vehari explores how multilingual podcasting and cultural storytelling can create an engaging, context-based learning environment for EFL learners in Vehari, Pakistan.</p>
            </div>
          </section>
          <section className="section">
            <div className="container two-col">
              <div>
                <span className="eyebrow">What is it?</span>
                <h2>A culturally anchored approach to English learning.</h2>
              </div>
              <div>
                <p className="lead">The project brings Punjabi, Saraiki and English into podcast-based learning while using local stories as contexts for listening, speaking, vocabulary and cultural awareness.</p>
                <p>Rather than treating English as an abstract subject, the project connects learning activities with the realities, stories and identities of the community.</p>
              </div>
            </div>
          </section>
          <section className="section alt">
            <div className="container">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Why this project?</span>
                  <h2>The challenge we are responding to</h2>
                </div>
              </div>
              <div className="cards">
                {(cards.about_challenge || []).map((c, i) => (
                  <div key={i} className="card">
                    <h3>{c.title}</h3>
                    <p>{c.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="section">
            <div className="container">
              <span className="eyebrow">Vision & mission</span>
              <div className="two-col" style={{ marginTop: '16px' }}>
                <div className="callout">
                  <h3>Vision</h3>
                  <p>Develop a culturally meaningful, multilingual and scalable approach to English language learning through podcasting and storytelling.</p>
                </div>
                <div className="callout">
                  <h3>Mission</h3>
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    <li>Improve English listening, speaking and vocabulary.</li>
                    <li>Encourage multilingual expression.</li>
                    <li>Connect local culture with language learning.</li>
                    <li>Develop confidence and learner autonomy.</li>
                    <li>Create resources that teachers and communities can reuse.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
          <section className="section alt">
            <div className="container">
              <span className="eyebrow">Project identity</span>
              <h2>One Voice. Many Stories. Stronger Community.</h2>
              <p className="lead">The project combines technology with cultural relevance so learners can develop English while valuing the languages and stories that shape their community.</p>
            </div>
          </section>
        </section>
      )}

      {/* ================= 3. RESEARCH ================= */}
      {currentView === 'research' && (
        <section className="view" id="research" style={{ display: 'block' }}>
          <section className="page-hero">
            <div className="container">
              <span className="eyebrow" style={{ color: '#dcecff' }}>Research</span>
              <h1>Researching technology-enhanced, culturally relevant language learning.</h1>
              <p>A mixed-methods research project examining language outcomes and participant perspectives in a multilingual EFL setting.</p>
            </div>
          </section>
          <section className="section">
            <div className="container two-col">
              <div>
                <span className="eyebrow">Project brief</span>
                <h2>Voices of Vehari</h2>
                <p className="lead">Enhancing English Proficiency through Multilingual Podcasting and Cultural Storytelling</p>
              </div>
              <div className="card">
                <p><strong>Nature:</strong> Applied Basic Research</p>
                <p><strong>Duration:</strong> 12 months</p>
                <p><strong>Proposed start:</strong> August 2025</p>
                <p><strong>Department:</strong> Humanities, Vehari Campus</p>
                <p><strong>Area:</strong> Computer Assisted Language Learning and ELT</p>
                <p><strong>Estimated / requested grant:</strong> Rs. 300,000</p>
              </div>
            </div>
          </section>
          <section className="section alt">
            <div className="container">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Research objectives</span>
                  <h2>Four questions the project is designed to address</h2>
                </div>
              </div>
              <div className="cards">
                {(cards.research_objective || []).map((c, i) => (
                  <div key={i} className="card">
                    {c.icon && <div className="icon">{c.icon}</div>}
                    <h3>{c.title}</h3>
                    <p>{c.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="section">
            <div className="container">
              <span className="eyebrow">Research design</span>
              <h2>Mixed methods</h2>
              <div className="two-col" style={{ marginTop: '24px' }}>
                <div className="card">
                  <h3>Quantitative component</h3>
                  <p>Simple language-proficiency assessments before, during and after podcast sessions, with emphasis on speaking, listening and vocabulary.</p>
                </div>
                <div className="card">
                  <h3>Qualitative component</h3>
                  <p>Participant perspectives and experiences gathered through discussions and practice sessions to understand how learners and teachers perceive the approach.</p>
                </div>
              </div>
            </div>
          </section>
          <section className="section alt">
            <div className="container">
              <span className="eyebrow">Academic foundations</span>
              <h2>Selected references</h2>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Author</th>
                      <th>Contribution to the project context</th>
                    </tr>
                  </thead>
                  <tbody>
                    {references.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 700 }}>{r.author}</td>
                        <td>{r.contribution}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </section>
      )}

      {/* ================= 4. METHODOLOGY ================= */}
      {currentView === 'methodology' && (
        <section className="view" id="methodology" style={{ display: 'block' }}>
          <section className="page-hero">
            <div className="container">
              <span className="eyebrow" style={{ color: '#dcecff' }}>Methodology</span>
              <h1>From needs assessment to podcasts, practice and evidence.</h1>
              <p>The project is organized into three practical phases across 12 months.</p>
            </div>
          </section>
          <section className="section">
            <div className="container">
              <div className="timeline">
                {timeline.map((item, idx) => (
                  <div key={idx} className="step">
                    <div className="num">{item.phase_number}</div>
                    <span className="eyebrow">{item.duration}</span>
                    <h2>{item.title}</h2>
                    {(item.paragraphs || []).map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="section alt">
            <div className="container two-col">
              <div>
                <span className="eyebrow">Learning cycle</span>
                <h2>Local language â†’ local story â†’ English practice</h2>
                <p>Participants encounter meaningful local content, use multilingual support where appropriate, then practise English through listening, vocabulary and speaking activities.</p>
              </div>
              <div className="callout">
                <h3>What gets assessed?</h3>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  <li>English listening</li>
                  <li>English speaking</li>
                  <li>Vocabulary development</li>
                  <li>Participant confidence and perceptions</li>
                </ul>
              </div>
            </div>
          </section>
        </section>
      )}

      {/* ================= 5. PODCASTS ================= */}
      {currentView === 'podcasts' && (
        <section className="view" id="podcasts" style={{ display: 'block' }}>
          <section className="page-hero">
            <div className="container">
              <span className="eyebrow" style={{ color: '#dcecff' }}>Podcast</span>
              <h1>Real conversations. Local voices. Language learning.</h1>
              <p>Explore the podcast series as it grows. Each episode can connect a local topic with vocabulary, questions, speaking practice and a transcript.</p>
            </div>
          </section>
          <section className="section">
            <div className="container">
              <div className="filters">
                {['all', 'education', 'culture', 'food'].map((f) => (
                  <button
                    key={f}
                    className={`filter ${activeTab === f ? 'active' : ''}`}
                    onClick={() => setActiveTab(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <div className="cards">
                {filteredPodcasts.map((pod) => (
                  <div key={pod.id} className="card media-card">
                    <div style={{ position: 'relative' }}>
                      <img
                        src={formatImageUrl(pod.cover_image_url) || '/assets/podcast_upcoming.jpeg'}
                        alt={pod.title}
                        onError={(e) => { e.target.src = '/assets/podcast_upcoming.jpeg'; }}
                      />
                      {pod.video_url && (
                        <div
                          onClick={() => setActiveVideoPodcast(pod)}
                          style={{
                            position: 'absolute',
                            bottom: '12px',
                            right: '12px',
                            background: 'rgba(232, 65, 24, 0.92)',
                            color: '#fff',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                          }}
                          title="Click to play video"
                        >
                          <span>â–¶</span> {isYouTubeUrl(pod.video_url) ? 'YouTube Video' : 'Watch Video'}
                        </div>
                      )}
                    </div>
                    <div className="body">
                      {(pod.tags || []).map((t, ti) => (
                        <span key={ti} className="tag">{t}</span>
                      ))}
                      <h3>{pod.title}</h3>
                      {pod.guest && (
                        <p style={{ margin: '4px 0' }}>
                          <strong>Guest:</strong> {pod.guest} {pod.host ? `Â· Host: ${pod.host}` : ''}
                        </p>
                      )}
                      <p>{pod.description}</p>
                      <AudioPlayer src={formatAudioUrl(pod.audio_url)} />
                      <div className="actions" style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {pod.video_url && (
                          <button
                            type="button"
                            className="btn primary sm"
                            style={{ background: '#e84118', borderColor: '#c23616' }}
                            onClick={() => setActiveVideoPodcast(pod)}
                          >
                            â–¶ Watch Video
                          </button>
                        )}
                        <a className="btn ghost sm" href="#audio-transcripts">Transcript</a>
                        <a className="btn primary sm" href="#learning">Learn from it</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="section alt">
            <div className="container two-col">
              <div>
                <span className="eyebrow">Episode format</span>
                <h2>Every podcast can become a lesson.</h2>
              </div>
              <div>
                <p>Each podcast is designed around simple questions, vocabulary training and speaking suggestions, so the media content can also support structured English practice.</p>
                <a className="btn ghost" href="#learning">Explore Learning Resources</a>
              </div>
            </div>
          </section>
        </section>
      )}

      {/* ================= 6. STORIES ================= */}
      {currentView === 'stories' && (
        <section className="view" id="stories" style={{ display: 'block' }}>
          <section className="page-hero">
            <div className="container">
              <span className="eyebrow" style={{ color: '#dcecff' }}>Stories</span>
              <h1>Documenting the culture and everyday voices of Vehari.</h1>
              <p>Stories provide the cultural context through which English learning becomes familiar, meaningful and connected to real life.</p>
            </div>
          </section>
          <section className="section">
            <div className="container">
              <div className="section-head">
                <div>
                  <span className="eyebrow">Story collection</span>
                  <h2>What we can preserve and share</h2>
                </div>
                <p>As fieldwork progresses, replace the placeholders below with verified community stories and photographs.</p>
              </div>
              <div className="cards">
                {stories.map((st) => (
                  <div key={st.id} className="card">
                    {st.image_url && (
                      <img
                        src={formatImageUrl(st.image_url)}
                        alt={st.title}
                        style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '12px', marginBottom: '14px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <span className="tag">{st.category_tag || 'Folklore'}</span>
                    <h3>{st.title}</h3>
                    <p>{st.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="section alt">
            <div className="container callout">
              <span className="eyebrow">Story format</span>
              <h2>Local language â†’ English â†’ Learning</h2>
              <p>Each published story can include the original/local-language version, an English version, audio narration, key vocabulary, comprehension questions and speaking prompts.</p>
            </div>
          </section>
        </section>
      )}

      {/* ================= 7. LEARNING ================= */}
      {currentView === 'learning' && (
        <section className="view" id="learning" style={{ display: 'block' }}>
          <section className="page-hero">
            <div className="container">
              <span className="eyebrow" style={{ color: '#dcecff' }}>Learning resources</span>
              <h1>Turn every story and podcast into an English-learning experience.</h1>
              <p>A free resource collection for students, teachers and community participants.</p>
            </div>
          </section>
          <section className="section">
            <div className="container">
              <div className="cards">
                {(cards.learning_resource || []).map((c, i) => (
                  <div key={i} className="card">
                    {c.icon && <div className="icon">{c.icon}</div>}
                    <h3>{c.title}</h3>
                    <p>{c.description}</p>
                    {c.bullets && c.bullets.length > 0 && (
                      <ul style={{ paddingLeft: '20px', margin: '10px 0 0', color: 'var(--muted)', fontSize: '14px' }}>
                        {c.bullets.map((b, bi) => (
                          <li key={bi}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="section alt">
            <div className="container">
              <span className="eyebrow">Sample activity</span>
              <h2>Learn from â€œWomen Education in Vehariâ€</h2>
              <div className="two-col" style={{ marginTop: '24px' }}>
                <div className="card">
                  <h3>Before listening</h3>
                  <ol style={{ paddingLeft: '20px', margin: 0, color: 'var(--muted)' }}>
                    <li>What does educational opportunity mean to you?</li>
                    <li>What challenges can affect access to education?</li>
                    <li>Write three words you expect to hear.</li>
                  </ol>
                </div>
                <div className="card">
                  <h3>After listening</h3>
                  <ol style={{ paddingLeft: '20px', margin: 0, color: 'var(--muted)' }}>
                    <li>Summarize the main ideas in English.</li>
                    <li>Select five new vocabulary items.</li>
                    <li>Discuss one question with a partner.</li>
                  </ol>
                </div>
              </div>
            </div>
          </section>
          <section className="section">
            <div className="container">
              <span className="eyebrow">For mentors</span>
              <h2>Simple, reusable teaching support</h2>
              <p className="lead">The project intends to train undergraduate student mentors and create accessible resources that teachers and community leaders can use beyond the project period.</p>
            </div>
          </section>
        </section>
      )}

      {/* ================= TEACHER GUIDE ================= */}
      {currentView === 'teacher-guide' && (
        <section className="view" id="teacher-guide" style={{ display: 'block' }}>
          {/* 1. HERO SECTION */}
          <section className="page-hero">
            <div className="container" style={{ textAlign: 'left' }}>
              <span className="eyebrow" style={{ color: '#dcecff' }}>Teacher Guide & Resources</span>
              <h1 style={{ fontSize: '2.5rem', lineHeight: 1.2, margin: '14px 0 16px', maxWidth: '900px' }}>
                {tg?.hero?.title || 'Teacher Guide: Using Local Stories in the English Classroom'}
              </h1>
              <p className="lead" style={{ maxWidth: '840px', margin: '0 0 16px', fontSize: '1.2rem', color: '#e0edff', fontWeight: 500 }}>
                {tg?.hero?.subtitle || 'A practical guide for educators using community narratives, oral folklore, and local experiences to make English learning relevant, communicative, and engaging.'}
              </p>
              <p style={{ maxWidth: '780px', margin: '0 0 28px', color: '#cadbf5', fontSize: '15px', lineHeight: 1.6 }}>
                {tg?.hero?.description || 'Contextualized language teaching allows students to connect new English structures with familiar environments, reducing anxiety and dramatically improving communicative participation.'}
              </p>
              <div className="actions" style={{ display: 'flex', justifyContent: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
                <a
                  className="btn primary"
                  href="#teacher-resources"
                  onClick={(e) => scrollToTeacherSection(e, 'teacher-resources')}
                  style={{
                    background: '#1665c0',
                    color: '#ffffff',
                    border: '1px solid #1665c0',
                    padding: '12px 24px',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                  }}
                >
                  {tg?.hero?.primary_cta || 'Explore Teaching Resources'}
                </a>
                <a
                  className="btn ghost"
                  href="#activity-of-the-month"
                  onClick={(e) => scrollToTeacherSection(e, 'activity-of-the-month')}
                  style={{
                    background: '#ffffff',
                    color: '#073b7a',
                    border: '1px solid #ffffff',
                    padding: '12px 24px',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                  }}
                >
                  {tg?.hero?.secondary_cta || 'Browse Classroom Ideas'}
                </a>
              </div>
            </div>
          </section>

          {/* 2. INTRODUCTION / HOW TO USE THIS GUIDE */}
          <section className="section">
            <div className="container">
              <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 36px' }}>
                <span className="eyebrow">Pedagogical Framework</span>
                <h2>How to Use This Guide</h2>
                <p style={{ color: 'var(--muted)', fontSize: '15px', margin: 0 }}>
                  Five foundational pillars connecting cultural familiarity with active language acquisition.
                </p>
              </div>
              <div className="cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                {(tg?.benefits || []).map((b, idx) => (
                  <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{b.icon}</div>
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>{b.title}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5, margin: 0, flex: 1 }}>
                      {b.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 3. FEATURED TEACHING RESOURCES & 4. CATEGORY FILTERS */}
          <section className="section alt" id="teacher-resources">
            <div className="container">
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', gap: '16px' }}>
                <div>
                  <span className="eyebrow">Classroom Library</span>
                  <h2>Featured Teaching Resources</h2>
                  <p style={{ color: 'var(--muted)', margin: 0, fontSize: '15px' }}>
                    Structured, ready-to-run lesson guides adaptable for secondary and higher education.
                  </p>
                </div>
                {/* Category Filter Buttons */}
                <div className="filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(tg?.categories || ['All', 'Lesson Ideas', 'Speaking', 'Writing', 'Reading', 'Vocabulary', 'Student Engagement']).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`filter ${selectedTeacherCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedTeacherCategory(cat)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: '1px solid var(--border)',
                        background: selectedTeacherCategory === cat ? 'var(--primary, #1665c0)' : 'var(--card-bg, #fff)',
                        color: selectedTeacherCategory === cat ? '#fff' : 'inherit',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resources Cards Grid */}
              <div className="cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '22px' }}>
                {filteredTeacherResources.map((res) => (
                  <div key={res.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span className="tag" style={{ margin: 0 }}>{res.category}</span>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>
                          â± {res.time || res.estimated_time || '30â€“45 minutes'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.2rem', margin: '0 0 10px', lineHeight: 1.35 }}>{res.title}</h3>
                      <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '14px' }}>
                        {res.excerpt || res.short_description}
                      </p>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--muted)', marginBottom: '18px' }}>
                        <span><strong>Target Level:</strong> {res.level || 'Intermediate'}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn ghost sm"
                      style={{ alignSelf: 'flex-start', marginTop: 'auto' }}
                      onClick={() => setActiveResourceModal(res)}
                    >
                       Read Guide & Steps
                    </button>
                  </div>
                ))}
              </div>
              {filteredTeacherResources.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                  <p>No guides found under category "{selectedTeacherCategory}".</p>
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => setSelectedTeacherCategory('All')}
                    style={{ marginTop: '10px' }}
                  >
                    Reset to All
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 5. CLASSROOM ACTIVITY OF THE MONTH */}
          <section className="section" id="activity-of-the-month">
            <div className="container">
              <div className="card" style={{ border: '2px solid rgba(22, 101, 192, 0.25)', background: 'linear-gradient(135deg, rgba(240, 247, 255, 0.9) 0%, rgba(255, 255, 255, 1) 100%)', padding: '32px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="tag" style={{ background: '#1665c0', color: '#fff', fontWeight: 600 }}>ðŸŒŸ Classroom Activity of the Month</span>
                    <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
                      Level: {tg?.featuredActivity?.level || 'Intermediate'} Â· Duration: {tg?.featuredActivity?.time || '35 minutes'}
                    </span>
                  </div>
                </div>

                <h2 style={{ fontSize: '1.85rem', marginBottom: '10px' }}>{tg?.featuredActivity?.title || 'Tell Your Story'}</h2>
                <p className="lead" style={{ fontSize: '1.05rem', color: 'var(--muted)', marginBottom: '24px' }}>
                  {tg?.featuredActivity?.purpose || 'Help students practice speaking and narrative skills by sharing a familiar personal or local experience.'}
                </p>

                <div className="two-col" style={{ gap: '28px', marginTop: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1665c0', marginBottom: '12px' }}>
                      ðŸŽ¯ Learning Objectives
                    </h4>
                    <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--muted)', fontSize: '14px', lineHeight: 1.8 }}>
                      {(tg?.featuredActivity?.objectives || []).map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>

                    <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(22, 101, 192, 0.08)', borderLeft: '4px solid #1665c0' }}>
                      <strong style={{ display: 'block', fontSize: '13px', textTransform: 'uppercase', color: '#1665c0', marginBottom: '4px' }}>ðŸ’¡ Teacher Tip</strong>
                      <p style={{ margin: 0, fontSize: '13.5px', color: '#2d3748', lineHeight: 1.5 }}>
                        {tg?.featuredActivity?.teacherTip || 'Encourage students to choose experiences from their own community, family, school or daily life.'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1665c0', marginBottom: '12px' }}>
                      ðŸ“‹ Step-by-Step Procedure
                    </h4>
                    <ol style={{ paddingLeft: '20px', margin: 0, color: 'var(--muted)', fontSize: '14px', lineHeight: 1.8 }}>
                      {(tg?.featuredActivity?.steps || []).map((step, i) => (
                        <li key={i} style={{ marginBottom: '6px' }}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. PRACTICAL TEACHING STRATEGIES */}
          <section className="section alt">
            <div className="container">
              <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 36px' }}>
                <span className="eyebrow">Methodology in Action</span>
                <h2>Practical Teaching Strategies</h2>
                <p style={{ color: 'var(--muted)', fontSize: '15px', margin: 0 }}>
                  Six evidence-informed techniques for contextualized English pedagogy.
                </p>
              </div>
              <div className="cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {(tg?.strategies || []).map((strat) => (
                  <div key={strat.num} className="card">
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1665c0', opacity: 0.8, display: 'block', marginBottom: '8px' }}>
                      {strat.num}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>{strat.title}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>
                      {strat.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 7. READY-TO-USE CLASSROOM PROMPTS */}
          <section className="section">
            <div className="container">
              <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 36px' }}>
                <span className="eyebrow">Discussion Starters</span>
                <h2>Ready-to-Use Classroom Prompts</h2>
                <p style={{ color: 'var(--muted)', fontSize: '15px', margin: 0 }}>
                  Click "Copy Prompt" to instantly copy questions to clipboard for slides, board work, or worksheets.
                </p>
              </div>
              <div className="cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                {(tg?.classroomPrompts || []).map((prompt, pIdx) => {
                  const promptText = (typeof prompt === 'string' ? prompt : (prompt?.prompt || ''))
                    .replace(/^["'\s]+|["'\s]+$/g, '');
                  return (
                    <div
                      key={pIdx}
                      className="card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        background: '#fafbfc',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                        <span style={{ fontSize: '1.2rem', color: '#1665c0', flexShrink: 0 }}>ðŸ’¬</span>
                        <p style={{ margin: 0, fontStyle: 'italic', fontSize: '15px', color: '#2d3748', lineHeight: 1.5, fontWeight: 500 }}>
                          "{promptText}"
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() => handleCopyPrompt(promptText, pIdx)}
                        style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '6px 12px' }}
                      >
                        {copiedPromptIndex === pIdx ? 'âœ“ Copied!' : 'ðŸ“‹ Copy Prompt'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 8. LESSON PLAN TEMPLATE */}
          <section className="section alt">
            <div className="container">
              <div className="card" style={{ maxWidth: '860px', margin: '0 auto', padding: '36px', border: '1px dashed #1665c0', background: '#fff' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #edf2f7', paddingBottom: '18px', marginBottom: '24px', gap: '12px' }}>
                  <div>
                    <span className="tag" style={{ background: '#e0edff', color: '#1665c0', fontWeight: 600 }}>Teacher Planning Tool</span>
                    <h3 style={{ fontSize: '1.5rem', margin: '8px 0 4px' }}>{tg?.lessonPlanTemplate?.title || 'Simple Lesson Plan Template'}</h3>
                    <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>{tg?.lessonPlanTemplate?.description}</p>
                  </div>
                  <button
                    type="button"
                    className="btn primary sm"
                    onClick={() => window.print()}
                  >
                    ðŸ–¨ Print / Save Template
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  {((tg?.lessonPlanTemplate?.fields && tg.lessonPlanTemplate.fields.length > 0) ? tg.lessonPlanTemplate.fields : [
                    { label: 'Topic', placeholder: tg?.lessonPlanTemplate?.topic || 'e.g. Local Harvests & Markets in Vehari' },
                    { label: 'Learning Objective', placeholder: tg?.lessonPlanTemplate?.learning_objective || 'e.g. Describe a local market scene using 5 sensory adjectives.' },
                    { label: 'English Skills', placeholder: tg?.lessonPlanTemplate?.english_skills || 'Speaking, Vocabulary, Listening, Reading' },
                    { label: 'Vocabulary', placeholder: tg?.lessonPlanTemplate?.vocabulary || 'e.g. stall, vendor, barter, fresh, bustling, fragrant' },
                    { label: 'Warm-up Activity', placeholder: tg?.lessonPlanTemplate?.warmup_activity || '5-minute photo prompt & partner brainstorming' },
                    { label: 'Main Activity', placeholder: tg?.lessonPlanTemplate?.main_activity || 'Contextual reading or listening from Voices of Vehari story archive' },
                    { label: 'Pair/Group Activity', placeholder: tg?.lessonPlanTemplate?.pair_group_activity || 'Role-play interview between local vendor and customer' },
                    { label: 'Assessment', placeholder: tg?.lessonPlanTemplate?.assessment || 'Formative observation of peer interaction' },
                    { label: 'Homework / Follow-up', placeholder: tg?.lessonPlanTemplate?.homework || 'Write a 4-sentence reflection on favorite family custom' },
                  ]).map((fld, fIdx) => (
                    <div key={fIdx} style={{ padding: '12px 14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', marginBottom: '4px' }}>
                        {fld.label}
                      </strong>
                      <span style={{ fontSize: '13px', color: 'var(--muted)', fontStyle: 'italic' }}>
                        {fld.placeholder}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 9. TEACHER TIPS */}
          <section className="section">
            <div className="container">
              <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 36px' }}>
                <span className="eyebrow">Classroom Best Practices</span>
                <h2>Teacher Tips for Maximum Engagement</h2>
                <p style={{ color: 'var(--muted)', fontSize: '15px', margin: 0 }}>
                  Tested habits that keep learners actively speaking and writing.
                </p>
              </div>
              <div className="cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {(tg?.tips || []).map((tip, tIdx) => (
                  <div key={tIdx} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e0edff', color: '#1665c0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', flexShrink: 0 }}>
                      {tIdx + 1}
                    </div>
                    <p style={{ margin: 0, fontSize: '14.5px', color: '#2d3748', lineHeight: 1.55 }}>
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 10. FINAL CALL TO ACTION */}
          <section className="section alt">
            <div className="container callout" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <span className="eyebrow">Community & Classroom</span>
              <h2>Bring Local Voices Into Your Classroom</h2>
              <p className="lead" style={{ maxWidth: '640px', margin: '0 auto 24px' }}>
                Explore our collection of community stories and student podcasts to inspire your next lesson plan.
              </p>
              <div className="actions" style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <a className="btn primary" href="#stories">Explore Local Stories</a>
                <a className="btn ghost" href="#learning">View Student Learning Activities</a>
              </div>
            </div>
          </section>
        </section>
      )}

      {/* ================= 8. AUDIO & TRANSCRIPTS ================= */}
      {currentView === 'audio-transcripts' && (
        <section className="view" id="audio-transcripts" style={{ display: 'block' }}>
          <section className="page-hero">
            <div className="container">
              <span className="eyebrow" style={{ color: '#dcecff' }}>Audio & transcripts</span>
              <h1>Listen to the voice. Read the words. Practise the language.</h1>
              <p>Pair every recording with an accessible transcript and learning layer.</p>
            </div>
          </section>
          <section className="section">
            <div className="container">
              <div className="searchbox">
                <input
                  type="text"
                  placeholder="Search episodes, guests or topics"
                  value={audioSearch}
                  onChange={(e) => setAudioSearch(e.target.value)}
                  aria-label="Search"
                />
                <button className="btn primary" type="button">Search</button>
              </div>
              <div style={{ marginTop: '26px', display: 'grid', gap: '18px' }}>
                {filteredAudioList.map((pod) => (
                  <div key={pod.id} className="card">
                    {(pod.tags || []).map((t, ti) => (
                      <span key={ti} className="tag">{t}</span>
                    ))}
                    <h3>{pod.title}</h3>
                    {pod.guest && <p style={{ margin: '4px 0', color: 'var(--muted)' }}>Guest: {pod.guest} {pod.host ? `Â· Host: ${pod.host}` : ''}</p>}
                    <AudioPlayer src={formatAudioUrl(pod.audio_url)} />
                    <div className="actions" style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {pod.video_url && (
                        <button
                          type="button"
                          className="btn primary sm"
                          style={{ background: '#e84118', borderColor: '#c23616' }}
                          onClick={() => setActiveVideoPodcast(pod)}
                        >
                          â–¶ Watch Video
                        </button>
                      )}
                      <a className="btn ghost sm" href="#transcript">Open transcript</a>
                      <a className="btn ghost sm" href="#learning">Learning activity</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="section alt" id="transcript">
            <div className="container two-col">
              <div>
                <span className="eyebrow">Transcript model</span>
                <h2>One episode, four learning layers.</h2>
                <ol style={{ paddingLeft: '20px', margin: 0, color: 'var(--muted)', fontSize: '15px', lineHeight: 1.8 }}>
                  <li><strong>Original conversation</strong> â€” preserve the authentic exchange.</li>
                  <li><strong>English version</strong> â€” support comprehension and comparison.</li>
                  <li><strong>Vocabulary</strong> â€” highlight useful words and phrases.</li>
                  <li><strong>Practice</strong> â€” add listening, speaking and reflection activities.</li>
                </ol>
              </div>
              <div className="callout">
                <h3>Publishing note</h3>
                <p>Full transcripts should be added after recordings are finalized and checked by the project team. The demo intentionally uses placeholders rather than inventing dialogue.</p>
              </div>
            </div>
          </section>
        </section>
      )}

      {/* ================= 9. GALLERY ================= */}
      {currentView === 'gallery' && (
        <section className="view" id="gallery" style={{ display: 'block' }}>
          <section className="page-hero">
            <div className="container">
              <span className="eyebrow" style={{ color: '#dcecff' }}>Gallery</span>
              <h1>The project in pictures.</h1>
              <p>Use this space as the visual archive of podcast recording, training, practice sessions, community engagement and dissemination events.</p>
            </div>
          </section>
          <section className="section">
            <div className="container">
              <div className="gallery">
                {gallery.map((g, i) => (
                  <img
                    key={g.id || i}
                    src={formatImageUrl(g.image_url) || '/assets/gallery_poster.jpeg'}
                    alt={g.alt_text || g.title}
                    title={g.caption || g.title}
                    onError={(e) => { e.target.src = '/assets/gallery_poster.jpeg'; }}
                  />
                ))}
              </div>
            </div>
          </section>
          <section className="section alt">
            <div className="container three-col">
              {(cards.gallery_theme || []).map((c, i) => (
                <div key={i} className="card">
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>
                </div>
              ))}
            </div>
          </section>
        </section>
      )}

      {/* ================= 10. TEAM ================= */}
      {currentView === 'team' && (
        <section className="view" id="team" style={{ display: 'block' }}>
          <section className="page-hero">
            <div className="container">
              <span className="eyebrow" style={{ color: '#dcecff' }}>Team</span>
              <h1>The people behind the voices.</h1>
              <p>Academic leadership, mentors and student contributors supporting the research, learning and storytelling work.</p>
            </div>
          </section>

          {/* LEADERSHIP */}
          <section className="section">
            <div className="container">
              <span className="eyebrow">Project leadership</span>
              <h2>Leadership</h2>
              <div className="team-grid" style={{ marginTop: '22px' }}>
                {(team_by_role.leadership || []).map((m) => (
                  <div key={m.id} className="person">
                    {m.image_url ? (
                      <img
                        src={formatImageUrl(m.image_url)}
                        alt={m.name}
                        className="avatar"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="avatar">{m.initials || 'IS'}</div>
                    )}
                    <div>
                      <h3>{m.name}</h3>
                      <p>{m.designation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* MENTORS */}
          <section className="section alt">
            <div className="container">
              <span className="eyebrow">Mentors</span>
              <h2>Mentors</h2>
              <div className="team-grid" style={{ marginTop: '22px' }}>
                {(team_by_role.mentor || []).map((m) => (
                  <div key={m.id} className="person">
                    {m.image_url ? (
                      <img
                        src={formatImageUrl(m.image_url)}
                        alt={m.name}
                        className="avatar"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="avatar">{m.initials || 'MS'}</div>
                    )}
                    <div>
                      <h3>{m.name}</h3>
                      <p>{m.designation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* STUDENT CONTRIBUTORS */}
          <section className="section">
            <div className="container">
              <span className="eyebrow">Student team</span>
              <h2>Student contributors</h2>
              <div className="team-grid" style={{ marginTop: '22px' }}>
                {(team_by_role.student || []).map((m) => (
                  <div key={m.id} className="person">
                    {m.image_url ? (
                      <img
                        src={formatImageUrl(m.image_url)}
                        alt={m.name}
                        className="avatar"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="avatar">{m.initials || 'ST'}</div>
                    )}
                    <div>
                      <h3>{m.name}</h3>
                      <p>{m.designation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CONTRIBUTORS / HOSTS */}
          <section className="section alt">
            <div className="container">
              <span className="eyebrow">Featured contributors</span>
              <h2>Podcast & media contributors</h2>
              <div className="team-grid" style={{ marginTop: '22px' }}>
                {(team_by_role.contributor || []).map((m) => (
                  <div key={m.id} className="person">
                    {m.image_url ? (
                      <img
                        src={formatImageUrl(m.image_url)}
                        alt={m.name}
                        className="avatar"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="avatar">{m.initials || 'FC'}</div>
                    )}
                    <div>
                      <h3>{m.name}</h3>
                      <p>{m.designation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </section>
      )}

      {/* ================= 11. OUTCOMES ================= */}
      {currentView === 'outcomes' && (
        <section className="view" id="outcomes" style={{ display: 'block' }}>
          <section className="page-hero">
            <div className="container">
              <span className="eyebrow" style={{ color: '#dcecff' }}>Outcomes & impact</span>
              <h1>From activity to evidence.</h1>
              <p>This page should evolve as the project produces evidence. The demo separates planned outcomes from results that are not yet available.</p>
            </div>
          </section>
          <section className="section">
            <div className="container">
              <div className="cards">
                {(cards.outcome_item || []).map((c, i) => (
                  <div key={i} className="card">
                    <span className="eyebrow">{c.tag || `0${i+1}`}</span>
                    <h3>{c.title}</h3>
                    <p>{c.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="section alt">
            <div className="container">
              <span className="eyebrow">Results dashboard</span>
              <h2>Evidence will be added here after assessment.</h2>
              <div className="two-col" style={{ marginTop: '22px' }}>
                <div className="callout">
                  <h3>Before â†’ During â†’ After</h3>
                  <p>Use verified project data to show change in listening, speaking and vocabulary performance.</p>
                </div>
                <div className="callout">
                  <h3>Participant perspectives</h3>
                  <p>Summarize themes from students, teachers and community participants after qualitative analysis is complete.</p>
                </div>
              </div>
              <div className="notice" style={{ marginTop: '18px' }}>
                No improvement percentages or findings are invented in this demo. Replace this section with the project's actual analyzed results.
              </div>
            </div>
          </section>
        </section>
      )}

      {/* ================= 12. NEWS & EVENTS ================= */}
      {currentView === 'news' && (
        <section className="view" id="news" style={{ display: 'block' }}>
          <section className="page-hero">
            <div className="container">
              <span className="eyebrow" style={{ color: '#dcecff' }}>News & events</span>
              <h1>Follow the project as it grows.</h1>
              <p>A living record of training, podcast production, practice sessions, research progress and dissemination.</p>
            </div>
          </section>
          <section className="section">
            <div className="container">
              <div className="cards">
                {(cards.news_event || []).map((c, i) => (
                  <div key={i} className="card">
                    <span className="tag">{c.tag || 'Planned'}</span>
                    <h3>{c.title}</h3>
                    <p>{c.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="section alt">
            <div className="container callout">
              <span className="eyebrow">Research updates</span>
              <h2>Journal article & conference presentation</h2>
              <p>The proposal identifies a journal article and a local or regional conference presentation as intended research outputs. Links will be added when the outputs are available.</p>
            </div>
          </section>
        </section>
      )}

      {/* ================= 13. CONTACT ================= */}
      {currentView === 'contact' && (
        <section className="view" id="contact" style={{ display: 'block' }}>
          <section className="page-hero">
            <div className="container">
              <span className="eyebrow" style={{ color: '#dcecff' }}>Contact & get involved</span>
              <h1>Bring another voice into the conversation.</h1>
              <p>Suggest a guest, share a story, propose a topic or explore collaboration with Voices of Vehari.</p>
            </div>
          </section>
          <section className="section">
            <div className="container two-col">
              <div>
                <span className="eyebrow">Project location</span>
                <h2>{settings.campus || 'COMSATS University Islamabad â€” Vehari Campus'}</h2>
                <p style={{ whiteSpace: 'pre-line', color: 'var(--muted)', fontSize: '16px' }}>
                  {settings.address || 'Mailsi Road, Off Multan Road\nPeer Murad, Vehari\nPunjab, Pakistan'}
                </p>
                <div className="callout" style={{ marginTop: '20px' }}>
                  <h3>Project contacts</h3>
                  <p>Use the verified contact details supplied by the project team when the production website is published.</p>
                  <p><strong>Principal Investigator:</strong> {settings.pi_name || 'Dr. Muhammad Imran Saeed'}</p>
                  <p><strong>Co-PI:</strong> {settings.copi_name || 'Nazish Malik'}</p>
                  <p><strong>Email:</strong> {settings.contact_email || 'info@voicesofvehari.edu.pk'}</p>
                  <p><strong>Phone:</strong> {settings.contact_phone || '+92 (0) 67 3602803'}</p>
                </div>
              </div>
              <div className="card">
                <h3>Get involved</h3>
                <form onSubmit={handleContactSubmit}>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      className="form-control"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">I want to...</label>
                    <select
                      className="form-control"
                      value={contactIntent}
                      onChange={(e) => setContactIntent(e.target.value)}
                    >
                      <option>Suggest a guest</option>
                      <option>Share a story</option>
                      <option>Suggest a topic</option>
                      <option>Collaborate</option>
                      <option>Participate</option>
                      <option>Ask a question</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message</label>
                    <textarea
                      rows="5"
                      className="form-control"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <button className="btn primary" type="submit" disabled={submittingContact}>
                    {submittingContact ? 'Sending Message...' : 'Send Message'}
                  </button>
                  {contactFeedback && (
                    <div style={{
                      marginTop: '16px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      lineHeight: '1.5',
                      background: contactFeedback.type === 'success' ? '#def7ec' : '#f4f8ff',
                      color: contactFeedback.type === 'success' ? '#03543f' : '#1e429f',
                      border: `1px solid ${contactFeedback.type === 'success' ? '#84e1bc' : '#b4c6fc'}`
                    }}>
                      {contactFeedback.message}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </section>
          <section className="section alt">
            <div className="container three-col">
              <div className="card">
                <h3>ðŸŽ™ Suggest a guest</h3>
                <p>Know someone with a meaningful story or expertise relevant to Vehari?</p>
              </div>
              <div className="card">
                <h3> Share a story</h3>
                <p>Help document a local tradition, experience or community narrative.</p>
              </div>
              <div className="card">
                <h3>ðŸ¤ Collaborate</h3>
                <p>Teachers, researchers and community organizations can explore partnership opportunities.</p>
              </div>
            </div>
          </section>
        </section>
      )}

      {/* ================= VIDEO PLAYER MODAL ================= */}
      {activeVideoPodcast && (
        <div
          className="modal-overlay"
          onClick={() => setActiveVideoPodcast(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px'
          }}
        >
          <div
            className="modal-box"
            style={{
              maxWidth: '800px',
              width: '100%',
              background: '#fff',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              padding: 0
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid var(--line)',
                background: '#f8fafc'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--navy)' }}>{activeVideoPodcast.title}</h3>
                {activeVideoPodcast.guest && (
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    Guest: {activeVideoPodcast.guest} {activeVideoPodcast.host ? `Â· Host: ${activeVideoPodcast.host}` : ''}
                  </div>
                )}
              </div>
              <button
                onClick={() => setActiveVideoPodcast(null)}
                style={{
                  border: 0,
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '22px',
                  color: 'var(--navy)',
                  lineHeight: 1,
                  padding: '4px 8px'
                }}
                aria-label="Close video player"
              >
                âœ•
              </button>
            </div>

            <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, background: '#000' }}>
              <iframe
                src={getVideoEmbedUrl(activeVideoPodcast.video_url)}
                title={activeVideoPodcast.title}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            <div style={{ padding: '16px 20px', background: '#fff' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6 }}>
                {activeVideoPodcast.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Guide Resource Detail Modal */}
      {activeResourceModal && (
        <div
          className="modal-backdrop"
          onClick={() => setActiveResourceModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(15, 23, 42, 0.82)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px'
          }}
        >
          <div
            className="modal-box"
            style={{
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#fff',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              padding: 0
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 24px',
                borderBottom: '1px solid var(--border, #e2e8f0)',
                background: '#f8fafc'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="tag" style={{ margin: 0, fontSize: '11px' }}>{activeResourceModal.category}</span>
                  <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>
                    â± {activeResourceModal.time} Â· Level: {activeResourceModal.level}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--navy, #0f172a)' }}>
                  {activeResourceModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveResourceModal(null)}
                style={{
                  border: 0,
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '22px',
                  color: 'var(--navy, #0f172a)',
                  lineHeight: 1,
                  padding: '4px 8px'
                }}
                aria-label="Close guide"
              >
                âœ•
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontSize: '14.5px', lineHeight: 1.6, color: '#334155' }}>
              <p style={{ margin: '0 0 20px', color: 'var(--muted)', fontStyle: 'italic' }}>
                {activeResourceModal.excerpt || activeResourceModal.short_description}
              </p>

              {(activeResourceModal.details?.objective || activeResourceModal.content) && (
                <div style={{ marginBottom: '20px', padding: '14px 16px', borderRadius: '10px', background: 'rgba(22, 101, 192, 0.07)', borderLeft: '4px solid #1665c0' }}>
                  <strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: '#1665c0', marginBottom: '4px', letterSpacing: '0.04em' }}>
                    ðŸŽ¯ Learning Objective
                  </strong>
                  <p style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>
                    {activeResourceModal.details?.objective || activeResourceModal.content}
                  </p>
                </div>
              )}

              {((activeResourceModal.details?.materials && activeResourceModal.details.materials.length > 0) || (activeResourceModal.materials && activeResourceModal.materials.length > 0)) && (
                <div style={{ marginBottom: '22px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                    ðŸ“¦ Materials & Preparation
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--muted)' }}>
                    {(activeResourceModal.details?.materials || activeResourceModal.materials || []).map((mat, mi) => (
                      <li key={mi} style={{ marginBottom: '4px' }}>{mat}</li>
                    ))}
                  </ul>
                </div>
              )}

              {((activeResourceModal.details?.steps && activeResourceModal.details.steps.length > 0) || (activeResourceModal.steps && activeResourceModal.steps.length > 0)) && (
                <div>
                  <h4 style={{ margin: '0 0 10px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                    ðŸ“‹ Step-by-Step Procedure
                  </h4>
                  <ol style={{ margin: 0, paddingLeft: '20px', color: '#334155' }}>
                    {(activeResourceModal.details?.steps || activeResourceModal.steps || []).map((stp, si) => (
                      <li key={si} style={{ marginBottom: '10px' }}>
                        {stp}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '14px 24px',
                borderTop: '1px solid var(--border, #e2e8f0)',
                background: '#f8fafc'
              }}
            >
              <button
                type="button"
                className="btn primary sm"
                onClick={() => setActiveResourceModal(null)}
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer settings={settings} />

      {/* ==================== VOCABULARY PAGE ==================== */}
      {currentView === 'vocabulary' && (() => {
        const VOCAB_CATS = ['All', 'Education', 'Community', 'Culture', 'Nature', 'Daily Life', 'Academic', 'Communication'];
        const publishedWords = (vocabulary || []).filter((w) => w.is_published !== false);
        const filteredWords = publishedWords.filter((w) => {
          const q = vocabSearch.toLowerCase();
          const matchSearch = !q || w.word?.toLowerCase().includes(q) || w.meaning?.toLowerCase().includes(q) || w.example_sentence?.toLowerCase().includes(q);
          const matchCat = vocabCat === 'All' || w.category === vocabCat;
          const matchLevel = vocabLevel === 'All' || w.level === vocabLevel;
          return matchSearch && matchCat && matchLevel;
        });
        const levelColor = (level) => {
          if (level === 'Beginner') return { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' };
          if (level === 'Advanced') return { bg: '#fce4ec', color: '#c62828', border: '#f48fb1' };
          return { bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' };
        };
        return (
          <div style={{ minHeight: '80vh', background: '#f8fafc' }}>
            {/* Hero */}
            <div style={{ background: 'linear-gradient(135deg, var(--navy,#1e3a5f) 0%, #2d5986 100%)', color: 'white', padding: '64px 24px 48px', textAlign: 'center' }}>
              <div style={{ maxWidth: '760px', margin: '0 auto' }}>
                <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '6px 18px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '18px' }}>
                  ENGLISH VOCABULARY
                </div>
                <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.2, color: 'white' }}>
                  Vocabulary
                </h1>
                <p style={{ fontSize: '18px', opacity: 0.88, margin: '0 0 28px', lineHeight: 1.6 }}>
                  Explore key English words drawn from the culture, community and everyday life of Vehari. Build your vocabulary with clear definitions and local examples.
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', color: 'rgba(255,255,255,0.85)', fontSize: '15px', fontWeight: 600 }}>
                  <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '4px 14px' }}>{publishedWords.length} Words</span>
                  <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '4px 14px' }}>{VOCAB_CATS.length - 1} Categories</span>
                  <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '4px 14px' }}>3 Levels</span>
                </div>
              </div>
            </div>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px' }}>
              {/* Search + Filters */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: '28px' }}>
                <input
                  type="search"
                  placeholder="Search words, meanings, examples..."
                  value={vocabSearch}
                  onChange={(e) => setVocabSearch(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '15px', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }}
                />
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {VOCAB_CATS.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setVocabCat(cat)}
                      style={{
                        padding: '6px 14px', borderRadius: '20px', border: '1.5px solid',
                        borderColor: vocabCat === cat ? 'var(--navy,#1e3a5f)' : '#e2e8f0',
                        background: vocabCat === cat ? 'var(--navy,#1e3a5f)' : 'white',
                        color: vocabCat === cat ? 'white' : '#334155',
                        fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >{cat}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Level:</span>
                  {['All', 'Beginner', 'Intermediate', 'Advanced'].map((lv) => {
                    const lc = levelColor(lv);
                    const active = vocabLevel === lv;
                    return (
                      <button key={lv} onClick={() => setVocabLevel(lv)} style={{
                        padding: '4px 12px', borderRadius: '16px', border: '1.5px solid',
                        borderColor: active ? (lv === 'All' ? 'var(--navy,#1e3a5f)' : lc.border) : '#e2e8f0',
                        background: active ? (lv === 'All' ? 'var(--navy,#1e3a5f)' : lc.bg) : 'white',
                        color: active ? (lv === 'All' ? 'white' : lc.color) : '#334155',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                      }}>{lv}</button>
                    );
                  })}
                </div>
              </div>

              {/* Word count */}
              <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: 600 }}>
                  Showing <strong>{filteredWords.length}</strong> of <strong>{publishedWords.length}</strong> words
                </p>
                {(vocabSearch || vocabCat !== 'All' || vocabLevel !== 'All') && (
                  <button onClick={() => { setVocabSearch(''); setVocabCat('All'); setVocabLevel('All'); }}
                    style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
                    Clear Filters âœ•
                  </button>
                )}
              </div>

              {/* Cards Grid */}
              {filteredWords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
                  <h3 style={{ color: 'var(--navy,#1e3a5f)', marginBottom: '8px' }}>No words found</h3>
                  <p style={{ color: '#64748b', marginBottom: '20px' }}>Try a different search term or filter.</p>
                  <button onClick={() => { setVocabSearch(''); setVocabCat('All'); setVocabLevel('All'); }}
                    style={{ background: 'var(--navy,#1e3a5f)', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 24px', cursor: 'pointer', fontWeight: 700 }}>
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {filteredWords.map((w) => {
                    const lc = levelColor(w.level);
                    return (
                      <div key={w.id} style={{
                        background: 'white', borderRadius: '16px', padding: '24px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: 'var(--navy,#1e3a5f)' }}>{w.word}</h3>
                          <span style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: lc.bg, color: lc.color, border: `1px solid ${lc.border}`, flexShrink: 0 }}>{w.level}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <span style={{ fontSize: '12px', fontStyle: 'italic', color: '#64748b', background: '#f8fafc', padding: '2px 8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>{w.part_of_speech}</span>
                          <span style={{ fontSize: '11px', fontWeight: 700, background: '#f0f4ff', color: 'var(--navy,#1e3a5f)', padding: '2px 8px', borderRadius: '10px' }}>{w.category}</span>
                        </div>
                        <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>{w.meaning}</p>
                        {w.example_sentence && (
                          <div style={{ background: '#f8fafc', borderLeft: '3px solid var(--teal,#2a9d8f)', borderRadius: '0 8px 8px 0', padding: '10px 12px' }}>
                            <p style={{ margin: 0, fontSize: '13px', color: '#475569', fontStyle: 'italic', lineHeight: 1.5 }}>"{w.example_sentence}"</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default PublicWebsite;
