import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import UiIcon from './UiIcon';

function NavIcon({ name }: { name: string }) {
  const props = { className: "w-5 h-5", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, role: "img" as const, "aria-label": name };
  switch (name) {
    case 'home':
      return <svg {...props} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
    case 'natal':
      return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg>;
    case 'match':
      return <svg {...props} viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="m12 5 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z"/></svg>;
    case 'chat':
      return <svg {...props} viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case 'notifications':
      return <svg {...props} viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
    case 'profile':
      return <svg {...props} viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case 'synastry':
      return <svg {...props} viewBox="0 0 24 24"><circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/></svg>;
    case 'transit':
      return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-30 12 12)"/></svg>;
    case 'tarot':
      return <svg {...props} viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="m12 8 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z"/></svg>;
    case 'journal':
      return <svg {...props} viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>;
    case 'glossary':
      return <svg {...props} viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
    case 'logout':
      return <svg {...props} viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
    default:
      return null;
  }
}

const navItems = [
  { path: '/home', iconKey: 'home', label: 'Trang Chủ' },
  { path: '/natal', iconKey: 'natal', label: 'Bản Đồ Sao' },
  { path: '/match', iconKey: 'match', label: 'Ghép Đôi' },
  { path: '/chat', iconKey: 'chat', label: 'Trò Chuyện' },
  { path: '/notifications', iconKey: 'notifications', label: 'Thông Báo' },
  { path: '/profile', iconKey: 'profile', label: 'Hồ Sơ' },
];

const astroItems = [
  { path: '/synastry', iconKey: 'synastry', label: 'Bản Đồ Đôi (Synastry)' },
  { path: '/transit', iconKey: 'transit', label: 'Vận Hạn (Transit)' },
  { path: '/tarot', iconKey: 'tarot', label: 'Trải Bài Tarot' },
  { path: '/journal', iconKey: 'journal', label: 'Nhật Ký Vũ Trụ' },
  { path: '/glossary', iconKey: 'glossary', label: 'Từ Điển Chiêm Tinh' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const profile = useSelector((s: RootState) => s.profile);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const displayName = profile.name?.trim() || (profile.email ? profile.email.split('@')[0] : 'Người dùng');
  const hasAstro = Boolean(profile.sun && profile.moon);

  return (
    <aside className="fixed left-0 top-0 h-full w-64 z-50 flex flex-col"
      style={{
        background: 'rgba(9, 7, 18, 0.94)',
        borderRight: '1px solid rgba(168, 85, 247, 0.15)',
        backdropFilter: 'blur(24px)'
      }}>
      
      {/* Brand Header */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(168, 85, 247, 0.12)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.2))', border: '1px solid rgba(168,85,247,0.4)' }}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07 19.07 4.93" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide text-white uppercase" style={{ letterSpacing: '0.08em' }}>
              Resonancia
            </h1>
            <p className="text-[10px] text-purple-300/60 uppercase tracking-widest font-mono">Astrology Match</p>
          </div>
        </div>
      </div>

      {/* User Profile Summary */}
      <div className="p-4 mx-3 my-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 relative"
            style={{ border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(168,85,247,0.1)' }}>
            {profile.avatar ? (
              <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-sm text-purple-200"
                style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.4), rgba(219,39,119,0.3))' }}>
                {displayName[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-white text-xs font-semibold truncate tracking-wide">{displayName}</p>
            {hasAstro ? (
              <p className="text-[11px] text-purple-300/70 truncate mt-0.5">
                <UiIcon name="sun" label="Mặt Trời" className="inline mr-1" />{profile.sun} · <UiIcon name="moon" label="Mặt Trăng" className="inline mr-1" />{profile.moon}
              </p>
            ) : (
              <button onClick={() => navigate('/register/step2')}
                className="text-[11px] text-pink-400 hover:text-pink-300 hover:underline truncate mt-0.5 flex items-center gap-1">
                <span><UiIcon name="star" label="Thiết lập lá số" className="inline mr-1" />Thiết lập lá số</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink key={item.path} to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200
              ${isActive
                ? 'text-white'
                : 'text-purple-300/70 hover:text-white hover:bg-white/[0.04]'
              }
            `}
            style={({ isActive }) => isActive ? {
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.25), rgba(219, 39, 119, 0.15))',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              boxShadow: '0 4px 12px rgba(147, 51, 234, 0.15)'
            } : {}}
          >
            <NavIcon name={item.iconKey} />
            <span className="tracking-wide">{item.label}</span>
          </NavLink>
        ))}

        <div className="pt-3 pb-1 px-3">
          <p className="text-[10px] uppercase font-mono tracking-wider text-purple-300/40 font-semibold">Khám Phá Chiêm Tinh</p>
        </div>

        {astroItems.map(item => (
          <NavLink key={item.path} to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200
              ${isActive
                ? 'text-white'
                : 'text-purple-300/70 hover:text-white hover:bg-white/[0.04]'
              }
            `}
            style={({ isActive }) => isActive ? {
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.25), rgba(219, 39, 119, 0.15))',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              boxShadow: '0 4px 12px rgba(147, 51, 234, 0.15)'
            } : {}}
          >
            <NavIcon name={item.iconKey} />
            <span className="tracking-wide">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(168, 85, 247, 0.12)' }}>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200">
          <NavIcon name="logout" />
          <span className="tracking-wide">Đăng Xuất</span>
        </button>
      </div>
    </aside>
  );
}
