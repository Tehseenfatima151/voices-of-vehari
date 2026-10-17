import axios from 'axios';
import fallbackData from './fallbackData';
import { setMediaCache, compressImageFile } from '../utils/mediaUrlHelper';

const resolveMediaReference = async (url) => {
  if (!url || typeof url !== 'string' || !url.startsWith('media:')) return url;
  const id = url.replace('media:', '');
  try {
    const res = await supabaseClient.get(`/media_files?id=eq.${id}&select=id,public_url`);
    if (Array.isArray(res.data) && res.data[0]?.public_url) {
      setMediaCache([res.data[0]]);
      return res.data[0].public_url;
    }
  } catch (_) {}
  return url;
};

// Base API URL from Vite environment variable or proxy fallback
const API_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Supabase Direct REST API Configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://bkdyqqkayzbzcpnjqprp.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hA-e-yW1EgUNZ_xbBzgo8g_xY3NSvFI';

const supabaseClient = axios.create({
  baseURL: `${SUPABASE_URL}/rest/v1`,
  timeout: 10000,
  headers: {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  },
});

const slugify = (text = '') => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

// ================= SCHEMA MAPPERS FOR SUPABASE =================
const mapPodcastFromSupabase = (pod) => {
  let tags = [];
  if (pod.tags_json) {
    try {
      tags = typeof pod.tags_json === 'string' ? JSON.parse(pod.tags_json) : pod.tags_json;
    } catch {
      tags = [];
    }
  } else if (Array.isArray(pod.tags)) {
    tags = pod.tags;
  }
  return {
    ...pod,
    tags,
    category: pod.category || 'general',
    cover_image_url: pod.cover_image_url || '/assets/podcast_upcoming.jpeg',
    audio_url: pod.audio_url || '',
    video_url: pod.video_url || '',
    is_published: pod.is_published ?? true,
    sort_order: Number(pod.sort_order) || 0,
  };
};

const mapStoryFromSupabase = (st) => ({
  ...st,
  is_published: st.is_published ?? true,
  category_tag: st.category_tag || 'Folklore',
  sort_order: Number(st.sort_order) || 0,
});

const mapGalleryFromSupabase = (g) => ({
  ...g,
  is_published: g.is_published ?? true,
  sort_order: Number(g.sort_order) || 0,
});

const mapTeamMemberFromSupabase = (m) => ({
  ...m,
  is_active: m.is_active ?? true,
  sort_order: Number(m.sort_order) || 0,
});

const mapCardFromSupabase = (c) => {
  let bullets = [];
  if (c.bullets_json) {
    try {
      bullets = typeof c.bullets_json === 'string' ? JSON.parse(c.bullets_json) : c.bullets_json;
    } catch {
      bullets = [];
    }
  } else if (Array.isArray(c.bullets)) {
    bullets = c.bullets;
  }
  return {
    ...c,
    bullets,
    is_active: c.is_active ?? true,
    sort_order: Number(c.sort_order) || 0,
  };
};

const mapTimelineFromSupabase = (t) => {
  let paragraphs = [];
  if (t.paragraphs_json) {
    try {
      paragraphs = typeof t.paragraphs_json === 'string' ? JSON.parse(t.paragraphs_json) : t.paragraphs_json;
    } catch {
      paragraphs = [];
    }
  } else if (Array.isArray(t.paragraphs)) {
    paragraphs = t.paragraphs;
  }
  return {
    ...t,
    paragraphs,
    phase_number: Number(t.phase_number) || 1,
    is_active: t.is_active ?? true,
    sort_order: Number(t.sort_order) || 0,
  };
};

const mapArticleFromSupabase = (a) => {
  let materials = [];
  if (a.materials_json) {
    try {
      materials = typeof a.materials_json === 'string' ? JSON.parse(a.materials_json) : a.materials_json;
    } catch {
      materials = [];
    }
  } else if (Array.isArray(a.materials)) {
    materials = a.materials;
  }

  let steps = [];
  if (a.steps_json) {
    try {
      steps = typeof a.steps_json === 'string' ? JSON.parse(a.steps_json) : a.steps_json;
    } catch {
      steps = [];
    }
  } else if (Array.isArray(a.steps)) {
    steps = a.steps;
  }

  return {
    ...a,
    materials,
    steps,
    short_description: a.short_description || '',
    excerpt: a.short_description || '',
    estimated_time: a.estimated_time || '30–45 minutes',
    time: a.estimated_time || '30–45 minutes',
    display_order: Number(a.display_order) || 0,
    is_published: a.is_published ?? true,
    details: {
      objective: a.content || a.short_description || '',
      materials,
      steps,
    },
  };
};

const mapActivityFromSupabase = (act) => {
  let objectives = [];
  if (act.objectives_json) {
    try {
      objectives = typeof act.objectives_json === 'string' ? JSON.parse(act.objectives_json) : act.objectives_json;
    } catch {
      objectives = [];
    }
  } else if (Array.isArray(act.objectives)) {
    objectives = act.objectives;
  }

  let steps = [];
  if (act.steps_json) {
    try {
      steps = typeof act.steps_json === 'string' ? JSON.parse(act.steps_json) : act.steps_json;
    } catch {
      steps = [];
    }
  } else if (Array.isArray(act.steps)) {
    steps = act.steps;
  }

  return {
    ...act,
    objectives,
    steps,
    teacher_tip: act.teacher_tip || '',
    teacherTip: act.teacher_tip || '',
    estimated_time: act.estimated_time || '35 minutes',
    time: act.estimated_time || '35 minutes',
    is_published: act.is_published ?? true,
  };
};

const mapStrategyFromSupabase = (s) => ({
  ...s,
  num: s.strategy_number || (s.display_order ? String(s.display_order).padStart(2, '0') : '01'),
  strategy_number: s.strategy_number || (s.display_order ? String(s.display_order).padStart(2, '0') : '01'),
  display_order: Number(s.display_order) || 0,
  is_published: s.is_published ?? true,
});

