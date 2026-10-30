import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';

import OnboardingPage from './pages/OnboardingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegisterStep2Page from './pages/RegisterStep2Page';
import HomePage from './pages/HomePage';
import NatalChartPage from './pages/NatalChartPage';
import MatchPage from './pages/MatchPage';
import ChatListPage from './pages/ChatListPage';
import ChatRoomPage from './pages/ChatRoomPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import PredictionPage from './pages/PredictionPage';

// Lazy-loaded new feature pages
const SynastryPage = lazy(() => import('./pages/SynastryPage'));
const TransitPage = lazy(() => import('./pages/TransitPage'));
const TarotPage = lazy(() => import('./pages/TarotPage'));
const GlossaryPage = lazy(() => import('./pages/GlossaryPage'));
const CosmicJournalPage = lazy(() => import('./pages/CosmicJournalPage'));

const PageFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="cosmic-spinner" />
  </div>
);

export default function App() {
  useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/onboarding" replace />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/step2" element={<RegisterStep2Page />} />
      <Route path="/register-step2" element={<RegisterStep2Page />} />

      {/* Protected routes wrapped in MainLayout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<HomePage />} />
        <Route path="/natal" element={<NatalChartPage />} />
        <Route path="/match" element={<MatchPage />} />
        <Route path="/chat" element={<ChatListPage />} />
        <Route path="/chat/:chatId" element={<ChatRoomPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/user/:userId" element={<UserProfilePage />} />
        <Route path="/prediction" element={<PredictionPage />} />

        {/* ✨ New feature routes */}
        <Route path="/synastry" element={<Suspense fallback={<PageFallback />}><SynastryPage /></Suspense>} />
        <Route path="/transit" element={<Suspense fallback={<PageFallback />}><TransitPage /></Suspense>} />
        <Route path="/tarot" element={<Suspense fallback={<PageFallback />}><TarotPage /></Suspense>} />
        <Route path="/glossary" element={<Suspense fallback={<PageFallback />}><GlossaryPage /></Suspense>} />
        <Route path="/journal" element={<Suspense fallback={<PageFallback />}><CosmicJournalPage /></Suspense>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
