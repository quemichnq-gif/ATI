import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { apiGenerate } from '../services/api';
import { ELEMENT_MAP } from '../constants/astrologyMap';

type PersonalNatalSummaryProps = {
  onOpenChart: () => void;
};

export default function PersonalNatalSummary({ onOpenChart }: PersonalNatalSummaryProps) {
  const profile = useSelector((state: RootState) => state.profile);
  const [dailyPrediction, setDailyPrediction] = useState('');
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const displayName = profile.name?.trim() || (profile.email ? profile.email.split('@')[0] : 'Nhà Chiêm Tinh');
  const element = ELEMENT_MAP[profile.sun || ''];
  const dominantElementLabel = element === 'Hỏa' ? 'Hỏa (Nhiệt Huyết)'
    : element === 'Thổ' ? 'Thổ (Vững Chãi)'
    : element === 'Khí' ? 'Khí (Tự Do)'
    : element === 'Thủy' ? 'Thủy (Cảm Xúc)'
    : 'Chưa xác định';

  useEffect(() => {
    async function loadPrediction() {
      if (!profile.uid && !profile.sun) return;
      try {
        setLoadingPrediction(true);
        const response = await apiGenerate({
          uid: profile.uid,
          name: profile.name || 'Bạn',
          sun: profile.sun || 'Bạch Dương',
          moon: profile.moon || 'Cự Giải',
          ascendant: profile.ascendant || 'Sư Tử',
          category: 'daily',
          day: 'today',
        });
        if (response.data?.prediction) setDailyPrediction(response.data.prediction);
      } catch (error) {
        console.warn('Lỗi tải dự đoán AI:', error);
        setDailyPrediction(
          `Năng lượng vũ trụ hôm nay mang lại sự tích cực và trực giác nhạy bén cho Mặt Trời ${profile.sun || 'của bạn'}. Hãy tự tin đón nhận những cơ hội kết nối mới!`
        );
      } finally {
        setLoadingPrediction(false);
      }
    }
    void loadPrediction();
  }, [profile.uid, profile.sun]);

  return (
      <section className="p-8 sm:p-10 rounded-3xl bg-purple-950/40 border border-purple-600/30 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-purple-800/40 pb-6 mb-8">
          <div>
            <span className="text-xs uppercase font-mono tracking-widest text-pink-400 font-bold">
              Lá Số Của Bạn
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              {displayName}
            </h2>
          </div>
          <button
            onClick={onOpenChart}
            className="self-start md:self-auto px-5 py-2.5 rounded-full text-xs uppercase font-bold tracking-wider bg-purple-800/50 hover:bg-purple-700/70 text-purple-100 border border-purple-500/40 transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            Chi Tiết Vòng Hoàng Đạo →
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-zinc-950/60 border border-purple-700/30 text-center hover:border-purple-500/50 transition-all">
            <span className="block text-[11px] font-mono text-purple-300/70 uppercase">Mặt Trời (Sun)</span>
            <span className="block text-xl sm:text-2xl font-bold text-amber-300 mt-2">
              {profile.sun || 'Chưa thiết lập'}
            </span>
            <span className="text-[10px] text-purple-400/80 mt-1 block">Bản ngã & Mục đích sống</span>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950/60 border border-purple-700/30 text-center hover:border-purple-500/50 transition-all">
            <span className="block text-[11px] font-mono text-purple-300/70 uppercase">Mặt Trăng (Moon)</span>
            <span className="block text-xl sm:text-2xl font-bold text-purple-300 mt-2">
              {profile.moon || 'Chưa thiết lập'}
            </span>
            <span className="text-[10px] text-purple-400/80 mt-1 block">Cảm xúc & Tiềm thức</span>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950/60 border border-purple-700/30 text-center hover:border-purple-500/50 transition-all">
            <span className="block text-[11px] font-mono text-purple-300/70 uppercase">Cung Mọc (Ascendant)</span>
            <span className="block text-xl sm:text-2xl font-bold text-pink-300 mt-2">
              {profile.ascendant || 'Chưa thiết lập'}
            </span>
            <span className="text-[10px] text-purple-400/80 mt-1 block">Diện mạo & Cách nhìn đời</span>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950/60 border border-purple-700/30 text-center hover:border-purple-500/50 transition-all">
            <span className="block text-[11px] font-mono text-purple-300/70 uppercase">Nguyên Tố Chủ Đạo</span>
            <span className="block text-xl sm:text-2xl font-bold text-emerald-300 mt-2">
              {profile.sun && ['Bạch Dương', 'Sư Tử', 'Nhân Mã'].includes(profile.sun)
                ? 'Hỏa (Nhiệt Huyết)'
                : profile.sun && ['Kim Ngưu', 'Xử Nữ', 'Ma Kết'].includes(profile.sun)
                ? 'Thổ (Vững Chãi)'
                : profile.sun && ['Song Tử', 'Thiên Bình', 'Bảo Bình'].includes(profile.sun)
                ? 'Khí (Tự Do)'
                : 'Thủy (Cảm Xúc)'}
            </span>
            <span className="text-[10px] text-purple-400/80 mt-1 block">Khí chất tâm hồn</span>
          </div>
        </div>

        {/* Thông điệp AI hôm nay */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-purple-900/40 via-purple-950/50 to-pink-950/40 border border-purple-600/30">
          <div className="flex items-center gap-2 mb-2 text-pink-300 text-xs font-bold uppercase tracking-wider">
            <span>✨</span> Dự Đoán Vận Khí Hôm Nay (Gemini AI)
          </div>
          <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed italic">
            {loadingPrediction
              ? 'Đang lắng nghe dịch chuyển của các vì sao...'
              : dailyPrediction || 'Hôm nay là thời điểm lý tưởng để bạn mở rộng các mối quan hệ xã hội và nuôi dưỡng sự thấu hiểu.'}
          </p>
        </div>
      </section>
  );
}