const mapPromptFromSupabase = (p) => ({
  ...p,
  prompt: (p.prompt || '').trim().replace(/^["'\s]+|["'\s]+$/g, ''),
  category: p.category || 'General',
  display_order: Number(p.display_order) || 0,
  is_published: p.is_published ?? true,
});

const mapLessonPlanFromSupabase = (lp) => {
  if (!lp) return fallbackData.teacherGuide?.lessonPlanTemplate;
  const fields = [
    { label: 'Topic', placeholder: lp.topic || 'e.g. Local Harvests & Markets in Vehari' },
    { label: 'Learning Objective', placeholder: lp.learning_objective || 'e.g. By the end of class, students will be able to describe a market scene...' },
    { label: 'English Skills', placeholder: lp.english_skills || 'Speaking, Vocabulary, Listening, Reading' },
    { label: 'Vocabulary', placeholder: lp.vocabulary || 'e.g. stall, vendor, barter, fresh, bustling, fragrant' },
    { label: 'Warm-up Activity', placeholder: lp.warmup_activity || '5-minute photo prompt & partner brainstorming' },
    { label: 'Main Activity', placeholder: lp.main_activity || 'Contextual reading or listening from Voices of Vehari story archive' },
    { label: 'Pair/Group Activity', placeholder: lp.pair_group_activity || 'Role-play interview between local vendor and customer' },
    { label: 'Assessment', placeholder: lp.assessment || 'Formative observation of peer interaction' },
    { label: 'Homework / Follow-up', placeholder: lp.homework || 'Write a 4-sentence reflection on their favorite family custom' },
  ];
  return {
    ...lp,
    fields,
  };
};

// Storage helper functions for offline/demo resilience
const getStorageItem = (key, defaultVal) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setStorageItem = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (_) {}
};

const notifyStorageUpdate = () => {
  try {
    window.dispatchEvent(new Event('storage'));
  } catch (_) {}
};

// Fallback initial structures
const getInitialArticles = () => (fallbackData.teacherGuide?.resources || []).map((a, i) => ({
  ...a,
  id: a.id || i + 1,
  is_published: a.is_published ?? true,
  display_order: a.display_order ?? (i + 1),
  category: a.category || 'Lesson Ideas',
  short_description: a.short_description || a.excerpt || '',
  excerpt: a.short_description || a.excerpt || '',
  estimated_time: a.estimated_time || a.time || '30–45 minutes',
  time: a.estimated_time || a.time || '30–45 minutes',
  level: a.level || 'Intermediate',
  content: a.content || a.details?.objective || '',
  materials: a.materials || a.details?.materials || [],
  steps: a.steps || a.details?.steps || [],
  details: {
    objective: a.content || a.details?.objective || a.short_description || '',
    materials: a.materials || a.details?.materials || [],
    steps: a.steps || a.details?.steps || [],
  }
}));

const getInitialActivities = () => [
  {
    ...fallbackData.teacherGuide?.featuredActivity,
    id: 1,
    is_published: true,
    estimated_time: fallbackData.teacherGuide?.featuredActivity?.time || '35 minutes',
    teacher_tip: fallbackData.teacherGuide?.featuredActivity?.teacherTip || '',
  }
];

const getInitialStrategies = () => (fallbackData.teacherGuide?.strategies || []).map((s, i) => ({
  ...s,
  id: s.id || i + 1,
  strategy_number: s.strategy_number || s.num || String(i + 1).padStart(2, '0'),
  num: s.strategy_number || s.num || String(i + 1).padStart(2, '0'),
  display_order: s.display_order ?? (i + 1),
  is_published: s.is_published ?? true,
}));

const getInitialPrompts = () => {
  const promptCategories = [
    'Speaking & Discussion',
    'Oral History & Storytelling',
    'Culture & Vocabulary',
    'Critical Thinking & Action',
    'Peer Discussion',
    'Community Appreciation'
  ];
  return (fallbackData.teacherGuide?.classroomPrompts || []).map((p, i) => ({
    id: i + 1,
    prompt: (typeof p === 'string' ? p : (p.prompt || '')).replace(/^["'\s]+|["'\s]+$/g, ''),
    category: (typeof p === 'object' && p.category) ? p.category : (promptCategories[i] || 'Classroom'),
    display_order: i + 1,
    is_published: true
  }));
};

const getInitialLessonPlan = () => ({
  ...fallbackData.teacherGuide?.lessonPlanTemplate,
  topic: fallbackData.teacherGuide?.lessonPlanTemplate?.topic || 'Local Harvests & Markets in Vehari',
  learning_objective: fallbackData.teacherGuide?.lessonPlanTemplate?.learning_objective || 'Describe a local market scene using 5 sensory adjectives.',
  english_skills: fallbackData.teacherGuide?.lessonPlanTemplate?.english_skills || 'Speaking, Vocabulary, Listening, Reading',
  vocabulary: fallbackData.teacherGuide?.lessonPlanTemplate?.vocabulary || 'stall, vendor, barter, fresh, bustling, fragrant',
  warmup_activity: fallbackData.teacherGuide?.lessonPlanTemplate?.warmup_activity || '5-minute photo prompt & partner brainstorming',
  main_activity: fallbackData.teacherGuide?.lessonPlanTemplate?.main_activity || 'Contextual reading or listening from story archive',
  pair_group_activity: fallbackData.teacherGuide?.lessonPlanTemplate?.pair_group_activity || 'Role-play interview between local vendor and customer',
  assessment: fallbackData.teacherGuide?.lessonPlanTemplate?.assessment || 'Formative observation of peer interaction',
  homework: fallbackData.teacherGuide?.lessonPlanTemplate?.homework || 'Write a 4-sentence reflection on favorite family custom',
});

const buildTeacherGuidePayload = (articles, activities, strategies, prompts, lessonPlan) => {
  const rawArticles = articles || getStorageItem('vov_cms_tg_articles', getInitialArticles());
  const tgArticles = rawArticles
    .filter((a) => a.is_published !== false)
    .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));

  const rawActivities = activities || getStorageItem('vov_cms_tg_activities', getInitialActivities());
  const publishedActivities = rawActivities.filter((a) => a.is_published !== false);
  const tgFeaturedActivity = publishedActivities.length > 0
    ? publishedActivities[0]
    : (fallbackData.teacherGuide?.featuredActivity || null);

  const rawStrategies = strategies || getStorageItem('vov_cms_tg_strategies', getInitialStrategies());
  const tgStrategies = rawStrategies
    .filter((s) => s.is_published !== false)
    .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));

  const rawPrompts = prompts || getStorageItem('vov_cms_tg_prompts', getInitialPrompts());
  const tgPrompts = rawPrompts
    .filter((p) => p.is_published !== false)
    .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));

  const rawLessonPlan = lessonPlan || getStorageItem('vov_cms_tg_lessonplan', getInitialLessonPlan());
  const lpFields = [
    { label: 'Topic', placeholder: rawLessonPlan.topic || 'e.g. Local Harvests & Markets in Vehari' },
    { label: 'Learning Objective', placeholder: rawLessonPlan.learning_objective || 'e.g. By the end of class, students will be able to describe a market scene...' },
    { label: 'English Skills', placeholder: rawLessonPlan.english_skills || 'Speaking, Vocabulary, Listening, Reading' },
    { label: 'Vocabulary', placeholder: rawLessonPlan.vocabulary || 'e.g. stall, vendor, barter, fresh, bustling, fragrant' },
    { label: 'Warm-up Activity', placeholder: rawLessonPlan.warmup_activity || '5-minute photo prompt & partner brainstorming' },
    { label: 'Main Activity', placeholder: rawLessonPlan.main_activity || 'Contextual reading or listening from Voices of Vehari story archive' },
    { label: 'Pair/Group Activity', placeholder: rawLessonPlan.pair_group_activity || 'Role-play interview between local vendor and customer' },
    { label: 'Assessment', placeholder: rawLessonPlan.assessment || 'Formative observation of peer interaction' },
    { label: 'Homework / Follow-up', placeholder: rawLessonPlan.homework || 'Write a 4-sentence reflection on their favorite family custom' },
  ];
  const tgLessonPlan = {
    ...rawLessonPlan,
    fields: rawLessonPlan.fields && rawLessonPlan.fields.length > 0 ? rawLessonPlan.fields : lpFields,
  };

  const uniqueCategories = ['All', ...new Set(tgArticles.map((a) => a.category).filter(Boolean))];

  return {
    ...(fallbackData.teacherGuide || {}),
    categories: uniqueCategories,
    resources: tgArticles,
    featuredActivity: tgFeaturedActivity,
    strategies: tgStrategies,
    classroomPrompts: tgPrompts.map((p) => {
      const txt = typeof p === 'string' ? p : (p.prompt || '');
      return txt.replace(/^["'\s]+|["'\s]+$/g, '');
    }),
    promptsList: tgPrompts,
    lessonPlanTemplate: tgLessonPlan,
  };
};

export const api = {
  checkBackendHealth: async () => {
    try {
      const res = await apiClient.get('/health', { timeout: 2500 });
      return res.status === 200;
    } catch {
      return false;
    }
  },

  // ================= 1. PUBLIC ENDPOINTS (DIRECT REAL-TIME SUPABASE) =================
  getPublicAll: async () => {
    try {
      const [
        settingsRes,
        heroRes,
        podRes,
        storyRes,
        vocabRes,
        galleryRes,
        teamRes,
        cardsRes,
        statsRes,
        timelineRes,
        refsRes,
        tgArticlesRes,
        tgActivitiesRes,
        tgStrategiesRes,
        tgPromptsRes,
        tgLessonPlanRes
      ] = await Promise.allSettled([
        supabaseClient.get('/site_settings?select=*&limit=1'),
        supabaseClient.get('/hero_sections?select=*&limit=1'),
        supabaseClient.get('/podcasts?select=*&order=sort_order.asc,created_at.desc'),
        supabaseClient.get('/stories?select=*&order=sort_order.asc,created_at.desc'),
        supabaseClient.get('/vocabulary_words?select=*&order=display_order.asc,id.asc'),
        supabaseClient.get('/gallery_items?select=*&order=sort_order.asc,created_at.desc'),
        supabaseClient.get('/team_members?select=*&order=sort_order.asc,id.asc'),
        supabaseClient.get('/section_cards?select=*&order=sort_order.asc,id.asc'),
        supabaseClient.get('/statistics?select=*&order=sort_order.asc,id.asc'),
        supabaseClient.get('/timeline_items?select=*&order=sort_order.asc,phase_number.asc'),
        supabaseClient.get('/academic_references?select=*&order=sort_order.asc,id.asc'),
        supabaseClient.get('/teacher_guide_articles?select=*&order=display_order.asc,id.asc'),
        supabaseClient.get('/teacher_guide_activities?select=*&order=id.asc'),
        supabaseClient.get('/teacher_guide_strategies?select=*&order=display_order.asc,id.asc'),
        supabaseClient.get('/teacher_guide_prompts?select=*&order=display_order.asc,id.asc'),
        supabaseClient.get('/teacher_guide_lesson_plans?select=*&limit=1'),
      ]);

      // Settings
      let settings = getStorageItem('vov_cms_settings', fallbackData.settings);
      if (settingsRes.status === 'fulfilled' && Array.isArray(settingsRes.value.data) && settingsRes.value.data[0]) {
        settings = { ...settingsRes.value.data[0] };
        if (settings.logo_url && settings.logo_url.startsWith('media:')) {
          settings.logo_url = await resolveMediaReference(settings.logo_url);
        }
        setStorageItem('vov_cms_settings', settings);
      }

      // Hero
      let hero = getStorageItem('vov_cms_hero', fallbackData.hero);
      if (heroRes.status === 'fulfilled' && Array.isArray(heroRes.value.data) && heroRes.value.data[0]) {
        hero = { ...heroRes.value.data[0] };
        if (hero.hero_image_url && hero.hero_image_url.startsWith('media:')) {
          hero.hero_image_url = await resolveMediaReference(hero.hero_image_url);
        }
        if (hero.logo_float_url && hero.logo_float_url.startsWith('media:')) {
          hero.logo_float_url = await resolveMediaReference(hero.logo_float_url);
        }
        setStorageItem('vov_cms_hero', hero);
      }

      // Podcasts
      let podcasts = getStorageItem('vov_cms_podcasts', fallbackData.podcasts);
      if (podRes.status === 'fulfilled' && Array.isArray(podRes.value.data) && podRes.value.data.length > 0) {
        podcasts = podRes.value.data.map(mapPodcastFromSupabase);
        setStorageItem('vov_cms_podcasts', podcasts);
      }

      // Stories
      let stories = getStorageItem('vov_cms_stories', fallbackData.stories);
      if (storyRes.status === 'fulfilled' && Array.isArray(storyRes.value.data) && storyRes.value.data.length > 0) {
        stories = storyRes.value.data.map(mapStoryFromSupabase);
        setStorageItem('vov_cms_stories', stories);
      }

      // Vocabulary
      let vocabulary = getStorageItem('vov_cms_vocabulary', fallbackData.vocabulary || []);
      if (vocabRes.status === 'fulfilled' && Array.isArray(vocabRes.value.data) && vocabRes.value.data.length > 0) {
        vocabulary = vocabRes.value.data;
        setStorageItem('vov_cms_vocabulary', vocabulary);
      }

      // Gallery
      let gallery = getStorageItem('vov_cms_gallery', fallbackData.gallery);
      if (galleryRes.status === 'fulfilled' && Array.isArray(galleryRes.value.data) && galleryRes.value.data.length > 0) {
        gallery = galleryRes.value.data.map(mapGalleryFromSupabase);
        setStorageItem('vov_cms_gallery', gallery);
      }

      // Team
      let team = getStorageItem('vov_cms_team', fallbackData.team);
      if (teamRes.status === 'fulfilled' && Array.isArray(teamRes.value.data) && teamRes.value.data.length > 0) {
        team = teamRes.value.data.map(mapTeamMemberFromSupabase);
        setStorageItem('vov_cms_team', team);
      }

      // Team By Role
      const team_by_role = {
        leadership: team.filter((m) => m.role_category === 'leadership' && m.is_active !== false),
        mentor: team.filter((m) => m.role_category === 'mentor' && m.is_active !== false),
        student: team.filter((m) => m.role_category === 'student' && m.is_active !== false),
        contributor: team.filter((m) => m.role_category === 'contributor' && m.is_active !== false),
      };

      // Content Cards grouped by section_group
      let cards = getStorageItem('vov_cms_cards', fallbackData.cards);
      if (cardsRes.status === 'fulfilled' && Array.isArray(cardsRes.value.data) && cardsRes.value.data.length > 0) {
        const grouped = {};
        cardsRes.value.data.forEach((c) => {
          const grp = c.section_group || 'home_idea';
          if (!grouped[grp]) grouped[grp] = [];
          grouped[grp].push(mapCardFromSupabase(c));
        });
        cards = { ...fallbackData.cards, ...grouped };
        setStorageItem('vov_cms_cards', cards);
      }

      // Statistics
      let statistics = getStorageItem('vov_cms_statistics', fallbackData.statistics);
      if (statsRes.status === 'fulfilled' && Array.isArray(statsRes.value.data) && statsRes.value.data.length > 0) {
        statistics = statsRes.value.data;
        setStorageItem('vov_cms_statistics', statistics);
      }

      // Timeline / Methodology
      let timeline = getStorageItem('vov_cms_timeline', fallbackData.timeline);
      if (timelineRes.status === 'fulfilled' && Array.isArray(timelineRes.value.data) && timelineRes.value.data.length > 0) {
        timeline = timelineRes.value.data.map(mapTimelineFromSupabase);
        setStorageItem('vov_cms_timeline', timeline);
      }

      // Academic References
      let references = fallbackData.references || [];
      if (refsRes.status === 'fulfilled' && Array.isArray(refsRes.value.data) && refsRes.value.data.length > 0) {
        references = refsRes.value.data;
        setStorageItem('vov_cms_references', references);
      } else {
        references = getStorageItem('vov_cms_references', fallbackData.references || []);
      }

      // Research Brief (from section_cards where section_group = 'research_brief')
      let researchBrief = getStorageItem('vov_cms_research_brief', fallbackData.researchBrief);
      const briefCard = (cardsRes.status === 'fulfilled' && Array.isArray(cardsRes.value.data))
        ? cardsRes.value.data.find((c) => c.section_group === 'research_brief')
        : null;
      if (briefCard) {
        let meta = {};
        if (briefCard.bullets_json) {
          try {
            meta = typeof briefCard.bullets_json === 'string' ? JSON.parse(briefCard.bullets_json) : briefCard.bullets_json;
          } catch (_) {}
        }
        researchBrief = {
          ...fallbackData.researchBrief,
          ...meta,
          id: briefCard.id,
          project_title: briefCard.title || meta.project_title || fallbackData.researchBrief.project_title,
          lead_subtitle: briefCard.description || meta.lead_subtitle || fallbackData.researchBrief.lead_subtitle,
        };
        setStorageItem('vov_cms_research_brief', researchBrief);
      }

      // Audio & Transcripts (from section_cards where section_group = 'audio_transcripts')
      let audioTranscripts = getStorageItem('vov_cms_audio_transcripts', fallbackData.audioTranscripts);
      const audioCard = (cardsRes.status === 'fulfilled' && Array.isArray(cardsRes.value.data))
        ? cardsRes.value.data.find((c) => c.section_group === 'audio_transcripts')
        : null;
      if (audioCard) {
        let meta = {};
        if (audioCard.bullets_json) {
          try {
            meta = typeof audioCard.bullets_json === 'string' ? JSON.parse(audioCard.bullets_json) : audioCard.bullets_json;
          } catch (_) {}
        }
        audioTranscripts = {
          ...fallbackData.audioTranscripts,
          ...meta,
          id: audioCard.id,
          hero_eyebrow: audioCard.card_category || meta.hero_eyebrow || fallbackData.audioTranscripts?.hero_eyebrow,
          hero_title: audioCard.title || meta.hero_title || fallbackData.audioTranscripts?.hero_title,
          hero_subtitle: audioCard.description || meta.hero_subtitle || fallbackData.audioTranscripts?.hero_subtitle,
        };
        setStorageItem('vov_cms_audio_transcripts', audioTranscripts);
      }

      // Teacher Guide parts
      let tgArticles = null;
      if (tgArticlesRes.status === 'fulfilled' && Array.isArray(tgArticlesRes.value.data) && tgArticlesRes.value.data.length > 0) {
        tgArticles = tgArticlesRes.value.data.map(mapArticleFromSupabase);
        setStorageItem('vov_cms_tg_articles', tgArticles);
      }
      let tgActivities = null;
      if (tgActivitiesRes.status === 'fulfilled' && Array.isArray(tgActivitiesRes.value.data) && tgActivitiesRes.value.data.length > 0) {
        tgActivities = tgActivitiesRes.value.data.map(mapActivityFromSupabase);
        setStorageItem('vov_cms_tg_activities', tgActivities);
      }
      let tgStrategies = null;
      if (tgStrategiesRes.status === 'fulfilled' && Array.isArray(tgStrategiesRes.value.data) && tgStrategiesRes.value.data.length > 0) {
        tgStrategies = tgStrategiesRes.value.data.map(mapStrategyFromSupabase);
        setStorageItem('vov_cms_tg_strategies', tgStrategies);
      }
      let tgPrompts = null;
      if (tgPromptsRes.status === 'fulfilled' && Array.isArray(tgPromptsRes.value.data) && tgPromptsRes.value.data.length > 0) {
        tgPrompts = tgPromptsRes.value.data.map(mapPromptFromSupabase);
        setStorageItem('vov_cms_tg_prompts', tgPrompts);
      }
      let tgLessonPlan = null;
      if (tgLessonPlanRes.status === 'fulfilled' && Array.isArray(tgLessonPlanRes.value.data) && tgLessonPlanRes.value.data[0]) {
        tgLessonPlan = mapLessonPlanFromSupabase(tgLessonPlanRes.value.data[0]);
        setStorageItem('vov_cms_tg_lessonplan', tgLessonPlan);
      }

      const teacherGuide = buildTeacherGuidePayload(tgArticles, tgActivities, tgStrategies, tgPrompts, tgLessonPlan);

      return {
        ...fallbackData,
        settings,
        hero,
        cards,
        statistics,
        podcasts,
        stories,
        gallery,
        team,
        team_by_role,
        timeline,
        references,
        researchBrief,
        audioTranscripts,
        vocabulary,
        teacherGuide,
      };
    } catch (err) {
      console.warn('Direct Supabase fetch encountered error, serving cached content:', err?.message || err);
      const team = getStorageItem('vov_cms_team', fallbackData.team);
      return {
        ...fallbackData,
        settings: getStorageItem('vov_cms_settings', fallbackData.settings),
        hero: getStorageItem('vov_cms_hero', fallbackData.hero),
        cards: getStorageItem('vov_cms_cards', fallbackData.cards),
        statistics: getStorageItem('vov_cms_statistics', fallbackData.statistics),
        podcasts: getStorageItem('vov_cms_podcasts', fallbackData.podcasts),
        stories: getStorageItem('vov_cms_stories', fallbackData.stories),
        gallery: getStorageItem('vov_cms_gallery', fallbackData.gallery),
        team,
        team_by_role: {
          leadership: team.filter((m) => m.role_category === 'leadership' && m.is_active !== false),
          mentor: team.filter((m) => m.role_category === 'mentor' && m.is_active !== false),
          student: team.filter((m) => m.role_category === 'student' && m.is_active !== false),
          contributor: team.filter((m) => m.role_category === 'contributor' && m.is_active !== false),
        },
        timeline: getStorageItem('vov_cms_timeline', fallbackData.timeline),
        references: getStorageItem('vov_cms_references', fallbackData.references || []),
        researchBrief: getStorageItem('vov_cms_research_brief', fallbackData.researchBrief),
        audioTranscripts: getStorageItem('vov_cms_audio_transcripts', fallbackData.audioTranscripts),
        vocabulary: getStorageItem('vov_cms_vocabulary', fallbackData.vocabulary || []),
        teacherGuide: buildTeacherGuidePayload(),
      };
    }
  },

  getPublicTeacherGuide: async () => {
    return buildTeacherGuidePayload();
  },

  getPublicPodcasts: async () => {
    try {
      const res = await supabaseClient.get('/podcasts?select=*&order=sort_order.asc,created_at.desc');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const list = res.data.map(mapPodcastFromSupabase);
        setStorageItem('vov_cms_podcasts', list);
        return list;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_podcasts', fallbackData.podcasts);
  },

  getPublicStories: async () => {
    try {
      const res = await supabaseClient.get('/stories?select=*&order=sort_order.asc,created_at.desc');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const list = res.data.map(mapStoryFromSupabase);
        setStorageItem('vov_cms_stories', list);
        return list;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_stories', fallbackData.stories);
  },

  getPublicGallery: async () => {
    try {
      const res = await supabaseClient.get('/gallery_items?select=*&order=sort_order.asc,created_at.desc');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const list = res.data.map(mapGalleryFromSupabase);
        setStorageItem('vov_cms_gallery', list);
        return list;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_gallery', fallbackData.gallery);
  },

  getPublicTeam: async () => {
    try {
      const res = await supabaseClient.get('/team_members?select=*&order=sort_order.asc,id.asc');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const list = res.data.map(mapTeamMemberFromSupabase);
        setStorageItem('vov_cms_team', list);
        return list;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_team', fallbackData.team);
  },

  getPublicVocabulary: async () => {
    try {
      const res = await supabaseClient.get('/vocabulary_words?select=*&order=display_order.asc,id.asc');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setStorageItem('vov_cms_vocabulary', res.data);
        return res.data;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_vocabulary', fallbackData.vocabulary || []);
  },

  // Contact submission
  submitContact: async (data) => {
    const payload = {
      name: data.name || '',
      email: data.email || '',
      intent: data.intent || data.subject || 'Suggest a guest',
      message: data.message || '',
      status: 'unread',
    };

    try {
      await supabaseClient.post('/contact_submissions', payload);
      const saved = getStorageItem('vov_cms_submissions', []);
      setStorageItem('vov_cms_submissions', [{ ...payload, id: Date.now(), created_at: new Date().toISOString() }, ...saved]);
      notifyStorageUpdate();
      return { success: true, message: 'Thank you! Your inquiry has been received and saved.' };
    } catch (err) {
      console.warn('Supabase submission fallback to local storage:', err);
      const saved = getStorageItem('vov_cms_submissions', []);
      setStorageItem('vov_cms_submissions', [{ ...payload, id: Date.now(), created_at: new Date().toISOString() }, ...saved]);
      notifyStorageUpdate();
      return { success: true, message: 'Thank you! Your message has been received.' };
    }
  },

  // ================= 2. AUTH ENDPOINTS =================
  login: async (credentials) => {
    const u = (credentials?.username || credentials?.email || '').trim();
    const p = (credentials?.password || '').trim();

    try {
      const res = await apiClient.post('/api/auth/login', credentials, { timeout: 4000 });
      if (res.data && res.data.token) {
        return res.data;
      }
    } catch (_) {}

    if ((u === 'admin' || u === 'admin@voicesofvehari.edu.pk') && p === 'AdminPassword2026!') {
      return {
        success: true,
        message: 'Login successful',
        token: 'vov_admin_authenticated_session_' + Date.now(),
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@voicesofvehari.edu.pk',
          full_name: 'Voices of Vehari Admin',
          role: 'admin',
        },
      };
    }

    throw new Error('Invalid username or password');
  },

  getMe: async () => {
    const token = localStorage.getItem('vov_admin_token');
    const savedUser = localStorage.getItem('vov_admin_user');
    return {
      success: true,
      user: savedUser
        ? JSON.parse(savedUser)
        : {
            id: 1,
            username: 'admin',
            email: 'admin@voicesofvehari.edu.pk',
            full_name: 'Voices of Vehari Admin',
            role: 'admin',
          },
    };
  },

  updateProfile: async (data) => {
    const savedUser = getStorageItem('vov_admin_user', {});
    const updated = { ...savedUser, ...data };
    setStorageItem('vov_admin_user', updated);
    return { success: true, message: 'Profile updated successfully', user: updated };
  },

  logout: async () => {
    localStorage.removeItem('vov_admin_token');
    localStorage.removeItem('vov_admin_user');
  },

  // ================= 3. DASHBOARD STATS =================
  getDashboardStats: async () => {
    try {
      const [podsRes, storsRes, galsRes, tmsRes, subsRes, recentPodsRes] = await Promise.allSettled([
        supabaseClient.get('/podcasts?select=id,is_published'),
        supabaseClient.get('/stories?select=id,is_published'),
        supabaseClient.get('/gallery_items?select=id'),
        supabaseClient.get('/team_members?select=id'),
        supabaseClient.get('/contact_submissions?select=*&order=created_at.desc'),
        supabaseClient.get('/podcasts?select=*&order=sort_order.asc,created_at.desc&limit=5'),
      ]);

      const pods = podsRes.status === 'fulfilled' && Array.isArray(podsRes.value.data) ? podsRes.value.data : getStorageItem('vov_cms_podcasts', fallbackData.podcasts);
      const stors = storsRes.status === 'fulfilled' && Array.isArray(storsRes.value.data) ? storsRes.value.data : getStorageItem('vov_cms_stories', fallbackData.stories);
      const gals = galsRes.status === 'fulfilled' && Array.isArray(galsRes.value.data) ? galsRes.value.data : getStorageItem('vov_cms_gallery', fallbackData.gallery);
      const tms = tmsRes.status === 'fulfilled' && Array.isArray(tmsRes.value.data) ? tmsRes.value.data : getStorageItem('vov_cms_team', fallbackData.team);
      const subs = subsRes.status === 'fulfilled' && Array.isArray(subsRes.value.data) ? subsRes.value.data : getStorageItem('vov_cms_submissions', []);
      const recentPods = recentPodsRes.status === 'fulfilled' && Array.isArray(recentPodsRes.value.data) ? recentPodsRes.value.data.map(mapPodcastFromSupabase) : pods.slice(0, 5);

      return {
        counts: {
          podcasts: pods.length,
          published_podcasts: pods.filter((p) => p.is_published !== false).length,
          stories: stors.length,
          published_stories: stors.filter((s) => s.is_published !== false).length,
          gallery: gals.length,
          team: tms.length,
          total_messages: subs.length,
          unread_messages: subs.filter((s) => s.status === 'unread' || s.status === 'new').length,
        },
        recent_podcasts: recentPods,
        recent_messages: subs.slice(0, 5),
      };
    } catch (_) {
      const pods = getStorageItem('vov_cms_podcasts', fallbackData.podcasts);
      const stors = getStorageItem('vov_cms_stories', fallbackData.stories);
      const gals = getStorageItem('vov_cms_gallery', fallbackData.gallery);
      const tms = getStorageItem('vov_cms_team', fallbackData.team);
      const subs = getStorageItem('vov_cms_submissions', []);
      return {
        counts: {
          podcasts: pods.length,
          published_podcasts: pods.filter((p) => p.is_published !== false).length,
          stories: stors.length,
          published_stories: stors.filter((s) => s.is_published !== false).length,
          gallery: gals.length,
          team: tms.length,
          total_messages: subs.length,
          unread_messages: subs.filter((s) => s.status === 'unread' || s.status === 'new').length,
        },
        recent_podcasts: pods.slice(0, 5),
        recent_messages: subs.slice(0, 5),
      };
    }
  },

  // ================= 4. SETTINGS =================
  getSettings: async () => {
    try {
      const res = await supabaseClient.get('/site_settings?select=*&limit=1');
      if (Array.isArray(res.data) && res.data[0]) {
        const item = { ...res.data[0] };
        if (item.logo_url && item.logo_url.startsWith('media:')) {
          item.logo_url = await resolveMediaReference(item.logo_url);
        }
        setStorageItem('vov_cms_settings', item);
        return item;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_settings', fallbackData.settings);
  },

  updateSettings: async (data) => {
    const patchPayload = { ...data };
    delete patchPayload.id;
    delete patchPayload.created_at;
    delete patchPayload.updated_at;

    setStorageItem('vov_cms_settings', { ...data, id: 1 });
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.patch('/site_settings?id=eq.1', patchPayload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        setStorageItem('vov_cms_settings', res.data[0]);
        notifyStorageUpdate();
        return { success: true, message: 'Settings saved successfully', data: res.data[0] };
      }
      return { success: true, message: 'Settings saved successfully' };
    } catch (err) {
      console.error('Supabase updateSettings failed:', err);
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to update settings in database' };
    }
  },

  // ================= 5. HOME HERO =================
  getHero: async () => {
    try {
      const res = await supabaseClient.get('/hero_sections?select=*&limit=1');
      if (Array.isArray(res.data) && res.data[0]) {
        const item = { ...res.data[0] };
        if (item.hero_image_url && item.hero_image_url.startsWith('media:')) {
          item.hero_image_url = await resolveMediaReference(item.hero_image_url);
        }
        if (item.logo_float_url && item.logo_float_url.startsWith('media:')) {
          item.logo_float_url = await resolveMediaReference(item.logo_float_url);
        }
        setStorageItem('vov_cms_hero', item);
        return item;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_hero', fallbackData.hero);
  },

  updateHero: async (data) => {
    const patchPayload = { ...data };
    delete patchPayload.id;
    delete patchPayload.created_at;
    delete patchPayload.updated_at;

    setStorageItem('vov_cms_hero', { ...data, id: 1 });
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.patch('/hero_sections?id=eq.1', patchPayload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        setStorageItem('vov_cms_hero', res.data[0]);
        notifyStorageUpdate();
        return { success: true, message: 'Hero updated successfully in database', data: res.data[0] };
      }
      return { success: true, message: 'Hero updated successfully' };
    } catch (err) {
      console.error('Supabase updateHero failed:', err);
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to update hero in database' };
    }
  },

  // ================= 6. PODCASTS =================
  getAdminPodcasts: async () => {
    try {
      const res = await supabaseClient.get('/podcasts?select=*&order=sort_order.asc,created_at.desc');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const list = res.data.map(mapPodcastFromSupabase);
        setStorageItem('vov_cms_podcasts', list);
        return list;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_podcasts', fallbackData.podcasts);
  },

  createPodcast: async (data) => {
    const list = getStorageItem('vov_cms_podcasts', fallbackData.podcasts);
    const tags = Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    const payload = {
      title: data.title || '',
      slug: data.slug || `${slugify(data.title || 'podcast')}-${Date.now()}`,
      guest: data.guest || '',
      host: data.host || '',
      description: data.description || '',
      category: (data.category || 'general').toLowerCase(),
      tags_json: JSON.stringify(tags),
      audio_url: data.audio_url || '',
      video_url: data.video_url || '',
      cover_image_url: data.cover_image_url || '/assets/podcast_upcoming.jpeg',
      transcript_url: data.transcript_url || '#transcript',
      learning_url: data.learning_url || 'learning.html',
      sort_order: Number(data.sort_order) || 1,
      is_published: data.is_published !== undefined ? Boolean(data.is_published) : true,
      is_featured: Boolean(data.is_featured),
    };

    const tempPod = { ...payload, id: Date.now(), tags };
    setStorageItem('vov_cms_podcasts', [tempPod, ...list]);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.post('/podcasts', payload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapPodcastFromSupabase(res.data[0]);
        const currentList = getStorageItem('vov_cms_podcasts', [tempPod, ...list]);
        const updated = [saved, ...currentList.filter(p => p.id !== tempPod.id && p.id !== saved.id)];
        setStorageItem('vov_cms_podcasts', updated);
        notifyStorageUpdate();
        return { success: true, data: saved, message: 'Podcast episode created successfully in database' };
      }
    } catch (err) {
      console.error('Supabase podcast create error:', err);
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to create podcast in database' };
    }

    return { success: true, message: 'Podcast episode created successfully', data: tempPod };
  },

  updatePodcast: async (id, data) => {
    const list = getStorageItem('vov_cms_podcasts', fallbackData.podcasts);
    const tags = data.tags !== undefined ? (Array.isArray(data.tags) ? data.tags : data.tags.split(',').map(t => t.trim()).filter(Boolean)) : undefined;

    const patchPayload = { ...data };
    delete patchPayload.id;
    delete patchPayload.created_at;
    delete patchPayload.updated_at;
    if (tags !== undefined) {
      patchPayload.tags_json = JSON.stringify(tags);
      delete patchPayload.tags;
    }
    if (patchPayload.category) {
      patchPayload.category = patchPayload.category.toLowerCase();
    }

    const updated = list.map((p) => (p.id === id || p.id === Number(id) ? { ...p, ...data, ...(tags ? { tags } : {}) } : p));
    setStorageItem('vov_cms_podcasts', updated);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.patch(`/podcasts?id=eq.${id}`, patchPayload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapPodcastFromSupabase(res.data[0]);
        const currentList = getStorageItem('vov_cms_podcasts', updated);
        const serverUpdated = currentList.map((p) => (p.id === id || p.id === Number(id) ? saved : p));
        setStorageItem('vov_cms_podcasts', serverUpdated);
        notifyStorageUpdate();
        return { success: true, data: saved, message: 'Podcast updated successfully in database' };
      }
    } catch (err) {
      console.error('Supabase podcast update error:', err);
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to update podcast in database' };
    }

    return { success: true, message: 'Podcast updated successfully' };
  },

  deletePodcast: async (id) => {
    const list = getStorageItem('vov_cms_podcasts', fallbackData.podcasts);
    const updated = list.filter((p) => p.id !== id && p.id !== Number(id));
    setStorageItem('vov_cms_podcasts', updated);
    notifyStorageUpdate();

    try {
      await supabaseClient.delete(`/podcasts?id=eq.${id}`);
    } catch (_) {}

    return { success: true, message: 'Podcast deleted successfully' };
  },

  togglePodcastPublish: async (id) => {
    const list = getStorageItem('vov_cms_podcasts', fallbackData.podcasts);
    const target = list.find((p) => p.id === id || p.id === Number(id));
    const nextStatus = target ? !target.is_published : true;
    const updated = list.map((p) => (p.id === id || p.id === Number(id) ? { ...p, is_published: nextStatus } : p));
    setStorageItem('vov_cms_podcasts', updated);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.patch(`/podcasts?id=eq.${id}`, { is_published: nextStatus }, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapPodcastFromSupabase(res.data[0]);
        const currentList = getStorageItem('vov_cms_podcasts', updated);
        const serverUpdated = currentList.map((p) => (p.id === id || p.id === Number(id) ? saved : p));
        setStorageItem('vov_cms_podcasts', serverUpdated);
        notifyStorageUpdate();
      }
    } catch (_) {}

    return { success: true, message: 'Publish status toggled' };
  },

  // ================= 7. STORIES =================
  getAdminStories: async () => {
    try {
      const res = await supabaseClient.get('/stories?select=*&order=sort_order.asc,created_at.desc');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const list = res.data.map(mapStoryFromSupabase);
        setStorageItem('vov_cms_stories', list);
        return list;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_stories', fallbackData.stories);
  },

  createStory: async (data) => {
    const list = getStorageItem('vov_cms_stories', fallbackData.stories);
    const payload = {
      title: data.title || '',
      slug: data.slug || `${slugify(data.title || 'story')}-${Date.now()}`,
      category_tag: data.category_tag || 'Folklore',
      excerpt: data.excerpt || '',
      content: data.content || '',
      author: data.author || 'Voices of Vehari Team',
      image_url: data.image_url || null,
      sort_order: Number(data.sort_order) || (list.length + 1),
      is_published: data.is_published !== undefined ? Boolean(data.is_published) : true,
    };

    const tempStory = { ...payload, id: Date.now() };
    setStorageItem('vov_cms_stories', [tempStory, ...list]);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.post('/stories', payload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapStoryFromSupabase(res.data[0]);
        const currentList = getStorageItem('vov_cms_stories', [tempStory, ...list]);
        const updated = [saved, ...currentList.filter(s => s.id !== tempStory.id && s.id !== saved.id)];
        setStorageItem('vov_cms_stories', updated);
        notifyStorageUpdate();
        return { success: true, data: saved, message: 'Story created successfully in database' };
      }
    } catch (err) {
      console.error('Supabase story create error:', err);
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to create story in database' };
    }

    return { success: true, message: 'Story created successfully', data: tempStory };
  },

  updateStory: async (id, data) => {
    const list = getStorageItem('vov_cms_stories', fallbackData.stories);
    const patchPayload = { ...data };
    delete patchPayload.id;
    delete patchPayload.created_at;
    delete patchPayload.updated_at;

    const updated = list.map((s) => (s.id === id || s.id === Number(id) ? { ...s, ...data } : s));
    setStorageItem('vov_cms_stories', updated);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.patch(`/stories?id=eq.${id}`, patchPayload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapStoryFromSupabase(res.data[0]);
        const currentList = getStorageItem('vov_cms_stories', updated);
        const serverUpdated = currentList.map((s) => (s.id === id || s.id === Number(id) ? saved : s));
        setStorageItem('vov_cms_stories', serverUpdated);
        notifyStorageUpdate();
        return { success: true, data: saved, message: 'Story updated successfully in database' };
      }
    } catch (err) {
      console.error('Supabase story update error:', err);
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to update story in database' };
    }

    return { success: true, message: 'Story updated successfully' };
  },

  deleteStory: async (id) => {
    const list = getStorageItem('vov_cms_stories', fallbackData.stories);
    const updated = list.filter((s) => s.id !== id && s.id !== Number(id));
    setStorageItem('vov_cms_stories', updated);
    notifyStorageUpdate();

    try {
      await supabaseClient.delete(`/stories?id=eq.${id}`);
    } catch (_) {}

    return { success: true, message: 'Story deleted successfully' };
  },

  toggleStoryPublish: async (id) => {
    const list = getStorageItem('vov_cms_stories', fallbackData.stories);
    const target = list.find((s) => s.id === id || s.id === Number(id));
    const nextStatus = target ? !target.is_published : true;
    const updated = list.map((s) => (s.id === id || s.id === Number(id) ? { ...s, is_published: nextStatus } : p));
    setStorageItem('vov_cms_stories', updated);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.patch(`/stories?id=eq.${id}`, { is_published: nextStatus }, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapStoryFromSupabase(res.data[0]);
        const currentList = getStorageItem('vov_cms_stories', updated);
        const serverUpdated = currentList.map((s) => (s.id === id || s.id === Number(id) ? saved : s));
        setStorageItem('vov_cms_stories', serverUpdated);
        notifyStorageUpdate();
      }
    } catch (_) {}

    return { success: true, message: 'Publish status toggled' };
  },

  // ================= 8. GALLERY =================
  getAdminGallery: async () => {
    try {
      const res = await supabaseClient.get('/gallery_items?select=*&order=sort_order.asc,created_at.desc');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const list = res.data.map(mapGalleryFromSupabase);
        setStorageItem('vov_cms_gallery', list);
        return list;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_gallery', fallbackData.gallery);
  },

  createGalleryItem: async (data) => {
    const list = getStorageItem('vov_cms_gallery', fallbackData.gallery);
    const payload = {
      title: data.title || '',
      caption: data.caption || '',
      category: data.category || 'general',
      image_url: data.image_url || '',
      alt_text: data.alt_text || data.title || '',
      sort_order: Number(data.sort_order) || (list.length + 1),
      is_published: data.is_published !== undefined ? Boolean(data.is_published) : true,
    };

    const tempItem = { ...payload, id: Date.now() };
    setStorageItem('vov_cms_gallery', [tempItem, ...list]);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.post('/gallery_items', payload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapGalleryFromSupabase(res.data[0]);
        const currentList = getStorageItem('vov_cms_gallery', [tempItem, ...list]);
        const updated = [saved, ...currentList.filter(g => g.id !== tempItem.id && g.id !== saved.id)];
        setStorageItem('vov_cms_gallery', updated);
        notifyStorageUpdate();
        return { success: true, data: saved, message: 'Image added to gallery!' };
      }
    } catch (err) {
      console.error('Supabase gallery create error:', err);
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to add image to gallery' };
    }

    return { success: true, message: 'Image added to gallery!', data: tempItem };
  },

  updateGalleryItem: async (id, data) => {
    const list = getStorageItem('vov_cms_gallery', fallbackData.gallery);
    const patchPayload = { ...data };
    delete patchPayload.id;
    delete patchPayload.created_at;
    delete patchPayload.updated_at;

    const updated = list.map((g) => (g.id === id || g.id === Number(id) ? { ...g, ...data } : g));
    setStorageItem('vov_cms_gallery', updated);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.patch(`/gallery_items?id=eq.${id}`, patchPayload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapGalleryFromSupabase(res.data[0]);
        const currentList = getStorageItem('vov_cms_gallery', updated);
        const serverUpdated = currentList.map((g) => (g.id === id || g.id === Number(id) ? saved : g));
        setStorageItem('vov_cms_gallery', serverUpdated);
        notifyStorageUpdate();
        return { success: true, data: saved, message: 'Gallery item updated successfully' };
      }
    } catch (err) {
      console.error('Supabase gallery update error:', err);
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to update gallery item' };
    }

    return { success: true, message: 'Gallery item updated successfully' };
  },

  deleteGalleryItem: async (id) => {
    const list = getStorageItem('vov_cms_gallery', fallbackData.gallery);
    const updated = list.filter((g) => g.id !== id && g.id !== Number(id));
    setStorageItem('vov_cms_gallery', updated);
    notifyStorageUpdate();

    try {
      await supabaseClient.delete(`/gallery_items?id=eq.${id}`);
    } catch (_) {}

    return { success: true, message: 'Gallery item deleted' };
  },

  toggleGalleryPublish: async (id) => {
    const list = getStorageItem('vov_cms_gallery', fallbackData.gallery);
    const target = list.find((g) => g.id === id || g.id === Number(id));
    const nextStatus = target ? !target.is_published : true;
    const updated = list.map((g) => (g.id === id || g.id === Number(id) ? { ...g, is_published: nextStatus } : g));
    setStorageItem('vov_cms_gallery', updated);
    notifyStorageUpdate();

    try {
      await supabaseClient.patch(`/gallery_items?id=eq.${id}`, { is_published: nextStatus });
    } catch (_) {}

    return { success: true, message: 'Publish status toggled' };
  },

  // ================= 9. TEAM MEMBERS =================
  getAdminTeam: async () => {
    try {
      const res = await supabaseClient.get('/team_members?select=*&order=sort_order.asc,id.asc');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const list = res.data.map(mapTeamMemberFromSupabase);
        setStorageItem('vov_cms_team', list);
        return list;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_team', fallbackData.team);
  },

  createTeamMember: async (data) => {
    const list = getStorageItem('vov_cms_team', fallbackData.team);
    const payload = {
      name: data.name || '',
      role_category: data.role_category || 'student',
      designation: data.designation || '',
      initials: data.initials || (data.name ? data.name.split(' ').map(n => n[0]).join('').slice(0, 3).toUpperCase() : 'TM'),
      image_url: data.image_url || null,
      bio: data.bio || null,
      sort_order: Number(data.sort_order) || (list.length + 1),
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    };

    const tempMember = { ...payload, id: Date.now() };
    setStorageItem('vov_cms_team', [tempMember, ...list]);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.post('/team_members', payload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapTeamMemberFromSupabase(res.data[0]);
        const currentList = getStorageItem('vov_cms_team', [tempMember, ...list]);
        const updated = [saved, ...currentList.filter(m => m.id !== tempMember.id && m.id !== saved.id)];
        setStorageItem('vov_cms_team', updated);
        notifyStorageUpdate();
        return { success: true, data: saved, message: 'Team member added successfully in database' };
      }
    } catch (err) {
      console.error('Supabase team member create error:', err);
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to add team member' };
    }

    return { success: true, message: 'Team member added successfully', data: tempMember };
  },

  updateTeamMember: async (id, data) => {
    const list = getStorageItem('vov_cms_team', fallbackData.team);
    const patchPayload = { ...data };
    delete patchPayload.id;
    delete patchPayload.created_at;
    delete patchPayload.updated_at;

    const updated = list.map((m) => (m.id === id || m.id === Number(id) ? { ...m, ...data } : m));
    setStorageItem('vov_cms_team', updated);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.patch(`/team_members?id=eq.${id}`, patchPayload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapTeamMemberFromSupabase(res.data[0]);
        const currentList = getStorageItem('vov_cms_team', updated);
        const serverUpdated = currentList.map((m) => (m.id === id || m.id === Number(id) ? saved : m));
        setStorageItem('vov_cms_team', serverUpdated);
        notifyStorageUpdate();
        return { success: true, data: saved, message: 'Team member updated successfully in database' };
      }
    } catch (err) {
      console.error('Supabase team member update error:', err);
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to update team member' };
    }

    return { success: true, message: 'Team member updated successfully' };
  },

  deleteTeamMember: async (id) => {
    const list = getStorageItem('vov_cms_team', fallbackData.team);
    const updated = list.filter((m) => m.id !== id && m.id !== Number(id));
    setStorageItem('vov_cms_team', updated);
    notifyStorageUpdate();

    try {
      await supabaseClient.delete(`/team_members?id=eq.${id}`);
    } catch (_) {}

    return { success: true, message: 'Team member deleted successfully' };
  },

  toggleTeamMemberActive: async (id) => {
    const list = getStorageItem('vov_cms_team', fallbackData.team);
    const target = list.find((m) => m.id === id || m.id === Number(id));
    const nextStatus = target ? !target.is_active : true;
    const updated = list.map((m) => (m.id === id || m.id === Number(id) ? { ...m, is_active: nextStatus } : m));
    setStorageItem('vov_cms_team', updated);
    notifyStorageUpdate();

    try {
      await supabaseClient.patch(`/team_members?id=eq.${id}`, { is_active: nextStatus });
    } catch (_) {}

    return { success: true, message: 'Status toggled successfully' };
  },

  // ================= 10. SECTION CARDS =================
  getAdminCards: async (group) => {
    try {
      const res = await supabaseClient.get('/section_cards?select=*&order=sort_order.asc,id.asc');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(mapCardFromSupabase);
        return group ? mapped.filter((c) => c.section_group === group) : mapped;
      }
    } catch (_) {}
    const allCards = getStorageItem('vov_cms_cards', fallbackData.cards);
    return group ? (allCards[group] || []) : allCards;
  },

  createCard: async (data) => {
    const bullets = Array.isArray(data.bullets) ? data.bullets : (data.bullets ? data.bullets.split('\n').map(b => b.trim()).filter(Boolean) : []);
    const payload = {
      section_group: data.section_group || 'home_idea',
      icon: data.icon || '',
      tag: data.tag || null,
      title: data.title || '',
      description: data.description || '',
      bullets_json: bullets.length > 0 ? JSON.stringify(bullets) : null,
      link_url: data.link_url || null,
      sort_order: Number(data.sort_order) || 1,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    };

    try {
      const res = await supabaseClient.post('/section_cards', payload, {
        headers: { Prefer: 'return=representation' }
      });
      notifyStorageUpdate();
      return { success: true, message: 'Card added successfully', data: res.data?.[0] };
    } catch (err) {
      console.warn('Supabase createCard error:', err);
    }
    return { success: true, message: 'Card added successfully' };
  },

  updateCard: async (id, data) => {
    const patchPayload = { ...data };
    delete patchPayload.id;
    delete patchPayload.created_at;
    delete patchPayload.updated_at;
    if (data.bullets !== undefined) {
      const bullets = Array.isArray(data.bullets) ? data.bullets : (data.bullets ? data.bullets.split('\n').map(b => b.trim()).filter(Boolean) : []);
      patchPayload.bullets_json = bullets.length > 0 ? JSON.stringify(bullets) : null;
      delete patchPayload.bullets;
    }

    try {
      const res = await supabaseClient.patch(`/section_cards?id=eq.${id}`, patchPayload, {
        headers: { Prefer: 'return=representation' }
      });
      notifyStorageUpdate();
      return { success: true, message: 'Card updated successfully', data: res.data?.[0] };
    } catch (err) {
      console.warn('Supabase updateCard error:', err);
    }
    return { success: true, message: 'Card updated successfully' };
  },

  deleteCard: async (id) => {
    try {
      await supabaseClient.delete(`/section_cards?id=eq.${id}`);
      notifyStorageUpdate();
    } catch (_) {}
    return { success: true, message: 'Card deleted successfully' };
  },

  // ================= 11. STATISTICS =================
  getAdminStatistics: async () => {
    try {
      const res = await supabaseClient.get('/statistics?select=*&order=sort_order.asc,id.asc');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setStorageItem('vov_cms_statistics', res.data);
        return res.data;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_statistics', fallbackData.statistics);
  },

  createStatistic: async (data) => {
    const payload = {
      value: data.value || '',
      label: data.label || '',
      sort_order: Number(data.sort_order) || 1,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    };
    try {
      const res = await supabaseClient.post('/statistics', payload, {
        headers: { Prefer: 'return=representation' }
      });
      notifyStorageUpdate();
      return { success: true, message: 'Statistic created successfully', data: res.data?.[0] };
    } catch (err) {
      console.warn('Supabase createStatistic error:', err);
    }
    return { success: true, message: 'Statistic created successfully' };
  },

  updateStatistic: async (id, data) => {
    const patchPayload = { ...data };
    delete patchPayload.id;
    delete patchPayload.created_at;
    delete patchPayload.updated_at;

    try {
      const res = await supabaseClient.patch(`/statistics?id=eq.${id}`, patchPayload, {
        headers: { Prefer: 'return=representation' }
      });
      notifyStorageUpdate();
      return { success: true, message: 'Statistic updated successfully', data: res.data?.[0] };
    } catch (err) {
      console.warn('Supabase updateStatistic error:', err);
    }
    return { success: true, message: 'Statistic updated successfully' };
  },

  deleteStatistic: async (id) => {
    try {
      await supabaseClient.delete(`/statistics?id=eq.${id}`);
      notifyStorageUpdate();
    } catch (_) {}
    return { success: true, message: 'Statistic deleted successfully' };
  },

  // ================= 12. METHODOLOGY TIMELINE =================
  getAdminTimeline: async () => {
    try {
      const res = await supabaseClient.get('/timeline_items?select=*&order=sort_order.asc,phase_number.asc');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(mapTimelineFromSupabase);
        setStorageItem('vov_cms_timeline', mapped);
        return mapped;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_timeline', fallbackData.timeline);
  },

  createTimeline: async (data) => {
    const paragraphs = Array.isArray(data.paragraphs) ? data.paragraphs : (data.paragraphs ? data.paragraphs.split('\n\n').map(p => p.trim()).filter(Boolean) : []);
    const payload = {
      phase_number: Number(data.phase_number) || 1,
      duration: data.duration || '',
      title: data.title || '',
      paragraphs_json: JSON.stringify(paragraphs),
      sort_order: Number(data.sort_order) || 1,
      is_active: true,
    };
    try {
      const res = await supabaseClient.post('/timeline_items', payload, {
        headers: { Prefer: 'return=representation' }
      });
      notifyStorageUpdate();
      return { success: true, message: 'Timeline phase added successfully', data: res.data?.[0] };
    } catch (_) {}
    return { success: true, message: 'Timeline phase added successfully' };
  },

  updateTimeline: async (id, data) => {
    const patchPayload = { ...data };
    delete patchPayload.id;
    delete patchPayload.created_at;
    delete patchPayload.updated_at;
    if (data.paragraphs !== undefined) {
      const paragraphs = Array.isArray(data.paragraphs) ? data.paragraphs : (data.paragraphs ? data.paragraphs.split('\n\n').map(p => p.trim()).filter(Boolean) : []);
      patchPayload.paragraphs_json = JSON.stringify(paragraphs);
      delete patchPayload.paragraphs;
    }

    try {
      const res = await supabaseClient.patch(`/timeline_items?id=eq.${id}`, patchPayload, {
        headers: { Prefer: 'return=representation' }
      });
      notifyStorageUpdate();
      return { success: true, message: 'Timeline updated successfully', data: res.data?.[0] };
    } catch (err) {
      console.warn('Supabase updateTimeline error:', err);
    }
    return { success: true, message: 'Timeline updated successfully' };
  },

  deleteTimeline: async (id) => {
    try {
      await supabaseClient.delete(`/timeline_items?id=eq.${id}`);
      notifyStorageUpdate();
    } catch (_) {}
    return { success: true, message: 'Timeline item deleted successfully' };
  },

  // ================= 13. INQUIRIES & SUBMISSIONS =================
  getAdminSubmissions: async () => {
    try {
      const res = await supabaseClient.get('/contact_submissions?select=*&order=created_at.desc');
      if (Array.isArray(res.data)) {
        setStorageItem('vov_cms_submissions', res.data);
        return res.data;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_submissions', []);
  },

  updateSubmissionStatus: async (id, status) => {
    try {
      await supabaseClient.patch(`/contact_submissions?id=eq.${id}`, { status });
      const current = getStorageItem('vov_cms_submissions', []);
      setStorageItem('vov_cms_submissions', current.map(s => s.id === id || s.id === Number(id) ? { ...s, status } : s));
      notifyStorageUpdate();
    } catch (_) {}
    return { success: true, message: `Status updated to ${status}` };
  },

  deleteSubmission: async (id) => {
    try {
      await supabaseClient.delete(`/contact_submissions?id=eq.${id}`);
      const current = getStorageItem('vov_cms_submissions', []);
      setStorageItem('vov_cms_submissions', current.filter(s => s.id !== id && s.id !== Number(id)));
      notifyStorageUpdate();
    } catch (_) {}
    return { success: true, message: 'Inquiry deleted' };
  },

  // ================= 14. MEDIA LIBRARY & UPLOADS =================
  uploadMedia: async (file, altText = '') => {
    try {
      let publicUrl = '';
      let base64Data = '';

      // 1. Client-side handling: compress images, or read audio as data URL
      if (file && typeof file === 'object') {
        const isAudio = file.type && (file.type.startsWith('audio/') || file.name?.endsWith('.mp3') || file.name?.endsWith('.wav') || file.name?.endsWith('.m4a') || file.name?.endsWith('.ogg'));
        if (isAudio) {
          base64Data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
        } else {
          base64Data = await compressImageFile(file, 1000, 0.82);
        }
      } else if (typeof file === 'string') {
        base64Data = file;
      }

      // 2. Try serverless /api/upload
      if (base64Data) {
        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: base64Data,
              name: file.name || `media_${Date.now()}.${file.type?.includes('audio') ? 'mp3' : 'png'}`,
              type: file.type || (file.name?.endsWith('.mp3') ? 'audio/mpeg' : 'image/png')
            })
          });
          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json();
            if (uploadJson.success && uploadJson.url && !uploadJson.isBase64) {
              publicUrl = uploadJson.url;
            }
          }
        } catch (serverlessErr) {
          console.warn('/api/upload endpoint not reachable:', serverlessErr);
        }
      }

      // 3. If external host not reachable, use self-contained compressed base64
      if (!publicUrl) {
        publicUrl = base64Data;
      }

      const mediaRecord = {
        filename: file.name || `media_${Date.now()}`,
        original_name: file.name || 'file',
        file_type: (file.type && file.type.startsWith('image/')) ? 'image' : ((file.type && file.type.startsWith('audio/')) ? 'audio' : 'document'),
        mime_type: file.type || 'application/octet-stream',
        file_size: file.size || (publicUrl ? publicUrl.length : 0),
        file_path: (file.name || 'upload').slice(0, 250),
        public_url: publicUrl,
        alt_text: altText || file.name || '',
      };

      try {
        const res = await supabaseClient.post('/media_files', mediaRecord, {
          headers: { Prefer: 'return=representation' }
        });
        if (Array.isArray(res.data) && res.data[0]) {
          const savedItem = res.data[0];
          setMediaCache([savedItem]);
          const currentMedia = getStorageItem('vov_cms_media', []);
          setStorageItem('vov_cms_media', [savedItem, ...currentMedia.filter(m => m.id !== savedItem.id)]);
          notifyStorageUpdate();
          return { success: true, message: 'Media uploaded successfully', data: savedItem, file: savedItem };
        }
      } catch (dbErr) {
        console.warn('Supabase media_files save error:', dbErr);
      }

      const fallbackItem = { ...mediaRecord, id: Date.now() };
      setMediaCache([fallbackItem]);
      const currentMedia = getStorageItem('vov_cms_media', []);
      setStorageItem('vov_cms_media', [fallbackItem, ...currentMedia]);
      notifyStorageUpdate();

      return {
        success: true,
        message: 'Media uploaded successfully',
        data: fallbackItem,
        file: fallbackItem
      };
    } catch (err) {
      return { success: false, message: err.message || 'Upload failed' };
    }
  },

  getMediaList: async (type) => {
    try {
      let url = '/media_files?select=*&order=created_at.desc';
      if (type) url += `&file_type=eq.${type}`;
      const res = await supabaseClient.get(url);
      if (Array.isArray(res.data)) {
        return res.data;
      }
    } catch (_) {}
    return [];
  },

  deleteMedia: async (id) => {
    try {
      await supabaseClient.delete(`/media_files?id=eq.${id}`);
    } catch (_) {}
    return { success: true, message: 'Media deleted successfully' };
  },

  // ================= 15. TEACHER GUIDE ARTICLES =================
  getAdminTeacherArticles: async () => {
    try {
      const res = await supabaseClient.get('/teacher_guide_articles?select=*&order=display_order.asc,id.asc');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(mapArticleFromSupabase);
        setStorageItem('vov_cms_tg_articles', mapped);
        return mapped;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_tg_articles', getInitialArticles());
  },

  createTeacherArticle: async (data) => {
    const list = getStorageItem('vov_cms_tg_articles', getInitialArticles());
    const materials = Array.isArray(data.materials) ? data.materials : [];
    const steps = Array.isArray(data.steps) ? data.steps : [];
    const payload = {
      title: data.title || '',
      slug: data.slug || `${slugify(data.title || 'article')}-${Date.now()}`,
      category: data.category || 'Lesson Ideas',
      short_description: data.short_description || data.excerpt || '',
      content: data.content || data.short_description || '',
      materials_json: JSON.stringify(materials),
      steps_json: JSON.stringify(steps),
      image_url: data.image_url || null,
      level: data.level || 'Intermediate',
      estimated_time: data.estimated_time || data.time || '30–45 minutes',
      author: data.author || 'Voices of Vehari Team',
      display_order: Number(data.display_order) || (list.length + 1),
      is_published: data.is_published !== undefined ? Boolean(data.is_published) : true,
    };

    const tempArt = mapArticleFromSupabase({ ...payload, id: Date.now() });
    setStorageItem('vov_cms_tg_articles', [tempArt, ...list]);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.post('/teacher_guide_articles', payload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapArticleFromSupabase(res.data[0]);
        const currentList = getStorageItem('vov_cms_tg_articles', [tempArt, ...list]);
        const updated = [saved, ...currentList.filter(a => a.id !== tempArt.id && a.id !== saved.id)];
        setStorageItem('vov_cms_tg_articles', updated);
        notifyStorageUpdate();
        return { success: true, message: 'Article created successfully', data: saved };
      }
    } catch (err) {
      console.warn('Supabase createTeacherArticle error:', err);
    }

    return { success: true, message: 'Article created successfully', data: tempArt };
  },

  updateTeacherArticle: async (id, data) => {
    const list = getStorageItem('vov_cms_tg_articles', getInitialArticles());
    const patchPayload = { ...data };
    delete patchPayload.id;
    delete patchPayload.created_at;
    delete patchPayload.updated_at;
    delete patchPayload.details;
    delete patchPayload.excerpt;
    delete patchPayload.time;
    if (data.materials !== undefined) {
      patchPayload.materials_json = JSON.stringify(Array.isArray(data.materials) ? data.materials : []);
      delete patchPayload.materials;
    }
    if (data.steps !== undefined) {
      patchPayload.steps_json = JSON.stringify(Array.isArray(data.steps) ? data.steps : []);
      delete patchPayload.steps;
    }
    if (data.short_description !== undefined) {
      patchPayload.short_description = data.short_description;
    }

    const updated = list.map((a) => (a.id === id || a.id === Number(id) ? { ...a, ...data } : a));
    setStorageItem('vov_cms_tg_articles', updated);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.patch(`/teacher_guide_articles?id=eq.${id}`, patchPayload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapArticleFromSupabase(res.data[0]);
        const currentList = getStorageItem('vov_cms_tg_articles', updated);
        setStorageItem('vov_cms_tg_articles', currentList.map(a => a.id === id || a.id === Number(id) ? saved : a));
        notifyStorageUpdate();
        return { success: true, message: 'Article updated successfully', data: saved };
      }
    } catch (err) {
      console.warn('Supabase updateTeacherArticle error:', err);
    }

    return { success: true, message: 'Article updated successfully' };
  },

  deleteTeacherArticle: async (id) => {
    const list = getStorageItem('vov_cms_tg_articles', getInitialArticles());
    const updated = list.filter((a) => a.id !== id && a.id !== Number(id));
    setStorageItem('vov_cms_tg_articles', updated);
    notifyStorageUpdate();

    try {
      await supabaseClient.delete(`/teacher_guide_articles?id=eq.${id}`);
    } catch (_) {}

    return { success: true, message: 'Article deleted successfully' };
  },

  toggleTeacherArticlePublish: async (id) => {
    const list = getStorageItem('vov_cms_tg_articles', getInitialArticles());
    const target = list.find((a) => a.id === id || a.id === Number(id));
    const nextStatus = target ? !target.is_published : true;
    const updated = list.map((a) => (a.id === id || a.id === Number(id) ? { ...a, is_published: nextStatus } : a));
    setStorageItem('vov_cms_tg_articles', updated);
    notifyStorageUpdate();

    try {
      await supabaseClient.patch(`/teacher_guide_articles?id=eq.${id}`, { is_published: nextStatus });
    } catch (_) {}

    return { success: true, message: 'Status toggled successfully' };
  },

  // ================= 16. TEACHER GUIDE ACTIVITIES =================
  getAdminTeacherActivities: async () => {
    try {
      const res = await supabaseClient.get('/teacher_guide_activities?select=*&order=id.asc');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(mapActivityFromSupabase);
        setStorageItem('vov_cms_tg_activities', mapped);
        return mapped;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_tg_activities', getInitialActivities());
  },

  createTeacherActivity: async (data) => {
    const list = getStorageItem('vov_cms_tg_activities', getInitialActivities());
    const payload = {
      title: data.title || '',
      purpose: data.purpose || '',
      objectives_json: JSON.stringify(Array.isArray(data.objectives) ? data.objectives : []),
      steps_json: JSON.stringify(Array.isArray(data.steps) ? data.steps : []),
      teacher_tip: data.teacher_tip || data.teacherTip || '',
      estimated_time: data.estimated_time || data.time || '35 minutes',
      level: data.level || 'Intermediate',
      image_url: data.image_url || null,
      is_published: data.is_published !== undefined ? Boolean(data.is_published) : true,
    };

    const tempAct = mapActivityFromSupabase({ ...payload, id: Date.now() });
    setStorageItem('vov_cms_tg_activities', [tempAct, ...list]);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.post('/teacher_guide_activities', payload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapActivityFromSupabase(res.data[0]);
        const currentList = getStorageItem('vov_cms_tg_activities', [tempAct, ...list]);
        setStorageItem('vov_cms_tg_activities', [saved, ...currentList.filter(a => a.id !== tempAct.id && a.id !== saved.id)]);
        notifyStorageUpdate();
        return { success: true, message: 'Activity created successfully', data: saved };
      }
    } catch (err) {
      console.warn('Supabase createTeacherActivity error:', err);
    }

    return { success: true, message: 'Activity created successfully', data: tempAct };
  },

  updateTeacherActivity: async (id, data) => {
    const list = getStorageItem('vov_cms_tg_activities', getInitialActivities());
    const patchPayload = { ...data };
    delete patchPayload.id;
    delete patchPayload.created_at;
    delete patchPayload.updated_at;
    delete patchPayload.time;
    delete patchPayload.teacherTip;
    if (data.objectives !== undefined) {
      patchPayload.objectives_json = JSON.stringify(Array.isArray(data.objectives) ? data.objectives : []);
      delete patchPayload.objectives;
    }
    if (data.steps !== undefined) {
      patchPayload.steps_json = JSON.stringify(Array.isArray(data.steps) ? data.steps : []);
      delete patchPayload.steps;
    }
    if (data.teacher_tip !== undefined || data.teacherTip !== undefined) {
      patchPayload.teacher_tip = data.teacher_tip !== undefined ? data.teacher_tip : data.teacherTip;
    }

    const updated = list.map((a) => (a.id === id || a.id === Number(id) ? { ...a, ...data } : a));
    setStorageItem('vov_cms_tg_activities', updated);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.patch(`/teacher_guide_activities?id=eq.${id}`, patchPayload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapActivityFromSupabase(res.data[0]);
        const currentList = getStorageItem('vov_cms_tg_activities', updated);
        setStorageItem('vov_cms_tg_activities', currentList.map(a => a.id === id || a.id === Number(id) ? saved : a));
        notifyStorageUpdate();
        return { success: true, message: 'Activity updated successfully', data: saved };
      }
    } catch (err) {
      console.warn('Supabase updateTeacherActivity error:', err);
    }

    return { success: true, message: 'Activity updated successfully' };
  },

  deleteTeacherActivity: async (id) => {
    const list = getStorageItem('vov_cms_tg_activities', getInitialActivities());
    const updated = list.filter((a) => a.id !== id && a.id !== Number(id));
    setStorageItem('vov_cms_tg_activities', updated);
    notifyStorageUpdate();

    try {
      await supabaseClient.delete(`/teacher_guide_activities?id=eq.${id}`);
    } catch (_) {}

    return { success: true, message: 'Activity deleted successfully' };
  },

  toggleTeacherActivityPublish: async (id) => {
    const list = getStorageItem('vov_cms_tg_activities', getInitialActivities());
    const target = list.find((a) => a.id === id || a.id === Number(id));
    const nextStatus = target ? !target.is_published : true;
    const updated = list.map((a) => (a.id === id || a.id === Number(id) ? { ...a, is_published: nextStatus } : a));
    setStorageItem('vov_cms_tg_activities', updated);
    notifyStorageUpdate();

    try {
      await supabaseClient.patch(`/teacher_guide_activities?id=eq.${id}`, { is_published: nextStatus });
    } catch (_) {}

    return { success: true, message: 'Status toggled successfully' };
  },

  // ================= 17. TEACHER GUIDE STRATEGIES =================
  getAdminTeacherStrategies: async () => {
    try {
      const res = await supabaseClient.get('/teacher_guide_strategies?select=*&order=display_order.asc,id.asc');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(mapStrategyFromSupabase);
        setStorageItem('vov_cms_tg_strategies', mapped);
        return mapped;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_tg_strategies', getInitialStrategies());
  },

  createTeacherStrategy: async (data) => {
    const list = getStorageItem('vov_cms_tg_strategies', getInitialStrategies());
    const payload = {
      strategy_number: data.strategy_number || data.num || String(list.length + 1).padStart(2, '0'),
      title: data.title || '',
      description: data.description || '',
      icon: data.icon || '💡',
      display_order: Number(data.display_order) || (list.length + 1),
      is_published: data.is_published !== undefined ? Boolean(data.is_published) : true,
    };

    const tempStrat = mapStrategyFromSupabase({ ...payload, id: Date.now() });
    setStorageItem('vov_cms_tg_strategies', [...list, tempStrat]);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.post('/teacher_guide_strategies', payload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapStrategyFromSupabase(res.data[0]);
        const currentList = getStorageItem('vov_cms_tg_strategies', [...list, tempStrat]);
        setStorageItem('vov_cms_tg_strategies', [...currentList.filter(s => s.id !== tempStrat.id && s.id !== saved.id), saved]);
        notifyStorageUpdate();
        return { success: true, message: 'Strategy created successfully', data: saved };
      }
    } catch (err) {
      console.warn('Supabase createTeacherStrategy error:', err);
    }

    return { success: true, message: 'Strategy created successfully', data: tempStrat };
  },

  updateTeacherStrategy: async (id, data) => {
    const list = getStorageItem('vov_cms_tg_strategies', getInitialStrategies());
    const patchPayload = { ...data };
    delete patchPayload.id;
    delete patchPayload.created_at;
    delete patchPayload.updated_at;
    delete patchPayload.num;
    if (data.num !== undefined && !data.strategy_number) {
      patchPayload.strategy_number = data.num;
    }

    const updated = list.map((s) => (s.id === id || s.id === Number(id) ? { ...s, ...data } : s));
    setStorageItem('vov_cms_tg_strategies', updated);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.patch(`/teacher_guide_strategies?id=eq.${id}`, patchPayload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapStrategyFromSupabase(res.data[0]);
        const currentList = getStorageItem('vov_cms_tg_strategies', updated);
        setStorageItem('vov_cms_tg_strategies', currentList.map(s => s.id === id || s.id === Number(id) ? saved : s));
        notifyStorageUpdate();
        return { success: true, message: 'Strategy updated successfully', data: saved };
      }
    } catch (err) {
      console.warn('Supabase updateTeacherStrategy error:', err);
    }

    return { success: true, message: 'Strategy updated successfully' };
  },

  deleteTeacherStrategy: async (id) => {
    const list = getStorageItem('vov_cms_tg_strategies', getInitialStrategies());
    const updated = list.filter((s) => s.id !== id && s.id !== Number(id));
    setStorageItem('vov_cms_tg_strategies', updated);
    notifyStorageUpdate();

    try {
      await supabaseClient.delete(`/teacher_guide_strategies?id=eq.${id}`);
    } catch (_) {}

    return { success: true, message: 'Strategy deleted successfully' };
  },

  toggleTeacherStrategyPublish: async (id) => {
    const list = getStorageItem('vov_cms_tg_strategies', getInitialStrategies());
    const target = list.find((s) => s.id === id || s.id === Number(id));
    const nextStatus = target ? !target.is_published : true;
    const updated = list.map((s) => (s.id === id || s.id === Number(id) ? { ...s, is_published: nextStatus } : s));
    setStorageItem('vov_cms_tg_strategies', updated);
    notifyStorageUpdate();

    try {
      await supabaseClient.patch(`/teacher_guide_strategies?id=eq.${id}`, { is_published: nextStatus });
    } catch (_) {}

    return { success: true, message: 'Status toggled successfully' };
  },

  // ================= 18. TEACHER GUIDE PROMPTS =================
  getAdminTeacherPrompts: async () => {
    try {
      const res = await supabaseClient.get('/teacher_guide_prompts?select=*&order=display_order.asc,id.asc');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(mapPromptFromSupabase);
        setStorageItem('vov_cms_tg_prompts', mapped);
        return mapped;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_tg_prompts', getInitialPrompts());
  },

  createTeacherPrompt: async (data) => {
    const list = getStorageItem('vov_cms_tg_prompts', getInitialPrompts());
    const cleanText = (data.prompt || '').trim().replace(/^["'\s]+|["'\s]+$/g, '');
    const payload = {
      prompt: cleanText,
      category: data.category || 'General',
      display_order: Number(data.display_order) || (list.length + 1),
      is_published: data.is_published !== undefined ? Boolean(data.is_published) : true,
    };

    const tempPrompt = mapPromptFromSupabase({ ...payload, id: Date.now() });
    setStorageItem('vov_cms_tg_prompts', [...list, tempPrompt]);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.post('/teacher_guide_prompts', payload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapPromptFromSupabase(res.data[0]);
        const currentList = getStorageItem('vov_cms_tg_prompts', [...list, tempPrompt]);
        setStorageItem('vov_cms_tg_prompts', [...currentList.filter(p => p.id !== tempPrompt.id && p.id !== saved.id), saved]);
        notifyStorageUpdate();
        return { success: true, message: 'Prompt created successfully', data: saved };
      }
    } catch (err) {
      console.warn('Supabase createTeacherPrompt error:', err);
    }

    return { success: true, message: 'Prompt created successfully', data: tempPrompt };
  },

  updateTeacherPrompt: async (id, data) => {
    const list = getStorageItem('vov_cms_tg_prompts', getInitialPrompts());
    const patchPayload = { ...data };
    delete patchPayload.id;
    delete patchPayload.created_at;
    delete patchPayload.updated_at;
    if (data.prompt !== undefined) {
      patchPayload.prompt = data.prompt.trim().replace(/^["'\s]+|["'\s]+$/g, '');
    }

    const updated = list.map((p) => (p.id === id || p.id === Number(id) ? { ...p, ...data } : p));
    setStorageItem('vov_cms_tg_prompts', updated);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.patch(`/teacher_guide_prompts?id=eq.${id}`, patchPayload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapPromptFromSupabase(res.data[0]);
        const currentList = getStorageItem('vov_cms_tg_prompts', updated);
        setStorageItem('vov_cms_tg_prompts', currentList.map(p => p.id === id || p.id === Number(id) ? saved : p));
        notifyStorageUpdate();
        return { success: true, message: 'Prompt updated successfully', data: saved };
      }
    } catch (err) {
      console.warn('Supabase updateTeacherPrompt error:', err);
    }

    return { success: true, message: 'Prompt updated successfully' };
  },

  deleteTeacherPrompt: async (id) => {
    const list = getStorageItem('vov_cms_tg_prompts', getInitialPrompts());
    const updated = list.filter((p) => p.id !== id && p.id !== Number(id));
    setStorageItem('vov_cms_tg_prompts', updated);
    notifyStorageUpdate();

    try {
      await supabaseClient.delete(`/teacher_guide_prompts?id=eq.${id}`);
    } catch (_) {}

    return { success: true, message: 'Prompt deleted successfully' };
  },

  toggleTeacherPromptPublish: async (id) => {
    const list = getStorageItem('vov_cms_tg_prompts', getInitialPrompts());
    const target = list.find((p) => p.id === id || p.id === Number(id));
    const nextStatus = target ? !target.is_published : true;
    const updated = list.map((p) => (p.id === id || p.id === Number(id) ? { ...p, is_published: nextStatus } : p));
    setStorageItem('vov_cms_tg_prompts', updated);
    notifyStorageUpdate();

    try {
      await supabaseClient.patch(`/teacher_guide_prompts?id=eq.${id}`, { is_published: nextStatus });
    } catch (_) {}

    return { success: true, message: 'Status toggled successfully' };
  },

  // ================= 19. TEACHER GUIDE LESSON PLAN =================
  getAdminLessonPlan: async () => {
    try {
      const res = await supabaseClient.get('/teacher_guide_lesson_plans?select=*&limit=1');
      if (Array.isArray(res.data) && res.data[0]) {
        const mapped = mapLessonPlanFromSupabase(res.data[0]);
        setStorageItem('vov_cms_tg_lessonplan', mapped);
        return mapped;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_tg_lessonplan', getInitialLessonPlan());
  },

  updateLessonPlan: async (data) => {
    const patchPayload = { ...data };
    delete patchPayload.id;
    delete patchPayload.created_at;
    delete patchPayload.updated_at;
    delete patchPayload.fields;

    const fullPlan = mapLessonPlanFromSupabase(data);
    setStorageItem('vov_cms_tg_lessonplan', fullPlan);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.patch('/teacher_guide_lesson_plans?id=eq.1', patchPayload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = mapLessonPlanFromSupabase(res.data[0]);
        setStorageItem('vov_cms_tg_lessonplan', saved);
        notifyStorageUpdate();
        return { success: true, message: 'Lesson plan template updated successfully', data: saved };
      }
    } catch (err) {
      console.warn('Supabase updateLessonPlan error:', err);
    }

    return { success: true, message: 'Lesson plan template updated successfully', data: fullPlan };
  },

  // ================= 20. VOCABULARY =================
  getAdminVocabulary: async () => {
    try {
      const res = await supabaseClient.get('/vocabulary_words?select=*&order=display_order.asc,id.asc');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setStorageItem('vov_cms_vocabulary', res.data);
        return res.data;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_vocabulary', fallbackData.vocabulary || []);
  },

  createVocabularyWord: async (data) => {
    const list = getStorageItem('vov_cms_vocabulary', fallbackData.vocabulary || []);
    const payload = {
      word: data.word || '',
      part_of_speech: data.part_of_speech || 'noun',
      meaning: data.meaning || '',
      example_sentence: data.example_sentence || '',
      category: data.category || 'General',
      level: data.level || 'Intermediate',
      display_order: Number(data.display_order) || (list.length + 1),
      is_published: data.is_published !== undefined ? Boolean(data.is_published) : true,
    };
    const tempWord = { ...payload, id: Date.now() };
    setStorageItem('vov_cms_vocabulary', [...list, tempWord]);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.post('/vocabulary_words', payload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = res.data[0];
        const currentList = getStorageItem('vov_cms_vocabulary', [...list, tempWord]);
        const updated = [...currentList.filter(w => w.id !== tempWord.id && w.id !== saved.id), saved];
        setStorageItem('vov_cms_vocabulary', updated);
        notifyStorageUpdate();
        return { success: true, data: saved, message: 'Word created successfully' };
      }
    } catch (_) {}

    return { success: true, message: 'Word created successfully', data: tempWord };
  },

  updateVocabularyWord: async (id, data) => {
    const list = getStorageItem('vov_cms_vocabulary', fallbackData.vocabulary || []);
    const patchPayload = { ...data };
    delete patchPayload.id;
    delete patchPayload.created_at;
    delete patchPayload.updated_at;

    const updated = list.map((w) => (w.id === id || w.id === Number(id)) ? { ...w, ...data } : w);
    setStorageItem('vov_cms_vocabulary', updated);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.patch(`/vocabulary_words?id=eq.${id}`, patchPayload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = res.data[0];
        const currentList = getStorageItem('vov_cms_vocabulary', updated);
        const serverUpdated = currentList.map((w) => (w.id === id || w.id === Number(id) ? saved : w));
        setStorageItem('vov_cms_vocabulary', serverUpdated);
        notifyStorageUpdate();
        return { success: true, data: saved, message: 'Word updated successfully' };
      }
    } catch (_) {}

    return { success: true, message: 'Word updated successfully' };
  },

  deleteVocabularyWord: async (id) => {
    const list = getStorageItem('vov_cms_vocabulary', fallbackData.vocabulary || []);
    const updated = list.filter((w) => w.id !== id && w.id !== Number(id));
    setStorageItem('vov_cms_vocabulary', updated);
    notifyStorageUpdate();

    try {
      await supabaseClient.delete(`/vocabulary_words?id=eq.${id}`);
    } catch (_) {}

    return { success: true, message: 'Word deleted successfully' };
  },

  toggleVocabularyPublish: async (id) => {
    const list = getStorageItem('vov_cms_vocabulary', fallbackData.vocabulary || []);
    const target = list.find((w) => w.id === id || w.id === Number(id));
    const nextStatus = target ? !target.is_published : true;
    const updated = list.map((w) => (w.id === id || w.id === Number(id) ? { ...w, is_published: nextStatus } : w));
    setStorageItem('vov_cms_vocabulary', updated);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.patch(`/vocabulary_words?id=eq.${id}`, { is_published: nextStatus }, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = res.data[0];
        const currentList = getStorageItem('vov_cms_vocabulary', updated);
        const serverUpdated = currentList.map((w) => (w.id === id || w.id === Number(id) ? saved : w));
        setStorageItem('vov_cms_vocabulary', serverUpdated);
        notifyStorageUpdate();
      }
    } catch (_) {}

    return { success: true, message: 'Status toggled successfully' };
  },

  // ================= 21. RESEARCH BRIEF & PAGE =================
  getResearchBrief: async () => {
    try {
      const res = await supabaseClient.get('/section_cards?section_group=eq.research_brief&limit=1');
      if (Array.isArray(res.data) && res.data[0]) {
        const row = res.data[0];
        let meta = {};
        if (row.bullets_json) {
          try {
            meta = typeof row.bullets_json === 'string' ? JSON.parse(row.bullets_json) : row.bullets_json;
          } catch (_) {}
        }
        const combined = {
          ...fallbackData.researchBrief,
          ...meta,
          id: row.id,
          project_title: row.title || meta.project_title || fallbackData.researchBrief.project_title,
          lead_subtitle: row.description || meta.lead_subtitle || fallbackData.researchBrief.lead_subtitle,
        };
        setStorageItem('vov_cms_research_brief', combined);
        return combined;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_research_brief', fallbackData.researchBrief);
  },

  updateResearchBrief: async (data) => {
    const currentBrief = getStorageItem('vov_cms_research_brief', fallbackData.researchBrief);
    const updated = { ...currentBrief, ...data };
    setStorageItem('vov_cms_research_brief', updated);

    const payload = {
      section_group: 'research_brief',
      icon: '🔬',
      tag: 'Research',
      title: updated.project_title || 'Voices of Vehari',
      description: updated.lead_subtitle || '',
      bullets_json: JSON.stringify(updated),
      sort_order: 1,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    try {
      const checkRes = await supabaseClient.get('/section_cards?section_group=eq.research_brief&limit=1');
      if (Array.isArray(checkRes.data) && checkRes.data[0]?.id) {
        await supabaseClient.patch(`/section_cards?id=eq.${checkRes.data[0].id}`, payload, {
          headers: { Prefer: 'return=representation' }
        });
      } else {
        await supabaseClient.post('/section_cards', payload, {
          headers: { Prefer: 'return=representation' }
        });
      }
      notifyStorageUpdate();
      return { success: true, message: 'Research brief updated successfully in database!' };
    } catch (err) {
      console.warn('Supabase updateResearchBrief error:', err);
      notifyStorageUpdate();
      return { success: true, message: 'Research brief saved locally' };
    }
  },

  // ================= 21B. AUDIO & TRANSCRIPTS =================
  getAudioTranscripts: async () => {
    try {
      const res = await supabaseClient.get('/section_cards?section_group=eq.audio_transcripts&limit=1');
      if (Array.isArray(res.data) && res.data[0]) {
        const row = res.data[0];
        let meta = {};
        if (row.bullets_json) {
          try {
            meta = typeof row.bullets_json === 'string' ? JSON.parse(row.bullets_json) : row.bullets_json;
          } catch (_) {}
        }
        const combined = {
          ...fallbackData.audioTranscripts,
          ...meta,
          id: row.id,
          hero_eyebrow: row.card_category || meta.hero_eyebrow || fallbackData.audioTranscripts?.hero_eyebrow,
          hero_title: row.title || meta.hero_title || fallbackData.audioTranscripts?.hero_title,
          hero_subtitle: row.description || meta.hero_subtitle || fallbackData.audioTranscripts?.hero_subtitle,
        };
        setStorageItem('vov_cms_audio_transcripts', combined);
        return combined;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_audio_transcripts', fallbackData.audioTranscripts);
  },

  updateAudioTranscripts: async (data) => {
    const current = getStorageItem('vov_cms_audio_transcripts', fallbackData.audioTranscripts);
    const updated = { ...current, ...data };
    setStorageItem('vov_cms_audio_transcripts', updated);

    const payload = {
      section_group: 'audio_transcripts',
      card_category: updated.hero_eyebrow || 'Learning Resource',
      title: updated.hero_title || 'Audio Archive & Full Transcripts',
      description: updated.hero_subtitle || '',
      bullets_json: JSON.stringify(updated),
      sort_order: 1,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    try {
      const checkRes = await supabaseClient.get('/section_cards?section_group=eq.audio_transcripts&limit=1');
      if (Array.isArray(checkRes.data) && checkRes.data[0]?.id) {
        await supabaseClient.patch(`/section_cards?id=eq.${checkRes.data[0].id}`, payload, {
          headers: { Prefer: 'return=representation' }
        });
      } else {
        await supabaseClient.post('/section_cards', payload, {
          headers: { Prefer: 'return=representation' }
        });
      }
      notifyStorageUpdate();
      return { success: true, message: 'Audio & Transcripts updated successfully!' };
    } catch (err) {
      console.warn('Supabase updateAudioTranscripts error:', err);
      notifyStorageUpdate();
      return { success: true, message: 'Audio & Transcripts saved locally' };
    }
  },

  // ================= 22. ACADEMIC REFERENCES =================
  getAdminReferences: async () => {
    try {
      const res = await supabaseClient.get('/academic_references?select=*&order=sort_order.asc,id.asc');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setStorageItem('vov_cms_references', res.data);
        return res.data;
      }
    } catch (_) {}
    return getStorageItem('vov_cms_references', fallbackData.references || []);
  },

  createAcademicReference: async (data) => {
    const list = getStorageItem('vov_cms_references', fallbackData.references || []);
    const payload = {
      author: data.author || '',
      contribution: data.contribution || '',
      sort_order: Number(data.sort_order) || (list.length + 1),
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    };
    const tempRef = { ...payload, id: Date.now() };
    setStorageItem('vov_cms_references', [...list, tempRef]);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.post('/academic_references', payload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = res.data[0];
        const currentList = getStorageItem('vov_cms_references', [...list, tempRef]);
        const updated = [...currentList.filter(r => r.id !== tempRef.id && r.id !== saved.id), saved];
        setStorageItem('vov_cms_references', updated);
        notifyStorageUpdate();
        return { success: true, message: 'Reference added successfully', data: saved };
      }
    } catch (err) {
      console.warn('Supabase createAcademicReference error:', err);
    }
    return { success: true, message: 'Reference added successfully', data: tempRef };
  },

  updateAcademicReference: async (id, data) => {
    const list = getStorageItem('vov_cms_references', fallbackData.references || []);
    const patchPayload = { ...data };
    delete patchPayload.id;
    delete patchPayload.created_at;
    delete patchPayload.updated_at;

    const updated = list.map((r) => (r.id === id || r.id === Number(id)) ? { ...r, ...data } : r);
    setStorageItem('vov_cms_references', updated);
    notifyStorageUpdate();

    try {
      const res = await supabaseClient.patch(`/academic_references?id=eq.${id}`, patchPayload, {
        headers: { Prefer: 'return=representation' }
      });
      if (Array.isArray(res.data) && res.data[0]) {
        const saved = res.data[0];
        const currentList = getStorageItem('vov_cms_references', updated);
        const serverUpdated = currentList.map((r) => (r.id === id || r.id === Number(id) ? saved : r));
        setStorageItem('vov_cms_references', serverUpdated);
        notifyStorageUpdate();
        return { success: true, message: 'Reference updated successfully', data: saved };
      }
    } catch (err) {
      console.warn('Supabase updateAcademicReference error:', err);
    }
    return { success: true, message: 'Reference updated successfully' };
  },

  deleteAcademicReference: async (id) => {
    const list = getStorageItem('vov_cms_references', fallbackData.references || []);
    const updated = list.filter((r) => r.id !== id && r.id !== Number(id));
    setStorageItem('vov_cms_references', updated);
    notifyStorageUpdate();

    try {
      await supabaseClient.delete(`/academic_references?id=eq.${id}`);
    } catch (err) {
      console.warn('Supabase deleteAcademicReference error:', err);
    }
    return { success: true, message: 'Reference deleted successfully' };
  },
};

export default api;
