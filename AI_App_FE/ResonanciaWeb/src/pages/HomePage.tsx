import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { getVietnameseDate } from '../utils/date';
import { apiGenerate } from '../services/api';

// AstroGPT Assets
// @ts-ignore
import handImg from '../assets/astrogpt/hand.png';
// @ts-ignore
import handBgImg from '../assets/astrogpt/hand_bg.png';
// @ts-ignore
import logoImg from '../assets/astrogpt/Logo.png';

// 12 Sign SVGs
// @ts-ignore
import signAries from '../assets/astrogpt/Sign/sign1.svg';
// @ts-ignore
import signTaurus from '../assets/astrogpt/Sign/sign2.svg';
// @ts-ignore
import signGemini from '../assets/astrogpt/Sign/sign3.svg';
// @ts-ignore
import signCancer from '../assets/astrogpt/Sign/sign4.svg';
// @ts-ignore
import signLeo from '../assets/astrogpt/Sign/sign5.svg';
// @ts-ignore
import signVirgo from '../assets/astrogpt/Sign/sign6.svg';
// @ts-ignore
import signLibra from '../assets/astrogpt/Sign/sign7.svg';
// @ts-ignore
import signScorpio from '../assets/astrogpt/Sign/sign8.svg';
// @ts-ignore
import signSagittarius from '../assets/astrogpt/Sign/sign9.svg';
// @ts-ignore
import signCapricorn from '../assets/astrogpt/Sign/sign10.svg';
// @ts-ignore
import signAquarius from '../assets/astrogpt/Sign/sign11.svg';
// @ts-ignore
import signPisces from '../assets/astrogpt/Sign/sign12.svg';

const ZODIAC_SIGNS = [
  { name: 'Bạch Dương', en: 'Aries', date: '21/3 - 19/4', icon: signAries, element: 'Hỏa' },
  { name: 'Kim Ngưu', en: 'Taurus', date: '20/4 - 20/5', icon: signTaurus, element: 'Thổ' },
  { name: 'Song Tử', en: 'Gemini', date: '21/5 - 20/6', icon: signGemini, element: 'Khí' },
  { name: 'Cự Giải', en: 'Cancer', date: '21/6 - 22/7', icon: signCancer, element: 'Thủy' },
  { name: 'Sư Tử', en: 'Leo', date: '23/7 - 22/8', icon: signLeo, element: 'Hỏa' },
  { name: 'Xử Nữ', en: 'Virgo', date: '23/8 - 22/9', icon: signVirgo, element: 'Thổ' },
  { name: 'Thiên Bình', en: 'Libra', date: '23/9 - 22/10', icon: signLibra, element: 'Khí' },
  { name: 'Bọ Cạp', en: 'Scorpio', date: '23/10 - 21/11', icon: signScorpio, element: 'Thủy' },
  { name: 'Nhân Mã', en: 'Sagittarius', date: '22/11 - 21/12', icon: signSagittarius, element: 'Hỏa' },
  { name: 'Ma Kết', en: 'Capricorn', date: '22/12 - 19/1', icon: signCapricorn, element: 'Thổ' },
  { name: 'Bảo Bình', en: 'Aquarius', date: '20/1 - 18/2', icon: signAquarius, element: 'Khí' },
  { name: 'Song Ngư', en: 'Pisces', date: '19/2 - 20/3', icon: signPisces, element: 'Thủy' },
];

