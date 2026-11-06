import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import StarField from './StarField';
import ErrorBoundary from './ErrorBoundary';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen text-slate-100" style={{ background: 'radial-gradient(ellipse at 50% 20%, #110a24 0%, #07050d 75%)' }}>
      <StarField count={50} />
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile top bar — hidden on md+ (sidebar always visible) */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 py-2.5"
        style={{
          background: 'rgba(9, 7, 18, 0.92)',
          borderBottom: '1px solid rgba(168, 85, 247, 0.12)',
          backdropFilter: 'blur(20px)',
        }}>
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-purple-300 hover:text-white hover:bg-white/[0.06] transition-all"
          aria-label="Mở menu điều hướng"
          aria-expanded={sidebarOpen}
          aria-controls="sidebar-nav"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.2))', border: '1px solid rgba(168,85,247,0.4)' }}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="w-3 h-3 text-purple-300" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07 19.07 4.93" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-white uppercase tracking-widest">Resonancia</span>
        </div>
      </header>

      <main className="md:ml-64 min-h-screen relative z-10">
        {/* Offset for mobile top bar height */}
        <div className="pt-16 md:pt-0 max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
