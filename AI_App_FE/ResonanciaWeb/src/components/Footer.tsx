import { Link } from 'react-router-dom';

// Danh sách trang lấy chuẩn xác từ Menu Điều hướng (Navbar.tsx)
const astrologyMenuCol1 = [
  { name: 'Trang Chủ', path: '/home' },
  { name: 'Bản Đồ Sao', path: '/natal' },
  { name: 'Ghép Đôi', path: '/match' },
  { name: 'Bản Đồ Đôi', path: '/synastry' },
];

const astrologyMenuCol2 = [
  { name: 'Vận Hạn', path: '/transit' },
  { name: 'Dự Đoán', path: '/prediction' },
  { name: 'Tarot', path: '/tarot' },
  { name: 'Nhật Ký Vũ Trụ', path: '/journal' },
];

const featuresMenu = [
  { name: 'Từ Điển Chiêm Tinh', path: '/glossary' },
  { name: 'Trò Chuyện', path: '/chat' },
  { name: 'Resonancia AI', path: '/assistant' },
  { name: 'Thông Báo', path: '/notifications' },
  { name: 'Hồ Sơ Cá Nhân', path: '/profile' },
];

const socialLinks = [
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/',
    icon: '/astrica/images/687a0a9f772f56954abcb15e_facebook.svg',
  },
  {
    name: 'Twitter',
    url: 'https://twitter.com/',
    icon: '/astrica/images/687a0a9f8abd083fa17554c6_d7a3fc95e38cfecee0dc7af9c395c0de_twitter.svg',
  },
  {
    name: 'LinkedIn',
    url: 'https://in.linkedin.com/',
    icon: '/astrica/images/687a0a9d928404cbfe0edbfd_linkedin.svg',
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/',
    icon: '/astrica/images/687a0a9f311190c0fc07c241_145d82f565fd3d3f691ebf9963b896c6_instagram%201.svg',
  },
];

export default function Footer() {
  return (
    <footer className="astrica-footer relative z-20 w-full overflow-hidden">
      <div className="container w-container mx-auto max-w-[1330px] px-4 sm:px-6 lg:px-8">
        {/* Top 3-column Widget Grid */}
        <div className="first-footer">
          {/* Column 1: Chiêm Tinh Học (Chia 2 cột con cân đối, 100% link chuẩn từ Menu) */}
          <div className="footer-widget">
            <h3 className="widget-title flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-purple-400 opacity-80" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
              Chiêm Tinh Học
            </h3>
            <div className="footer-nav-grid">
              <ul className="footer-nav-list">
                {astrologyMenuCol1.map((item) => (
                  <li key={item.name}>
                    <Link to={item.path} className="footer-nav-link">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="footer-nav-list">
                {astrologyMenuCol2.map((item) => (
                  <li key={item.name}>
                    <Link to={item.path} className="footer-nav-link">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 2: Tính Năng & Tiện Ích (100% link chuẩn từ Menu) */}
          <div className="footer-widget">
            <h3 className="widget-title flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-purple-400 opacity-80" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
              Tính Năng &amp; Tiện Ích
            </h3>
            <ul className="footer-nav-list">
              {featuresMenu.map((item) => (
                <li key={item.name}>
                  <Link to={item.path} className="footer-nav-link">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Social (4 nút viên nhộng với SVG chính thức) */}
          <div className="footer-widget">
            <h3 className="widget-title flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-purple-400 opacity-80" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
              Kết Nối Mạng Xã Hội
            </h3>
            <ul className="footer-social-list">
              {socialLinks.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-social-link"
                    aria-label={`Theo dõi Resonancia trên ${item.name}`}
                  >
                    <div className="footer-social-icon-block">
                      <img src={item.icon} alt="" aria-hidden="true" loading="lazy" />
                    </div>
                    <div className="footer-social-text-block">
                      <div className="footer-social-text">{item.name}</div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright Block */}
        <div className="copyright-block">
          <div className="copyright-text flex items-center gap-2">
            <span>© 2026 <strong className="font-semibold text-white tracking-wide">RESONANCIA</strong> Platform. All Rights Reserved.</span>
          </div>
          <div className="copyright-text flex items-center gap-2 text-purple-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            <span>Empowered by Google Gemini AI &amp; Swiss Ephemeris</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