export default function HomePage() {
  const profile = useSelector((s: RootState) => s.profile);
  const navigate = useNavigate();

  const [dailyPrediction, setDailyPrediction] = useState<string>('');
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [selectedSign, setSelectedSign] = useState<string | null>(profile.sun || 'Bạch Dương');

  const displayName = profile.name?.trim() || (profile.email ? profile.email.split('@')[0] : 'Nhà Chiêm Tinh');

  useEffect(() => {
    async function loadPrediction() {
      if (!profile.uid && !profile.sun) return;
      try {
        setLoadingPrediction(true);
        const res = await apiGenerate({
          uid: profile.uid,
          name: profile.name || 'Bạn',
          sun: profile.sun || 'Bạch Dương',
          moon: profile.moon || 'Cự Giải',
          ascendant: profile.ascendant || 'Sư Tử',
          category: 'daily',
          day: 'today',
        });
        if (res.data?.prediction) {
          setDailyPrediction(res.data.prediction);
        }
      } catch (err) {
        console.warn('Lỗi tải dự đoán AI:', err);
        setDailyPrediction(
          `Năng lượng vũ trụ hôm nay mang lại sự tích cực và trực giác nhạy bén cho Mặt Trời ${profile.sun || 'của bạn'}. Hãy tự tin đón nhận những cơ hội kết nối mới!`
        );
      } finally {
        setLoadingPrediction(false);
      }
    }
    loadPrediction();
  }, [profile.uid, profile.sun]);

  return (
    <div className="space-y-16 animate-fadeIn">
      {/* 1. HERO SECTION CHUẨN ASTROGPT */}
      <section className="relative min-h-[70vh] flex flex-col lg:flex-row items-center justify-between gap-12 pt-4">
        {/* Left Column: Welcome & Headlines */}
        <div className="w-full lg:w-7/12 space-y-6 text-center lg:text-left z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-900/50 border border-purple-500/40 text-purple-200 text-xs font-mono uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping"></span>
            {getVietnameseDate()}
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-none">
            CHÀO MỪNG ĐẾN <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-amber-300 drop-shadow-[0_0_35px_rgba(168,85,247,0.7)]">
              RESONANCIA
            </span>
          </h1>

          <p className="text-base sm:text-xl text-purple-200/90 font-light max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Khám phá vũ trụ nội tâm, bản đồ sao định mệnh và kết nối với tri kỷ đích thực qua trí tuệ nhân tạo chiêm tinh học vượt bậc.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
            <button
              onClick={() => navigate('/natal')}
              className="px-7 py-3.5 rounded-full font-bold uppercase tracking-wider text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:shadow-[0_0_35px_rgba(236,72,153,0.7)] transition-all hover:scale-105"
            >
              Xem Bản Đồ Sao
            </button>
            <button
              onClick={() => navigate('/match')}
              className="px-7 py-3.5 rounded-full font-bold uppercase tracking-wider text-sm text-purple-200 bg-purple-950/70 hover:bg-purple-900/80 border border-purple-600/50 hover:border-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all hover:scale-105"
            >
              Ghép Đôi Tình Duyên
            </button>
          </div>
        </div>

        {/* Right Column: Rotating Magic Wheel & Astro Hand */}
        <div className="w-full lg:w-5/12 flex items-center justify-center relative min-h-[380px]">
          {/* Vòng quay ma thuật hoàng đạo (Quay 360 độ liên tục) */}
          <img
            src={handBgImg}
            alt="Zodiac Magic Ring"
            className="absolute w-[360px] sm:w-[440px] opacity-90 animate-spin"
            style={{ animationDuration: '35s' }}
          />

          {/* Bàn tay chiêm tinh huyền bí */}
          <img
            src={handImg}
            alt="Astrology Hand"
            className="relative z-10 w-[200px] sm:w-[240px] drop-shadow-[0_0_40px_rgba(168,85,247,0.8)] hover:scale-105 transition-transform"
          />
        </div>
      </section>

      {/* 2. CARD LÁ SỐ CÁ NHÂN CỦA USER */}
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
            onClick={() => navigate('/natal')}
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

      {/* 3. 12 CUNG HOÀNG ĐẠO (ZODIAC GRID CHUẨN ASTROGPT) */}
      <section className="space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase font-mono tracking-[0.3em] text-pink-400 font-bold">
            12 Cung Hoàng Đạo
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Khám Phá Năng Lượng Cung Của Bạn
          </h2>
          <p className="text-sm text-purple-300/70 max-w-lg mx-auto">
            Chọn cung hoàng đạo để lắng nghe những giải mã sâu sắc nhất về bản mệnh và vận thế.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {ZODIAC_SIGNS.map((sign) => {
            const isSelected = selectedSign === sign.name;
            return (
              <button
                key={sign.en}
                onClick={() => setSelectedSign(sign.name)}
                className={`p-5 rounded-2xl flex flex-col items-center text-center transition-all group ${
                  isSelected
                    ? 'bg-purple-800/60 border-2 border-pink-400 shadow-[0_0_20px_rgba(219,39,119,0.5)] scale-105'
                    : 'bg-zinc-950/50 hover:bg-purple-950/60 border border-purple-700/30 hover:border-purple-500/60'
                }`}
              >
                <img
                  src={sign.icon}
                  alt={sign.name}
                  className="w-16 h-16 object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-transform"
                />
                <span className="text-base font-bold text-white mt-3 block">{sign.name}</span>
                <span className="text-[11px] text-purple-300/70 font-mono mt-0.5">{sign.date}</span>
                <span className="mt-2 text-[10px] px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-600/40 text-purple-200">
                  {sign.element}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. 4 TÍNH NĂNG CỐT LÕI CỦA ATI */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase font-mono tracking-[0.25em] text-pink-400 font-bold">
            Hệ Thống Tính Năng
          </span>
          <h2 className="text-3xl font-extrabold text-white">
            Bộ Công Cụ Chiêm Tinh Học Toàn Diện
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Natal Chart */}
          <div
            onClick={() => navigate('/natal')}
            className="p-6 rounded-3xl bg-zinc-950/60 border border-purple-700/40 hover:border-purple-400/80 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(147,51,234,0.3)] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-800/40 border border-purple-500/40 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                🪐
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-pink-300 transition-colors">
                Bản Đồ Sao (Natal)
              </h3>
              <p className="text-xs text-purple-300/70 leading-relaxed">
                Biểu đồ hình tròn SVG trực quan với 10 hành tinh, 12 cung và 12 nhà địa bàn cá nhân.
              </p>
            </div>
            <span className="mt-6 text-xs text-pink-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Khám phá ngay →
            </span>
          </div>

          {/* Card 2: Matchmaking */}
          <div
            onClick={() => navigate('/match')}
            className="p-6 rounded-3xl bg-zinc-950/60 border border-purple-700/40 hover:border-pink-400/80 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(219,39,119,0.3)] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-pink-800/40 border border-pink-500/40 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                💖
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-pink-300 transition-colors">
                Ghép Đôi Tình Duyên
              </h3>
              <p className="text-xs text-purple-300/70 leading-relaxed">
                Tìm kiếm bạn đời tri kỷ dựa trên mức độ cộng hưởng năng lượng các chòm sao.
              </p>
            </div>
            <span className="mt-6 text-xs text-pink-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Tìm kiếm tri kỷ →
            </span>
          </div>

          {/* Card 3: Tarot Reading */}
          <div
            onClick={() => navigate('/tarot')}
            className="p-6 rounded-3xl bg-zinc-950/60 border border-purple-700/40 hover:border-amber-400/80 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(245,158,11,0.3)] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-800/40 border border-amber-500/40 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                🎴
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                Trải Bài Tarot
              </h3>
              <p className="text-xs text-purple-300/70 leading-relaxed">
                Rút lá bài thông điệp mỗi ngày để nhận lời chỉ dẫn thông thái từ vũ trụ sâu thẳm.
              </p>
            </div>
            <span className="mt-6 text-xs text-amber-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Rút bài ngay →
            </span>
          </div>

          {/* Card 4: Transits */}
          <div
            onClick={() => navigate('/transit')}
            className="p-6 rounded-3xl bg-zinc-950/60 border border-purple-700/40 hover:border-emerald-400/80 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-800/40 border border-emerald-500/40 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                🌌
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Vận Hạn Hành Tinh
              </h3>
              <p className="text-xs text-purple-300/70 leading-relaxed">
                Theo dõi chuyển dịch thực tế của các hành tinh để đón đầu vận hội và hóa giải thử thách.
              </p>
            </div>
            <span className="mt-6 text-xs text-emerald-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Xem vận hạn →
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
