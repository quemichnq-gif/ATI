export const ELEMENT_MAP: Record<string, string> = {
  'Bạch Dương': 'Hoả', 'Sư Tử': 'Hoả', 'Nhân Mã': 'Hoả',
  'Kim Ngưu': 'Thổ', 'Xử Nữ': 'Thổ', 'Ma Kết': 'Thổ',
  'Song Tử': 'Khí', 'Thiên Bình': 'Khí', 'Bảo Bình': 'Khí',
  'Cự Giải': 'Thuỷ', 'Bọ Cạp': 'Thuỷ', 'Song Ngư': 'Thuỷ',
};

export const ELEMENT_COLORS: Record<string, [string, string]> = {
  'Hoả': ['#ff48bb', '#ff8c5a'],
  'Thổ': ['#ce2e6b', '#b500e2'],
  'Khí': ['#48ffc8', '#47c5ff'],
  'Thuỷ': ['#61a4ff', '#9d8bff'],
  'Không xác định': ['#5a5a5a', '#888888'],
};

export const ZODIAC_EMOJIS: Record<string, string> = {
  'Bạch Dương': '♈',
  'Kim Ngưu': '♉',
  'Song Tử': '♊',
  'Cự Giải': '♋',
  'Sư Tử': '♌',
  'Xử Nữ': '♍',
  'Thiên Bình': '♎',
  'Bọ Cạp': '♏',
  'Nhân Mã': '♐',
  'Ma Kết': '♑',
  'Bảo Bình': '♒',
  'Song Ngư': '♓',
  'Không xác định': '✨',
};

export const ZODIAC_SYMBOLS: Record<string, { emoji: string; symbol: string; en: string }> = {
  'Bạch Dương': { emoji: '♈', symbol: '🐏', en: 'Aries' },
  'Kim Ngưu': { emoji: '♉', symbol: '🐂', en: 'Taurus' },
  'Song Tử': { emoji: '♊', symbol: '👫', en: 'Gemini' },
  'Cự Giải': { emoji: '♋', symbol: '🦀', en: 'Cancer' },
  'Sư Tử': { emoji: '♌', symbol: '🦁', en: 'Leo' },
  'Xử Nữ': { emoji: '♍', symbol: '🌾', en: 'Virgo' },
  'Thiên Bình': { emoji: '♎', symbol: '⚖️', en: 'Libra' },
  'Bọ Cạp': { emoji: '♏', symbol: '🦂', en: 'Scorpio' },
  'Nhân Mã': { emoji: '♐', symbol: '🏹', en: 'Sagittarius' },
  'Ma Kết': { emoji: '♑', symbol: '🐐', en: 'Capricorn' },
  'Bảo Bình': { emoji: '♒', symbol: '🏺', en: 'Aquarius' },
  'Song Ngư': { emoji: '♓', symbol: '🐟', en: 'Pisces' },
};

export const MATCH_TAGS: Record<string, { label: string; emoji: string; color: string; desc: string }> = {
  greenflag: { label: 'Green Flag', emoji: '💚', color: '#22c55e', desc: 'Người tương hợp hoàn toàn' },
  redflag: { label: 'Red Flag', emoji: '🚩', color: '#ef4444', desc: 'Người thử thách bạn' },
  karmic: { label: 'Karmic', emoji: '🔮', color: '#a855f7', desc: 'Kết nối nghiệp duyên' },
  destiny: { label: 'Destiny', emoji: '⭐', color: '#f59e0b', desc: 'Người vận mệnh' },
  twinflame: { label: 'Twin Flame', emoji: '🔥', color: '#f97316', desc: 'Ngọn lửa đôi' },
};

export const TRANSLATIONS: Record<string, string> = {
  'Aries': 'Bạch Dương',
  'Taurus': 'Kim Ngưu',
  'Gemini': 'Song Tử',
  'Cancer': 'Cự Giải',
  'Leo': 'Sư Tử',
  'Virgo': 'Xử Nữ',
  'Libra': 'Thiên Bình',
  'Scorpio': 'Bọ Cạp',
  'Sagittarius': 'Nhân Mã',
  'Capricorn': 'Ma Kết',
  'Aquarius': 'Bảo Bình',
  'Pisces': 'Song Ngư',
};

export const PLANET_TRANSLATIONS: Record<string, string> = {
  'Sun': 'Mặt Trời',
  'Moon': 'Mặt Trăng',
  'Mercury': 'Sao Thuỷ',
  'Venus': 'Sao Kim',
  'Mars': 'Sao Hoả',
  'Jupiter': 'Sao Mộc',
  'Saturn': 'Sao Thổ',
  'Uranus': 'Sao Thiên Vương',
  'Neptune': 'Sao Hải Vương',
  'Pluto': 'Sao Diêm Vương',
  'Ascendant': 'Điểm Mọc',
  'Descendant': 'Điểm Lặn',
  'MC': 'Trung Thiên',
  'IC': 'Thiên Đế',
};
