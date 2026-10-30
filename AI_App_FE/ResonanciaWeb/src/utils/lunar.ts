/**
 * Lunar & Transit utilities cho Resonancia
 * Tính toán pha Mặt Trăng + Transit alerts không cần AI
 */

export interface LunarPhase {
  phase: 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous'
       | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';
  name: string;
  emoji: string;
  illumination: number; // 0–100
  meaning: string;
  energy: string;
}

/**
 * Tính pha Mặt Trăng dựa trên ngày (công thức thiên văn đơn giản)
 */
export function getLunarPhase(date: Date = new Date()): LunarPhase {
  // Epoch: New Moon ngày 6/1/2000 18:14 UTC
  const knownNewMoon = new Date('2000-01-06T18:14:00Z');
  const lunarCycle = 29.53058867; // ngày
  const diffMs = date.getTime() - knownNewMoon.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const cyclePos = ((diffDays % lunarCycle) + lunarCycle) % lunarCycle;
  const illumination = Math.round(50 - 50 * Math.cos((cyclePos / lunarCycle) * 2 * Math.PI));

  if (cyclePos < 1.85)   return { phase: 'new', name: 'Trăng Mới', emoji: '🌑', illumination, meaning: 'Thời điểm khởi đầu, gieo hạt ước nguyện mới', energy: 'Ý định · Khởi đầu · Nội tâm' };
  if (cyclePos < 7.38)   return { phase: 'waxing_crescent', name: 'Lưỡi Liềm Tăng', emoji: '🌒', illumination, meaning: 'Năng lượng tích lũy, hành động nhỏ mỗi ngày', energy: 'Tích lũy · Hy vọng · Tiến lên' };
  if (cyclePos < 9.22)   return { phase: 'first_quarter', name: 'Trăng Bán Tròn Đầu', emoji: '🌓', illumination, meaning: 'Đối mặt thử thách, quyết định quan trọng', energy: 'Quyết định · Cam kết · Hành động' };
  if (cyclePos < 14.77)  return { phase: 'waxing_gibbous', name: 'Trăng Khuyết Lồi Tăng', emoji: '🌔', illumination, meaning: 'Hoàn thiện và chuẩn bị, tinh chỉnh kế hoạch', energy: 'Tinh chỉnh · Kiên nhẫn · Cẩn thận' };
  if (cyclePos < 16.61)  return { phase: 'full', name: 'Trăng Tròn', emoji: '🌕', illumination: 100, meaning: 'Đỉnh điểm năng lượng, cảm xúc dâng trào, kết quả hiện ra', energy: 'Đỉnh cao · Buông bỏ · Rõ ràng' };
  if (cyclePos < 22.15)  return { phase: 'waning_gibbous', name: 'Trăng Khuyết Lồi Giảm', emoji: '🌖', illumination, meaning: 'Thu hoạch thành quả, chia sẻ và biết ơn', energy: 'Biết ơn · Chia sẻ · Phản chiếu' };
  if (cyclePos < 23.99)  return { phase: 'last_quarter', name: 'Trăng Bán Tròn Cuối', emoji: '🌗', illumination, meaning: 'Buông bỏ những gì không còn phù hợp', energy: 'Buông bỏ · Tha thứ · Thanh lọc' };
  return { phase: 'waning_crescent', name: 'Lưỡi Liềm Giảm', emoji: '🌘', illumination, meaning: 'Nghỉ ngơi, nạp năng lượng và suy ngẫm', energy: 'Nghỉ ngơi · Suy ngẫm · Chuẩn bị' };
}

/**
 * Ý nghĩa pha trăng theo cung Mặt Trời
 */
