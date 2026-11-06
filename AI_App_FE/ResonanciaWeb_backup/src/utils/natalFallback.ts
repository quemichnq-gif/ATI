// Client-side fallback cho luận giải Natal Chart & Hướng nghiệp
// Đảm bảo người dùng luôn luôn nhận được phân tích chiêm tinh học sâu sắc,
// kể cả khi server offline hoặc kết nối backend gặp sự cố.

interface ProfileLike {
  name?: string;
  sun?: string;
  moon?: string;
  mercury?: string;
  venus?: string;
  mars?: string;
  jupiter?: string;
  saturn?: string;
  ascendant?: string;
  mc?: string;
  house10?: string;
  fireRatio?: number;
  earthRatio?: number;
  airRatio?: number;
  waterRatio?: number;
}

const CAREER_MC_PROFILES: Record<string, { archetype: string; desc: string; fields: string[]; advice: string }> = {
  'Bạch Dương': {
    archetype: 'Người Tiên Phong Độc Lập',
    desc: 'Bạn mang khí chất của một người khởi xướng, ghét sự rập khuôn và luôn khát khao làm chủ vận mệnh nghề nghiệp. Bạn phát huy phong độ cao nhất khi được trao quyền tự quyết và mở lối các dự án mới.',
    fields: ['Khởi nghiệp / Sáng lập dự án', 'Quản trị điều hành & Ứng biến rủi ro', 'Công nghệ sáng tạo', 'Phát triển thị trường mới'],
    advice: 'Rèn luyện tính kiên nhẫn ở giai đoạn duy trì; phối hợp nhịp nhàng với đội nhóm thay vì ôm đồm đơn độc.',
  },
  'Kim Ngưu': {
    archetype: 'Kiến Trúc Sư Giá Trị Bền Vững',
    desc: 'Trực giác thực tế nhạy bén về giá trị vật chất và sự vững chắc. Phong cách làm việc điềm đạm, có phương pháp bài bản và đặc biệt kiên định với các mục tiêu dài hạn.',
    fields: ['Tài chính - Ngân hàng / Thẩm định đầu tư', 'Kiến trúc & Bất động sản', 'Nghệ thuật ứng dụng & Thiết kế cao cấp', 'Quản lý chuỗi cung ứng'],
    advice: 'Tránh rơi vào vùng an toàn quá lâu; hãy cởi mở đón nhận công nghệ mới và linh hoạt đổi mới quy trình.',
  },
  'Song Tử': {
    archetype: 'Chiến Lược Gia Truyền Thông & Kết Nối Tri Thức',
    desc: 'Trí tuệ linh hoạt, khả năng tổng hợp dữ liệu đa nguồn nhanh chóng và năng khiếu ngôn ngữ vượt trội giúp bạn trở thành cầu nối thông tin đắc lực trong mọi tổ chức.',
    fields: ['Truyền thông & Báo chí đa nền tảng', 'Marketing sáng tạo & Quảng cáo', 'Quan hệ đối ngoại & Phát triển thị trường', 'Đào tạo & Xuất bản'],
    advice: 'Tập trung năng lượng vào các mục tiêu then chốt, tránh để sự tò mò vô tận làm phân tán tiến độ.',
  },
  'Cự Giải': {
    archetype: 'Người Kiến Tạo Không Gian Nuôi Dưỡng & Thấu Cảm',
    desc: 'Năng lực thấu cảm sâu sắc, khả năng nắm bắt tâm lý đối tác và xây dựng văn hóa gắn kết. Bạn kiến tạo ra những sản phẩm/dịch vụ mang lại sự an tâm tuyệt đối.',
    fields: ['Quản trị nguồn nhân lực (HR) & Phát triển tổ chức', 'Tư vấn tâm lý & Chăm sóc sức khỏe', 'F&B, Khách sạn nghỉ dưỡng & Dân dụng', 'Giáo dục & Hoạt động xã hội'],
    advice: 'Tách bạch cảm xúc cá nhân khi đàm phán; rèn luyện sự quyết đoán lý trí khi xử lý xung đột.',
  },
  'Sư Tử': {
    archetype: 'Nhà Lãnh Đạo Sân Khấu Lớn & Truyền Cảm Hứng',
    desc: 'Khí chất tự tin, phong thái đĩnh đạc và sức hút tự nhiên giúp bạn dễ dàng thu hút nguồn lực và truyền ngọn lửa nhiệt huyết cho tập thể.',
    fields: ['Quản lý nghệ thuật & Giải trí', 'Xây dựng thương hiệu cá nhân / PR cấp cao', 'Lãnh đạo doanh nghiệp & Diễn thuyết', 'Thời trang & Sự kiện quy mô lớn'],
    advice: 'Học cách đón nhận ý kiến phản biện đa chiều từ cộng sự và chia sẻ hào quang cùng tập thể.',
  },
  'Xử Nữ': {
    archetype: 'Chuyên Gia Tối Ưu Hệ Thống & Chuẩn Mực Hoàn Hảo',
    desc: 'Tư duy phân tích sắc lẹm, sự tỉ mỉ đến từng chi tiết và tiêu chuẩn làm việc mẫu mực. Bạn là người biến những quy trình phức tạp thành cỗ máy vận hành trơn tru.',
    fields: ['Phân tích dữ liệu & Khoa học máy tính', 'Kiểm toán, Pháp chế & Quản lý chất lượng (QA)', 'Nghiên cứu khoa học & Y sinh', 'Tư vấn tối ưu hóa quy trình'],
    advice: 'Chấp nhận nguyên lý "đủ tốt để bứt phá", tránh để chủ nghĩa hoàn hảo làm chậm nhịp độ cơ hội.',
  },
  'Thiên Bình': {
    archetype: 'Nhà Ngoại Giao Chiến Lược & Cân Bằng Lợi Ích',
    desc: 'Khả năng dung hòa tuyệt vời giữa thẩm mỹ tinh tế và nghệ thuật đàm phán. Bạn xuất sắc trong việc xây dựng đối tác chiến lược và kiến tạo các thỏa thuận đôi bên cùng có lợi.',
    fields: ['Luật thương mại & Trọng tài kinh tế', 'Quan hệ đối tác (Partnerships) & Kinh doanh quốc tế', 'Thiết kế nội thất, Mỹ thuật & Giám tuyển', 'Tư vấn nhân sự cấp cao'],
    advice: 'Quyết đoán hơn trong việc chốt quyết định dưới áp lực thời gian, tin tưởng vào trực giác của bản thân.',
  },
  'Bọ Cạp': {
    archetype: 'Chiến Lược Gia Chiều Sâu & Xử Lý Khủng Hoảng',
    desc: 'Tầm nhìn thấu suốt bản chất, khả năng giữ bí mật và bản lĩnh phi thường trước nghịch cảnh. Càng trong tình thế khó khăn, bạn càng chứng tỏ nội lực sắc bén.',
    fields: ['Đầu tư mạo hiểm (VC) & M&A', 'An ninh mạng & Phân tích rủi ro chiến lược', 'Nghiên cứu tâm lý học chuyên sâu', 'Tái cấu trúc & Quản trị khủng hoảng'],
    advice: 'Học cách ủy quyền và đặt niềm tin minh bạch vào các cộng sự thân tín để mở rộng quy mô.',
  },
  'Nhân Mã': {
    archetype: 'Nhà Khai Phóng Tầm Nhìn & Cố Vấn Toàn Cầu',
    desc: 'Tư duy vĩ mô rộng mở, tinh thần khám phá không biên giới và đam mê truyền bá tri thức. Bạn luôn hướng tầm mắt ra thế giới rộng lớn với năng lượng lạc quan dồi dào.',
    fields: ['Hợp tác quốc tế & Thương mại toàn cầu', 'Nghiên cứu học thuật, Giảng dạy & Xuất bản', 'Du lịch cao cấp & Ngoại giao văn hóa', 'Chiến lược phát triển tầm nhìn xa'],
    advice: 'Kết hợp cùng những cộng sự tỉ mỉ để hiện thực hóa các ý tưởng vĩ mô vào hành động thực tế cụ thể.',
  },
  'Ma Kết': {
    archetype: 'Nhà Kiến Tạo Đế Chế & Kỷ Luật Thượng Tầng',
    desc: 'Sức bền phi thường, đạo đức nghề nghiệp gương mẫu và tư duy xây dựng di sản bền vững. Bạn tiến lên từng bước vững chắc, được tín nhiệm bởi uy tín và tinh thần trách nhiệm.',
    fields: ['Điều hành doanh nghiệp cấp cao (C-Level)', 'Bất động sản công nghiệp & Hạ tầng', 'Quản lý quỹ đầu tư giá trị', 'Chiến lược quản trị bền vững'],
    advice: 'Học cách tưởng thưởng cho bản thân sau mỗi cột mốc và giữ cân bằng giữa công việc và đời sống riêng.',
  },
  'Bảo Bình': {
    archetype: 'Nhà Canh Tân Đột Phá & Tiên Tri Tương Lai',
    desc: 'Tư duy đi trước thời đại, tinh thần nhân đạo vì tiến bộ xã hội và không bị trói buộc bởi định kiến cũ kỹ. Bạn có biệt tài ứng dụng công nghệ để giải quyết bài toán lớn.',
    fields: ['Trí tuệ nhân tạo (AI), Blockchain & Tech', 'Năng lượng tái tạo & Khoa học tương lai', 'Tổ chức phi chính phủ & Đổi mới xã hội', 'Thiết kế sản phẩm số cách mạng'],
    advice: 'Chuyển hóa các ý tưởng trừu tượng thành ngôn ngữ gần gũi, kết nối cảm xúc chân thực với người đồng hành.',
  },
  'Song Ngư': {
    archetype: 'Nghệ Sĩ Trực Giác & Sứ Giả Hàn Gắn Tâm Hồn',
    desc: 'Trực giác thiên bẩm, trí tưởng tượng không giới hạn và lòng bao dung sâu sắc. Bạn chạm đến trái tim người khác bằng những giá trị nhân văn và sáng tạo lay động.',
    fields: ['Điện ảnh, Âm nhạc & Nghệ thuật thị giác', 'Tâm lý trị liệu & Trị liệu nghệ thuật', 'Thiết kế trải nghiệm cảm xúc (UX)', 'Bảo tồn văn hóa & Hoạt động thiện nguyện'],
    advice: 'Thiết lập ranh giới năng lượng rõ ràng và áp dụng kỷ luật mềm để bảo vệ nguồn cảm hứng sáng tạo.',
  },
};

