import { useNavigate } from 'react-router-dom';
import { getVietnameseDate } from '../utils/date';
import ReferenceHomeSections from '../components/ReferenceHomeSections';

// AstroGPT Assets
// @ts-ignore
import handImg from '../assets/astrogpt/hand.png';
// @ts-ignore
import handBgImg from '../assets/astrogpt/hand_bg.png';
export default function HomePage() {
  const navigate = useNavigate();


  return (
    <>
      <div className="space-y-16 animate-fadeIn">
      {/* 1. HERO SECTION CHUẨN ASTROGPT */}
      <section className="hero-section relative min-h-[70vh] flex flex-col lg:flex-row items-center justify-between gap-12 pt-4">
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

      </div>
      <ReferenceHomeSections />
    </>
  );
}
