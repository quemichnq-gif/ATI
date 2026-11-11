import { DEFAULT_CANDIDATE_PROFILES, CandidateProfile } from '../constants/defaultCandidates';
import { MatchTagType } from '../types';

export interface MatchSynastryBreakdown {
  love: number;
  trust: number;
  communication: number;
  commitment: number;
}

export interface EnrichedCandidate {
  uid: string;
  name: string;
  age: number;
  gender: string;
  zodiac: string;
  sun: string;
  moon: string;
  ascendant?: string;
  element: string;
  avatar: string;
  coverImage?: string;
  job?: string;
  personality: string;
  bio?: string;
  compatibility_score: number;
  match_level: 'high' | 'medium' | 'challenge';
  match_level_text: string;
  aspect_name: string;
  aspect_detail: string;
  element_synergy: string;
  element_detail: string;
  breakdown: MatchSynastryBreakdown;
  reason: string;
  highlight: string;
  advice: string;
  isRealUser?: boolean;
}

export const ZODIAC_ORDER = [
  'Bạch Dương',
  'Kim Ngưu',
  'Song Tử',
  'Cự Giải',
  'Sư Tử',
  'Xử Nữ',
  'Thiên Bình',
  'Bọ Cạp',
  'Nhân Mã',
  'Ma Kết',
  'Bảo Bình',
  'Song Ngư',
];

export const ELEMENT_MAP: Record<string, string> = {
  'Bạch Dương': 'Lửa',
  'Sư Tử': 'Lửa',
  'Nhân Mã': 'Lửa',
  'Kim Ngưu': 'Đất',
  'Xử Nữ': 'Đất',
  'Ma Kết': 'Đất',
  'Song Tử': 'Khí',
  'Thiên Bình': 'Khí',
  'Bảo Bình': 'Khí',
  'Cự Giải': 'Nước',
  'Bọ Cạp': 'Nước',
  'Song Ngư': 'Nước',
};

function normalizeElement(elem?: string, sign?: string): string {
  if (elem) {
    if (elem === 'Hoả' || elem === 'Lửa') return 'Lửa';
    if (elem === 'Thổ' || elem === 'Đất') return 'Đất';
    if (elem === 'Khí') return 'Khí';
    if (elem === 'Thuỷ' || elem === 'Nước') return 'Nước';
  }
  if (sign && ELEMENT_MAP[sign]) return ELEMENT_MAP[sign];
  return 'Đất';
}

interface SynastryComputation {
  score: number;
  aspect_name: string;
  aspect_detail: string;
  element_synergy: string;
  element_detail: string;
  breakdown: MatchSynastryBreakdown;
  reason: string;
  highlight: string;
  advice: string;
}

