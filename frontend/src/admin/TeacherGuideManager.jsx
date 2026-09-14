import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { formatImageUrl } from '../utils/mediaUrlHelper';

export const TeacherGuideManager = () => {
  const [activeTab, setActiveTab] = useState('articles'); // 'articles' | 'activity' | 'strategies' | 'prompts' | 'lesson_plan'
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // 1. ARTICLES STATE
  const [articles, setArticles] = useState([]);
  const [selectedArticleCategory, setSelectedArticleCategory] = useState('All');
  const [articleSearch, setArticleSearch] = useState('');
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [articleFormData, setArticleFormData] = useState({
    title: '',
    category: 'Lesson Ideas',
    short_description: '',
    content: '',
    materials: '',
    steps: '',
    image_url: '',
    level: 'Intermediate',
    estimated_time: '30–45 minutes',
    author: 'Voices of Vehari Team',
    display_order: 0,
    is_published: true,
  });

  // 2. ACTIVITIES STATE
  const [activities, setActivities] = useState([]);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [activityFormData, setActivityFormData] = useState({
    title: '',
    purpose: '',
    estimated_time: '35 minutes',
    level: 'Intermediate',
    teacher_tip: '',
    objectives: '',
    steps: '',
    image_url: '',
    is_published: true,
  });

  // 3. STRATEGIES STATE
  const [strategies, setStrategies] = useState([]);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [editingStrategyId, setEditingStrategyId] = useState(null);
  const [strategyFormData, setStrategyFormData] = useState({
    strategy_number: '01',
    icon: '💡',
    title: '',
    description: '',
    display_order: 0,
    is_published: true,
  });

  // 4. PROMPTS STATE
  const [prompts, setPrompts] = useState([]);
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState(null);
  const [promptFormData, setPromptFormData] = useState({
    prompt: '',
    category: 'Local Community',
    display_order: 0,
    is_published: true,
  });

  // 5. LESSON PLAN STATE
  const [lessonPlan, setLessonPlan] = useState({
    title: 'Simple Lesson Plan Template',
    description: 'A practical, culturally-responsive lesson structure for classroom English teachers.',
    topic: '',
    learning_objective: '',
    english_skills: '',
    vocabulary: '',
    warmup_activity: '',
    main_activity: '',
    pair_group_activity: '',
    assessment: '',
    homework: '',
  });
  const [savingLessonPlan, setSavingLessonPlan] = useState(false);

  // SHARED DELETE MODAL
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'article'|'activity'|'strategy'|'prompt', item }

  // LOAD ALL DATA
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [artRes, actRes, stratRes, promptRes, lpRes] = await Promise.all([
        api.getAdminTeacherArticles(),
        api.getAdminTeacherActivities(),
        api.getAdminTeacherStrategies(),
        api.getAdminTeacherPrompts(),
        api.getAdminLessonPlan(),
      ]);
      setArticles(artRes || []);
      setActivities(actRes || []);
      setStrategies(stratRes || []);
      setPrompts(promptRes || []);
      if (lpRes) {
        setLessonPlan({
          title: lpRes.title || 'Simple Lesson Plan Template',
          description: lpRes.description || '',
          topic: lpRes.topic || '',
          learning_objective: lpRes.learning_objective || '',
          english_skills: lpRes.english_skills || '',
          vocabulary: lpRes.vocabulary || '',
          warmup_activity: lpRes.warmup_activity || '',
          main_activity: lpRes.main_activity || '',
          pair_group_activity: lpRes.pair_group_activity || '',
          assessment: lpRes.assessment || '',
          homework: lpRes.homework || '',
        });
      }
    } catch {
      addToast('Failed to load teacher guide content', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // ================= 1. ARTICLES ACTIONS =================
  const openCreateArticleModal = () => {
    setEditingArticleId(null);
    setArticleFormData({
      title: '',
      category: 'Lesson Ideas',
      short_description: '',
      content: '',
      materials: '',
      steps: '',
      image_url: '',
      level: 'Intermediate',
      estimated_time: '30–45 minutes',
      author: 'Voices of Vehari Team',
      display_order: articles.length + 1,
      is_published: true,
    });
    setArticleModalOpen(true);
  };

  const openEditArticleModal = (art) => {
    setEditingArticleId(art.id);
    const materialsArr = art.materials || art.details?.materials || [];
    const stepsArr = art.steps || art.details?.steps || [];
    setArticleFormData({
      title: art.title || '',
      category: art.category || 'Lesson Ideas',
      short_description: art.short_description || art.excerpt || '',
      content: art.content || '',
      materials: Array.isArray(materialsArr) ? materialsArr.join('\n') : '',
      steps: Array.isArray(stepsArr) ? stepsArr.join('\n') : '',
      image_url: art.image_url || '',
      level: art.level || 'Intermediate',
      estimated_time: art.estimated_time || art.time || '30–45 minutes',
      author: art.author || 'Voices of Vehari Team',
      display_order: art.display_order ?? 0,
      is_published: art.is_published ?? true,
    });
    setArticleModalOpen(true);
  };

  const handleToggleArticlePublish = async (id) => {
    try {
      const res = await api.toggleTeacherArticlePublish(id);
      addToast(res.message || 'Article status updated', 'success');
      loadAllData();
    } catch {
      addToast('Failed to toggle article status', 'error');
    }
  };

  const handleArticleSubmit = async (e) => {
    e.preventDefault();
    if (!articleFormData.title.trim()) {
      addToast('Title is required', 'error');
      return;
    }
    const payload = {
      ...articleFormData,
      materials: articleFormData.materials
        ? articleFormData.materials.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
      steps: articleFormData.steps
        ? articleFormData.steps.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
    };

    try {
      if (editingArticleId) {
        await api.updateTeacherArticle(editingArticleId, payload);
        addToast('Article updated successfully', 'success');
      } else {
        await api.createTeacherArticle(payload);
        addToast('Article created successfully', 'success');
      }
      setArticleModalOpen(false);
      loadAllData();
    } catch {
      addToast('Failed to save article', 'error');
    }
  };

  // ================= 2. ACTIVITIES ACTIONS =================
  const openCreateActivityModal = () => {
    setEditingActivityId(null);
    setActivityFormData({
      title: '',
      purpose: '',
      estimated_time: '35 minutes',
      level: 'Intermediate',
      teacher_tip: '',
      objectives: '',
      steps: '',
      image_url: '',
      is_published: true,
    });
    setActivityModalOpen(true);
  };

  const openEditActivityModal = (act) => {
    setEditingActivityId(act.id);
    const objArr = act.objectives || [];
    const stepsArr = act.steps || [];
    setActivityFormData({
      title: act.title || '',
      purpose: act.purpose || '',
      estimated_time: act.estimated_time || act.time || '35 minutes',
      level: act.level || 'Intermediate',
      teacher_tip: act.teacher_tip || act.teacherTip || '',
      objectives: Array.isArray(objArr) ? objArr.join('\n') : '',
      steps: Array.isArray(stepsArr) ? stepsArr.join('\n') : '',
      image_url: act.image_url || '',
      is_published: act.is_published ?? true,
    });
    setActivityModalOpen(true);
  };

  const handleToggleActivityPublish = async (id) => {
    try {
      const res = await api.toggleTeacherActivityPublish(id);
      addToast(res.message || 'Activity status updated', 'success');
      loadAllData();
    } catch {
      addToast('Failed to toggle activity status', 'error');
    }
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    if (!activityFormData.title.trim() || !activityFormData.purpose.trim()) {
      addToast('Title and Purpose are required', 'error');
      return;
    }
    const payload = {
      ...activityFormData,
      objectives: activityFormData.objectives
        ? activityFormData.objectives.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
      steps: activityFormData.steps
        ? activityFormData.steps.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
    };

    try {
      if (editingActivityId) {
        await api.updateTeacherActivity(editingActivityId, payload);
        addToast('Activity updated successfully', 'success');
      } else {
        await api.createTeacherActivity(payload);
        addToast('Activity created successfully', 'success');
      }
      setActivityModalOpen(false);
      loadAllData();
    } catch {
      addToast('Failed to save activity', 'error');
    }
  };

  // ================= 3. STRATEGIES ACTIONS =================
  const openCreateStrategyModal = () => {
    setEditingStrategyId(null);
    setStrategyFormData({
      strategy_number: String(strategies.length + 1).padStart(2, '0'),
      icon: '💡',
      title: '',
      description: '',
      display_order: strategies.length + 1,
      is_published: true,
    });
    setStrategyModalOpen(true);
  };

  const openEditStrategyModal = (strat) => {
    setEditingStrategyId(strat.id);
    setStrategyFormData({
      strategy_number: strat.strategy_number || strat.num || '01',
      icon: strat.icon || '💡',
      title: strat.title || '',
      description: strat.description || '',
      display_order: strat.display_order ?? 0,
      is_published: strat.is_published ?? true,
    });
    setStrategyModalOpen(true);
  };

  const handleToggleStrategyPublish = async (id) => {
    try {
      const res = await api.toggleTeacherStrategyPublish(id);
      addToast(res.message || 'Strategy status updated', 'success');
      loadAllData();
    } catch {
      addToast('Failed to toggle strategy status', 'error');
    }
  };

  const handleStrategySubmit = async (e) => {
    e.preventDefault();
    if (!strategyFormData.title.trim() || !strategyFormData.description.trim()) {
      addToast('Title and Description are required', 'error');
      return;
    }
    try {
      if (editingStrategyId) {
        await api.updateTeacherStrategy(editingStrategyId, strategyFormData);
        addToast('Strategy updated successfully', 'success');
      } else {
        await api.createTeacherStrategy(strategyFormData);
        addToast('Strategy created successfully', 'success');
      }
      setStrategyModalOpen(false);
      loadAllData();
    } catch {
      addToast('Failed to save strategy', 'error');
    }
  };

  // ================= 4. PROMPTS ACTIONS =================
  const openCreatePromptModal = () => {
    setEditingPromptId(null);
    setPromptFormData({
      prompt: '',
      category: 'Local Community',
      display_order: prompts.length + 1,
      is_published: true,
    });
    setPromptModalOpen(true);
  };

  const openEditPromptModal = (pr) => {
    setEditingPromptId(pr.id);
    setPromptFormData({
      prompt: pr.prompt || '',
      category: pr.category || 'Local Community',
      display_order: pr.display_order ?? 0,
      is_published: pr.is_published ?? true,
    });
    setPromptModalOpen(true);
  };

  const handleTogglePromptPublish = async (id) => {
    try {
      const res = await api.toggleTeacherPromptPublish(id);
      addToast(res.message || 'Prompt status updated', 'success');
      loadAllData();
    } catch {
      addToast('Failed to toggle prompt status', 'error');
    }
  };

  const handlePromptSubmit = async (e) => {
    e.preventDefault();
    if (!promptFormData.prompt.trim()) {
      addToast('Prompt text is required', 'error');
      return;
    }
    try {
      if (editingPromptId) {
        await api.updateTeacherPrompt(editingPromptId, promptFormData);
        addToast('Prompt updated successfully', 'success');
      } else {
        await api.createTeacherPrompt(promptFormData);
        addToast('Prompt created successfully', 'success');
      }
      setPromptModalOpen(false);
      loadAllData();
    } catch {
      addToast('Failed to save prompt', 'error');
    }
  };

  // ================= 5. LESSON PLAN ACTIONS =================
  const handleSaveLessonPlan = async (e) => {
    e.preventDefault();
    try {
      setSavingLessonPlan(true);
      await api.updateLessonPlan(lessonPlan);
      addToast('Lesson plan template updated successfully', 'success');
    } catch {
      addToast('Failed to save lesson plan template', 'error');
    } finally {
      setSavingLessonPlan(false);
    }
  };

  // ================= SHARED DELETE CONFIRMATION =================
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'article') {
        await api.deleteTeacherArticle(itemToDelete.item.id);
        addToast('Article deleted successfully', 'success');
      } else if (itemToDelete.type === 'activity') {
        await api.deleteTeacherActivity(itemToDelete.item.id);
        addToast('Activity deleted successfully', 'success');
      } else if (itemToDelete.type === 'strategy') {
        await api.deleteTeacherStrategy(itemToDelete.item.id);
        addToast('Strategy deleted successfully', 'success');
      } else if (itemToDelete.type === 'prompt') {
        await api.deleteTeacherPrompt(itemToDelete.item.id);
        addToast('Prompt deleted successfully', 'success');
      }
      setDeleteModalOpen(false);
      setItemToDelete(null);
      loadAllData();
    } catch {
      addToast('Failed to delete item', 'error');
    }
  };

  // Filter articles
  const categories = ['All', 'Lesson Ideas', 'Speaking', 'Writing', 'Reading', 'Vocabulary', 'Student Engagement'];
  const filteredArticles = articles.filter((a) => {
    const matchesCat =
      selectedArticleCategory === 'All' ||
      (a.category || '').toLowerCase() === selectedArticleCategory.toLowerCase();
    const matchesSearch =
      !articleSearch ||
      (a.title || '').toLowerCase().includes(articleSearch.toLowerCase()) ||
      (a.short_description || a.excerpt || '').toLowerCase().includes(articleSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', color: 'var(--navy)' }}>📚 Teacher Guide Manager</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>
            Full CMS management for pedagogical articles, classroom activities, practical strategies, discussion prompts, and lesson plans.
          </p>
        </div>
        <a
          href="/#teacher-guide"
          target="_blank"
          rel="noopener noreferrer"
          className="btn ghost sm"
          style={{ textDecoration: 'none' }}
        >
          👁️ Preview Public Page
        </a>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          className={`btn sm ${activeTab === 'articles' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('articles')}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: activeTab === 'articles' ? '3px solid #1665c0' : 'none' }}
        >
          📑 Articles ({articles.length})
        </button>
        <button
          className={`btn sm ${activeTab === 'activity' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('activity')}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: activeTab === 'activity' ? '3px solid #1665c0' : 'none' }}
        >
          🌟 Featured Activity ({activities.length})
        </button>
        <button
          className={`btn sm ${activeTab === 'strategies' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('strategies')}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: activeTab === 'strategies' ? '3px solid #1665c0' : 'none' }}
        >
          💡 Strategies ({strategies.length})
        </button>
        <button
          className={`btn sm ${activeTab === 'prompts' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('prompts')}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: activeTab === 'prompts' ? '3px solid #1665c0' : 'none' }}
        >
          💬 Prompts ({prompts.length})
        </button>
        <button
          className={`btn sm ${activeTab === 'lesson_plan' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('lesson_plan')}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: activeTab === 'lesson_plan' ? '3px solid #1665c0' : 'none' }}
        >
          📝 Lesson Plan Template
        </button>
      </div>

      {/* ================= TAB 1: ARTICLES ================= */}
      {activeTab === 'articles' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search articles..."
                value={articleSearch}
                onChange={(e) => setArticleSearch(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '220px' }}
              />
              <select
                value={selectedArticleCategory}
                onChange={(e) => setSelectedArticleCategory(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn primary sm" onClick={openCreateArticleModal}>
              + Add New Article
            </button>
          </div>

          <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Level & Duration</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>Loading articles...</td>
                  </tr>
                ) : filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                      No articles found. Click "+ Add New Article" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map((art) => (
                    <tr key={art.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#e0edff', color: '#1665c0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>
                            📖
                          </div>
                          <div>
                            <strong style={{ color: 'var(--navy)', display: 'block', fontSize: '14px' }}>{art.title}</strong>
                            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                              {(art.short_description || art.excerpt || '').slice(0, 60)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="tag" style={{ margin: 0 }}>{art.category}</span>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--muted)' }}>
                        {art.level} · {art.estimated_time || art.time}
                      </td>
                      <td style={{ fontSize: '13px', fontWeight: 600 }}>{art.display_order}</td>
                      <td>
                        <button
                          onClick={() => handleToggleArticlePublish(art.id)}
                          className={`badge ${art.is_published ? 'published' : 'draft'}`}
                          style={{ border: 0, cursor: 'pointer' }}
                        >
                          {art.is_published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn ghost sm" style={{ marginRight: '6px' }} onClick={() => openEditArticleModal(art)}>
                          Edit
                        </button>
                        <button
                          className="btn danger sm"
                          onClick={() => {
                            setItemToDelete({ type: 'article', item: art });
                            setDeleteModalOpen(true);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: FEATURED ACTIVITY ================= */}
      {activeTab === 'activity' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--navy)' }}>🌟 Classroom Activity of the Month</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                Highlight an exemplary classroom activity on the public Teacher Guide page.
              </p>
            </div>
            <button className="btn primary sm" onClick={openCreateActivityModal}>
              + Add New Activity
            </button>
          </div>

          <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Purpose</th>
                  <th>Level & Time</th>
                  <th>Objectives / Steps</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>Loading activities...</td>
                  </tr>
                ) : activities.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                      No classroom activities found. Create one to feature on the site!
                    </td>
                  </tr>
                ) : (
                  activities.map((act) => (
                    <tr key={act.id}>
                      <td>
                        <strong style={{ color: 'var(--navy)', fontSize: '14px', display: 'block' }}>{act.title}</strong>
                        {act.teacher_tip && (
                          <span style={{ fontSize: '11px', color: '#1665c0', fontStyle: 'italic' }}>
                            Tip: {act.teacher_tip.slice(0, 45)}...
                          </span>
                        )}
                      </td>
                      <td style={{ maxWidth: '280px', fontSize: '13px', color: 'var(--muted)' }}>
                        {act.purpose}
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        {act.level} · {act.estimated_time || act.time}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {(act.objectives || []).length} objectives · {(act.steps || []).length} steps
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleActivityPublish(act.id)}
                          className={`badge ${act.is_published ? 'published' : 'draft'}`}
                          style={{ border: 0, cursor: 'pointer' }}
                        >
                          {act.is_published ? 'Featured / Active' : 'Draft'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn ghost sm" style={{ marginRight: '6px' }} onClick={() => openEditActivityModal(act)}>
                          Edit
                        </button>
                        <button
                          className="btn danger sm"
                          onClick={() => {
                            setItemToDelete({ type: 'activity', item: act });
                            setDeleteModalOpen(true);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: STRATEGIES ================= */}
      {activeTab === 'strategies' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--navy)' }}>💡 Practical Teaching Strategies</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                Evidence-informed pedagogical principles shown under "Methodology in Action".
              </p>
            </div>
            <button className="btn primary sm" onClick={openCreateStrategyModal}>
              + Add Strategy
            </button>
          </div>

          <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Number</th>
                  <th style={{ width: '60px' }}>Icon</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>Loading strategies...</td>
                  </tr>
                ) : strategies.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>No strategies found.</td>
                  </tr>
                ) : (
                  strategies.map((st) => (
                    <tr key={st.id}>
                      <td>
                        <span style={{ fontWeight: 800, color: '#1665c0' }}>{st.strategy_number || st.num}</span>
                      </td>
                      <td style={{ fontSize: '18px' }}>{st.icon || '💡'}</td>
                      <td>
                        <strong style={{ color: 'var(--navy)', fontSize: '14px' }}>{st.title}</strong>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--muted)', maxWidth: '380px' }}>
                        {st.description}
                      </td>
                      <td style={{ fontSize: '13px', fontWeight: 600 }}>{st.display_order}</td>
                      <td>
                        <button
                          onClick={() => handleToggleStrategyPublish(st.id)}
                          className={`badge ${st.is_published ? 'published' : 'draft'}`}
                          style={{ border: 0, cursor: 'pointer' }}
                        >
                          {st.is_published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn ghost sm" style={{ marginRight: '6px' }} onClick={() => openEditStrategyModal(st)}>
                          Edit
                        </button>
                        <button
                          className="btn danger sm"
                          onClick={() => {
                            setItemToDelete({ type: 'strategy', item: st });
                            setDeleteModalOpen(true);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 4: PROMPTS ================= */}
      {activeTab === 'prompts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--navy)' }}>💬 Ready-to-Use Classroom Prompts</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                Questions that teachers can copy with one click to use in classroom discussions.
              </p>
            </div>
            <button className="btn primary sm" onClick={openCreatePromptModal}>
              + Add Prompt
            </button>
          </div>

          <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Prompt Text</th>
                  <th>Category</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>Loading prompts...</td>
                  </tr>
                ) : prompts.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>No prompts found.</td>
                  </tr>
                ) : (
                  prompts.map((pr) => (
                    <tr key={pr.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: '#1665c0', fontSize: '16px' }}>💬</span>
                          <span style={{ fontSize: '14px', fontStyle: 'italic', color: '#1e293b' }}>
                            "{pr.prompt}"
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="tag" style={{ margin: 0 }}>{pr.category || 'General'}</span>
                      </td>
                      <td style={{ fontSize: '13px', fontWeight: 600 }}>{pr.display_order}</td>
                      <td>
                        <button
                          onClick={() => handleTogglePromptPublish(pr.id)}
                          className={`badge ${pr.is_published ? 'published' : 'draft'}`}
                          style={{ border: 0, cursor: 'pointer' }}
                        >
                          {pr.is_published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn ghost sm" style={{ marginRight: '6px' }} onClick={() => openEditPromptModal(pr)}>
                          Edit
                        </button>
                        <button
                          className="btn danger sm"
                          onClick={() => {
                            setItemToDelete({ type: 'prompt', item: pr });
                            setDeleteModalOpen(true);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 5: LESSON PLAN TEMPLATE ================= */}
      {activeTab === 'lesson_plan' && (
        <div className="admin-card" style={{ maxWidth: '850px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: 'var(--navy)' }}>📝 Lesson Plan Template Settings</h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--muted)' }}>
              Configure the default lesson plan template available for download and printing on the public Teacher Guide page.
            </p>
          </div>

          <form onSubmit={handleSaveLessonPlan}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
              <div className="form-group">
                <label>Template Title</label>
                <input
                  type="text"
                  value={lessonPlan.title}
                  onChange={(e) => setLessonPlan({ ...lessonPlan, title: e.target.value })}
                  placeholder="e.g. Simple Lesson Plan Template"
                  required
                />
              </div>

              <div className="form-group">
                <label>Template Subtitle / Description</label>
                <input
                  type="text"
                  value={lessonPlan.description}
                  onChange={(e) => setLessonPlan({ ...lessonPlan, description: e.target.value })}
                  placeholder="e.g. A practical, culturally-responsive lesson structure"
                />
              </div>

              <div className="form-group">
                <label>Default Topic</label>
                <input
                  type="text"
                  value={lessonPlan.topic}
                  onChange={(e) => setLessonPlan({ ...lessonPlan, topic: e.target.value })}
                  placeholder="e.g. Local Harvests & Markets in Vehari"
                />
              </div>

              <div className="form-group">
                <label>Target English Skills</label>
                <input
                  type="text"
                  value={lessonPlan.english_skills}
                  onChange={(e) => setLessonPlan({ ...lessonPlan, english_skills: e.target.value })}
                  placeholder="e.g. Speaking, Vocabulary, Listening, Reading"
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Learning Objective</label>
                <textarea
                  rows="2"
                  value={lessonPlan.learning_objective}
                  onChange={(e) => setLessonPlan({ ...lessonPlan, learning_objective: e.target.value })}
                  placeholder="e.g. By the end of class, students will be able to describe..."
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Key Vocabulary</label>
                <input
                  type="text"
                  value={lessonPlan.vocabulary}
                  onChange={(e) => setLessonPlan({ ...lessonPlan, vocabulary: e.target.value })}
                  placeholder="e.g. stall, vendor, barter, fresh, bustling, fragrant"
                />
              </div>

              <div className="form-group">
                <label>Warm-up Activity</label>
                <textarea
                  rows="2"
                  value={lessonPlan.warmup_activity}
                  onChange={(e) => setLessonPlan({ ...lessonPlan, warmup_activity: e.target.value })}
                  placeholder="5-minute photo prompt & partner brainstorming"
                />
              </div>

              <div className="form-group">
                <label>Main Activity</label>
                <textarea
                  rows="2"
                  value={lessonPlan.main_activity}
                  onChange={(e) => setLessonPlan({ ...lessonPlan, main_activity: e.target.value })}
                  placeholder="Contextual reading or listening from Voices of Vehari archive"
                />
              </div>

              <div className="form-group">
                <label>Pair / Group Activity</label>
                <textarea
                  rows="2"
                  value={lessonPlan.pair_group_activity}
                  onChange={(e) => setLessonPlan({ ...lessonPlan, pair_group_activity: e.target.value })}
                  placeholder="Role-play interview between vendor and customer"
                />
              </div>

              <div className="form-group">
                <label>Formative Assessment</label>
                <textarea
                  rows="2"
                  value={lessonPlan.assessment}
                  onChange={(e) => setLessonPlan({ ...lessonPlan, assessment: e.target.value })}
                  placeholder="Formative observation of peer interaction"
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Homework / Follow-up</label>
                <input
                  type="text"
                  value={lessonPlan.homework}
                  onChange={(e) => setLessonPlan({ ...lessonPlan, homework: e.target.value })}
                  placeholder="Write a 4-sentence reflection on favorite family custom"
                />
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn primary" disabled={savingLessonPlan}>
                {savingLessonPlan ? 'Saving...' : '💾 Save Lesson Plan Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= ARTICLE MODAL ================= */}
      {articleModalOpen && (
        <div className="modal-overlay" onClick={() => setArticleModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: 'var(--navy)' }}>
                {editingArticleId ? 'Edit Teacher Guide Article' : 'Add New Teacher Guide Article'}
              </h3>
              <button style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: '20px' }} onClick={() => setArticleModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleArticleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={articleFormData.title}
                    onChange={(e) => setArticleFormData({ ...articleFormData, title: e.target.value })}
                    placeholder="e.g. Teaching English Through Local Stories"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={articleFormData.category}
                      onChange={(e) => setArticleFormData({ ...articleFormData, category: e.target.value })}
                    >
                      <option value="Lesson Ideas">Lesson Ideas</option>
                      <option value="Speaking">Speaking</option>
                      <option value="Writing">Writing</option>
                      <option value="Reading">Reading</option>
                      <option value="Vocabulary">Vocabulary</option>
                      <option value="Student Engagement">Student Engagement</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Target Level</label>
                    <select
                      value={articleFormData.level}
                      onChange={(e) => setArticleFormData({ ...articleFormData, level: e.target.value })}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Beginner–Intermediate">Beginner–Intermediate</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label>Estimated Time</label>
                    <input
                      type="text"
                      value={articleFormData.estimated_time}
                      onChange={(e) => setArticleFormData({ ...articleFormData, estimated_time: e.target.value })}
                      placeholder="e.g. 30–45 minutes"
                    />
                  </div>

                  <div className="form-group">
                    <label>Author</label>
                    <input
                      type="text"
                      value={articleFormData.author}
                      onChange={(e) => setArticleFormData({ ...articleFormData, author: e.target.value })}
                      placeholder="Voices of Vehari Team"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Short Description / Excerpt *</label>
                  <textarea
                    rows="2"
                    value={articleFormData.short_description}
                    onChange={(e) => setArticleFormData({ ...articleFormData, short_description: e.target.value })}
                    placeholder="Brief description shown on the resource card"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Pedagogical Objective / Detailed Content</label>
                  <textarea
                    rows="3"
                    value={articleFormData.content}
                    onChange={(e) => setArticleFormData({ ...articleFormData, content: e.target.value })}
                    placeholder="Clear statement of what students will achieve"
                  />
                </div>

                <div className="form-group">
                  <label>Recommended Materials (one per line)</label>
                  <textarea
                    rows="3"
                    value={articleFormData.materials}
                    onChange={(e) => setArticleFormData({ ...articleFormData, materials: e.target.value })}
                    placeholder={"Printed story or audio clip\nGuided reading worksheet\nDiscussion cue cards"}
                  />
                </div>

                <div className="form-group">
                  <label>Step-by-Step Procedure (one per line)</label>
                  <textarea
                    rows="5"
                    value={articleFormData.steps}
                    onChange={(e) => setArticleFormData({ ...articleFormData, steps: e.target.value })}
                    placeholder={"Warm-up (5 mins): Brief introduction\nVocabulary Preview (8 mins): Pre-teach terms\nActive Reading (12 mins): Paired task\nGroup Discussion (10 mins): Reflection"}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'center' }}>
                  <div className="form-group">
                    <label>Display Order</label>
                    <input
                      type="number"
                      value={articleFormData.display_order}
                      onChange={(e) => setArticleFormData({ ...articleFormData, display_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '18px' }}>
                    <input
                      type="checkbox"
                      id="art_pub"
                      checked={articleFormData.is_published}
                      onChange={(e) => setArticleFormData({ ...articleFormData, is_published: e.target.checked })}
                    />
                    <label htmlFor="art_pub" style={{ margin: 0, cursor: 'pointer', fontWeight: 600 }}>
                      Publish Immediately
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn ghost" onClick={() => setArticleModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  {editingArticleId ? 'Save Changes' : 'Create Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ACTIVITY MODAL ================= */}
      {activityModalOpen && (
        <div className="modal-overlay" onClick={() => setActivityModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: 'var(--navy)' }}>
                {editingActivityId ? 'Edit Classroom Activity' : 'Add New Classroom Activity'}
              </h3>
              <button style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: '20px' }} onClick={() => setActivityModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleActivitySubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Activity Title *</label>
                  <input
                    type="text"
                    value={activityFormData.title}
                    onChange={(e) => setActivityFormData({ ...activityFormData, title: e.target.value })}
                    placeholder="e.g. Tell Your Story"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Purpose / Pedagogical Aim *</label>
                  <textarea
                    rows="2"
                    value={activityFormData.purpose}
                    onChange={(e) => setActivityFormData({ ...activityFormData, purpose: e.target.value })}
                    placeholder="e.g. Help students practice speaking and narrative skills..."
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label>Duration</label>
                    <input
                      type="text"
                      value={activityFormData.estimated_time}
                      onChange={(e) => setActivityFormData({ ...activityFormData, estimated_time: e.target.value })}
                      placeholder="e.g. 35 minutes"
                    />
                  </div>

                  <div className="form-group">
                    <label>Target Level</label>
                    <select
                      value={activityFormData.level}
                      onChange={(e) => setActivityFormData({ ...activityFormData, level: e.target.value })}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Beginner–Intermediate">Beginner–Intermediate</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>💡 Teacher Tip</label>
                  <input
                    type="text"
                    value={activityFormData.teacher_tip}
                    onChange={(e) => setActivityFormData({ ...activityFormData, teacher_tip: e.target.value })}
                    placeholder="e.g. Encourage students to choose experiences from their own community..."
                  />
                </div>

                <div className="form-group">
                  <label>Learning Objectives (one per line)</label>
                  <textarea
                    rows="4"
                    value={activityFormData.objectives}
                    onChange={(e) => setActivityFormData({ ...activityFormData, objectives: e.target.value })}
                    placeholder={"Practice past tense\nImprove speaking confidence\nBuild descriptive vocabulary\nDevelop listening skills"}
                  />
                </div>

                <div className="form-group">
                  <label>Step-by-Step Procedure (one per line)</label>
                  <textarea
                    rows="5"
                    value={activityFormData.steps}
                    onChange={(e) => setActivityFormData({ ...activityFormData, steps: e.target.value })}
                    placeholder={"Choose a familiar personal experience\nWrite 5–7 keywords in English\nPrepare 1–2 minute story\nShare with a partner"}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="act_pub"
                    checked={activityFormData.is_published}
                    onChange={(e) => setActivityFormData({ ...activityFormData, is_published: e.target.checked })}
                  />
                  <label htmlFor="act_pub" style={{ margin: 0, cursor: 'pointer', fontWeight: 600 }}>
                    Feature this activity publicly
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn ghost" onClick={() => setActivityModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  {editingActivityId ? 'Save Changes' : 'Create Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= STRATEGY MODAL ================= */}
      {strategyModalOpen && (
        <div className="modal-overlay" onClick={() => setStrategyModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: 'var(--navy)' }}>
                {editingStrategyId ? 'Edit Teaching Strategy' : 'Add Teaching Strategy'}
              </h3>
              <button style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: '20px' }} onClick={() => setStrategyModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleStrategySubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '100px 80px 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Number</label>
                    <input
                      type="text"
                      value={strategyFormData.strategy_number}
                      onChange={(e) => setStrategyFormData({ ...strategyFormData, strategy_number: e.target.value })}
                      placeholder="01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Icon</label>
                    <input
                      type="text"
                      value={strategyFormData.icon}
                      onChange={(e) => setStrategyFormData({ ...strategyFormData, icon: e.target.value })}
                      placeholder="💡"
                    />
                  </div>
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      value={strategyFormData.title}
                      onChange={(e) => setStrategyFormData({ ...strategyFormData, title: e.target.value })}
                      placeholder="Start with Familiar Topics"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    rows="3"
                    value={strategyFormData.description}
                    onChange={(e) => setStrategyFormData({ ...strategyFormData, description: e.target.value })}
                    placeholder="Begin lessons with places, people and experiences students already understand."
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                  <div className="form-group">
                    <label>Display Order</label>
                    <input
                      type="number"
                      value={strategyFormData.display_order}
                      onChange={(e) => setStrategyFormData({ ...strategyFormData, display_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '18px' }}>
                    <input
                      type="checkbox"
                      id="strat_pub"
                      checked={strategyFormData.is_published}
                      onChange={(e) => setStrategyFormData({ ...strategyFormData, is_published: e.target.checked })}
                    />
                    <label htmlFor="strat_pub" style={{ margin: 0, cursor: 'pointer', fontWeight: 600 }}>
                      Published
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn ghost" onClick={() => setStrategyModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  {editingStrategyId ? 'Save Changes' : 'Create Strategy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PROMPT MODAL ================= */}
      {promptModalOpen && (
        <div className="modal-overlay" onClick={() => setPromptModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: 'var(--navy)' }}>
                {editingPromptId ? 'Edit Classroom Prompt' : 'Add Classroom Prompt'}
              </h3>
              <button style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: '20px' }} onClick={() => setPromptModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handlePromptSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Prompt Question *</label>
                  <textarea
                    rows="3"
                    value={promptFormData.prompt}
                    onChange={(e) => setPromptFormData({ ...promptFormData, prompt: e.target.value })}
                    placeholder="e.g. Describe a place in Vehari that is important to you."
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Category</label>
                    <input
                      type="text"
                      value={promptFormData.category}
                      onChange={(e) => setPromptFormData({ ...promptFormData, category: e.target.value })}
                      placeholder="e.g. Local Community"
                    />
                  </div>

                  <div className="form-group">
                    <label>Display Order</label>
                    <input
                      type="number"
                      value={promptFormData.display_order}
                      onChange={(e) => setPromptFormData({ ...promptFormData, display_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="pr_pub"
                    checked={promptFormData.is_published}
                    onChange={(e) => setPromptFormData({ ...promptFormData, is_published: e.target.checked })}
                  />
                  <label htmlFor="pr_pub" style={{ margin: 0, cursor: 'pointer', fontWeight: 600 }}>
                    Published
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn ghost" onClick={() => setPromptModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  {editingPromptId ? 'Save Changes' : 'Create Prompt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CONFIRMATION MODAL ================= */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Confirm Deletion"
        message={`Are you sure you want to delete this ${itemToDelete?.type || 'item'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
      />
    </div>
  );
};

export default TeacherGuideManager;
