import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { motion } from 'framer-motion';
import { auth } from '../services/firebase';
import StarField from '../components/StarField';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirm) return setError('Vui lòng điền đầy đủ thông tin');
    if (password !== confirm) return setError('Mật khẩu không khớp');
    if (password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự');
    setLoading(true); setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      navigate('/register/step2', { state: { uid: cred.user.uid, email } });
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setError('Email đã được sử dụng');
      else setError('Đăng ký thất bại. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
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
            <div className="text-5xl mb-4">⭐</div>
            <h1 className="text-3xl font-bold font-display gradient-text">Tạo Tài Khoản</h1>
            <p className="text-purple-300 text-sm mt-2 opacity-80">Bắt đầu hành trình chiêm tinh của bạn</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-purple-300 text-sm mb-2">Email</label>
              <input type="email" className="cosmic-input" placeholder="email@example.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-purple-300 text-sm mb-2">Mật khẩu</label>
              <input type="password" className="cosmic-input" placeholder="Tối thiểu 6 ký tự"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-purple-300 text-sm mb-2">Xác nhận mật khẩu</label>
              <input type="password" className="cosmic-input" placeholder="Nhập lại mật khẩu"
                value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg px-4 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-cosmic w-full py-3 text-base mt-2"
              style={{ background: 'linear-gradient(135deg, #ff6eb4, #9d4edd)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang tạo...
                </span>
              ) : '🚀 Tiếp Theo'}
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