export function getLunarMeaningForSign(phase: LunarPhase, sunSign: string): string {
  const fireSign = ['Bạch Dương', 'Sư Tử', 'Nhân Mã'].includes(sunSign);
  const waterSign = ['Cự Giải', 'Bọ Cạp', 'Song Ngư'].includes(sunSign);
  const earthSign = ['Kim Ngưu', 'Xử Nữ', 'Ma Kết'].includes(sunSign);
  const airSign = ['Song Tử', 'Thiên Bình', 'Bảo Bình'].includes(sunSign);

  const messages: Record<string, Record<string, string>> = {
    new: {
      fire: `${sunSign} của bạn đang được nạp đầy lửa khởi đầu. Đây là lúc lý tưởng để bắt đầu dự án mới với sự táo bạo đặc trưng.`,
      water: `${sunSign} nhạy cảm nên tận dụng trăng mới để đặt ý định từ nội tâm. Hãy lắng nghe trực giác.`,
      earth: `${sunSign} thực tế hãy dùng trăng mới để lập kế hoạch cụ thể và đặt mục tiêu có thể đo lường được.`,
      air: `${sunSign} của bạn sẽ nảy sinh ý tưởng tươi mới trong giai đoạn trăng mới. Hãy ghi lại ngay khi cảm hứng ập đến.`,
    },
    full: {
      fire: `Trăng tròn khuếch đại năng lượng bùng cháy của ${sunSign}. Cảm xúc mãnh liệt, hãy kênh hóa chúng vào sáng tạo.`,
      water: `${sunSign} cực nhạy trong trăng tròn. Cảm giác vừa rõ nét vừa dâng trào — hãy để nước mắt rơi nếu cần.`,
      earth: `Trăng tròn giúp ${sunSign} thấy thành quả công sức. Đây là thời điểm ghi nhận và ăn mừng.`,
      air: `${sunSign} đạt đỉnh kết nối xã hội trong trăng tròn. Cuộc trò chuyện quan trọng sẽ xảy ra.`,
    },
  };

  const type = fireSign ? 'fire' : waterSign ? 'water' : earthSign ? 'earth' : 'air';
  const phaseKey = ['new', 'full'].includes(phase.phase) ? phase.phase : null;
  if (phaseKey && messages[phaseKey]?.[type]) return messages[phaseKey][type];
  return `${sunSign} và ${phase.name}: ${phase.meaning}`;
}

// =====================================================
// TRANSIT ALERTS
// =====================================================

export interface TransitEvent {
  id: string;
  planet: string;
  event: string;
  emoji: string;
  dateRange: string;
  description: string;
  affectedSigns: string[];
  impact: 'high' | 'medium' | 'low';
  category: 'communication' | 'love' | 'career' | 'energy' | 'spiritual';
}

/**
 * Danh sách sự kiện thiên văn năm 2026 (hardcoded – cập nhật hàng năm)
 */
