import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { auth, db } from '../services/firebase';
import StarField from '../components/StarField';
import UiIcon from '../components/UiIcon';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const d = snap.data();
        if (d.birthDate && d.sun && d.moon) navigate('/home', { replace: true });
        else navigate('/register/step2', { replace: true, state: { uid: user.uid, email: d.email || '' } });
      }
    });
    return unsub;
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError('Vui lòng nhập đầy đủ thông tin');
    setLoading(true); setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (snap.exists()) {
        const d = snap.data();
        if (d.birthDate && d.sun && d.moon) navigate('/home', { replace: true });
        else navigate('/register/step2', { state: { uid: cred.user.uid, email } });
      } else {
        navigate('/register/step2', { state: { uid: cred.user.uid, email } });
      }
    } catch {
      setError('Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
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
              <label htmlFor="login-password" className="block text-purple-300 text-sm mb-2 font-medium">Mật khẩu</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                className="cosmic-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

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