export function calculateSynastryDetails(
  userSign: string,
  userMoon: string,
  userElement: string,
  candSign: string,
  candMoon: string,
  candElement: string,
  targetTag: MatchTagType
): SynastryComputation {
  const s1 = userSign || 'Bảo Bình';
  const s2 = candSign || 'Bạch Dương';

  const elem1 = normalizeElement(userElement, s1);
  const elem2 = normalizeElement(candElement, s2);

  const idx1 = ZODIAC_ORDER.indexOf(s1);
  const idx2 = ZODIAC_ORDER.indexOf(s2);

  let dist = 2; // fallback
  if (idx1 !== -1 && idx2 !== -1) {
    const diff = Math.abs(idx1 - idx2);
    dist = Math.min(diff, 12 - diff);
  }

  let aspect_name = 'Lục Hợp 60° (Sextile)';
  let aspect_detail = 'Góc chiếu hòa ái đem lại nguồn cảm hứng và sự tôn trọng tự nhiên.';
  let baseScore = 88;
  let love = 88;
  let trust = 90;
  let comm = 92;
  let commit = 86;
  let highlight = 'Giao tiếp mượt mà, luôn động viên nhau hoàn thiện bản thân.';
  let advice = 'Hãy cùng nhau bắt tay vào các dự án sáng tạo chung.';

  const suitabilityMap: Record<MatchTagType, number> = {
    greenflag: 92,
    twinflame: 86,
    destiny: 88,
    karmic: 74,
    redflag: 45,
  };

  if (dist === 4) {
    // 120° Trine - Tam hợp
    aspect_name = 'Tam Hợp 120° (Trine)';
    aspect_detail = `Cùng chung nguyên tố ${elem1}, hai bạn có tần số rung động tâm hồn tự nhiên, thấu hiểu nhau mà không cần gượng ép.`;
    baseScore = 96;
    love = 97;
    trust = 96;
    comm = 94;
    commit = 95;
    suitabilityMap.greenflag = 98;
    suitabilityMap.twinflame = 95;
    suitabilityMap.destiny = 91;
    suitabilityMap.karmic = 72;
    suitabilityMap.redflag = 38;
    highlight = 'Sự đồng điệu sâu sắc trong nhân sinh quan và cảm xúc.';
    advice = 'Hãy trân trọng dòng chảy hòa hợp tự nhiên và tạo dựng mái ấm vững vàng.';
  } else if (dist === 2) {
    // 60° Sextile - Lục hợp
    aspect_name = 'Lục Hợp 60° (Sextile)';
    aspect_detail = `Nguyên tố ${elem1} và ${elem2} tương sinh, kích thích sự mở lòng, chia sẻ tri thức và xây dựng lòng tin vững chắc.`;
    baseScore = 90;
    love = 91;
    trust = 93;
    comm = 94;
    commit = 89;
    suitabilityMap.greenflag = 95;
    suitabilityMap.destiny = 90;
    suitabilityMap.twinflame = 88;
    suitabilityMap.karmic = 75;
    suitabilityMap.redflag = 44;
    highlight = 'Khả năng chia sẻ mọi điều trong cuộc sống một cách thoải mái.';
    advice = 'Duy trì các buổi trò chuyện sâu sắc và các chuyến đi ngắn cùng nhau.';
  } else if (dist === 6) {
    // 180° Opposition - Đối đỉnh
    aspect_name = 'Đối Đỉnh 180° (Opposition)';
    aspect_detail = `Trục nam châm đối xứng vũ trụ giữa ${s1} và ${s2} tạo lực hút mãnh liệt, đối phương nắm giữ đúng mảnh ghép bạn còn thiếu.`;
    baseScore = 89;
    love = 95;
    trust = 84;
    comm = 86;
    commit = 92;
    suitabilityMap.destiny = 99;
    suitabilityMap.twinflame = 93;
    suitabilityMap.greenflag = 82;
    suitabilityMap.karmic = 86;
    suitabilityMap.redflag = 68;
    highlight = 'Sức hút đối lập khó cưỡng và sự bù trừ phẩm chất hoàn hảo.';
    advice = 'Học cách nhìn nhận góc nhìn của đối phương như một món quà bổ khuyết.';
  } else if (dist === 0) {
    // 0° Conjunction - Trùng tụ
    aspect_name = 'Trùng Tụ 0° (Conjunction)';
    aspect_detail = `Cùng sinh ra dưới cung ${s1}, hai bạn như hai ngọn lửa song sinh phản chiếu chuẩn xác mọi suy nghĩ và khát vọng.`;
    baseScore = 93;
    love = 93;
    trust = 92;
    comm = 96;
    commit = 90;
    suitabilityMap.twinflame = 100;
    suitabilityMap.greenflag = 90;
    suitabilityMap.destiny = 87;
    suitabilityMap.karmic = 80;
    suitabilityMap.redflag = 50;
    highlight = 'Trực giác thấu suốt tâm can, không cần lời nói cũng hiểu ý đối phương.';
    advice = 'Dành cho nhau không gian riêng để không bị cuốn vào sự phản chiếu quá mức.';
  } else if (dist === 3) {
    // 90° Square - Vuông góc
    aspect_name = 'Vuông Góc 90° (Square)';
    aspect_detail = `Góc thách thức bản ngã giữa ${s1} và ${s2} tạo ra tia lửa khao khát mãnh liệt nhưng đi kèm nhiều phép thử về sự nhẫn nại.`;
    baseScore = 65;
    love = 75;
    trust = 62;
    comm = 64;
    commit = 60;
    suitabilityMap.redflag = 98;
    suitabilityMap.karmic = 86;
    suitabilityMap.destiny = 64;
    suitabilityMap.greenflag = 52;
    suitabilityMap.twinflame = 46;
    highlight = 'Lực hút mãnh liệt từ những khác biệt sâu sắc trong tính cách.';
    advice = 'Hạ cái tôi xuống và lắng nghe mà không phán xét trong những lúc bất đồng.';
  } else if (dist === 5) {
    // 150° Quincunx - Bất tương hợp
    aspect_name = 'Bất Tương Hợp 150° (Quincunx)';
    aspect_detail = `Liên kết tiền định giữa ${s1} và ${s2} chứa đựng bài học nghiệp quả sâu sắc, thúc đẩy cả hai cùng chữa lành và thức tỉnh.`;
    baseScore = 79;
    love = 82;
    trust = 78;
    comm = 77;
    commit = 83;
    suitabilityMap.karmic = 99;
    suitabilityMap.destiny = 85;
    suitabilityMap.redflag = 76;
    suitabilityMap.greenflag = 68;
    suitabilityMap.twinflame = 64;
    highlight = 'Mối liên kết tâm hồn kỳ lạ, như đã từng gắn bó từ tiền kiếp.';
    advice = 'Kiên nhẫn điều chỉnh thói quen và đón nhận những thay đổi tích cực.';
  } else {
    // 30° Semi-sextile - Bán lục hợp
    aspect_name = 'Bán Lục Hợp 30° (Semi-sextile)';
    aspect_detail = `Hai cung hoàng đạo kế cận mang năng lượng tiếp nối bài học trưởng thành, đòi hỏi thời gian để thấu hiểu sự khác biệt nhịp sống.`;
    baseScore = 75;
    love = 77;
    trust = 78;
    comm = 80;
    commit = 75;
    suitabilityMap.karmic = 88;
    suitabilityMap.greenflag = 75;
    suitabilityMap.redflag = 70;
    suitabilityMap.destiny = 70;
    suitabilityMap.twinflame = 65;
    highlight = 'Sự tò mò lành mạnh về thế giới quan mới mẻ của đối phương.';
    advice = 'Tôn trọng nhịp điệu sinh hoạt và cách bộc lộ cảm xúc riêng của mỗi người.';
  }

  // Moon - Moon Resonance
  const m1 = userMoon || '';
  const m2 = candMoon || '';
  if (m1 && m2) {
    const mElem1 = normalizeElement('', m1);
    const mElem2 = normalizeElement('', m2);
    if (mElem1 === mElem2) {
      love = Math.min(100, love + 3);
      trust = Math.min(100, trust + 4);
    } else if (
      (mElem1 === 'Đất' && mElem2 === 'Nước') ||
      (mElem1 === 'Nước' && mElem2 === 'Đất') ||
      (mElem1 === 'Lửa' && mElem2 === 'Khí') ||
      (mElem1 === 'Khí' && mElem2 === 'Lửa')
    ) {
      love = Math.min(100, love + 2);
      trust = Math.min(100, trust + 3);
    }
  }

  // Element Synergy
  let element_synergy = `${elem1} × ${elem2}`;
  let element_detail = '';

  if (elem1 === 'Nước' && elem2 === 'Đất') {
    element_synergy = 'Nước × Đất · Tương Sinh Màu Mỡ';
    element_detail = 'Đất tạo bờ cõi vững chãi và cảm giác an toàn; Nước tưới mát, xoa dịu những khô cằn trong tâm hồn Đất.';
  } else if (elem1 === 'Đất' && elem2 === 'Nước') {
    element_synergy = 'Đất × Nước · Tương Sinh Nuôi Dưỡng';
    element_detail = 'Nước mang lại sự dịu dàng và cảm xúc mềm mại; Đất làm điểm tựa vững vàng để cùng nhau xây đắp tương lai.';
  } else if (elem1 === 'Lửa' && elem2 === 'Khí') {
    element_synergy = 'Lửa × Khí · Thổi Bùng Đam Mê';
    element_detail = 'Khí tiếp thêm oxy cho Lửa bùng cháy rực rỡ; Lửa mang đến sự ấm áp và lòng dũng cảm cho những ý tưởng của Khí.';
  } else if (elem1 === 'Khí' && elem2 === 'Lửa') {
    element_synergy = 'Khí × Lửa · Cảm Hứng Vô Tận';
    element_detail = 'Lửa thắp sáng nhiệt huyết cho Khí; Khí đưa những khát vọng của Lửa bay cao và vươn xa hơn.';
  } else if (elem1 === 'Nước' && elem2 === 'Nước') {
    element_synergy = 'Nước × Nước · Đại Dương Thấu Cảm';
    element_detail = 'Hai dòng nước hòa làm một, trực giác và sự đồng cảm chạm tới tầng sâu tâm linh mà không cần quá nhiều lời giải thích.';
  } else if (elem1 === 'Đất' && elem2 === 'Đất') {
    element_synergy = 'Đất × Đất · Thành Trì Vững Chãi';
    element_detail = 'Cùng chung sự thực tế, thủy chung và tính kiên định, hai bạn là bến đỗ bình yên nhất sau mọi sóng gió cuộc đời.';
  } else if (elem1 === 'Lửa' && elem2 === 'Lửa') {
    element_synergy = 'Lửa × Lửa · Ngọn Lửa Cuồng Nhiệt';
    element_detail = 'Tràn đầy năng lượng, đam mê và sự chủ động, hai bạn cùng nhau tạo nên những hành trình rực rỡ và không bao giờ nhàm chán.';
  } else if (elem1 === 'Khí' && elem2 === 'Khí') {
    element_synergy = 'Khí × Khí · Bầu Trời Tự Do';
    element_detail = 'Sự đồng điệu về trí tuệ và tư tưởng, hai bạn là đôi tri kỷ có thể đàm đạo về cả vũ trụ từ lúc hoàng hôn tới rạng đông.';
  } else if ((elem1 === 'Lửa' && elem2 === 'Nước') || (elem1 === 'Nước' && elem2 === 'Lửa')) {
    element_synergy = 'Lửa × Nước · Sóng Lửa Mãnh Liệt';
    element_detail = 'Sự kết hợp giữa nhiệt huyết và chiều sâu cảm xúc tạo lực hút mãnh liệt, cần sự thấu hiểu để tránh làm đối phương tổn thương.';
  } else if ((elem1 === 'Đất' && elem2 === 'Khí') || (elem1 === 'Khí' && elem2 === 'Đất')) {
    element_synergy = 'Đất × Khí · Cánh Diều & Bến Đỗ';
    element_detail = 'Khí mang lại sự mới mẻ cho Đất, Đất giúp Khí tiếp đất thực tế; cần tôn trọng sự khác biệt trong nhịp sống của nhau.';
  } else {
    element_synergy = `${elem1} × ${elem2} · Bù Trừ Năng Lượng`;
    element_detail = 'Sự đa dạng về nguyên tố mở ra cơ hội học hỏi và hoàn thiện những phẩm chất còn thiếu cho cả hai bên.';
  }

  // Tag Specific Reason & Advice: Giải thích tương hợp / không xứng như nào và lời khuyên ngắn gọn
  const finalScore = suitabilityMap[targetTag] || baseScore;

  let reason = '';
  let shortAdvice = advice || 'Hãy lắng nghe và tôn trọng sự khác biệt của đối phương.';

  if (finalScore >= 85) {
    switch (targetTag) {
      case 'greenflag':
        reason = `Hai bạn rất tương hợp: Năng lượng ${userSign} và ${candSign} hòa quyện tự nhiên, mang lại sự thấu cảm, an toàn và tin cậy tuyệt đối cho nhau.`;
        shortAdvice = 'Hãy duy trì sự sẻ chia chân thành để ngọn lửa tình cảm luôn bền chặt ✨';
        break;
      case 'twinflame':
        reason = `Hai bạn tương hợp sâu sắc: Tựa như hai nửa gương soi, hai bạn nhận ra sự đồng điệu trong tâm hồn và nhịp đập cảm xúc ngay từ những lần trò chuyện đầu tiên.`;
        shortAdvice = 'Trân trọng sự kết nối hiếm có này và cùng nhau hoàn thiện bản thân.';
        break;
      case 'destiny':
        reason = `Hai bạn rất tương hợp: Sức hút định mệnh mãnh liệt, đối phương bù đắp đúng những phẩm chất bạn đang tìm kiếm để hoàn thiện cuộc sống.`;
        shortAdvice = 'Cởi mở đón nhận nhân duyên và tạo cơ hội để hai người hiểu nhau sâu hơn.';
        break;
      case 'karmic':
        reason = `Hai bạn tương hợp đặc biệt: Mối duyên nghiệp định sâu sắc, gắn kết tự nhiên và cùng nhau tạo nên những bước ngoặt ý nghĩa trên hành trình trưởng thành.`;
        shortAdvice = 'Cùng nhau học cách bao dung và trân trọng từng khoảnh khắc bên nhau.';
        break;
      case 'redflag':
        reason = `Sức hút tương hợp mãnh liệt nhưng đối lập: Đam mê bùng nổ cuốn hút nhau mạnh mẽ, nhưng cần sự điềm tĩnh để dung hòa những khác biệt về cá tính.`;
        shortAdvice = 'Hạ bớt cái tôi cá nhân trong các cuộc tranh luận để giữ lửa yêu thương.';
        break;
    }
  } else if (finalScore >= 70) {
    reason = `Tương hợp ở mức vừa phải: Giữa ${userSign} (${elem1}) và ${candSign} (${elem2}) có sự thu hút tự nhiên, nhưng nhịp sống và cách thể hiện tình cảm có nét khác biệt, cần thời gian để đồng điệu.`;
    shortAdvice = 'Kiên nhẫn lắng nghe, tạo không gian riêng và tôn trọng nhịp điệu của đối phương.';
  } else {
    reason = `Chưa thực sự tương xứng / Thử thách: Năng lượng ${userSign} (${elem1}) và ${candSign} (${elem2}) có sự đối lập về quan điểm sống và thói quen, dễ nảy sinh bất đồng nếu thiếu sự kiên nhẫn dung hòa.`;
    shortAdvice = 'Học cách nhường nhịn, thẳng thắn bày tỏ mong muốn và đón nhận sự khác biệt của nhau.';
  }

  return {
    score: finalScore,
    aspect_name,
    aspect_detail,
    element_synergy,
    element_detail,
    breakdown: { love, trust, communication: comm, commitment: commit },
    reason,
    highlight,
    advice: shortAdvice,
  };
}

