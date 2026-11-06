import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import StarField from './StarField';
import ErrorBoundary from './ErrorBoundary';
import AstroBot from './AstroBot';

// @ts-ignore
import bgImage from '../assets/astrogpt/bg1.jpg';

export default function MainLayout() {
  const [botOpen, setBotOpen] = useState(false);
  const toggleBot = useCallback(() => setBotOpen((o) => !o), []);

  return (
    <div
      className="min-h-screen text-slate-100 relative flex flex-col justify-between"
      style={{
        background: '#0b0616',
      }}
    >
      {/* Hình nền vũ trụ ngân hà AstroGPT */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          opacity: 0.38,
        }}
        aria-hidden
      />

      {/* Hiệu ứng gradient mờ tím huyền bí */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 10%, rgba(109, 30, 166, 0.4) 0%, rgba(11, 6, 22, 0.85) 60%)',
        }}
        aria-hidden
      />

      <StarField count={60} />

      {/* Top Navbar ngang chuẩn AstroGPT */}
      <Navbar onOpenBot={toggleBot} botOpen={botOpen} />

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Footer AstroGPT */}
      <Footer />

      {/* Floating AstroBot Pop-up Button (Bottom Right) */}
      <button
        onClick={toggleBot}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110"
        style={{
          background: botOpen
            ? 'linear-gradient(135deg, #7c3aed, #db2777)'
            : 'linear-gradient(135deg, rgba(147, 51, 234, 0.9), rgba(219, 39, 119, 0.8))',
          border: '2px solid rgba(216, 180, 254, 0.6)',
          boxShadow: '0 0 25px rgba(168, 85, 247, 0.6)',
        }}
        aria-label="AstroBot AI"
        title="Trò chuyện với AstroBot"
      >
        {botOpen ? (
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <span className="text-2xl">🔮</span>
        )}
      </button>

      {/* AstroBot Chat Panel */}
      {botOpen && <AstroBot onClose={() => setBotOpen(false)} />}
    </div>
  );
}
