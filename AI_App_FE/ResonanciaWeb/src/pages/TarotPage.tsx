import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store';
import { apiGenerate } from '../services/api';
import { ELEMENT_MAP, ELEMENT_COLORS } from '../constants/astrologyMap';
import UiIcon from '../components/UiIcon';

// Tarot deck — 22 lá Major Arcana (đủ cho daily card)
const MAJOR_ARCANA = [
  { id: 0, name: 'The Fool — Kẻ Điên', vi: 'Kẻ Điên', emoji: '🃏', meaning: 'Khởi đầu mới, mạo hiểm, tinh thần tự do, niềm tin vào cuộc sống', element: 'Khí' },
  { id: 1, name: 'The Magician — Pháp Sư', vi: 'Pháp Sư', emoji: '🔮', meaning: 'Ý chí mạnh mẽ, tài năng hiện thực hóa, sức mạnh sáng tạo', element: 'Hoả' },
  { id: 2, name: 'The High Priestess — Nữ Thầy Tu', vi: 'Nữ Thầy Tu', emoji: '🌙', meaning: 'Trực giác sâu sắc, bí ẩn, tiềm thức và tri thức ẩn', element: 'Thuỷ' },
  { id: 3, name: 'The Empress — Nữ Hoàng', vi: 'Nữ Hoàng', emoji: '👑', meaning: 'Sáng tạo, sự phong phú, sắc đẹp, thiên nhiên, mẫu thân', element: 'Thổ' },
  { id: 4, name: 'The Emperor — Hoàng Đế', vi: 'Hoàng Đế', emoji: '🏛️', meaning: 'Quyền lực, cấu trúc, ổn định, lãnh đạo và kỷ luật', element: 'Hoả' },
  { id: 5, name: 'The Hierophant — Giáo Hoàng', vi: 'Giáo Hoàng', emoji: '⛪', meaning: 'Truyền thống, giáo dục, giá trị tinh thần, cố vấn tinh thần', element: 'Thổ' },
  { id: 6, name: 'The Lovers — Đôi Tình Nhân', vi: 'Đôi Tình Nhân', emoji: '💕', meaning: 'Tình yêu, sự lựa chọn quan trọng, giá trị, mối quan hệ', element: 'Khí' },
  { id: 7, name: 'The Chariot — Cỗ Xe', vi: 'Cỗ Xe', emoji: '🏆', meaning: 'Chiến thắng nhờ ý chí, kiểm soát, quyết tâm và tiến lên', element: 'Thuỷ' },
  { id: 8, name: 'Strength — Sức Mạnh', vi: 'Sức Mạnh', emoji: '🦁', meaning: 'Dũng cảm nội tâm, kiên nhẫn, sức mạnh từ tình yêu thương', element: 'Hoả' },
  { id: 9, name: 'The Hermit — Ẩn Sĩ', vi: 'Ẩn Sĩ', emoji: '🕯️', meaning: 'Tìm kiếm nội tâm, sự cô đơn cần thiết, ánh sáng dẫn đường', element: 'Thổ' },
  { id: 10, name: 'Wheel of Fortune — Bánh Xe Số Phận', vi: 'Bánh Xe', emoji: '⚙️', meaning: 'Thay đổi vận mệnh, chu kỳ, may mắn và định mệnh', element: 'Hoả' },
  { id: 11, name: 'Justice — Công Lý', vi: 'Công Lý', emoji: '⚖️', meaning: 'Sự công bằng, hậu quả hành động, trung thực và quyết định', element: 'Khí' },
  { id: 12, name: 'The Hanged Man — Người Bị Treo', vi: 'Người Bị Treo', emoji: '🌀', meaning: 'Dừng lại để chiêm nghiệm, hy sinh, góc nhìn mới mẻ', element: 'Thuỷ' },
  { id: 13, name: 'Death — Cái Chết', vi: 'Biến Đổi', emoji: '🦋', meaning: 'Kết thúc để bắt đầu, chuyển hóa sâu sắc, buông bỏ quá khứ', element: 'Thuỷ' },
  { id: 14, name: 'Temperance — Điều Độ', vi: 'Điều Độ', emoji: '🌈', meaning: 'Cân bằng, kiên nhẫn, hòa hợp, chữa lành và dung hợp', element: 'Hoả' },
  { id: 15, name: 'The Devil — Ác Quỷ', vi: 'Xiềng Xích', emoji: '⛓️', meaning: 'Ràng buộc, cám dỗ vật chất, sợ hãi cần được nhìn nhận', element: 'Thổ' },
  { id: 16, name: 'The Tower — Tháp', vi: 'Sụp Đổ', emoji: '⚡', meaning: 'Đổ vỡ đột ngột, khải thị, phá hủy để tái thiết', element: 'Hoả' },
  { id: 17, name: 'The Star — Ngôi Sao', vi: 'Ngôi Sao', emoji: '⭐', meaning: 'Hy vọng, cảm hứng, chữa lành, được dẫn dắt bởi ánh sáng', element: 'Khí' },
  { id: 18, name: 'The Moon — Mặt Trăng', vi: 'Mặt Trăng', emoji: '🌕', meaning: 'Ảo tưởng, sự bí ẩn, lo lắng, tiềm thức và cảm xúc sâu', element: 'Thuỷ' },
  { id: 19, name: 'The Sun — Mặt Trời', vi: 'Mặt Trời', emoji: '☀️', meaning: 'Niềm vui, thành công, sự ấm áp, sự sống và sự rõ ràng', element: 'Hoả' },
  { id: 20, name: 'Judgement — Phán Xét', vi: 'Phán Xét', emoji: '📯', meaning: 'Thức tỉnh, sự mới sinh, lắng nghe tiếng gọi cao hơn', element: 'Hoả' },
  { id: 21, name: 'The World — Thế Giới', vi: 'Thế Giới', emoji: '🌍', meaning: 'Hoàn thành, trọn vẹn, thành tựu và hội nhập vũ trụ', element: 'Thổ' },
];

