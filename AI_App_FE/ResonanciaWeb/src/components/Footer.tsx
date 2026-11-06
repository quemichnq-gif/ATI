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

const watermarkChars = ['A', 's', 't', 'r', 'o', 'l', 'o', 'g', 'y'];

export default function Footer() {
  return (
    <footer className="astrica-footer relative z-20 w-full overflow-hidden">
      <div className="container w-container mx-auto max-w-[1330px] px-4 sm:px-6 lg:px-8">
        {/* Top 3-column Widget Grid */}
        <div className="first-footer">
          {/* Column 1: Chiêm Tinh Học (Chia 2 cột con cân đối, 100% link chuẩn từ Menu) */}
          <div className="footer-widget">
            <h3 className="widget-title">Chiêm Tinh Học</h3>
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
            <h3 className="widget-title">Tính Năng &amp; Tiện Ích</h3>
            <div className="footer-nav-grid">
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
          </div>

          {/* Column 3: Social (4 nút viên nhộng với SVG chính thức) */}
          <div className="footer-widget">
            <h3 className="widget-title">Social</h3>
            <ul className="footer-social-list">
              {socialLinks.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-social-link"
                  >
                    <div className="footer-social-icon-block">
                      <img src={item.icon} alt={item.name} loading="lazy" />
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
          <div className="copyright-text">© 2026 Resonancia Platform. All Rights Reserved.</div>
          <div className="copyright-text">
            Empowered by Google Gemini AI &amp; Swiss Ephemeris
          </div>
        </div>

        {/* Bottom Giant ASTROLOGY Watermark with Hover Jump */}
        <div className="bottom-footer">
          <div className="bottom-footer-text">
            {watermarkChars.map((char, index) => (
              <span key={index} className="footer-text-span">
                {char}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
