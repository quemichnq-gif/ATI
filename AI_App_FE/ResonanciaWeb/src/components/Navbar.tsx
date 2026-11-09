import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface NavItem {
  to: string;
  label: string;
  desc: string;
  badge?: string;
  special?: boolean;
  icon: (props: { className?: string }) => ReactElement;
}

const navLinks: NavItem[] = [
  {
    to: '/assistant',
    label: 'Resonancia AI',
    desc: 'Trợ lý chiêm tinh thông minh',
    badge: 'AI',
    special: true,
    icon: (p) => (
      <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
        <circle cx="9" cy="13.5" r="1.4" fill="currentColor" />
        <circle cx="15" cy="13.5" r="1.4" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: '/home',
    label: 'Trang Chủ',
    desc: 'Khám phá thế giới vũ trụ',
    icon: (p) => (
      <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: '/natal',
    label: 'Bản Đồ Sao',
    desc: 'Lá số ngày sinh cá nhân',
    icon: (p) => (
      <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="m4.93 4.93 4.24 4.24" />
        <path d="m14.83 9.17 4.24-4.24" />
        <path d="m14.83 14.83 4.24 4.24" />
        <path d="m9.17 14.83-4.24 4.24" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    to: '/match',
    label: 'Ghép Đôi',
    desc: 'Tương hợp duyên số chiêm tinh',
    icon: (p) => (
      <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <path d="m12 5 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z" />
      </svg>
    ),
  },
  {
    to: '/chat',
    label: 'Trò Chuyện',
    desc: 'Kết nối cộng đồng vũ trụ',
    icon: (p) => (
      <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="8" y1="9" x2="16" y2="9" />
        <line x1="8" y1="13" x2="13" y2="13" />
      </svg>
    ),
  },
  {
    to: '/notifications',
    label: 'Thông Báo',
    desc: 'Lời mời & Cập nhật mới nhất',
    icon: (p) => (
      <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    ),
  },
  {
    to: '/prediction',
    label: 'Dự Đoán',
    desc: 'Tử vi & Điềm báo tương lai',
    icon: (p) => (
      <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="9" r="6.5" />
        <path d="M7.5 18 6 21h12l-1.5-3" />
        <path d="M9 21h6" />
      </svg>
    ),
  },
  {
    to: '/tarot',
    label: 'Tarot',
    desc: 'Trải bài & Thông điệp vũ trụ',
    icon: (p) => (
      <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="m12 8 1.2 2.5 2.8.5-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.5L12 8Z" />
      </svg>
    ),
  },
  {
    to: '/synastry',
    label: 'Bản Đồ Đôi',
    desc: 'Synastry so sánh độ hợp nhau',
    icon: (p) => (
      <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="12" r="6" />
        <circle cx="15" cy="12" r="6" />
      </svg>
    ),
  },
  {
    to: '/transit',
    label: 'Vận Hạn',
    desc: 'Quá cảnh các hành tinh',
    icon: (p) => (
      <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-30 12 12)" />
        <circle cx="19.5" cy="7.7" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: '/glossary',
    label: 'Từ Điển Chiêm Tinh',
    desc: 'Kho tàng kiến thức chiêm tinh',
    icon: (p) => (
      <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
        <path d="M6 6h10M6 10h10M6 14h6" />
      </svg>
    ),
  },
  {
    to: '/journal',
    label: 'Nhật Ký Vũ Trụ',
    desc: 'Ghi chép cảm xúc mỗi ngày',
    icon: (p) => (
      <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRootRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useSelector((state: RootState) => state.profile);
  const authUser = useSelector((state: RootState) => state.auth);
  const currentEmail = profile.email || authUser.email || auth.currentUser?.email || '';
  const currentName = profile.name?.trim() || auth.currentUser?.displayName?.trim() || '';
  const displayName = currentName || (currentEmail ? currentEmail.split('@')[0] : 'Người dùng');

  useEffect(() => {
    const closeMenuOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !menuRootRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const closeMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
        menuTriggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', closeMenuOnOutsideClick);
    document.addEventListener('keydown', closeMenuOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenuOnOutsideClick);
      document.removeEventListener('keydown', closeMenuOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut(auth);
    navigate('/login');
  };

  const openResonanciaAI = () => {
    setMenuOpen(false);
    navigate('/assistant');
  };

  return (
    <header className="header-content-wrapper navbar w-nav astrica-navbar absolute top-0 left-0 right-0 z-40">
      <div className="container w-container site-navigation astrica-navbar-inner">
        <Link to="/home" className="astrica-brand" aria-label="Resonancia - Trang chủ">
          RESONANCIA
        </Link>

        <div className="astrica-menu-capsule" ref={menuRootRef}>
          <button
            type="button"
            className={`astrica-ai-trigger ${location.pathname === '/assistant' ? 'is-active' : ''}`}
            onClick={openResonanciaAI}
            aria-label="Mở Resonancia AI"
            title="Resonancia AI"
          >
            <img
              className="astrica-ai-icon"
              src="/astrica/images/6870b7473503e2e6d021b012_Nav_icon.svg"
              alt=""
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            className="astrica-search-trigger"
            onClick={openResonanciaAI}
            aria-label="Mở trợ lý Resonancia AI"
            title="Tìm kiếm hoặc hỏi Resonancia AI"
          >
            <span className="astrica-search-label">Tìm kiếm hoặc hỏi Resonancia AI...</span>
            <span className="astrica-search-caret" aria-hidden="true">|</span>
          </button>

          {/* Nút Chatbot mở Menu theo phong cách Resonancia AI */}
          <button
            type="button"
            className={`astrica-menu-trigger astrica-chatbot-trigger ${menuOpen ? 'is-active' : ''}`}
            ref={menuTriggerRef}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="resonancia-menu"
            aria-label={menuOpen ? 'Đóng menu Resonancia AI' : 'Mở menu Resonancia AI'}
            title="Menu Resonancia AI"
          >
            <div className="astrica-chatbot-badge">
              <svg
                className="astrica-chatbot-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {/* Ăng-ten phát sáng */}
                <line x1="12" y1="2" x2="12" y2="4.5" />
                <circle cx="12" cy="2" r="1.2" fill="currentColor" />
                {/* Đầu Robot bo góc */}
                <rect x="3.5" y="4.5" width="17" height="13" rx="4" />
                {/* Mắt phát sáng thông minh */}
                <circle cx="8.5" cy="11" r="1.4" fill="currentColor" />
                <circle cx="15.5" cy="11" r="1.4" fill="currentColor" />
                {/* Nụ cười AI thân thiện */}
                <path d="M9.5 14.5c.8.6 1.6.8 2.5.8s1.7-.2 2.5-.8" />
                {/* Tai nghe / Nút âm thanh hai bên */}
                <rect x="1.5" y="9.5" width="2" height="3" rx="1" fill="currentColor" />
                <rect x="20.5" y="9.5" width="2" height="3" rx="1" fill="currentColor" />
              </svg>
              <span className={`astrica-chatbot-pulse-dot ${menuOpen ? 'is-active' : ''}`} aria-hidden="true" />
            </div>
          </button>

          {/* Menu Panel tùy chỉnh đậm chất Resonancia AI */}
          <div id="resonancia-menu" className="astrica-menu-panel" hidden={!menuOpen}>
            {/* Header mini bên trong Menu */}
            <div className="astrica-menu-header">
              <div className="astrica-menu-header-brand">
                <div className="astrica-menu-header-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 15l1 2.5 2.5 1-2.5 1L19 22l-1-2.5-2.5-1 2.5-1L19 15Z"/>
                  </svg>
                </div>
                <div className="astrica-menu-header-text">
                  <span className="astrica-menu-header-title">RESONANCIA AI</span>
                  <span className="astrica-menu-header-sub">Hệ sinh thái Chiêm Tinh Vũ Trụ</span>
                </div>
              </div>
              <div className="astrica-menu-header-status">
                <span className="astrica-status-dot" aria-hidden="true" />
                <span>Trợ lý sẵn sàng</span>
              </div>
            </div>

            {/* Danh sách 12 tính năng Resonancia AI (Lưới 2 cột trực quan) */}
            <nav className="astrica-menu-grid" aria-label="Điều hướng Resonancia AI">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `astrica-menu-card ${isActive ? 'is-active' : ''} ${item.special ? 'is-special' : ''}`
                  }
                >
                  <div className="astrica-menu-card-icon-box">
                    <item.icon />
                  </div>
                  <div className="astrica-menu-card-content">
                    <div className="astrica-menu-card-title-row">
                      <span className="astrica-menu-card-title">{item.label}</span>
                      {item.badge && <span className="astrica-menu-card-badge">{item.badge}</span>}
                    </div>
                    <span className="astrica-menu-card-desc">{item.desc}</span>
                  </div>
                  <svg
                    className="astrica-menu-card-arrow"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </NavLink>
              ))}
            </nav>

            {/* Thông tin tài khoản người dùng & Nút Đăng xuất */}
            {authUser.uid ? (
              <div className="astrica-menu-account">
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="astrica-profile-link">
                  <div className="astrica-avatar-wrap">
                    <span className="astrica-avatar" aria-hidden="true">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt="" />
                      ) : (
                        displayName[0]?.toUpperCase() || 'U'
                      )}
                    </span>
                    <span className="astrica-avatar-badge" aria-hidden="true" />
                  </div>
                  <div className="astrica-profile-info">
                    <span className="astrica-profile-name">{displayName}</span>
                    <span className="astrica-profile-sub">
                      {profile.sun ? `Cung ${profile.sun} · Xem hồ sơ` : 'Hồ sơ cá nhân & Bản đồ sao'}
                    </span>
                  </div>
                </Link>
                <button type="button" onClick={handleLogout} className="astrica-logout-button">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <div className="astrica-menu-account">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="astrica-profile-link">
                  <div className="astrica-avatar-wrap">
                    <span className="astrica-avatar" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                    </span>
                  </div>
                  <div className="astrica-profile-info">
                    <span className="astrica-profile-name">Đăng nhập</span>
                    <span className="astrica-profile-sub">Truy cập hồ sơ &amp; tính năng</span>
                  </div>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all whitespace-nowrap"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
