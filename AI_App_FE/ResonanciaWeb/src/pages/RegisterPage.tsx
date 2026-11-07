import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { motion } from 'framer-motion';
import { auth } from '../services/firebase';
import StarField from '../components/StarField';
import UiIcon from '../components/UiIcon';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password || !confirm) return setError('Vui lòng điền đầy đủ thông tin');
    if (password !== confirm) return setError('Mật khẩu xác nhận không khớp');
    if (password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự');

    setLoading(true);
    setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      navigate('/register/step2', { state: { uid: cred.user.uid, email: cleanEmail } });
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        setError('Email này đã được sử dụng. Vui lòng chuyển sang Đăng nhập.');
      } else if (err?.code === 'auth/weak-password') {
        setError('Mật khẩu quá yếu (yêu cầu tối thiểu 6 ký tự).');
      } else if (err?.code === 'auth/invalid-email') {
        setError('Địa chỉ email không đúng định dạng.');
      } else {
        setError('Đăng ký không thành công. Vui lòng kiểm tra lại kết nối mạng và thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="astrica-auth-page min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #1a0030 0%, #0a0015 60%, #000 100%)' }}>
      <StarField count={200} />
      <div className="absolute w-96 h-96 rounded-full opacity-15 animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, #ff6eb4, transparent)', top: '5%', right: '5%' }} />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-card p-8" style={{ border: '1px solid rgba(255,110,180,0.3)' }}>
          <div className="text-center mb-8">
            <div className="text-5xl mb-4"><UiIcon name="star" label="Tạo tài khoản" /></div>
            <h1 className="text-3xl font-bold font-display gradient-text">Tạo Tài Khoản</h1>
            <p className="text-purple-300 text-sm mt-2 opacity-80">Bắt đầu hành trình chiêm tinh của bạn</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="register-email" className="block text-purple-300 text-sm mb-2">Email</label>
              <input
                id="register-email"
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
              <label htmlFor="register-password" className="block text-purple-300 text-sm mb-2">Mật khẩu</label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="cosmic-input pr-11"
                  placeholder="Tối thiểu 6 ký tự"
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
            <div>
              <label htmlFor="register-confirm" className="block text-purple-300 text-sm mb-2">Xác nhận mật khẩu</label>
              <div className="relative">
                <input
                  id="register-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="cosmic-input pr-11"
                  placeholder="Nhập lại mật khẩu"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/70 hover:text-purple-200 p-1 transition-colors"
                  aria-label={showConfirm ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
                  tabIndex={-1}
                >
                  {showConfirm ? (
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

            {error && (
              <p role="alert" className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg px-4 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-cosmic w-full py-3 text-base mt-2"
              style={{ background: 'linear-gradient(135deg, #ff6eb4, #9d4edd)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang tạo...
                </span>
              ) : <><UiIcon name="rocket" label="Tiếp theo" className="mr-2 inline" />Tiếp Theo</>}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-purple-300 text-sm">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-pink-400 hover:text-pink-300 font-semibold">Đăng nhập</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
