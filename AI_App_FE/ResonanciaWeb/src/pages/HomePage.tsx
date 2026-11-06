import { useNavigate } from 'react-router-dom';
import { getVietnameseDate } from '../utils/date';
import ReferenceHomeSections from '../components/ReferenceHomeSections';
import CosmicBackground from '../components/CosmicBackground';

// AstroGPT Assets
// @ts-ignore
import handImg from '../assets/astrogpt/hand.png';
// @ts-ignore
import handBgImg from '../assets/astrogpt/hand_bg.png';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      {/* Nền vũ trụ động toàn trang: Sao nhấp nháy, sao băng, tinh vân trôi nhẹ nhàng */}
      <CosmicBackground />

      <div className="space-y-16 animate-fadeIn relative z-10">
        {/* 1. HERO SECTION CHUẨN ASTROGPT */}
        <section className="hero-section relative min-h-[70vh] flex flex-col lg:flex-row items-center justify-between gap-12 pt-4">

          {/* Left Column: Welcome & Headlines */}
          <div className="w-full lg:w-7/12 space-y-6 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-900/50 border border-purple-500/40 text-purple-200 text-xs font-mono uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping"></span>
              {getVietnameseDate()}
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-none drop-shadow-[0_2px_20px_rgba(0,0,0,0.95)]">
              CHÀO MỪNG ĐẾN <br />
              <span
                className="drop-shadow-[0_0_30px_rgba(255,215,0,0.6)]"
                style={{
                  background: 'linear-gradient(90deg, #ffd700 0%, #ff6eb4 50%, #4cc9f0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                RESONANCIA
              </span>
            </h1>

            <p className="text-base sm:text-xl text-white font-normal max-w-xl mx-auto lg:mx-0 leading-relaxed drop-shadow-[0_1px_12px_rgba(0,0,0,0.95)]">
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
                className="px-7 py-3.5 rounded-full font-bold uppercase tracking-wider text-sm text-white transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #4cc9f0 0%, #9d4edd 100%)',
                  boxShadow: '0 0 20px rgba(76,201,240,0.45), 0 0 40px rgba(76,201,240,0.15)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 28px rgba(76,201,240,0.7), 0 0 54px rgba(76,201,240,0.25)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(76,201,240,0.45), 0 0 40px rgba(76,201,240,0.15)'; }}
              >
                Ghép Đôi Tình Duyên
              </button>
            </div>
          </div>

          {/* Right Column: Rotating Magic Wheel & Astro Hand */}
          <div className="w-full lg:w-5/12 flex items-center justify-center relative min-h-[460px]">
            {/* Vòng quay ma thuật hoàng đạo quay 360 độ */}
            <img
              src={handBgImg}
              alt="Zodiac Magic Ring"
              className="absolute w-[460px] sm:w-[560px] opacity-90 animate-spin"
              style={{ animationDuration: '35s' }}
            />
            {/* Bàn tay chiêm tinh huyền bí lơ lửng bồng bềnh */}
            <img
              src={handImg}
              alt="Astrology Hand"
              className="relative z-10 w-[260px] sm:w-[310px] drop-shadow-[0_0_50px_rgba(168,85,247,0.9)] animate-float-slow hover:scale-105 transition-transform"
            />
          </div>
        </section>
      </div>

      <ReferenceHomeSections />
    </>
  );
}