function getDailyCard(uid: string): typeof MAJOR_ARCANA[0] {
  const today = new Date().toISOString().split('T')[0];
  const seed = (uid + today).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return MAJOR_ARCANA[seed % MAJOR_ARCANA.length];
}

export default function TarotPage() {
  const profile = useSelector((s: RootState) => s.profile);
  const navigate = useNavigate();
  const [revealed, setRevealed] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [flipping, setFlipping] = useState(false);

  const element = ELEMENT_MAP[profile.sun || ''] || 'Không xác định';
  const colors = ELEMENT_COLORS[element] || ELEMENT_COLORS['Không xác định'];

  // Lấy lá bài ngày hôm nay (deterministic theo uid + ngày)
  const dailyCard = getDailyCard(profile.uid || 'guest');

  const handleReveal = async () => {
    if (revealed) return;
    setFlipping(true);
    await new Promise(r => setTimeout(r, 600));
    setFlipping(false);
    setRevealed(true);

    // Tải AI interpretation
    setLoading(true);
    try {
      const res = await apiGenerate({
        userData: {
          uid: profile.uid,
          name: profile.name,
          sun: profile.sun,
          moon: profile.moon,
          birthDate: profile.birthDate
        },
        category: `tarot_${dailyCard.vi.toLowerCase().replace(/\s+/g, '_')}`,
        day: new Date().toISOString().split('T')[0],
      });
      setInterpretation(res.data?.prediction || getDefaultInterpretation(dailyCard, profile.sun || ''));
    } catch {
      setInterpretation(getDefaultInterpretation(dailyCard, profile.sun || ''));
    } finally {
      setLoading(false);
    }
  };

  function getDefaultInterpretation(card: typeof dailyCard, sunSign: string): string {
    return `Lá ${card.vi} xuất hiện hôm nay mang thông điệp đặc biệt cho ${sunSign} của bạn. ${card.meaning}. Hãy để ý những khoảnh khắc đồng bộ vũ trụ trong ngày và đón nhận thông điệp này với trái tim rộng mở.`;
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <button onClick={() => navigate('/home')} className="text-purple-300 hover:text-white text-sm">← Về Trang Chủ</button>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text font-display">🎴 Tarot Hôm Nay</h1>
        <p className="text-purple-300 opacity-70 mt-1">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </motion.div>

      {/* Card area */}
      <div className="flex flex-col items-center gap-6">
        {/* Tarot card */}
        <motion.div
          className="relative cursor-pointer select-none"
          onClick={handleReveal}
          whileHover={!revealed ? { scale: 1.03 } : {}}
          animate={flipping ? { rotateY: 90 } : { rotateY: 0 }}
          transition={{ duration: 0.3 }}
          style={{ perspective: 1000 }}
        >
          <div className={`w-52 h-80 rounded-2xl flex items-center justify-center relative overflow-hidden transition-all duration-500`}
            style={{
              background: revealed
                ? `linear-gradient(135deg, rgba(30,15,60,0.95), rgba(60,20,80,0.9))`
                : `linear-gradient(135deg, rgba(20,10,40,0.95), rgba(50,10,70,0.9))`,
              border: `2px solid ${revealed ? colors[0] + '80' : 'rgba(139,92,246,0.4)'}`,
              boxShadow: revealed ? `0 0 30px ${colors[0]}40` : '0 0 20px rgba(139,92,246,0.2)',
            }}>

            {/* Card back pattern */}
            {!revealed && !flipping && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-7xl opacity-30">✦</div>
                <div className="absolute inset-4 border border-purple-500/20 rounded-xl" />
                <div className="absolute inset-6 border border-purple-500/10 rounded-lg" />
                <p className="absolute bottom-6 text-purple-400 text-xs font-medium">Bấm để lật bài</p>
              </div>
            )}

            {/* Revealed card */}
            {revealed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-5 space-y-3"
              >
                <div className="text-6xl">{dailyCard.emoji}</div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">{dailyCard.vi}</p>
                  <p className="text-purple-400 text-xs opacity-70 mt-1">{dailyCard.name}</p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs" style={{
                  background: `${colors[0]}30`, color: colors[0], border: `1px solid ${colors[0]}40`
                }}>
                  {dailyCard.element} · Cung {profile.sun}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Stars decoration */}
        <div className="flex gap-2 text-purple-500/40 text-xs">
          {['✦', '✧', '✦', '✧', '✦'].map((s, i) => (
            <motion.span key={i} animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}>{s}</motion.span>
          ))}
        </div>
      </div>

      {/* Interpretation */}
      <AnimatePresence>
        {revealed && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Meaning card */}
            <div className="glass-card p-5">
              <h2 className="text-white font-bold mb-2 flex items-center gap-2">
                <span>✨</span> Thông Điệp Lá Bài
              </h2>
              <p className="text-purple-200 text-sm leading-relaxed opacity-90">{dailyCard.meaning}</p>
            </div>

            {/* AI interpretation */}
            <div className="glass-card p-5">
              <h2 className="text-white font-bold mb-2 flex items-center gap-2">
                <span>🔮</span> Giải Nghĩa Cho {profile.sun} Hôm Nay
              </h2>
              {loading ? (
                <div className="flex items-center gap-3 py-2">
                  <div className="cosmic-spinner" style={{ width: 24, height: 24 }} />
                  <p className="text-purple-300 text-sm animate-pulse">Đang đọc thông điệp...</p>
                </div>
              ) : (
                <p className="text-purple-100 text-sm leading-relaxed opacity-90 italic border-l-2 pl-3"
                  style={{ borderColor: colors[0] }}>
                  {interpretation}
                </p>
              )}
            </div>

            {/* Tomorrow teaser */}
            <p className="text-center text-purple-500 text-xs opacity-60">
              ✦ Lá bài mới sẽ xuất hiện vào lúc nửa đêm ✦
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
