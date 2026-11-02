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

import SynastryPage from './pages/SynastryPage';
import TransitPage from './pages/TransitPage';
import TarotPage from './pages/TarotPage';
import GlossaryPage from './pages/GlossaryPage';
import CosmicJournalPage from './pages/CosmicJournalPage';

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

        {/* Feature routes */}
        <Route path="/synastry" element={<SynastryPage />} />
        <Route path="/transit" element={<TransitPage />} />
        <Route path="/tarot" element={<TarotPage />} />
        <Route path="/glossary" element={<GlossaryPage />} />
        <Route path="/journal" element={<CosmicJournalPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
