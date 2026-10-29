import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const navItems = [
  { path: '/home', icon: '🏠', label: 'Trang Chủ' },
  { path: '/natal', icon: '🔮', label: 'Natal Chart' },
  { path: '/match', icon: '💫', label: 'Tìm Kiếm' },
  { path: '/chat', icon: '💬', label: 'Trò Chuyện' },
  { path: '/notifications', icon: '🔔', label: 'Thông Báo' },
  { path: '/profile', icon: '👤', label: 'Hồ Sơ' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const profile = useSelector((s: RootState) => s.profile);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 z-50 flex flex-col"
      style={{ background: 'rgba(10,0,21,0.95)', borderRight: '1px solid rgba(157,78,221,0.2)', backdropFilter: 'blur(20px)' }}>
      
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(157,78,221,0.2)' }}>
        <h1 className="text-2xl font-bold font-display gradient-text">✨ Resonancia</h1>
        <p className="text-xs text-purple-300 mt-1 opacity-70">AI Astrology Matchmaking</p>
      </div>

      {/* Profile Preview */}
      <div className="p-4 border-b" style={{ borderColor: 'rgba(157,78,221,0.15)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
            style={{ border: '2px solid rgba(157,78,221,0.5)' }}>
            {profile.avatar
              ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-lg"
                  style={{ background: 'linear-gradient(135deg,#9d4edd,#ff6eb4)' }}>
                  {profile.name?.[0]?.toUpperCase() || '✨'}
                </div>
            }
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-semibold truncate">{profile.name || 'Người dùng'}</p>
            <p className="text-xs text-purple-300 opacity-70 truncate">{profile.sun || '...'} ✦ {profile.moon || '...'}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink key={item.path} to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                ? 'text-white'
                : 'text-purple-300 hover:text-white hover:bg-white/5'
              }
            `}
            style={({ isActive }) => isActive ? {
              background: 'linear-gradient(135deg, rgba(157,78,221,0.3), rgba(255,110,180,0.2))',
              boxShadow: '0 0 15px rgba(157,78,221,0.2)',
              border: '1px solid rgba(157,78,221,0.3)',
            } : {}}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(157,78,221,0.2)' }}>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200">
          <span className="text-xl">🚪</span>
          <span>Đăng Xuất</span>
        </button>
      </div>
    </aside>
  );
}