export function generateClientCareerAnalysis(profile: ProfileLike): string {
  const name = profile.name || 'Bạn';
  const sun = profile.sun || 'Ma Kết';
  const moon = profile.moon || 'Kim Ngưu';
  const mc = (profile.mc || profile.house10 || sun || 'Ma Kết').replace(/Midheaven|MC/gi, '').trim();

  let matched = 'Ma Kết';
  for (const k of Object.keys(CAREER_MC_PROFILES)) {
    if (mc.includes(k) || sun.includes(k)) {
      matched = k;
      break;
    }
  }

  const p = CAREER_MC_PROFILES[matched] || CAREER_MC_PROFILES['Ma Kết'];
  const saturn = profile.saturn || 'Sao Thổ';
  const jupiter = profile.jupiter || 'Sao Mộc';

  return `### 🌟 BẢN ĐỒ HƯỚNG NGHIỆP CHIÊM TINH HỌC CHO ${name.toUpperCase()}

**Định Vị Thiên Phú:** ${p.archetype}
*(Phân tích tương tác giữa Midheaven tại ${matched}, Mặt Trời ${sun} và Mặt Trăng ${moon})*

---

#### 1. Khí Chất Nghề Nghiệp & Thương Hiệu Cá Nhân
Với Trung Thiên (Midheaven - MC) tọa lạc tại **${matched}**, bạn xuất hiện trước thế giới như một ${p.archetype}. ${p.desc} Sự kết hợp cùng bản lĩnh cốt lõi của Mặt Trời ${sun} giúp bạn không chỉ có tầm nhìn mà còn có động lực nội tại mạnh mẽ để hiện thực hóa tham vọng.

#### 2. Sở Trường Năng Lực & Phong Cách Thực Thi
• **Tư duy & Giải quyết vấn đề:** Sự nhạy bén của Mặt Trăng ${moon} tạo nên một trực giác nghề nghiệp chính xác, giúp bạn phát hiện cơ hội hoặc rủi ro trước khi chúng hiển hiện.
• **Thế mạnh độc bản:** Bạn có khả năng làm chủ chuyên môn sâu, phong thái đĩnh đạc và tạo dựng được lòng tin tự nhiên nơi đối tác cũng như cấp trên.

#### 3. Các Lĩnh Vực & Môi Trường Bứt Phá Lý Tưởng
Để tài năng nở rộ nhất, bạn nên ưu tiên những môi trường tôn trọng sự tự chủ, có lộ trình phát triển minh bạch và giá trị thực chất:
${p.fields.map(f => `  • ${f}`).join('\n')}

#### 4. Bài Học Kỷ Luật (${saturn}) & Đòn Bẩy Thăng Tiến (${jupiter})
• **Thách thức cần vượt qua:** ${p.advice}
• **Kim chỉ nam sự nghiệp:** Sao Mộc (${jupiter}) bảo trợ cho sự mở rộng tri thức và quan hệ chất lượng cao. Đừng bao giờ ngừng nâng cấp kỹ năng chuyên môn cốt lõi. Hãy biến kỷ luật thép thành thói quen hằng ngày, bạn chắc chắn sẽ gặt hái vị thế vững chắc và danh tiếng xứng đáng với tầm vóc của mình.`;
}

