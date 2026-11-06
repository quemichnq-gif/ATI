import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// @ts-ignore
import logoImg from '../assets/astrogpt/Logo.png';

interface NavbarProps {
  onOpenBot: () => void;
  botOpen: boolean;
}

export default function Navbar({ onOpenBot, botOpen }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const profile = useSelector((s: RootState) => s.profile);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const displayName = profile.name?.trim() || (profile.email ? profile.email.split('@')[0] : 'Người dùng');

  const navLinks = [
    { to: '/home', label: 'Trang Chủ' },
    { to: '/natal', label: 'Bản Đồ Sao' },
    { to: '/match', label: 'Ghép Đôi' },
    { to: '/chat', label: 'Trò Chuyện' },
    { to: '/tarot', label: 'Tarot' },
    { to: '/synastry', label: 'Bản Đồ Đôi' },
    { to: '/transit', label: 'Vận Hạn' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-purple-800/30">
      <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* 1. Brand Logo (Bên trái) */}
        <Link to="/home" className="flex items-center gap-3 flex-shrink-0 group">
          <img
            src={logoImg}
            alt="Resonancia Logo"
            className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.7)] group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-300 to-purple-300 font-serif leading-none">
              RESONANCIA
            </span>
            <span className="text-[9px] text-purple-400/80 uppercase tracking-[0.25em] font-mono mt-0.5">
              ASTROLOGY MATCH
            </span>
          </div>
        </Link>

        {/* 2. Desktop Navigation Links (Ở giữa - Căn chuẩn 1 dòng, không bị ngắt) */}
        <nav className="hidden xl:flex items-center gap-1.5 2xl:gap-2 flex-shrink-0">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                whitespace-nowrap px-4 py-2 rounded-full text-xs 2xl:text-sm font-semibold tracking-wide transition-all uppercase
                ${isActive
                  ? 'bg-purple-700/80 text-white shadow-[0_0_16px_rgba(168,85,247,0.6)] border border-purple-400/60'
                  : 'text-purple-200/80 hover:text-white hover:bg-purple-900/40 border border-transparent'
                }
              `}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Màn hình trung bình (lg): menu thu gọn nhẹ để chữ không bao giờ bị tràn */}
        <nav className="hidden lg:flex xl:hidden items-center gap-1 flex-shrink-0">
          {navLinks.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all uppercase
                ${isActive
                  ? 'bg-purple-700/80 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)] border border-purple-400/50'
                  : 'text-purple-200/80 hover:text-white hover:bg-purple-900/30'
                }
              `}
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/transit"
            className="whitespace-nowrap px-2.5 py-1.5 text-xs font-semibold text-purple-300 hover:text-white"
          >
            Thêm ▾
          </Link>
        </nav>

        {/* 3. Action Controls (Bên phải) */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          {/* AstroBot button */}
          <button
            onClick={onOpenBot}
            className={`whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
              botOpen
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-pink-400 shadow-[0_0_20px_rgba(219,39,119,0.6)]'
                : 'bg-purple-900/60 text-purple-200 border-purple-500/40 hover:bg-purple-700/60 hover:text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>RESONANCIA AI</span>
          </button>

          {/* User profile avatar */}
          <Link
            to="/profile"
            className="whitespace-nowrap flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-purple-950/60 border border-purple-700/40 hover:border-purple-500/70 transition-all"
            title="Trang cá nhân"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
              {profile.avatar ? (
                <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                displayName[0]?.toUpperCase() || 'U'
              )}
            </div>
            <span className="text-xs font-medium text-purple-200 max-w-[110px] truncate">
              {displayName}
            </span>
          </Link>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="text-purple-400/70 hover:text-rose-400 transition-colors p-2 text-xs flex items-center justify-center rounded-full hover:bg-rose-500/10"
            title="Đăng xuất"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round"/>
              <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Mobile Hamburger Controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={onOpenBot}
            className="p-2 rounded-full bg-purple-800/60 text-purple-200 border border-purple-500/50 text-xs font-bold"
            aria-label="Mở AstroBot"
          >
            🤖 Bot
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2.5 rounded-xl bg-purple-950/70 border border-purple-700/50 text-purple-200"
            aria-label="Menu"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drop-down menu */}
      {menuOpen && (
        <div className="lg:hidden bg-zinc-950/98 border-b border-purple-800/50 px-6 py-5 space-y-2 animate-fadeIn shadow-2xl">
          {navLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-purple-200 hover:text-white hover:bg-purple-900/40 uppercase tracking-wide"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-purple-800/40 flex justify-between items-center">
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="text-xs text-purple-300 font-semibold flex items-center gap-2"
            >
              <span>👤 Hồ sơ ({displayName})</span>
            </Link>
            <button onClick={handleLogout} className="text-xs text-rose-400 font-semibold px-2 py-1">
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
