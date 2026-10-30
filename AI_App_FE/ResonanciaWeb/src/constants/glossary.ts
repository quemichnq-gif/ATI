/**
 * Từ điển chiêm tinh học — Zodiac Glossary
 * Giải thích các thuật ngữ phổ biến cho người mới
 */

export interface GlossaryTerm {
  id: string;
  term: string;
  symbol?: string;
  category: 'planet' | 'sign' | 'house' | 'aspect' | 'concept';
  short: string;
  detail: string;
  emoji: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Khái niệm cơ bản
  {
    id: 'natal-chart', term: 'Natal Chart (Lá Số)', symbol: '⊙', category: 'concept', emoji: '🗺️',
    short: 'Bản đồ sao tại thời điểm bạn được sinh ra',
    detail: 'Natal Chart là "ảnh chụp" bầu trời vào đúng khoảnh khắc bạn chào đời. Nó cho thấy vị trí của Mặt Trời, Mặt Trăng và các hành tinh trong 12 cung hoàng đạo và 12 nhà — là nền tảng của toàn bộ chiêm tinh cá nhân.',
  },
  {
    id: 'ascendant', term: 'Ascendant (Cung Mọc)', symbol: 'AC', category: 'concept', emoji: '↑',
    short: 'Cung hoàng đạo mọc lên ở đường chân trời phía Đông lúc bạn sinh',
    detail: 'Cung Mọc (Rising Sign) là "mặt nạ" bạn trình diện với thế giới — cách người khác nhìn nhận bạn ngay từ cái nhìn đầu tiên. Nó khác với Mặt Trời (cái tôi sâu bên trong) và ảnh hưởng mạnh đến ngoại hình và phong cách giao tiếp.',
  },
  {
    id: 'midheaven', term: 'Midheaven / MC (Trung Thiên)', symbol: 'MC', category: 'concept', emoji: '🏔️',
    short: 'Điểm cao nhất của lá số — liên quan sự nghiệp và danh tiếng',
    detail: 'MC (Medium Coeli) là điểm cung hoàng đạo nằm ở vị trí cao nhất trong bầu trời lúc bạn sinh. Nó đại diện cho sự nghiệp, danh tiếng, mục tiêu lớn trong cuộc đời và cách xã hội nhìn nhận bạn.',
  },
  {
    id: 'retrograde', term: 'Retrograde (Đảo Nghịch)', symbol: '↺', category: 'concept', emoji: '↩️',
    short: 'Khi hành tinh dường như chuyển động ngược lại (ảo giác quang học)',
    detail: 'Retrograde là hiện tượng hành tinh trông như đi lùi (thực ra là ảo giác do sự chênh lệch tốc độ quay quanh Mặt Trời). Khi một hành tinh đảo nghịch, lĩnh vực nó cai quản thường gặp trục trặc, trì hoãn hoặc cần xem xét lại. Nổi tiếng nhất là Mercury Retrograde.',
  },
  {
    id: 'transit', term: 'Transit (Quá Cảnh)', category: 'concept', emoji: '🔄',
    short: 'Vị trí hành tinh hiện tại và ảnh hưởng của chúng lên lá số của bạn',
    detail: 'Transit là vị trí các hành tinh trên bầu trời ngày hôm nay, đối chiếu với lá số sinh của bạn. Khi hành tinh hiện tại "chạm" vào một điểm trong lá số, nó kích hoạt chủ đề tương ứng trong cuộc sống.',
  },
  {
    id: 'synastry', term: 'Synastry (Bản Đồ Đôi)', category: 'concept', emoji: '💑',
    short: 'So sánh hai lá số để phân tích mối quan hệ',
    detail: 'Synastry đặt hai lá số lồng vào nhau để xem các hành tinh của người này tương tác thế nào với người kia. Giúp hiểu điểm hòa hợp (trine, sextile) và điểm ma sát (square, opposition) trong mối quan hệ.',
  },
  // Hành tinh
  {
    id: 'sun', term: 'Mặt Trời (Sun)', symbol: '☉', category: 'planet', emoji: '☀️',
    short: 'Bản ngã cốt lõi, ý thức, mục đích sống',
    detail: 'Mặt Trời trong lá số cho thấy cái tôi cơ bản — bạn là ai ở cốt lõi. Đây là cung mà hầu hết mọi người biết khi nói "tôi là cung Sư Tử" hay "tôi là Song Tử". Nó liên quan đến sức sống, ý chí và sứ mệnh cuộc đời.',
  },
  {
    id: 'moon', term: 'Mặt Trăng (Moon)', symbol: '☽', category: 'planet', emoji: '🌙',
    short: 'Cảm xúc, bản năng, nhu cầu vô thức và ký ức',
    detail: 'Mặt Trăng đại diện cho thế giới nội tâm — cảm xúc, bản năng, nhu cầu được an toàn. Nó cho thấy bạn phản ứng cảm xúc thế nào, những gì khiến bạn cảm thấy được nuôi dưỡng, và cách bạn kết nối với ký ức và gia đình.',
  },
  {
    id: 'mercury', term: 'Sao Thủy (Mercury)', symbol: '☿', category: 'planet', emoji: '💬',
    short: 'Trí tuệ, giao tiếp, học hỏi, di chuyển ngắn',
    detail: 'Sao Thủy cai quản tư duy, ngôn ngữ và giao tiếp. Nó cho thấy bạn suy nghĩ và diễn đạt ý tưởng như thế nào. Khi đảo nghịch (retrograde), giao tiếp và công nghệ thường gặp trục trặc.',
  },
  {
    id: 'venus', term: 'Sao Kim (Venus)', symbol: '♀', category: 'planet', emoji: '💕',
    short: 'Tình yêu, vẻ đẹp, nghệ thuật, tiền bạc, giá trị',
    detail: 'Sao Kim cho thấy bạn yêu thế nào, bị thu hút bởi điều gì và trân trọng điều gì. Nó cai quản các mối quan hệ lãng mạn, thẩm mỹ, sở thích nghệ thuật và cả tài chính cá nhân.',
  },
  {
    id: 'mars', term: 'Sao Hỏa (Mars)', symbol: '♂', category: 'planet', emoji: '🔥',
    short: 'Hành động, năng lượng, dục vọng, ý chí chiến đấu',
    detail: 'Sao Hỏa là nguồn năng lượng thô, động lực và sự táo bạo. Nó cho thấy bạn theo đuổi điều mình muốn như thế nào, cách bạn xử lý tức giận và mức độ quyết đoán trong cuộc sống.',
  },
  {
    id: 'jupiter', term: 'Sao Mộc (Jupiter)', symbol: '♃', category: 'planet', emoji: '🌟',
    short: 'May mắn, mở rộng, triết học, giáo dục, du lịch',
    detail: 'Sao Mộc là hành tinh may mắn — nó mang đến sự phong phú, cơ hội và tăng trưởng trong lĩnh vực nó cư ngụ. Chu kỳ 12 năm, mỗi năm Sao Mộc mang may mắn đến một cung khác nhau.',
  },
  {
    id: 'saturn', term: 'Sao Thổ (Saturn)', symbol: '♄', category: 'planet', emoji: '⏳',
    short: 'Kỷ luật, giới hạn, trách nhiệm, bài học cuộc đời',
    detail: 'Sao Thổ là "thầy giáo khắc nghiệt" — nó đặt ra thử thách để ta trưởng thành. Vị trí của Sao Thổ cho thấy lĩnh vực bạn cần nỗ lực nhất, nhưng cũng là nơi bạn xây dựng cấu trúc vững chắc nhất.',
  },
  // Nhà
  {
    id: 'house1', term: 'Nhà 1 (First House)', category: 'house', emoji: '🪞',
    short: 'Bản thân, ngoại hình, cách nhìn nhận đầu tiên',
    detail: 'Nhà 1 là nhà của "cái tôi" — nơi Cung Mọc cư ngụ. Nó cho thấy cách bạn tự nhìn nhận và cách người khác thấy bạn. Ảnh hưởng đến ngoại hình, phong cách và ấn tượng đầu tiên.',
  },
  {
    id: 'house7', term: 'Nhà 7 (Seventh House)', category: 'house', emoji: '👫',
    short: 'Đối tác, hôn nhân, hợp tác, kẻ thù công khai',
    detail: 'Nhà 7 là nhà của các mối quan hệ nghiêm túc — hôn nhân, đối tác kinh doanh, và cả đối thủ công khai. Cung nằm trong Nhà 7 cho biết bạn tìm kiếm những gì ở một người bạn đời.',
  },
  {
    id: 'house10', term: 'Nhà 10 (Tenth House)', category: 'house', emoji: '🏢',
    short: 'Sự nghiệp, danh tiếng, vị thế xã hội, mục tiêu lớn',
    detail: 'Nhà 10 là nhà của sự nghiệp và danh tiếng — nơi Midheaven (MC) tọa lạc. Nó cho thấy nghề nghiệp phù hợp với bạn và mức độ bạn được xã hội ghi nhận.',
  },
  // Góc cạnh
  {
    id: 'conjunction', term: 'Conjunction (Hội Tụ)', symbol: '☌', category: 'aspect', emoji: '⚡',
    short: 'Hai hành tinh cùng vị trí — năng lượng hòa trộn mạnh mẽ',
    detail: 'Conjunction xảy ra khi hai hành tinh ở gần nhau (~0-8°). Năng lượng của chúng hòa trộn và khuếch đại lẫn nhau. Có thể rất mạnh và tích cực (nếu hai hành tinh tương thích) hoặc gây bão (nếu không tương thích).',
  },
  {
    id: 'trine', term: 'Trine (Tam Giác)', symbol: '△', category: 'aspect', emoji: '✨',
    short: 'Góc 120° — dòng chảy năng lượng tự nhiên, hài hòa',
    detail: 'Trine là góc cạnh may mắn nhất — năng lượng chảy tự nhiên và dễ dàng. Trong Synastry, trine giữa hành tinh của hai người tạo nên sự đồng điệu và thoải mái tự nhiên.',
  },
  {
    id: 'square', term: 'Square (Vuông Góc)', symbol: '□', category: 'aspect', emoji: '⚔️',
    short: 'Góc 90° — căng thẳng, xung đột nhưng tạo ra động lực',
    detail: 'Square tạo ra ma sát và thách thức, nhưng cũng là nguồn động lực để hành động và thay đổi. Trong mối quan hệ, square tạo ra sức nóng — đôi khi là cuốn hút, đôi khi là xung đột.',
  },
  {
    id: 'opposition', term: 'Opposition (Đối Lập)', symbol: '☍', category: 'aspect', emoji: '⚖️',
    short: 'Góc 180° — căng thẳng giữa hai cực đối nhau',
    detail: 'Opposition đặt hai hành tinh ở hai đầu đối nhau. Tạo ra cảm giác kéo giằng giữa hai nhu cầu hoặc hai người. Thường biểu hiện qua mâu thuẫn trong mối quan hệ nhưng cũng tạo ra sự thu hút mạnh mẽ.',
  },
];

export function searchGlossary(query: string): GlossaryTerm[] {
  const q = query.toLowerCase().trim();
  if (!q) return GLOSSARY_TERMS;
  return GLOSSARY_TERMS.filter(t =>
    t.term.toLowerCase().includes(q) ||
    t.short.toLowerCase().includes(q) ||
    t.detail.toLowerCase().includes(q)
  );
}

export const GLOSSARY_CATEGORIES = [
  { id: 'all', label: 'Tất Cả', emoji: '📚' },
  { id: 'concept', label: 'Khái Niệm', emoji: '💡' },
  { id: 'planet', label: 'Hành Tinh', emoji: '🌍' },
  { id: 'house', label: 'Nhà', emoji: '🏠' },
  { id: 'aspect', label: 'Góc Cạnh', emoji: '📐' },
];
