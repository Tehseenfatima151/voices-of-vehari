import axios from 'axios';

// Base API URL from Vite environment variable or proxy fallback
const API_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vov_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 token expiry gracefully
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on an admin route, remove stored token
      if (window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('vov_admin_token');
        localStorage.removeItem('vov_admin_user');
        window.location.href = '/admin/login?session=expired';
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // ================= PUBLIC ENDPOINTS =================
  getPublicAll: async () => {
    const res = await apiClient.get('/api/public/all');
    return res.data.data;
  },

  getPublicPodcasts: async (params) => {
    const res = await apiClient.get('/api/public/podcasts', { params });
    return res.data.data;
  },

  getPublicStories: async () => {
    const res = await apiClient.get('/api/public/stories');
    return res.data.data;
  },

  getPublicGallery: async () => {
    const res = await apiClient.get('/api/public/gallery');
    return res.data.data;
  },

  getPublicTeam: async () => {
    const res = await apiClient.get('/api/public/team');
    return res.data.data;
  },

  submitContact: async (data) => {
    const res = await apiClient.post('/api/public/contact', data);
    return res.data;
  },

  // ================= AUTH ENDPOINTS =================
  login: async (credentials) => {
    const res = await apiClient.post('/api/auth/login', credentials);
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get('/api/auth/me');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await apiClient.put('/api/auth/profile', data);
    return res.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (_) {}
    localStorage.removeItem('vov_admin_token');
    localStorage.removeItem('vov_admin_user');
  },

  // ================= ADMIN CMS ENDPOINTS =================
  getDashboardStats: async () => {
    const res = await apiClient.get('/api/admin/dashboard/stats');
    return res.data.data;
  },

  getSettings: async () => {
    const res = await apiClient.get('/api/admin/settings');
    return res.data.data;
  },

  updateSettings: async (data) => {
    const res = await apiClient.put('/api/admin/settings', data);
    return res.data;
  },

  getHero: async () => {
    const res = await apiClient.get('/api/admin/hero');
    return res.data.data;
  },

  updateHero: async (data) => {
    const res = await apiClient.put('/api/admin/hero', data);
    return res.data;
  },

  // Podcasts
  getAdminPodcasts: async () => {
    const res = await apiClient.get('/api/admin/podcasts');
    return res.data.data;
  },

  createPodcast: async (data) => {
    const res = await apiClient.post('/api/admin/podcasts', data);
    return res.data;
  },

  updatePodcast: async (id, data) => {
    const res = await apiClient.put(`/api/admin/podcasts/${id}`, data);
    return res.data;
  },

  deletePodcast: async (id) => {
    const res = await apiClient.delete(`/api/admin/podcasts/${id}`);
    return res.data;
  },

  togglePodcastPublish: async (id) => {
    const res = await apiClient.patch(`/api/admin/podcasts/${id}/toggle-publish`);
    return res.data;
  },

  // Stories
  getAdminStories: async () => {
    const res = await apiClient.get('/api/admin/stories');
    return res.data.data;
  },

  createStory: async (data) => {
    const res = await apiClient.post('/api/admin/stories', data);
    return res.data;
  },

  updateStory: async (id, data) => {
    const res = await apiClient.put(`/api/admin/stories/${id}`, data);
    return res.data;
  },

  deleteStory: async (id) => {
    const res = await apiClient.delete(`/api/admin/stories/${id}`);
    return res.data;
  },

  toggleStoryPublish: async (id) => {
    const res = await apiClient.patch(`/api/admin/stories/${id}/toggle-publish`);
    return res.data;
  },

  // Gallery
  getAdminGallery: async () => {
    const res = await apiClient.get('/api/admin/gallery');
    return res.data.data;
  },

  createGalleryItem: async (data) => {
    const res = await apiClient.post('/api/admin/gallery', data);
    return res.data;
  },

  updateGalleryItem: async (id, data) => {
    const res = await apiClient.put(`/api/admin/gallery/${id}`, data);
    return res.data;
  },

  deleteGalleryItem: async (id) => {
    const res = await apiClient.delete(`/api/admin/gallery/${id}`);
    return res.data;
  },

  // Team
  getAdminTeam: async () => {
    const res = await apiClient.get('/api/admin/team');
    return res.data.data;
  },

  createTeamMember: async (data) => {
    const res = await apiClient.post('/api/admin/team', data);
    return res.data;
  },

  updateTeamMember: async (id, data) => {
    const res = await apiClient.put(`/api/admin/team/${id}`, data);
    return res.data;
  },

  deleteTeamMember: async (id) => {
    const res = await apiClient.delete(`/api/admin/team/${id}`);
    return res.data;
  },

  // Section Cards
  getAdminCards: async (group) => {
    const res = await apiClient.get('/api/admin/cards', { params: { group } });
    return res.data.data;
  },

  createCard: async (data) => {
    const res = await apiClient.post('/api/admin/cards', data);
    return res.data;
  },

  updateCard: async (id, data) => {
    const res = await apiClient.put(`/api/admin/cards/${id}`, data);
    return res.data;
  },

  deleteCard: async (id) => {
    const res = await apiClient.delete(`/api/admin/cards/${id}`);
    return res.data;
  },

  // Statistics
  getAdminStatistics: async () => {
    const res = await apiClient.get('/api/admin/statistics');
    return res.data.data;
  },

  createStatistic: async (data) => {
    const res = await apiClient.post('/api/admin/statistics', data);
    return res.data;
  },

  updateStatistic: async (id, data) => {
    const res = await apiClient.put(`/api/admin/statistics/${id}`, data);
    return res.data;
  },

  deleteStatistic: async (id) => {
    const res = await apiClient.delete(`/api/admin/statistics/${id}`);
    return res.data;
  },

  // Timeline
  getAdminTimeline: async () => {
    const res = await apiClient.get('/api/admin/timeline');
    return res.data.data;
  },

  updateTimeline: async (id, data) => {
    const res = await apiClient.put(`/api/admin/timeline/${id}`, data);
    return res.data;
  },

  // Submissions
  getAdminSubmissions: async () => {
    const res = await apiClient.get('/api/admin/submissions');
    return res.data.data;
  },

  updateSubmissionStatus: async (id, status) => {
    const res = await apiClient.patch(`/api/admin/submissions/${id}/status`, { status });
    return res.data;
  },

  deleteSubmission: async (id) => {
    const res = await apiClient.delete(`/api/admin/submissions/${id}`);
    return res.data;
  },

  // Media
  uploadMedia: async (file, altText = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt_text', altText);

    const res = await apiClient.post('/api/admin/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  getMediaList: async (type) => {
    const res = await apiClient.get('/api/admin/media/', { params: { type } });
    return res.data.data;
  },

  deleteMedia: async (id) => {
    const res = await apiClient.delete(`/api/admin/media/${id}`);
    return res.data;
  },
};

export default api;
