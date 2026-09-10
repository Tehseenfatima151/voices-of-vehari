import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PublicWebsite from './pages/PublicWebsite';
import AdminLogin from './admin/AdminLogin';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import HeroManager from './admin/HeroManager';
import PodcastsManager from './admin/PodcastsManager';
import StoriesManager from './admin/StoriesManager';
import GalleryManager from './admin/GalleryManager';
import TeamManager from './admin/TeamManager';
import CardsManager from './admin/CardsManager';
import StatsManager from './admin/StatsManager';
import TimelineManager from './admin/TimelineManager';
import SubmissionsManager from './admin/SubmissionsManager';
import MediaLibrary from './admin/MediaLibrary';
import SettingsManager from './admin/SettingsManager';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f1f5f9' }}>
        <p style={{ color: 'var(--navy)', fontWeight: 700 }}>Verifying administrator session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <Routes>
      {/* Public Voices of Vehari Website */}
      <Route path="/" element={<PublicWebsite />} />

      {/* Admin Authentication */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Protected Admin CMS Panel */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="hero" element={<HeroManager />} />
        <Route path="podcasts" element={<PodcastsManager />} />
        <Route path="stories" element={<StoriesManager />} />
        <Route path="gallery" element={<GalleryManager />} />
        <Route path="team" element={<TeamManager />} />
        <Route path="cards" element={<CardsManager />} />
        <Route path="stats" element={<StatsManager />} />
        <Route path="timeline" element={<TimelineManager />} />
        <Route path="submissions" element={<SubmissionsManager />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="settings" element={<SettingsManager />} />
      </Route>

      {/* Fallback to homepage */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
