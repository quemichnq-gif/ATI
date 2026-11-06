import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const navLinks = [
  { to: '/assistant', label: 'Resonancia AI' },
  { to: '/home', label: 'Trang Chủ' },
  { to: '/natal', label: 'Bản Đồ Sao' },
  { to: '/match', label: 'Ghép Đôi' },
  { to: '/chat', label: 'Trò Chuyện' },
  { to: '/notifications', label: 'Thông Báo' },
  { to: '/prediction', label: 'Dự Đoán' },
  { to: '/tarot', label: 'Tarot' },
  { to: '/synastry', label: 'Bản Đồ Đôi' },
  { to: '/transit', label: 'Vận Hạn' },
  { to: '/glossary', label: 'Từ Điển Chiêm Tinh' },
  { to: '/journal', label: 'Nhật Ký Vũ Trụ' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useSelector((state: RootState) => state.profile);
  const displayName = profile.name?.trim() || (profile.email ? profile.email.split('@')[0] : 'Người dùng');

  useEffect(() => {
    const closeMenuOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !menuRootRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const closeMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', closeMenuOnOutsideClick);
    document.addEventListener('keydown', closeMenuOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenuOnOutsideClick);
      document.removeEventListener('keydown', closeMenuOnEscape);
    };
  }, []);

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

          <button
            type="button"
            className="astrica-menu-trigger"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="resonancia-menu"
          >
            <span>Menu</span>
            <span className={`astrica-menu-indicator ${menuOpen ? 'is-active' : ''}`} aria-hidden="true" />
          </button>

          <div id="resonancia-menu" className="astrica-menu-panel" hidden={!menuOpen}>
            <nav className="astrica-menu-grid" aria-label="Điều hướng Resonancia">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => `astrica-menu-link ${isActive ? 'is-active' : ''}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="astrica-menu-account">
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="astrica-profile-link">
                <span className="astrica-avatar" aria-hidden="true">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="" />
                  ) : (
                    displayName[0]?.toUpperCase() || 'U'
                  )}
                </span>
                <span className="astrica-profile-name">{displayName}</span>
              </Link>
              <button type="button" onClick={handleLogout} className="astrica-logout-button">
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
