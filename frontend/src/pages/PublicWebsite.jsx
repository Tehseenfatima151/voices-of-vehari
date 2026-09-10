import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AudioPlayer from '../components/AudioPlayer';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const PublicWebsite = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // for podcast filter
  const [audioSearch, setAudioSearch] = useState(''); // for audio transcripts search
  
  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactIntent, setContactIntent] = useState('Suggest a guest');
  const [contactMessage, setContactMessage] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);

  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Current view based on hash (#about, #podcasts, etc.) or default to #index
  const currentView = (location.hash ? location.hash.replace('#', '') : 'index') || 'index';

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const result = await api.getPublicAll();
        setData(result);
      } catch (err) {
        console.error('Failed to load website content:', err);
        setError('Could not connect to the backend server. Please check if the API is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
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

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }

    try {
      setSubmittingContact(true);
      const res = await api.submitContact({
        name: contactName,
        email: contactEmail,
        intent: contactIntent,
        message: contactMessage
      });
      if (res.success) {
        addToast(res.message || 'Thank you! Your message has been received.', 'success');
        setContactName('');
        setContactEmail('');
        setContactMessage('');
      } else {
        addToast(res.message || 'Failed to submit form.', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error submitting message. Please try again.';
      addToast(msg, 'error');
    } finally {
      setSubmittingContact(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--paper)' }}>
        <div style={{ textAlign: 'center', color: 'var(--navy)' }}>
          <div style={{ fontSize: '32px', marginBottom: '14px' }}>🎙️</div>
          <h2 style={{ margin: 0, fontWeight: 800 }}>Voices of Vehari</h2>
          <p style={{ color: 'var(--muted)', marginTop: '6px' }}>Loading dynamic content from backend...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--paper)', padding: '20px' }}>
        <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <h3 style={{ color: '#d9383a' }}>Connection Notice</h3>
          <p>{error}</p>
          <button className="btn primary" onClick={() => window.location.reload()}>Retry Connection</button>
        </div>
      </div>
    );
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
    references = []
  } = data || {};

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
                  src={hero.hero_image_url || '/assets/hero_art.jpeg'}
                  alt={hero.hero_image_alt || 'Illustration of young people creating podcasts and sharing stories'}
                  onError={(e) => { e.target.src = '/assets/hero_art.jpeg'; }}
                />
                <div className="logo-float">
                  <img
                    src={hero.logo_float_url || '/assets/voices_logo.png'}
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
                <h2>Local language → local story → English practice</h2>
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
                    <img
                      src={pod.cover_image_url || '/assets/podcast_upcoming.jpeg'}
                      alt={pod.title}
                      onError={(e) => { e.target.src = '/assets/podcast_upcoming.jpeg'; }}
                    />
                    <div className="body">
                      {(pod.tags || []).map((t, ti) => (
                        <span key={ti} className="tag">{t}</span>
                      ))}
                      <h3>{pod.title}</h3>
                      {pod.guest && (
                        <p style={{ margin: '4px 0' }}>
                          <strong>Guest:</strong> {pod.guest} {pod.host ? `· Host: ${pod.host}` : ''}
                        </p>
                      )}
                      <p>{pod.description}</p>
                      <AudioPlayer src={pod.audio_url} />
                      <div className="actions" style={{ marginTop: '16px' }}>
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
              <h2>Local language → English → Learning</h2>
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
              <h2>Learn from “Women Education in Vehari”</h2>
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
                    {pod.guest && <p style={{ margin: '4px 0', color: 'var(--muted)' }}>Guest: {pod.guest} {pod.host ? `· Host: ${pod.host}` : ''}</p>}
                    <AudioPlayer src={pod.audio_url} />
                    <div className="actions" style={{ marginTop: '14px' }}>
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
                  <li><strong>Original conversation</strong> — preserve the authentic exchange.</li>
                  <li><strong>English version</strong> — support comprehension and comparison.</li>
                  <li><strong>Vocabulary</strong> — highlight useful words and phrases.</li>
                  <li><strong>Practice</strong> — add listening, speaking and reflection activities.</li>
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
                    src={g.image_url || '/assets/gallery_poster.jpeg'}
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
                    <div className="avatar">{m.initials || 'IS'}</div>
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
                    <div className="avatar">{m.initials || 'MS'}</div>
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
                    <div className="avatar">{m.initials || 'ST'}</div>
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
                    <div className="avatar">{m.initials || 'FC'}</div>
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
                  <h3>Before → During → After</h3>
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
                <h2>{settings.campus || 'COMSATS University Islamabad — Vehari Campus'}</h2>
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
                </form>
              </div>
            </div>
          </section>
          <section className="section alt">
            <div className="container three-col">
              <div className="card">
                <h3>🎙 Suggest a guest</h3>
                <p>Know someone with a meaningful story or expertise relevant to Vehari?</p>
              </div>
              <div className="card">
                <h3>📖 Share a story</h3>
                <p>Help document a local tradition, experience or community narrative.</p>
              </div>
              <div className="card">
                <h3>🤝 Collaborate</h3>
                <p>Teachers, researchers and community organizations can explore partnership opportunities.</p>
              </div>
            </div>
          </section>
        </section>
      )}

      <Footer settings={settings} />
    </div>
  );
};

export default PublicWebsite;
