import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

export const ResearchManager = () => {
  const [activeTab, setActiveTab] = useState('brief'); // 'brief' | 'design' | 'objectives' | 'references'
  const [loading, setLoading] = useState(true);
  const [savingBrief, setSavingBrief] = useState(false);

  // 1. Brief & Design State
  const [briefData, setBriefData] = useState({
    hero_eyebrow: 'Research',
    hero_title: 'Researching technology-enhanced, culturally relevant language learning.',
    hero_description: 'A mixed-methods research project examining language outcomes and participant perspectives in a multilingual EFL setting.',
    brief_eyebrow: 'Project brief',
    project_title: 'Voices of Vehari',
    lead_subtitle: 'Enhancing English Proficiency through Multilingual Podcasting and Cultural Storytelling',
    nature: 'Applied Basic Research',
    duration: '12 months',
    proposed_start: 'August 2025',
    department: 'Humanities, Vehari Campus',
    area: 'Computer Assisted Language Learning and ELT',
    grant_amount: 'Rs. 300,000',
    design_eyebrow: 'Research design',
    design_title: 'Mixed methods',
    quantitative_title: 'Quantitative component',
    quantitative_description: 'Simple language-proficiency assessments before, during and after podcast sessions, with emphasis on speaking, listening and vocabulary.',
    qualitative_title: 'Qualitative component',
    qualitative_description: 'Participant perspectives and experiences gathered through discussions and practice sessions to understand how learners and teachers perceive the approach.',
  });

  // 2. Objectives State (from section_cards where section_group = 'research_objective')
  const [objectives, setObjectives] = useState([]);
  const [objModalOpen, setObjModalOpen] = useState(false);
  const [editingObjId, setEditingObjId] = useState(null);
  const [objForm, setObjForm] = useState({
    icon: '01',
    title: '',
    description: '',
    sort_order: 1,
    is_active: true,
  });

  // 3. Academic References State
  const [references, setReferences] = useState([]);
  const [refModalOpen, setRefModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRef, setSelectedRef] = useState(null);
  const [editingRefId, setEditingRefId] = useState(null);
  const [refForm, setRefForm] = useState({
    author: '',
    contribution: '',
    sort_order: 1,
    is_active: true,
  });

  const { addToast } = useToast();

  const loadAllResearchData = async () => {
    try {
      setLoading(true);
      const [briefRes, cardsRes, refsRes] = await Promise.all([
        api.getResearchBrief(),
        api.getAdminCards('research_objective'),
        api.getAdminReferences(),
      ]);

      if (briefRes) {
        setBriefData((prev) => ({ ...prev, ...briefRes }));
      }
      if (Array.isArray(cardsRes)) {
        setObjectives(cardsRes);
      }
      if (Array.isArray(refsRes)) {
        setReferences(refsRes);
      }
    } catch {
      addToast('Failed to load research data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllResearchData();
  }, []);

  // Handle Brief & Design input changes
  const handleBriefChange = (e) => {
    const { name, value } = e.target;
    setBriefData((prev) => ({ ...prev, [name]: value }));
  };

  // Save Project Brief & Design
  const handleSaveBrief = async (e) => {
    if (e) e.preventDefault();
    try {
      setSavingBrief(true);
      const res = await api.updateResearchBrief(briefData);
      if (res && res.success) {
        addToast(res.message || 'Research data saved successfully!', 'success');
      } else {
        addToast(res?.message || 'Failed to update research brief', 'error');
      }
    } catch (err) {
      addToast(err?.message || 'Failed to save changes', 'error');
    } finally {
      setSavingBrief(false);
    }
  };

  // Objectives Handlers
  const handleOpenCreateObj = () => {
    setEditingObjId(null);
    setObjForm({
      icon: String(objectives.length + 1).padStart(2, '0'),
      title: '',
      description: '',
      sort_order: objectives.length + 1,
      is_active: true,
    });
    setObjModalOpen(true);
  };

  const handleOpenEditObj = (item) => {
    setEditingObjId(item.id);
    setObjForm({
      icon: item.icon || '',
      title: item.title || '',
      description: item.description || '',
      sort_order: item.sort_order || 1,
      is_active: item.is_active ?? true,
    });
    setObjModalOpen(true);
  };

  const handleSaveObj = async (e) => {
    e.preventDefault();
    try {
      if (editingObjId) {
        await api.updateCard(editingObjId, {
          section_group: 'research_objective',
          ...objForm,
        });
        addToast('Research objective updated successfully', 'success');
      } else {
        await api.createCard({
          section_group: 'research_objective',
          ...objForm,
        });
        addToast('Research objective added successfully', 'success');
      }
      setObjModalOpen(false);
      const refreshed = await api.getAdminCards('research_objective');
      setObjectives(refreshed);
    } catch {
      addToast('Failed to save objective', 'error');
    }
  };

  const handleDeleteObj = async (id) => {
    try {
      await api.deleteCard(id);
      addToast('Objective deleted successfully', 'success');
      const refreshed = await api.getAdminCards('research_objective');
      setObjectives(refreshed);
    } catch {
      addToast('Failed to delete objective', 'error');
    }
  };

  // References Handlers
  const handleOpenCreateRef = () => {
    setEditingRefId(null);
    setRefForm({
      author: '',
      contribution: '',
      sort_order: references.length + 1,
      is_active: true,
    });
    setRefModalOpen(true);
  };

  const handleOpenEditRef = (r) => {
    setEditingRefId(r.id);
    setRefForm({
      author: r.author || '',
      contribution: r.contribution || '',
      sort_order: r.sort_order || 1,
      is_active: r.is_active ?? true,
    });
    setRefModalOpen(true);
  };

  const handleSaveRef = async (e) => {
    e.preventDefault();
    try {
      if (editingRefId) {
        await api.updateAcademicReference(editingRefId, refForm);
        addToast('Reference updated successfully', 'success');
      } else {
        await api.createAcademicReference(refForm);
        addToast('Reference added successfully', 'success');
      }
      setRefModalOpen(false);
      const refreshed = await api.getAdminReferences();
      setReferences(refreshed);
    } catch {
      addToast('Failed to save reference', 'error');
    }
  };

  const confirmDeleteRef = async () => {
    if (!selectedRef) return;
    try {
      await api.deleteAcademicReference(selectedRef.id);
      addToast('Academic reference deleted', 'success');
      setDeleteModalOpen(false);
      setSelectedRef(null);
      const refreshed = await api.getAdminReferences();
      setReferences(refreshed);
    } catch {
      addToast('Failed to delete reference', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--navy)', fontWeight: 600 }}>
        Loading Research page data...
      </div>
    );
  }

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px' }}>
            Research Page Management
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
            Customize project brief metadata, research scope, methodologies, objectives, and academic references.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href="/#research"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <span>👁️</span> View Public Page
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { key: 'brief', icon: '📋', label: 'Project Brief & Key Info' },
          { key: 'design', icon: '🔬', label: 'Hero & Research Design' },
          { key: 'objectives', icon: '🎯', label: `Objectives (${objectives.length})` },
          { key: 'references', icon: '📚', label: `Selected References (${references.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              background: activeTab === tab.key ? 'var(--navy)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'var(--muted)',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ================= TAB 1: PROJECT BRIEF & KEY INFO ================= */}
      {activeTab === 'brief' && (
        <form onSubmit={handleSaveBrief}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Left Card: Project Title & Subtitle */}
            <div className="card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--navy)', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                📌 Project Identification
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                  Section Eyebrow
                </label>
                <input
                  type="text"
                  name="brief_eyebrow"
                  value={briefData.brief_eyebrow || ''}
                  onChange={handleBriefChange}
                  className="input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  placeholder="e.g. Project brief"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                  Project Title
                </label>
                <input
                  type="text"
                  name="project_title"
                  value={briefData.project_title || ''}
                  onChange={handleBriefChange}
                  className="input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                  placeholder="e.g. Voices of Vehari"
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                  Lead Subtitle / Tagline
                </label>
                <textarea
                  name="lead_subtitle"
                  value={briefData.lead_subtitle || ''}
                  onChange={handleBriefChange}
                  rows={4}
                  className="input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                  placeholder="e.g. Enhancing English Proficiency through Multilingual Podcasting and Cultural Storytelling"
                  required
                />
              </div>

              {/* Live Preview Box */}
              <div style={{ marginTop: '20px', padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--teal)', fontWeight: 700 }}>
                  Live Preview
                </span>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--teal)', fontWeight: 700, marginTop: '4px' }}>
                  {briefData.brief_eyebrow || 'Project brief'}
                </span>
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy)', margin: '4px 0' }}>
                  {briefData.project_title || 'Voices of Vehari'}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
                  {briefData.lead_subtitle || 'Enhancing English Proficiency through Multilingual Podcasting and Cultural Storytelling'}
                </p>
              </div>
            </div>

            {/* Right Card: Institutional & Financial Metadata */}
            <div className="card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--navy)', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                🏛️ Institutional & Project Metadata
              </h3>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                  Nature of Research
                </label>
                <input
                  type="text"
                  name="nature"
                  value={briefData.nature || ''}
                  onChange={handleBriefChange}
                  className="input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  placeholder="e.g. Applied Basic Research"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                    Duration
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={briefData.duration || ''}
                    onChange={handleBriefChange}
                    className="input"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    placeholder="e.g. 12 months"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                    Proposed Start
                  </label>
                  <input
                    type="text"
                    name="proposed_start"
                    value={briefData.proposed_start || ''}
                    onChange={handleBriefChange}
                    className="input"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    placeholder="e.g. August 2025"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                  Department / Campus
                </label>
                <input
                  type="text"
                  name="department"
                  value={briefData.department || ''}
                  onChange={handleBriefChange}
                  className="input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  placeholder="e.g. Humanities, Vehari Campus"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                  Research Area / Field
                </label>
                <input
                  type="text"
                  name="area"
                  value={briefData.area || ''}
                  onChange={handleBriefChange}
                  className="input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  placeholder="e.g. Computer Assisted Language Learning and ELT"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                  Estimated / Requested Grant
                </label>
                <input
                  type="text"
                  name="grant_amount"
                  value={briefData.grant_amount || ''}
                  onChange={handleBriefChange}
                  className="input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#0d9488' }}
                  placeholder="e.g. Rs. 300,000"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="submit"
              disabled={savingBrief}
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontSize: '15px', fontWeight: 700 }}
            >
              {savingBrief ? '💾 Saving to Database...' : '💾 Save Project Brief'}
            </button>
          </div>
        </form>
      )}

      {/* ================= TAB 2: HERO & RESEARCH DESIGN ================= */}
      {activeTab === 'design' && (
        <form onSubmit={handleSaveBrief}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Research Page Hero */}
            <div className="card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--navy)', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                🌟 Research Page Hero Banner
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                  Hero Eyebrow
                </label>
                <input
                  type="text"
                  name="hero_eyebrow"
                  value={briefData.hero_eyebrow || ''}
                  onChange={handleBriefChange}
                  className="input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  placeholder="e.g. Research"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                  Hero Headline / Title
                </label>
                <input
                  type="text"
                  name="hero_title"
                  value={briefData.hero_title || ''}
                  onChange={handleBriefChange}
                  className="input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                  placeholder="e.g. Researching technology-enhanced, culturally relevant language learning."
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                  Hero Subtitle / Description
                </label>
                <textarea
                  name="hero_description"
                  value={briefData.hero_description || ''}
                  onChange={handleBriefChange}
                  rows={4}
                  className="input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                  placeholder="e.g. A mixed-methods research project examining language outcomes and participant perspectives..."
                />
              </div>
            </div>

            {/* Research Design (Mixed Methods) */}
            <div className="card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--navy)', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                🔬 Research Design (Mixed Methods)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                    Design Eyebrow
                  </label>
                  <input
                    type="text"
                    name="design_eyebrow"
                    value={briefData.design_eyebrow || ''}
                    onChange={handleBriefChange}
                    className="input"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    placeholder="e.g. Research design"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                    Design Heading
                  </label>
                  <input
                    type="text"
                    name="design_title"
                    value={briefData.design_title || ''}
                    onChange={handleBriefChange}
                    className="input"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                    placeholder="e.g. Mixed methods"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                  Quantitative Component Title & Description
                </label>
                <input
                  type="text"
                  name="quantitative_title"
                  value={briefData.quantitative_title || ''}
                  onChange={handleBriefChange}
                  className="input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 600, marginBottom: '6px' }}
                  placeholder="e.g. Quantitative component"
                />
                <textarea
                  name="quantitative_description"
                  value={briefData.quantitative_description || ''}
                  onChange={handleBriefChange}
                  rows={3}
                  className="input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                  placeholder="Description of quantitative assessments..."
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                  Qualitative Component Title & Description
                </label>
                <input
                  type="text"
                  name="qualitative_title"
                  value={briefData.qualitative_title || ''}
                  onChange={handleBriefChange}
                  className="input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 600, marginBottom: '6px' }}
                  placeholder="e.g. Qualitative component"
                />
                <textarea
                  name="qualitative_description"
                  value={briefData.qualitative_description || ''}
                  onChange={handleBriefChange}
                  rows={3}
                  className="input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                  placeholder="Description of qualitative perspectives..."
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="submit"
              disabled={savingBrief}
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontSize: '15px', fontWeight: 700 }}
            >
              {savingBrief ? '💾 Saving to Database...' : '💾 Save Research Design'}
            </button>
          </div>
        </form>
      )}

      {/* ================= TAB 3: OBJECTIVES ================= */}
      {activeTab === 'objectives' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
              Research Objectives ({objectives.length})
            </h3>
            <button onClick={handleOpenCreateObj} className="btn btn-primary" style={{ fontSize: '13px' }}>
              + Add Research Objective
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {objectives.map((obj) => (
              <div
                key={obj.id}
                className="card"
                style={{
                  padding: '20px',
                  background: '#fff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--teal)' }}>
                      {obj.icon || '🎯'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                      Order: {obj.sort_order}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', margin: '0 0 8px' }}>
                    {obj.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.5', margin: 0 }}>
                    {obj.description}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    onClick={() => handleOpenEditObj(obj)}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteObj(obj.id)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px', color: '#ef4444', borderColor: '#fca5a5' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal for Objective Add/Edit */}
          {objModalOpen && (
            <div className="modal-backdrop">
              <div className="modal" style={{ maxWidth: '480px' }}>
                <div className="modal-header">
                  <h3>{editingObjId ? 'Edit Research Objective' : 'New Research Objective'}</h3>
                  <button onClick={() => setObjModalOpen(false)}>✕</button>
                </div>
                <form onSubmit={handleSaveObj} className="modal-body">
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                      Icon / Number Label (e.g. 01, 02)
                    </label>
                    <input
                      type="text"
                      value={objForm.icon}
                      onChange={(e) => setObjForm({ ...objForm, icon: e.target.value })}
                      className="input"
                      placeholder="01"
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                      Objective Title
                    </label>
                    <input
                      type="text"
                      value={objForm.title}
                      onChange={(e) => setObjForm({ ...objForm, title: e.target.value })}
                      className="input"
                      placeholder="e.g. Listening & speaking"
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                      Description
                    </label>
                    <textarea
                      value={objForm.description}
                      onChange={(e) => setObjForm({ ...objForm, description: e.target.value })}
                      rows={4}
                      className="input"
                      placeholder="Assess the impact of multilingual podcasting..."
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={objForm.sort_order}
                      onChange={(e) => setObjForm({ ...objForm, sort_order: Number(e.target.value) })}
                      className="input"
                      min={1}
                    />
                  </div>
                  <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                    <button type="button" onClick={() => setObjModalOpen(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingObjId ? 'Save Changes' : 'Create Objective'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: ACADEMIC REFERENCES ================= */}
      {activeTab === 'references' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                Academic Foundations & Citations ({references.length})
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '4px 0 0' }}>
                Selected published literature providing theoretical and empirical grounding for Voices of Vehari.
              </p>
            </div>
            <button onClick={handleOpenCreateRef} className="btn btn-primary" style={{ fontSize: '13px' }}>
              + Add Reference
            </button>
          </div>

          <div className="table-wrap" style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--navy)', width: '25%' }}>Author & Year</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>Contribution to Project Context</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: 'var(--navy)', width: '80px' }}>Order</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: 'var(--navy)', width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {references.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--navy)', fontSize: '14px' }}>
                      {r.author}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '13px', lineHeight: '1.5' }}>
                      {r.contribution}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--muted)' }}>
                      {r.sort_order}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenEditRef(r)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          title="Edit Reference"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRef(r);
                            setDeleteModalOpen(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444', borderColor: '#fca5a5' }}
                          title="Delete Reference"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reference Modal */}
          {refModalOpen && (
            <div className="modal-backdrop">
              <div className="modal" style={{ maxWidth: '520px' }}>
                <div className="modal-header">
                  <h3>{editingRefId ? 'Edit Academic Reference' : 'New Academic Reference'}</h3>
                  <button onClick={() => setRefModalOpen(false)}>✕</button>
                </div>
                <form onSubmit={handleSaveRef} className="modal-body">
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                      Author & Citation (e.g. Rosell-Aguilar (2013))
                    </label>
                    <input
                      type="text"
                      value={refForm.author}
                      onChange={(e) => setRefForm({ ...refForm, author: e.target.value })}
                      className="input"
                      placeholder="e.g. Creese & Blackledge (2010)"
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                      Contribution to Project Context
                    </label>
                    <textarea
                      value={refForm.contribution}
                      onChange={(e) => setRefForm({ ...refForm, contribution: e.target.value })}
                      rows={4}
                      className="input"
                      placeholder="e.g. Translanguaging as a pedagogy for multilingual classrooms."
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={refForm.sort_order}
                      onChange={(e) => setRefForm({ ...refForm, sort_order: Number(e.target.value) })}
                      className="input"
                      min={1}
                    />
                  </div>
                  <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                    <button type="button" onClick={() => setRefModalOpen(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingRefId ? 'Save Changes' : 'Create Reference'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Reference Confirmation */}
          <ConfirmationModal
            isOpen={deleteModalOpen}
            title="Delete Academic Reference"
            message={`Are you sure you want to delete reference "${selectedRef?.author}"?`}
            onConfirm={confirmDeleteRef}
            onCancel={() => {
              setDeleteModalOpen(false);
              setSelectedRef(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ResearchManager;