/**
 * Tính toán và làm giàu danh sách ứng viên mock cho người dùng hiện tại
 */
export function getRankedCandidates(userProfile: any, targetTag: MatchTagType): EnrichedCandidate[] {
  const userSign = userProfile?.sun || userProfile?.zodiac || 'Bảo Bình';
  const userMoon = userProfile?.moon || 'Song Ngư';
  const userElement = userProfile?.element || normalizeElement('', userSign);
  const userGender = userProfile?.gender || '';
  const myUid = userProfile?.uid || '';
  const myName = userProfile?.name || '';

  const candidatesList = Object.values(DEFAULT_CANDIDATE_PROFILES);

  // Lọc bỏ chính người dùng
  const filteredCandidates = candidatesList.filter(
    (c) => c.uid !== myUid && c.name !== myName
  );

  // Tính toán tương hợp cho từng ứng viên
  const enriched: EnrichedCandidate[] = filteredCandidates.map((c) => {
    const candSign = c.sun || c.zodiac || 'Bạch Dương';
    const candMoon = c.moon || 'Kim Ngưu';
    const candElem = c.element || normalizeElement('', candSign);

    const calc = calculateSynastryDetails(
      userSign,
      userMoon,
      userElement,
      candSign,
      candMoon,
      candElem,
      targetTag
    );

    const level: 'high' | 'medium' | 'challenge' =
      calc.score >= 85 ? 'high' : calc.score >= 70 ? 'medium' : 'challenge';
    const level_text =
      calc.score >= 85
        ? 'Tương hợp cao'
        : calc.score >= 70
        ? 'Tương hợp vừa'
        : 'Thử thách / Khác biệt';

    return {
      uid: c.uid,
      name: c.name,
      age: c.age || 22,
      gender: c.gender || '',
      zodiac: c.zodiac || candSign,
      sun: candSign,
      moon: candMoon,
      ascendant: c.ascendant,
      element: candElem,
      avatar: c.avatar,
      coverImage: c.coverImage,
      job: c.job || 'Thành viên Resonancia',
      personality: c.personality || 'Chân thành, ấm áp và luôn hướng tới sự đồng điệu',
      bio: c.bio,
      compatibility_score: calc.score,
      match_level: level,
      match_level_text: level_text,
      aspect_name: calc.aspect_name,
      aspect_detail: calc.aspect_detail,
      element_synergy: calc.element_synergy,
      element_detail: calc.element_detail,
      breakdown: calc.breakdown,
      reason: calc.reason,
      highlight: calc.highlight,
      advice: calc.advice,
      isRealUser: false,
    };
  });

  // Ưu tiên giới tính phù hợp nếu người dùng đã đặt giới tính
  enriched.sort((a, b) => {
    if (userGender === 'Nam' || userGender === 'male') {
      const aIsFemale = a.gender === 'Nữ' || a.gender === 'female';
      const bIsFemale = b.gender === 'Nữ' || b.gender === 'female';
      if (aIsFemale && !bIsFemale) return -1;
      if (!aIsFemale && bIsFemale) return 1;
    } else if (userGender === 'Nữ' || userGender === 'female') {
      const aIsMale = a.gender === 'Nam' || a.gender === 'male';
      const bIsMale = b.gender === 'Nam' || b.gender === 'male';
      if (aIsMale && !bIsMale) return -1;
      if (!aIsMale && bIsMale) return 1;
    }
    return b.compatibility_score - a.compatibility_score;
  });

  return enriched;
}
