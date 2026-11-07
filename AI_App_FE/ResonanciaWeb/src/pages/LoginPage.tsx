import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { auth, db } from '../services/firebase';
import { setAuth } from '../store/authSlice';
import { setProfile } from '../store/profileSlice';
import StarField from '../components/StarField';
import UiIcon from '../components/UiIcon';

const hasCompleteBirthProfile = (profile: any) =>
  Boolean(profile?.birthDate && profile?.birthTime && profile?.birthPlace);

const getAuthErrorMessage = (code: string): string => {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
    case 'auth/too-many-requests':
      return 'Tài khoản tạm thời bị khóa do thử sai nhiều lần. Vui lòng thử lại sau vài phút hoặc dùng chức năng Quên mật khẩu.';
    case 'auth/invalid-email':
      return 'Định dạng email không hợp lệ. Vui lòng kiểm tra lại.';
    case 'auth/user-disabled':
      return 'Tài khoản này đã bị tạm khóa.';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra đường truyền và thử lại.';
    default:
      return 'Đăng nhập không thành công. Vui lòng thử lại sau.';
  }
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const userEmail = user.email || '';
      dispatch(setAuth({ uid: user.uid, email: userEmail }));

      // Phục hồi từ cache để có ngay thông tin
      let cachedData: any = null;
      try {
        const raw = localStorage.getItem(`resonancia_profile_${user.uid}`);
        if (raw) cachedData = JSON.parse(raw);
      } catch {}

      if (!cachedData) {
        try {
          const rawLast = localStorage.getItem('resonancia_last_profile');
          if (rawLast) {
            const last = JSON.parse(rawLast);
            if (last && (last.uid === user.uid || (last.email && last.email === userEmail))) {
              cachedData = last;
            }
          }
        } catch {}
      }

      const effectiveName = cachedData?.name?.trim() || user.displayName?.trim() || (userEmail ? userEmail.split('@')[0] : 'Người dùng');
      dispatch(setProfile({
        uid: user.uid,
        email: userEmail,
        name: effectiveName,
        ...(cachedData || {}),
      } as any));

      let profileData = cachedData || {};
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          const merged = { ...cachedData, ...d, uid: user.uid, email: userEmail };
          profileData = merged;
          dispatch(setProfile(merged as any));
          try {
            localStorage.setItem(`resonancia_profile_${user.uid}`, JSON.stringify(merged));
            localStorage.setItem('resonancia_last_profile', JSON.stringify(merged));
          } catch {}
        }
      } catch (err) {
        console.warn('Lỗi kiểm tra dữ liệu hồ sơ:', err);
      }

      navigate(hasCompleteBirthProfile(profileData) ? '/home' : '/register/step2', {
        replace: true,
        state: { uid: user.uid, email: userEmail },
      });
    });
    return unsub;
  }, [navigate, dispatch]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return setError('Vui lòng nhập đầy đủ thông tin');
    setLoading(true);
    setError('');
    setInfoMessage('');

    let userCred = null;
    try {
      userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch (err: any) {
      console.error('Lỗi xác thực đăng nhập:', err);
      setError(getAuthErrorMessage(err?.code || ''));
      setLoading(false);
      return;
    }

    const user = userCred.user;
    dispatch(setAuth({ uid: user.uid, email: cleanEmail }));

    // Phục hồi profile ngay lập tức từ Persistent Cache
    let cachedData: any = null;
    try {
      const raw = localStorage.getItem(`resonancia_profile_${user.uid}`);
      if (raw) cachedData = JSON.parse(raw);
    } catch {}

    if (!cachedData) {
      try {
        const rawLast = localStorage.getItem('resonancia_last_profile');
        if (rawLast) {
          const last = JSON.parse(rawLast);
          if (last && (last.uid === user.uid || (last.email && last.email === cleanEmail))) {
            cachedData = last;
          }
        }
      } catch {}
    }

    const effectiveName = cachedData?.name?.trim() || user.displayName?.trim() || cleanEmail.split('@')[0];
    const initialProfile = {
      uid: user.uid,
      email: cleanEmail,
      name: effectiveName,
      ...(cachedData || {}),
    };
    dispatch(setProfile(initialProfile as any));

    let profileData = initialProfile;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const d = snap.data();
        const mergedData = { ...initialProfile, ...d };
        profileData = mergedData;
        dispatch(setProfile(mergedData as any));
        try {
          localStorage.setItem(`resonancia_profile_${user.uid}`, JSON.stringify(mergedData));
          localStorage.setItem('resonancia_last_profile', JSON.stringify(mergedData));
        } catch {}
      }
    } catch (err) {
      console.warn('Lỗi truy vấn Firestore profile sau đăng nhập:', err);
    }

    navigate(hasCompleteBirthProfile(profileData) ? '/home' : '/register/step2', {
      replace: true,
      state: { uid: user.uid, email: cleanEmail },
    });
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Vui lòng điền địa chỉ Email vào ô bên trên rồi bấm "Quên mật khẩu?"');
      return;
    }
    setError('');
    setInfoMessage('');
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setInfoMessage(`Đã gửi email khôi phục mật khẩu đến ${cleanEmail}. Vui lòng kiểm tra hộp thư (cả thư rác).`);
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        setError('Không tìm thấy tài khoản với email này.');
      } else if (err?.code === 'auth/invalid-email') {
        setError('Địa chỉ email không đúng định dạng.');
      } else {
        setError('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="astrica-auth-page min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #1a0030 0%, #0a0015 60%, #000 100%)' }}>
      <StarField count={250} />

      {/* Animated orb */}
      <div className="absolute w-96 h-96 rounded-full opacity-20 animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, #9d4edd, transparent)', top: '10%', left: '10%' }} />
      <div className="absolute w-64 h-64 rounded-full opacity-15 animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, #ff6eb4, transparent)', bottom: '15%', right: '15%', animationDelay: '1.5s' }} />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Card */}
        <div className="glass-card p-8" style={{ border: '1px solid rgba(157,78,221,0.3)' }}>
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="text-6xl mb-4 inline-block"
            ><UiIcon name="chart" label="Biểu đồ chiêm tinh" /></motion.div>
            <h1 className="text-3xl font-bold font-display gradient-text">Resonancia</h1>
            <p className="text-purple-300 text-sm mt-2 opacity-80">Vũ trụ đang chờ bạn khám phá</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-purple-300 text-sm mb-2 font-medium">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                className="cosmic-input"
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="login-password" className="text-purple-300 text-sm font-medium">Mật khẩu</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-xs text-pink-400 hover:text-pink-300 transition-colors focus:outline-none"
                >
                  {resetLoading ? 'Đang gửi...' : 'Quên mật khẩu?'}
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="cosmic-input pr-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/70 hover:text-purple-200 p-1 transition-colors"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {infoMessage && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                role="status"
                className="text-emerald-300 text-sm text-center bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2"
              >{infoMessage}</motion.p>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                role="alert"
                className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg px-4 py-2"
              >{error}</motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-cosmic w-full py-3 text-base mt-2"
              style={{ background: loading ? 'rgba(157,78,221,0.4)' : undefined }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang đăng nhập...
                </span>
              ) : <><UiIcon name="sparkles" label="Đăng nhập" className="mr-2 inline" />Đăng Nhập</>}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-purple-300 text-sm">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-pink-400 hover:text-pink-300 font-semibold transition-colors">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Stars decoration */}
        <div className="text-center mt-6 text-purple-400 opacity-50 text-xs">
          ✦ Kết nối qua chiêm tinh học ✦
        </div>
      </motion.div>
    </div>
  );
}