export const TRANSIT_EVENTS_2026: TransitEvent[] = [
  {
    id: 'mercury-rx-oct',
    planet: 'Sao Thủy',
    event: 'Retrograde (Đảo Nghịch)',
    emoji: '☿↺',
    dateRange: '24/10/2026 – 13/11/2026',
    description: 'Sao Thủy đảo nghịch trong Bọ Cạp. Tránh ký hợp đồng, trì hoãn quyết định lớn. Xem xét lại các mối quan hệ cũ.',
    affectedSigns: ['Song Tử', 'Song Ngư', 'Bọ Cạp', 'Thiên Bình'],
    impact: 'high',
    category: 'communication',
  },
  {
    id: 'venus-sco-nov',
    planet: 'Sao Kim',
    event: 'Quá cảnh Bọ Cạp',
    emoji: '♀♏',
    dateRange: '01/11/2026 – 25/11/2026',
    description: 'Sao Kim trong Bọ Cạp mang đến chiều sâu trong tình cảm. Cảm xúc mãnh liệt, kết nối sâu hơn nhưng cũng dễ ghen tuông.',
    affectedSigns: ['Kim Ngưu', 'Bọ Cạp', 'Sư Tử', 'Bảo Bình'],
    impact: 'medium',
    category: 'love',
  },
  {
    id: 'mars-cap-nov',
    planet: 'Sao Hỏa',
    event: 'Quá cảnh Ma Kết',
    emoji: '♂♑',
    dateRange: '15/11/2026 – 05/01/2027',
    description: 'Sao Hỏa trong Ma Kết — năng lượng mạnh mẽ, tập trung vào mục tiêu dài hạn. Thời gian lý tưởng để tăng năng suất làm việc.',
    affectedSigns: ['Bạch Dương', 'Ma Kết', 'Cự Giải', 'Thiên Bình'],
    impact: 'medium',
    category: 'career',
  },
  {
    id: 'full-moon-nov',
    planet: 'Mặt Trăng',
    event: 'Trăng Tròn Bạch Dương',
    emoji: '🌕♈',
    dateRange: '05/11/2026',
    description: 'Trăng tròn trong Bạch Dương — đỉnh điểm cảm xúc và sự táo bạo. Dũng khí để kết thúc những điều không còn phục vụ bạn.',
    affectedSigns: ['Bạch Dương', 'Thiên Bình', 'Ma Kết', 'Cự Giải'],
    impact: 'high',
    category: 'energy',
  },
  {
    id: 'jupiter-gemini',
    planet: 'Sao Mộc',
    event: 'Quá cảnh Song Tử (cả năm)',
    emoji: '♃♊',
    dateRange: '2026',
    description: 'Sao Mộc mang lại may mắn và mở rộng trong lĩnh vực truyền thông, học hỏi và kết nối. Năm tuyệt vời cho việc học và chia sẻ kiến thức.',
    affectedSigns: ['Song Tử', 'Nhân Mã', 'Sư Tử', 'Bạch Dương'],
    impact: 'high',
    category: 'spiritual',
  },
  {
    id: 'new-moon-nov',
    planet: 'Mặt Trăng',
    event: 'Trăng Mới Bọ Cạp',
    emoji: '🌑♏',
    dateRange: '20/11/2026',
    description: 'Trăng mới trong Bọ Cạp — thời điểm mạnh mẽ để đặt ý định về sự chuyển hóa, buông bỏ và làm sâu sắc hơn các mối quan hệ.',
    affectedSigns: ['Bọ Cạp', 'Kim Ngưu', 'Sư Tử', 'Bảo Bình'],
    impact: 'medium',
    category: 'spiritual',
  },
  {
    id: 'saturn-pisces',
    planet: 'Sao Thổ',
    event: 'Quá cảnh Song Ngư',
    emoji: '♄♓',
    dateRange: '2026 – 2028',
    description: 'Sao Thổ trong Song Ngư kêu gọi xây dựng cấu trúc cho ước mơ và trực giác. Học cách cân bằng lý tưởng với thực tế.',
    affectedSigns: ['Song Ngư', 'Xử Nữ', 'Song Tử', 'Nhân Mã'],
    impact: 'high',
    category: 'career',
  },
];

/**
 * Lấy các transit alerts liên quan đến user (dựa theo sun sign)
 */
export function getRelevantTransits(sunSign: string, limit = 4): TransitEvent[] {
  const today = new Date().toISOString().split('T')[0];
  const relevant = TRANSIT_EVENTS_2026.filter(e =>
    e.affectedSigns.includes(sunSign) || e.impact === 'high'
  );
  // Sắp xếp: sự kiện ảnh hưởng trực tiếp đến cung lên đầu
  return relevant
    .sort((a, b) => {
      const aAffects = a.affectedSigns.includes(sunSign) ? 1 : 0;
      const bAffects = b.affectedSigns.includes(sunSign) ? 1 : 0;
      return bAffects - aAffects;
    })
    .slice(0, limit);
}

/**
 * Kiểm tra xem sự kiện có đang active không (ngày hôm nay nằm trong khoảng)
 */
export function isTransitActive(event: TransitEvent): boolean {
  const now = Date.now();
  try {
    const parts = event.dateRange.split(' – ');
    if (parts.length < 2) return false;
    const parseViDate = (str: string) => {
      const [d, m, y] = str.trim().split('/');
      return new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`).getTime();
    };
    return now >= parseViDate(parts[0]) && now <= parseViDate(parts[1]);
  } catch { return false; }
}
