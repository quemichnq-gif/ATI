import { Link } from 'react-router-dom';
// @ts-ignore
import logoImg from '../assets/astrogpt/Logo.png';

export default function Footer() {
  return (
    <footer className="footer-section mt-24 border-t border-purple-900/40 bg-zinc-950/80 backdrop-blur-md">
      <div className="container w-container mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Logo & About */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Resonancia" className="w-12 h-12" />
              <div>
                <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-300 font-serif tracking-widest">
                  RESONANCIA
                </span>
                <p className="text-[10px] text-purple-400/80 uppercase font-mono">Astrology Matchmaking</p>
              </div>
            </div>
            <p className="text-xs text-purple-300/70 leading-relaxed">
              Nền tảng chiêm tinh học thông minh kết hợp trí tuệ nhân tạo Gemini. Phân tích lá số tử vi cá nhân, giải mã tương hợp tình duyên và dự đoán vận mệnh chuẩn xác.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-purple-200 mb-4 font-mono">
              Chiêm Tinh Học
            </h4>
            <ul className="space-y-2 text-xs text-purple-300/80">
              <li><Link to="/natal" className="hover:text-purple-100 transition-colors">Bản Đồ Sao Cá Nhân (Natal Chart)</Link></li>
              <li><Link to="/synastry" className="hover:text-purple-100 transition-colors">Bản Đồ Cặp Đôi (Synastry)</Link></li>
              <li><Link to="/transit" className="hover:text-purple-100 transition-colors">Vận Hạn Hành Tinh (Transits)</Link></li>
              <li><Link to="/glossary" className="hover:text-purple-100 transition-colors">Từ Điển 12 Cung Hoàng Đạo</Link></li>
            </ul>
          </div>

          {/* Match & Tarot */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-purple-200 mb-4 font-mono">
              Tính Năng Độc Quyền
            </h4>
            <ul className="space-y-2 text-xs text-purple-300/80">
              <li><Link to="/match" className="hover:text-purple-100 transition-colors">Ghép Đôi Tình Duyên AI</Link></li>
              <li><Link to="/tarot" className="hover:text-purple-100 transition-colors">Trải Bài Tarot Hàng Ngày</Link></li>
              <li><Link to="/journal" className="hover:text-purple-100 transition-colors">Nhật Ký Cảm Xúc Vũ Trụ</Link></li>
              <li><Link to="/chat" className="hover:text-purple-100 transition-colors">Phòng Trò Chuyện Tri Kỷ</Link></li>
            </ul>
          </div>

          {/* Contact & Community */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-purple-200 mb-4 font-mono">
              Trợ Lý Vũ Trụ
            </h4>
            <p className="text-xs text-purple-300/70 mb-3">
              Luôn sẵn sàng giải đáp mọi thắc mắc về tình cảm, sự nghiệp và vận mệnh 24/7 bằng công nghệ AI tiên tiến nhất.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/40 border border-purple-700/50 text-[11px] text-purple-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Resonancia AI Online
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-purple-900/30 flex flex-col sm:flex-row justify-between items-center text-xs text-purple-400/60 gap-4">
          <p>© 2026 Resonancia Platform. All rights reserved.</p>
          <p className="font-mono">Empowered by Google Gemini AI & Swiss Ephemeris</p>
        </div>
      </div>
    </footer>
  );
}

