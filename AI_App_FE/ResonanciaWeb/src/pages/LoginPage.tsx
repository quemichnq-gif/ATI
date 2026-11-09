import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { auth, db } from '../services/firebase';
import { setAuth } from '../store/authSlice';
import { setProfile } from '../store/profileSlice';
import StarField from '../components/StarField';
import UiIcon from '../components/UiIcon';
import { TEST_ACCOUNTS, getTestProfileByEmailOrUid } from '../constants/testAccounts';

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
  const location = useLocation();
  const [email, setEmail] = useState((location.state as any)?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const userEmail = user.email || '';
      dispatch(setAuth({ uid: user.uid, email: userEmail }));

      const testAcc = getTestProfileByEmailOrUid(userEmail) || getTestProfileByEmailOrUid(user.uid);

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

      const effectiveName =
        cachedData?.name?.trim() ||
        testAcc?.name ||
        user.displayName?.trim() ||
        (userEmail ? userEmail.split('@')[0] : 'Người dùng');

      const initialProfile = {
        uid: user.uid,
        email: userEmail,
        name: effectiveName,
        ...(testAcc || {}),
        ...(cachedData || {}),
      };

      dispatch(setProfile(initialProfile as any));

      try {
        localStorage.setItem(`resonancia_profile_${user.uid}`, JSON.stringify(initialProfile));
        localStorage.setItem('resonancia_last_profile', JSON.stringify(initialProfile));
      } catch {}

      let profileData = initialProfile;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          const merged = { ...initialProfile, ...d, uid: user.uid, email: userEmail };
          profileData = merged;
          dispatch(setProfile(merged as any));
          try {
            localStorage.setItem(`resonancia_profile_${user.uid}`, JSON.stringify(merged));
            localStorage.setItem('resonancia_last_profile', JSON.stringify(merged));
          } catch {}
        }
      } catch (err) {
        // fallback ok
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
    const testAcc = getTestProfileByEmailOrUid(cleanEmail) || getTestProfileByEmailOrUid(user.uid);
    dispatch(setAuth({ uid: user.uid, email: cleanEmail }));

    let cachedData: any = null;
    try {
      const raw = localStorage.getItem(`resonancia_profile_${user.uid}`);
      if (raw) cachedData = JSON.parse(raw);
    } catch {}

    const effectiveName =
      cachedData?.name?.trim() || testAcc?.name || user.displayName?.trim() || cleanEmail.split('@')[0];
    const initialProfile = {
      uid: user.uid,
      email: cleanEmail,
      name: effectiveName,
      ...(testAcc || {}),
      ...(cachedData || {}),
    };
    dispatch(setProfile(initialProfile as any));

    try {
      localStorage.setItem(`resonancia_profile_${user.uid}`, JSON.stringify(initialProfile));
      localStorage.setItem('resonancia_last_profile', JSON.stringify(initialProfile));
    } catch {}

    navigate(hasCompleteBirthProfile(initialProfile) ? '/chat' : '/register/step2', {
      replace: true,
      state: { uid: user.uid, email: cleanEmail },
    });
  };

  // Chọn email thử nghiệm để người dùng tự nhập mật khẩu.
  const handleUseTestEmail = (accountEmail: string) => {
    setEmail(accountEmail);
    setError('');
    setInfoMessage('Đã điền email. Hãy nhập mật khẩu được cấp cho tài khoản này.');
  };

  const handleCopyTestEmail = (accountEmail: string) => {
    navigator.clipboard.writeText(accountEmail);
    setCopiedEmail(accountEmail);
    setTimeout(() => setCopiedEmail(null), 2500);
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
    <div
      className="astrica-auth-page min-h-screen py-8 flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #1a0030 0%, #0a0015 60%, #000 100%)' }}
    >
      <StarField count={250} />

      {/* Animated orb */}
      <div
        className="absolute w-96 h-96 rounded-full opacity-20 animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, #9d4edd, transparent)', top: '10%', left: '10%' }}
      />
      <div
        className="absolute w-64 h-64 rounded-full opacity-15 animate-pulse-slow"
        style={{
          background: 'radial-gradient(circle, #ff6eb4, transparent)',
          bottom: '15%',
          right: '15%',
          animationDelay: '1.5s',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-lg mx-4"
      >
        {/* Card */}
        <div className="glass-card p-6 sm:p-8" style={{ border: '1px solid rgba(157,78,221,0.3)' }}>
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="text-5xl mb-3 inline-block"
            >
              <UiIcon name="chart" label="Biểu đồ chiêm tinh" />
            </motion.div>
            <h1 className="text-3xl font-bold font-display gradient-text">Resonancia</h1>
            <p className="text-purple-300 text-sm mt-1.5 opacity-80">Vũ trụ đang chờ bạn khám phá</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-purple-300 text-sm mb-1.5 font-medium">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                className="cosmic-input"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-purple-300 text-sm font-medium">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-xs text-pink-400 hover:text-pink-300 transition-colors focus:outline-none cursor-pointer"
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
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/70 hover:text-purple-200 p-1 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
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
              >
                {infoMessage}
              </motion.p>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                role="alert"
                className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg px-4 py-2"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-cosmic w-full py-3 text-base mt-2 cursor-pointer"
              style={{ background: loading ? 'rgba(157,78,221,0.4)' : undefined }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang đăng nhập...
                </span>
              ) : (
                <>
                  <UiIcon name="sparkles" label="Đăng nhập" className="mr-2 inline" />
                  Đăng Nhập
                </>
              )}
            </button>
          </form>

          {/* ============================================================ */}
          {/* KHỐI TÀI KHOẢN MẪU TEST CHAT 2 CHIỀU THỰC TẾ (1-CLICK LOGIN) */}
          {/* ============================================================ */}
          <div className="mt-6 pt-5 border-t border-purple-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-300/90 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Tài khoản thử nghiệm Chat Messenger
              </span>
              <span className="text-[11px] text-pink-300/80">Test 2 chiều</span>
            </div>

            <p className="text-xs text-purple-200/70 mb-3.5 leading-relaxed">
              Chọn email để điền vào biểu mẫu, rồi nhập mật khẩu được cấp. Dùng <strong>Tab ẩn danh (Incognito)</strong> để đăng nhập tài khoản đối diện và thử nhắn tin hai chiều:
            </p>

            <div className="space-y-2">
              {Object.values(TEST_ACCOUNTS).map((acc) => (
                <div
                  key={acc.email}
                  className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/25 flex items-center justify-between gap-2.5 hover:border-purple-400/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      className="w-9 h-9 rounded-full object-cover border border-purple-400/40 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5 truncate">
                        <span>{acc.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 font-normal">
                          {acc.zodiac}
                        </span>
                      </div>
                      <div className="text-[11px] text-purple-300/60 truncate font-mono">
                        {acc.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyTestEmail(acc.email)}
                      className="px-2 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-white/10 text-purple-200 border border-purple-400/20 transition-all cursor-pointer"
                      title="Sao chép email tài khoản thử nghiệm"
                    >
                      {copiedEmail === acc.email ? '✓ Đã chép' : 'Chép email'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUseTestEmail(acc.email)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-white transition-all cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, #0084ff 0%, #a033ff 100%)',
                      }}
                    >
                      Dùng email
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 p-2 rounded-lg bg-white/5 border border-purple-500/15 text-[11px] text-purple-300/80 text-center">
              Dùng mật khẩu được cấp riêng cho tài khoản thử nghiệm.
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-5">
            <p className="text-purple-300 text-sm">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-pink-400 hover:text-pink-300 font-semibold transition-colors">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Stars decoration */}
        <div className="text-center mt-4 text-purple-400 opacity-50 text-xs">
          ✦ Kết nối qua chiêm tinh học ✦
        </div>
      </motion.div>
    </div>
  );
}
