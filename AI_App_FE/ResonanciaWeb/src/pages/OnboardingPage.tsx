import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import UiIcon from '../components/UiIcon';

const FEATURES = [
  { icon: 'chart', title: 'Natal Chart AI', desc: 'Phân tích biểu đồ chiêm tinh cá nhân sâu với Gemini AI' },
  { icon: 'heart', title: 'AI Matchmaking', desc: '5 loại kết nối: Green Flag, Red Flag, Karmic, Destiny, Twin Flame' },
  { icon: 'message', title: 'Real-time Chat', desc: 'Kết nối và trò chuyện với người tương hợp trong thời gian thực' },
  { icon: 'star', title: 'Dự Đoán Hàng Ngày', desc: 'Horoscope cá nhân hoá dựa trên biểu đồ sinh của bạn' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a0030 0%, #0a0015 50%, #000 100%)' }}>
      <StarField count={200} />

      {/* Orbs */}
      <div className="absolute w-[500px] h-[500px] rounded-full opacity-10 animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, #9d4edd, transparent)', top: '-100px', left: '-100px' }} />
      <div className="absolute w-64 h-64 rounded-full opacity-10 animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, #ff6eb4, transparent)', bottom: '100px', right: '50px', animationDelay: '2s' }} />
      <div className="absolute w-48 h-48 rounded-full opacity-8 animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, #4cc9f0, transparent)', top: '200px', right: '0px', animationDelay: '3s' }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-8"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0], y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="text-8xl mb-6 inline-block"
          ><UiIcon name="chart" label="Biểu đồ chiêm tinh" className="text-8xl" /></motion.div>
          <h1 className="text-6xl font-bold font-display gradient-text mb-4">Resonancia</h1>
          <p className="text-xl text-purple-300 opacity-80 max-w-xl mx-auto leading-relaxed">
            Nền tảng kết đôi chiêm tinh học thông minh đầu tiên được hỗ trợ bởi <span className="text-pink-400 font-semibold">Gemini AI</span>
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {FEATURES.map((f, i) => (
            <motion.div key={i}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass-card p-5 text-center card-hover"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="text-4xl mb-3"><UiIcon name={f.icon as 'chart'} label={f.title} /></div>
              <h3 className="text-white font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-purple-300 text-xs opacity-70 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
              whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/register')}
            className="btn-cosmic px-10 py-4 text-lg font-bold"
          >
            <UiIcon name="rocket" label="Bắt đầu hành trình" className="mr-2 inline" />Bắt Đầu Hành Trình
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            className="px-10 py-4 text-lg font-semibold rounded-full text-purple-300 hover:text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(157,78,221,0.3)' }}
          >
            Đã có tài khoản →
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-purple-400 opacity-50 text-xs mt-8"
        >
          ✦ Được xây dựng bởi Nhóm 32 – HUST Faculty of IT ✦
        </motion.p>
      </div>
    </div>
  );
}