export function generateClientNatalAnalysis(profile: ProfileLike): string {
  const sun = profile.sun || 'Ma Kết';
  const moon = profile.moon || 'Kim Ngưu';
  const asc = profile.ascendant || 'Nhân Mã';
  const mercury = profile.mercury || 'Ma Kết';
  const venus = profile.venus || 'Bọ Cạp';
  const mars = profile.mars || 'Bạch Dương';
  const mc = profile.mc || 'Thiên Bình';

  const fire = profile.fireRatio ?? 25;
  const earth = profile.earthRatio ?? 35;
  const air = profile.airRatio ?? 20;
  const water = profile.waterRatio ?? 20;

  const elementsSorted = [
    { name: 'Thổ', val: earth },
    { name: 'Hoả', val: fire },
    { name: 'Khí', val: air },
    { name: 'Thuỷ', val: water },
  ].sort((a, b) => b.val - a.val);

  const dominant = elementsSorted[0];

  return `## 1. Tính Cách
Bản sắc của bạn được định hình bởi sự kết hợp độc đáo của bộ ba trụ cột (Big 3): Bản ngã kiên cường của Mặt Trời ${sun}, chiều sâu tâm lý từ Mặt Trăng ${moon} và chiếc 'mặt nạ xã hội' lôi cuốn của Cung Mọc ${asc}. Bạn sở hữu tư duy có chiều sâu, không thích những mối quan hệ hời hợt hay sự phù phiếm. Cách bạn bước vào thế giới là sự tự chủ, điềm tĩnh nhưng chứa đựng ngọn lửa nội lực âm thầm rất lớn.

## 2. Cảm Xúc
Mặt Trăng tại ${moon} bộc lộ một thế giới nội tâm phong phú và đòi hỏi sự an toàn tinh thần rất cao. Dưới áp lực, bạn có xu hướng tự xử lý cảm xúc trong không gian riêng trước khi chia sẻ. Bạn rất tinh tế trong việc cảm nhận năng lượng xung quanh, trân trọng những giá trị chân thực và sẵn sàng là chỗ dựa vững chãi nhất cho những người xứng đáng với niềm tin của bạn.

## 3. Sự Nghiệp
Với Trung Thiên (MC) tại ${mc} cùng tư duy sắc sảo từ Thủy tinh ${mercury}, con đường công danh của bạn gắn liền với khả năng xây dựng hệ thống, đàm phán chiến lược và tối ưu hóa nguồn lực. Bạn không chạy theo những ảo vọng ngắn hạn mà luôn có lộ trình dài hạn rõ ràng. Bạn đạt phong độ rực rỡ nhất trong các vai trò lãnh đạo chuyên môn, hoạch định dự án hoặc quản trị chiến lược.

## 4. Tình Yêu
Sao Kim tại ${venus} kết hợp cùng Hỏa tinh ${mars} tạo nên một phong cách yêu mãnh liệt, chân thành và tuyệt đối trung thành. Bạn không vội vã trong chuyện tình cảm; bạn cần thời gian để quan sát và thẩm định. Khi đã tìm được người tri kỷ đồng điệu về tần số tâm hồn, bạn sẽ dành trọn sự ấm áp, chở che và tận tụy để vun đắp tổ ấm vững bền.

## 5. Điểm Mạnh
Thế mạnh vượt trội của bạn là năng lực tập trung phi thường, sự kiên nhẫn và khả năng phục hồi sau thất bại cực kỳ đáng nể. Bạn sở hữu trực giác thực tế nhạy bén, biết cách biến các ý tưởng trừu tượng thành kết quả cụ thể. Thách thức lớn nhất là xu hướng ôm đồm trách nhiệm và tự khắt khe quá mức với bản thân; hãy học cách buông lỏng và cho phép mình được nghỉ ngơi.

## 6. Nguyên Tố
Cấu trúc năng lượng bản mệnh: Nguyên tố ${dominant.name} chiếm ưu thế (${dominant.val}%), Đất ${earth}%, Lửa ${fire}%, Khí ${air}%, Nước ${water}%. Sự phân bổ này mang đến sự vững vàng trong hành động kết hợp với khả năng thích ứng linh hoạt. Năng lượng trội giúp bạn giữ vững lập trường ngay cả khi nghịch cảnh bủa vây, đồng thời bảo toàn sự tỉnh táo cần thiết trong mọi quyết định quan trọng.

## 7. Lời Khuyên
Hãy nhớ rằng giá trị của bạn không chỉ đo bằng những thành tựu hữu hình. Hãy học cách tin tưởng và ủy quyền nhiều hơn cho đồng đội, mở lòng đón nhận sự giúp đỡ từ những người yêu thương. Dành thời gian kết nối với thiên nhiên và nuôi dưỡng đời sống tinh thần sẽ giúp bạn tái tạo nguồn sinh khí dồi dào.

## 8. Người Lý Tưởng
Mẫu người đồng điệu lý tưởng với bạn là người sở hữu trí tuệ sâu sắc, tính cách chín chắn và có chung hệ giá trị sống tử tế, bền vững. Sự kết hợp giữa năng lượng ổn định của nhóm Đất và sự thấu hiểu ấm áp của nhóm Nước sẽ tạo nên một mối quan hệ tri kỷ bền vững theo năm tháng, nơi cả hai cùng nâng đỡ nhau phát triển trọn vẹn.`;
}
