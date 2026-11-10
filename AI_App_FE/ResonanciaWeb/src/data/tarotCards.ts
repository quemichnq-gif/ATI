// Danh sách 78 lá bài Tarot Rider-Waite-Smith đầy đủ (22 Major Arcana + 56 Minor Arcana)
// Nguồn ảnh: Rider-Waite (1909) qua sixseeds/tarot-api
// Hỗ trợ cả URL gốc, URL mirror CDN và ảnh tối ưu cục bộ (/assets/tarot/)

export interface TarotCard {
  id: string; // e.g. 'ar00', 'wa01', 'cu10'
  filename: string; // e.g. 'ar00.jpg'
  name: string; // Tên tiếng Anh gốc Rider-Waite
  vi: string; // Tên tiếng Việt
  arcana: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  element: 'Hoả' | 'Thuỷ' | 'Khí' | 'Thổ';
  originalUrl: string; // URL gốc từ cards.json repo
  localImage: string; // Ảnh local tối ưu trong public/assets/tarot/
  fallbackUrl: string; // Mirror GitHub Pages
  cdnUrl: string; // Mirror Raw GitHub
  meaningUpright: string;
  meaningReversed: string;
  keywordsUpright: string[];
  keywordsReversed: string[];
}

export const TAROT_BACK_IMAGE = '/assets/tarot/back.jpg';
export const TAROT_BACK_FALLBACK = 'https://sixseeds.github.io/tarot-api/cards/back.jpg';

export const TAROT_CARDS: TarotCard[] = [
  {
    "id": "ar00",
    "filename": "ar00.jpg",
    "name": "The Fool",
    "vi": "Kẻ Điên",
    "arcana": "major",
    "element": "Khí",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar00.jpg",
    "localImage": "/assets/tarot/ar00.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar00.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar00.jpg",
    "meaningUpright": "Khởi đầu mới, mạo hiểm, tinh thần tự do, tiềm năng vô hạn và niềm tin ngây thơ vào cuộc sống.",
    "meaningReversed": "Liều lĩnh, mù quáng, bất cẩn, do dự trước khởi đầu mới hoặc rủi ro không lường trước.",
    "keywordsUpright": [
      "Khởi đầu",
      "Tự do",
      "Tiềm năng",
      "Ngây thơ"
    ],
    "keywordsReversed": [
      "Liều lĩnh",
      "Bất cẩn",
      "Do dự"
    ]
  },
  {
    "id": "ar01",
    "filename": "ar01.jpg",
    "name": "The Magician",
    "vi": "Ảo thuật gia",
    "arcana": "major",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar01.jpg",
    "localImage": "/assets/tarot/ar01.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar01.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar01.jpg",
    "meaningUpright": "Ý chí mạnh mẽ, tài năng hiện thực hóa ước mơ, nguồn năng lượng sáng tạo và làm chủ vận mệnh.",
    "meaningReversed": "Lợi dụng tài năng, lừa dối, thao túng, tiềm năng bị tắc nghẽn hoặc thiếu định hướng.",
    "keywordsUpright": [
      "Ý chí",
      "Sáng tạo",
      "Hiện thực hóa",
      "Năng lực"
    ],
    "keywordsReversed": [
      "Thao túng",
      "Thiếu tập trung",
      "Tắc nghẽn"
    ]
  },
  {
    "id": "ar02",
    "filename": "ar02.jpg",
    "name": "The High Priestess",
    "vi": "Nữ Tư Tế",
    "arcana": "major",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar02.jpg",
    "localImage": "/assets/tarot/ar02.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar02.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar02.jpg",
    "meaningUpright": "Trực giác sâu sắc, bí ẩn tiềm thức, tri thức nội tâm và sự tĩnh lặng soi sáng tâm hồn.",
    "meaningReversed": "Bỏ qua trực giác, giấu giếm bí mật, xa cách cảm xúc hoặc hoài nghi bản thân.",
    "keywordsUpright": [
      "Trực giác",
      "Bí ẩn",
      "Tiềm thức",
      "Tri thức"
    ],
    "keywordsReversed": [
      "Xa cách",
      "Bỏ qua giác quan",
      "Bí mật"
    ]
  },
  {
    "id": "ar03",
    "filename": "ar03.jpg",
    "name": "The Empress",
    "vi": "Nữ Hoàng",
    "arcana": "major",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar03.jpg",
    "localImage": "/assets/tarot/ar03.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar03.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar03.jpg",
    "meaningUpright": "Tình mẫu tử, sự phong phú, vẻ đẹp trù phú của thiên nhiên, sáng tạo nghệ thuật và nuôi dưỡng.",
    "meaningReversed": "Phụ thuộc cảm xúc, bế tắc sáng tạo, bỏ bê bản thân hoặc áp đặt quá mức.",
    "keywordsUpright": [
      "Phong phú",
      "Nuôi dưỡng",
      "Vẻ đẹp",
      "Sinh sôi"
    ],
    "keywordsReversed": [
      "Bế tắc",
      "Áp đặt",
      "Bỏ bê bản thân"
    ]
  },
  {
    "id": "ar04",
    "filename": "ar04.jpg",
    "name": "The Emperor",
    "vi": "Hoàng Đế",
    "arcana": "major",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar04.jpg",
    "localImage": "/assets/tarot/ar04.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar04.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar04.jpg",
    "meaningUpright": "Quyền lực, cấu trúc trật tự, tính kỷ luật, sự bảo hộ vững chãi và năng lực lãnh đạo.",
    "meaningReversed": "Chuyên quyền, độc đoán, cứng nhắc, mất kiểm soát hoặc lạm dụng quyền lực.",
    "keywordsUpright": [
      "Quyền lực",
      "Kỷ luật",
      "Trật tự",
      "Lãnh đạo"
    ],
    "keywordsReversed": [
      "Độc đoán",
      "Cứng nhắc",
      "Mất kiểm soát"
    ]
  },
  {
    "id": "ar05",
    "filename": "ar05.jpg",
    "name": "The Hierophant",
    "vi": "Giáo Hoàng",
    "arcana": "major",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar05.jpg",
    "localImage": "/assets/tarot/ar05.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar05.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar05.jpg",
    "meaningUpright": "Truyền thống văn hóa, đức tin, hướng dẫn tinh thần, đạo đức chuẩn mực và việc học hỏi.",
    "meaningReversed": "Phá vỡ quy tắc cũ, giáo điều mù quáng, gò bó tư duy hoặc lạc lối niềm tin.",
    "keywordsUpright": [
      "Truyền thống",
      "Đạo đức",
      "Cố vấn",
      "Đức tin"
    ],
    "keywordsReversed": [
      "Nổi loạn",
      "Giáo điều",
      "Gò bó"
    ]
  },
  {
    "id": "ar06",
    "filename": "ar06.jpg",
    "name": "The Lovers",
    "vi": "Đôi Tình Nhân",
    "arcana": "major",
    "element": "Khí",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar06.jpg",
    "localImage": "/assets/tarot/ar06.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar06.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar06.jpg",
    "meaningUpright": "Tình yêu chân thành, hòa hợp tâm hồn, sự lựa chọn giá trị sống và gắn kết bền chặt.",
    "meaningReversed": "Mâu thuẫn giá trị, chia rẽ tình cảm, lựa chọn sai lầm hoặc thiếu cam kết.",
    "keywordsUpright": [
      "Tình yêu",
      "Hòa hợp",
      "Lựa chọn",
      "Gắn kết"
    ],
    "keywordsReversed": [
      "Mâu thuẫn",
      "Chia rẽ",
      "Lựa chọn sai"
    ]
  },
  {
    "id": "ar07",
    "filename": "ar07.jpg",
    "name": "The Chariot",
    "vi": "Cỗ Xe",
    "arcana": "major",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar07.jpg",
    "localImage": "/assets/tarot/ar07.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar07.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar07.jpg",
    "meaningUpright": "Chiến thắng nhờ ý chí kiên định, kiểm soát xung đột nội tâm và quyết tâm tiến về phía trước.",
    "meaningReversed": "Mất phương hướng, hiếu thắng quá mức, thiếu tự chủ hoặc gặp trở ngại cản đường.",
    "keywordsUpright": [
      "Ý chí",
      "Quyết tâm",
      "Tiến lên",
      "Chiến thắng"
    ],
    "keywordsReversed": [
      "Mất kiểm soát",
      "Hiếu thắng",
      "Chệch hướng"
    ]
  },
  {
    "id": "ar08",
    "filename": "ar08.jpg",
    "name": "Strength",
    "vi": "Sức Mạnh",
    "arcana": "major",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar08.jpg",
    "localImage": "/assets/tarot/ar08.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar08.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar08.jpg",
    "meaningUpright": "Sức mạnh từ sự kiên nhẫn dịu dàng, lòng dũng cảm nội tâm, kiềm chế bản năng hoang dã.",
    "meaningReversed": "Tự ti, nghi ngờ bản thân, bộc phát nóng nảy hoặc yếu mềm trước khó khăn.",
    "keywordsUpright": [
      "Dũng cảm",
      "Kiên nhẫn",
      "Dịu dàng",
      "Nội lực"
    ],
    "keywordsReversed": [
      "Tự ti",
      "Nóng nảy",
      "Mất kiên nhẫn"
    ]
  },
  {
    "id": "ar09",
    "filename": "ar09.jpg",
    "name": "The Hermit",
    "vi": "Ẩn Sĩ",
    "arcana": "major",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar09.jpg",
    "localImage": "/assets/tarot/ar09.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar09.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar09.jpg",
    "meaningUpright": "Tìm về nội tâm, chiêm nghiệm sâu sắc, ánh sáng chân lý soi đường và sự tĩnh lặng cần thiết.",
    "meaningReversed": "Cô lập cực đoan, cô đơn lạc lõng, chối bỏ sự giúp đỡ hoặc ngại bước ra thế giới.",
    "keywordsUpright": [
      "Chiêm nghiệm",
      "Nội tâm",
      "Ánh sáng",
      "Tĩnh lặng"
    ],
    "keywordsReversed": [
      "Cô độc",
      "Lạc lõng",
      "Thu mình"
    ]
  },
  {
    "id": "ar10",
    "filename": "ar10.jpg",
    "name": "Wheel of Fortune",
    "vi": "Bánh Xe Số Phận",
    "arcana": "major",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar10.jpg",
    "localImage": "/assets/tarot/ar10.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar10.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar10.jpg",
    "meaningUpright": "Vận mệnh xoay vần, cơ hội bất ngờ, chu kỳ mới bắt đầu và bước ngoặt định mệnh.",
    "meaningReversed": "Biến cố không thuận lợi, chống cự thay đổi, xui xẻo tạm thời hoặc chu kỳ cũ lặp lại.",
    "keywordsUpright": [
      "Định mệnh",
      "Cơ hội",
      "Chu kỳ",
      "Bước ngoặt"
    ],
    "keywordsReversed": [
      "Kém may",
      "Chống cự",
      "Trì trệ"
    ]
  },
  {
    "id": "ar11",
    "filename": "ar11.jpg",
    "name": "Justice",
    "vi": "Công Lý",
    "arcana": "major",
    "element": "Khí",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar11.jpg",
    "localImage": "/assets/tarot/ar11.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar11.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar11.jpg",
    "meaningUpright": "Công bằng, sự thật sáng tỏ, nhân quả công minh và quyết định thấu đáo dựa trên lý trí.",
    "meaningReversed": "Bất công, phán xét phiến diện, thiếu trung thực hoặc trốn tránh trách nhiệm.",
    "keywordsUpright": [
      "Công bằng",
      "Chân lý",
      "Lý trí",
      "Nhân quả"
    ],
    "keywordsReversed": [
      "Bất công",
      "Thiên vị",
      "Thiếu trung thực"
    ]
  },
  {
    "id": "ar12",
    "filename": "ar12.jpg",
    "name": "The Hanged Man",
    "vi": "Người Bị Treo",
    "arcana": "major",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar12.jpg",
    "localImage": "/assets/tarot/ar12.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar12.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar12.jpg",
    "meaningUpright": "Dừng lại để nhìn nhận đa chiều, hy sinh vì mục đích lớn hơn, buông bỏ chấp niệm.",
    "meaningReversed": "Trì hoãn vô ích, hy sinh vô nghĩa, cứng đầu bám chấp hoặc bế tắc không lối thoát.",
    "keywordsUpright": [
      "Góc nhìn mới",
      "Buông bỏ",
      "Chiêm nghiệm",
      "Chờ đợi"
    ],
    "keywordsReversed": [
      "Bế tắc",
      "Trì hoãn",
      "Hy sinh vô ích"
    ]
  },
  {
    "id": "ar13",
    "filename": "ar13.jpg",
    "name": "Death",
    "vi": "Cái Chết",
    "arcana": "major",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar13.jpg",
    "localImage": "/assets/tarot/ar13.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar13.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar13.jpg",
    "meaningUpright": "Sự chuyển hóa sâu sắc, kết thúc một chu kỳ cũ để mở đường tái sinh cho điều tốt đẹp hơn.",
    "meaningReversed": "Sợ hãi thay đổi, níu kéo quá khứ, kháng cự quy luật tự nhiên hoặc chậm đổi mới.",
    "keywordsUpright": [
      "Tái sinh",
      "Chuyển hóa",
      "Kết thúc cũ",
      "Đổi mới"
    ],
    "keywordsReversed": [
      "Níu kéo",
      "Sợ thay đổi",
      "Kháng cự"
    ]
  },
  {
    "id": "ar14",
    "filename": "ar14.jpg",
    "name": "Temperance",
    "vi": "Điều Độ",
    "arcana": "major",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar14.jpg",
    "localImage": "/assets/tarot/ar14.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar14.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar14.jpg",
    "meaningUpright": "Cân bằng cuộc sống, kiên nhẫn dung hợp, chữa lành tổn thương và sự điều hòa tuyệt mỹ.",
    "meaningReversed": "Mất thăng bằng, xung đột thái quá, nóng vội hấp tấp hoặc thiếu tiết chế.",
    "keywordsUpright": [
      "Cân bằng",
      "Hòa hợp",
      "Chữa lành",
      "Tiết chế"
    ],
    "keywordsReversed": [
      "Mất cân bằng",
      "Xung đột",
      "Nóng vội"
    ]
  },
  {
    "id": "ar15",
    "filename": "ar15.jpg",
    "name": "The Devil",
    "vi": "Ác Quỷ",
    "arcana": "major",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar15.jpg",
    "localImage": "/assets/tarot/ar15.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar15.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar15.jpg",
    "meaningUpright": "Nhận diện xiềng xích ràng buộc, cám dỗ vật chất, ảo tưởng sợ hãi cần được giải phóng.",
    "meaningReversed": "Thoát khỏi ràng buộc độc hại, thức tỉnh tự do, buông bỏ ám ảnh và lấy lại quyền kiểm soát.",
    "keywordsUpright": [
      "Ràng buộc",
      "Cám dỗ",
      "Nhận thức",
      "Thử thách"
    ],
    "keywordsReversed": [
      "Giải phóng",
      "Tự do",
      "Vượt qua cám dỗ"
    ]
  },
  {
    "id": "ar16",
    "filename": "ar16.jpg",
    "name": "The Tower",
    "vi": "Tòa Tháp",
    "arcana": "major",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar16.jpg",
    "localImage": "/assets/tarot/ar16.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar16.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar16.jpg",
    "meaningUpright": "Đổ vỡ đột ngột giải phóng cấu trúc giả tạo, thức tỉnh sự thật và thanh lọc toàn diện.",
    "meaningReversed": "Thoát hiểm trong gang tấc, sợ đối mặt khủng hoảng, trì hoãn sự sụp đổ tất yếu.",
    "keywordsUpright": [
      "Thức tỉnh",
      "Đột phá",
      "Thanh lọc",
      "Chân lý"
    ],
    "keywordsReversed": [
      "Trì hoãn",
      "Sợ khủng hoảng",
      "Bất an"
    ]
  },
  {
    "id": "ar17",
    "filename": "ar17.jpg",
    "name": "The Star",
    "vi": "Ngôi Sao",
    "arcana": "major",
    "element": "Khí",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar17.jpg",
    "localImage": "/assets/tarot/ar17.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar17.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar17.jpg",
    "meaningUpright": "Hy vọng rạng ngời, niềm tin tái sinh, nguồn cảm hứng sáng tạo và bình yên tâm hồn.",
    "meaningReversed": "Mất niềm tin, tuyệt vọng tạm thời, bi quan chán nản hoặc thiếu cảm hứng sống.",
    "keywordsUpright": [
      "Hy vọng",
      "Bình yên",
      "Cảm hứng",
      "Niềm tin"
    ],
    "keywordsReversed": [
      "Mất hy vọng",
      "Bi quan",
      "Chán chường"
    ]
  },
  {
    "id": "ar18",
    "filename": "ar18.jpg",
    "name": "The Moon",
    "vi": "Mặt Trăng",
    "arcana": "major",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar18.jpg",
    "localImage": "/assets/tarot/ar18.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar18.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar18.jpg",
    "meaningUpright": "Ảo tưởng, chiều sâu vô thức, trực giác tinh tế giữa bóng tối và sự thật đang ẩn giấu.",
    "meaningReversed": "Sáng tỏ hiểu lầm, giải tỏa âu lo, nhìn thấu lừa dối và sự thật lộ diện.",
    "keywordsUpright": [
      "Trực giác",
      "Tiềm thức",
      "Bí ẩn",
      "Cảm xúc"
    ],
    "keywordsReversed": [
      "Sáng tỏ",
      "Tan biến ảo tưởng",
      "Giải tỏa"
    ]
  },
  {
    "id": "ar19",
    "filename": "ar19.jpg",
    "name": "The Sun",
    "vi": "Mặt Trời",
    "arcana": "major",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar19.jpg",
    "localImage": "/assets/tarot/ar19.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar19.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar19.jpg",
    "meaningUpright": "Niềm vui ngập tràn, thành công rực rỡ, năng lượng tích cực, sự ấm áp và thịnh vượng.",
    "meaningReversed": "Mây mù tạm thời, lạc quan tếu, niềm vui bị trì hoãn hoặc kiêu ngạo quá đà.",
    "keywordsUpright": [
      "Rạng rỡ",
      "Thành công",
      "Ấm áp",
      "Hạnh phúc"
    ],
    "keywordsReversed": [
      "U ám tạm thời",
      "Chậm trễ",
      "Lạc quan quá mức"
    ]
  },
  {
    "id": "ar20",
    "filename": "ar20.jpg",
    "name": "Judgement",
    "vi": "Phán Xét",
    "arcana": "major",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar20.jpg",
    "localImage": "/assets/tarot/ar20.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar20.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar20.jpg",
    "meaningUpright": "Sự thức tỉnh tâm linh, tái sinh từ bên trong, tiếng gọi sứ mệnh và tha thứ cho chính mình.",
    "meaningReversed": "Tự trách móc, phán xét bản thân gay gắt, chần chừ trước tiếng gọi thay đổi.",
    "keywordsUpright": [
      "Thức tỉnh",
      "Tái sinh",
      "Tha thứ",
      "Tiếng gọi"
    ],
    "keywordsReversed": [
      "Tự ti",
      "Phán xét khắt khe",
      "Do dự"
    ]
  },
  {
    "id": "ar21",
    "filename": "ar21.jpg",
    "name": "The World",
    "vi": "Thế Giới",
    "arcana": "major",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/ar21.jpg",
    "localImage": "/assets/tarot/ar21.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/ar21.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/ar21.jpg",
    "meaningUpright": "Viên mãn, trọn vẹn chu trình, hoàn thành mục tiêu lớn và hòa nhập hài hòa với vũ trụ.",
    "meaningReversed": "Chưa trọn vẹn, bỏ dở giữa chừng, trì hoãn bước cuối hoặc thiếu cảm giác hoàn tất.",
    "keywordsUpright": [
      "Viên mãn",
      "Trọn vẹn",
      "Thành tựu",
      "Hòa hợp"
    ],
    "keywordsReversed": [
      "Chưa xong",
      "Dang dở",
      "Trì trệ"
    ]
  },
  {
    "id": "wa01",
    "filename": "wa01.jpg",
    "name": "Ace of Wands",
    "vi": "Át Gậy",
    "arcana": "minor",
    "suit": "wands",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/wa01.jpg",
    "localImage": "/assets/tarot/wa01.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/wa01.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/wa01.jpg",
    "meaningUpright": "Nguồn cảm hứng sáng tạo dồi dào, khởi đầu dự án đầy nhiệt huyết và cơ hội bùng nổ.",
    "meaningReversed": "Thiếu cảm hứng, khởi đầu chậm chạp, trì hoãn năng lượng hoặc cạn kiệt đam mê.",
    "keywordsUpright": [
      "Gậy",
      "Át Gậy",
      "Hoả"
    ],
    "keywordsReversed": [
      "Ngược",
      "Gậy",
      "Cần lưu ý"
    ]
  },
  {
    "id": "wa02",
    "filename": "wa02.jpg",
    "name": "Two of Wands",
    "vi": "Hai Gậy",
    "arcana": "minor",
    "suit": "wands",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/wa02.jpg",
    "localImage": "/assets/tarot/wa02.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/wa02.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/wa02.jpg",
    "meaningUpright": "Lập kế hoạch tương lai, mở rộng tầm nhìn, tự tin bước ra khỏi vùng an toàn.",
    "meaningReversed": "Thiếu kế hoạch, sợ rủi ro, do dự trước quyết định lớn hoặc hạn chế tầm nhìn.",
    "keywordsUpright": [
      "Gậy",
      "Hai Gậy",
      "Hoả"
    ],
    "keywordsReversed": [
      "Ngược",
      "Gậy",
      "Cần lưu ý"
    ]
  },
  {
    "id": "wa03",
    "filename": "wa03.jpg",
    "name": "Three of Wands",
    "vi": "Ba Gậy",
    "arcana": "minor",
    "suit": "wands",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/wa03.jpg",
    "localImage": "/assets/tarot/wa03.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/wa03.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/wa03.jpg",
    "meaningUpright": "Tầm nhìn xa trông rộng, tiến bộ thuận lợi, chuẩn bị gặt hái kết quả từ những chuyến đi.",
    "meaningReversed": "Kế hoạch gặp trở ngại, kỳ vọng không đạt, trì hoãn chuyến đi hoặc thiếu kiên nhẫn.",
    "keywordsUpright": [
      "Gậy",
      "Ba Gậy",
      "Hoả"
    ],
    "keywordsReversed": [
      "Ngược",
      "Gậy",
      "Cần lưu ý"
    ]
  },
  {
    "id": "wa04",
    "filename": "wa04.jpg",
    "name": "Four of Wands",
    "vi": "Bốn Gậy",
    "arcana": "minor",
    "suit": "wands",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/wa04.jpg",
    "localImage": "/assets/tarot/wa04.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/wa04.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/wa04.jpg",
    "meaningUpright": "Ăn mừng thành công, mái ấm sum vầy, sự hòa thuận, niềm vui và nền tảng vững chắc.",
    "meaningReversed": "Mâu thuẫn gia đình, niềm vui chưa trọn, bất hòa tạm thời hoặc cảm giác bất an.",
    "keywordsUpright": [
      "Gậy",
      "Bốn Gậy",
      "Hoả"
    ],
    "keywordsReversed": [
      "Ngược",
      "Gậy",
      "Cần lưu ý"
    ]
  },
  {
    "id": "wa05",
    "filename": "wa05.jpg",
    "name": "Five of Wands",
    "vi": "Năm Gậy",
    "arcana": "minor",
    "suit": "wands",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/wa05.jpg",
    "localImage": "/assets/tarot/wa05.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/wa05.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/wa05.jpg",
    "meaningUpright": "Cạnh tranh công bằng, bất đồng quan điểm, thử thách tôi luyện và năng lượng xung đột.",
    "meaningReversed": "Tránh né tranh luận, xung đột ngầm leo thang, mệt mỏi vì đấu đá nội bộ.",
    "keywordsUpright": [
      "Gậy",
      "Năm Gậy",
      "Hoả"
    ],
    "keywordsReversed": [
      "Ngược",
      "Gậy",
      "Cần lưu ý"
    ]
  },
  {
    "id": "wa06",
    "filename": "wa06.jpg",
    "name": "Six of Wands",
    "vi": "Sáu Gậy",
    "arcana": "minor",
    "suit": "wands",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/wa06.jpg",
    "localImage": "/assets/tarot/wa06.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/wa06.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/wa06.jpg",
    "meaningUpright": "Chiến thắng vang dội, được công nhận thành tựu, vinh quang và sự tự tin bước tiếp.",
    "meaningReversed": "Thất bại tạm thời, thiếu tự tin, kiêu căng tự mãn hoặc công sức bị ngó lơ.",
    "keywordsUpright": [
      "Gậy",
      "Sáu Gậy",
      "Hoả"
    ],
    "keywordsReversed": [
      "Ngược",
      "Gậy",
      "Cần lưu ý"
    ]
  },
  {
    "id": "wa07",
    "filename": "wa07.jpg",
    "name": "Seven of Wands",
    "vi": "Bảy Gậy",
    "arcana": "minor",
    "suit": "wands",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/wa07.jpg",
    "localImage": "/assets/tarot/wa07.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/wa07.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/wa07.jpg",
    "meaningUpright": "Bảo vệ lập trường kiên định, dũng cảm đối mặt nghịch cảnh và không bao giờ bỏ cuộc.",
    "meaningReversed": "Bị áp đảo, đuối sức trước áp lực, nhượng bộ quá dễ dàng hoặc mất tự tin.",
    "keywordsUpright": [
      "Gậy",
      "Bảy Gậy",
      "Hoả"
    ],
    "keywordsReversed": [
      "Ngược",
      "Gậy",
      "Cần lưu ý"
    ]
  },
  {
    "id": "wa08",
    "filename": "wa08.jpg",
    "name": "Eight of Wands",
    "vi": "Tám Gậy",
    "arcana": "minor",
    "suit": "wands",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/wa08.jpg",
    "localImage": "/assets/tarot/wa08.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/wa08.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/wa08.jpg",
    "meaningUpright": "Tốc độ nhanh chóng, tin tức tốt lành đến dồn dập, mọi việc tiến triển thần tốc.",
    "meaningReversed": "Chậm trễ bất ngờ, hiểu lầm truyền thông, vội vàng hấp tấp gây hỏng việc.",
    "keywordsUpright": [
      "Gậy",
      "Tám Gậy",
      "Hoả"
    ],
    "keywordsReversed": [
      "Ngược",
      "Gậy",
      "Cần lưu ý"
    ]
  },
  {
    "id": "wa09",
    "filename": "wa09.jpg",
    "name": "Nine of Wands",
    "vi": "Chín Gậy",
    "arcana": "minor",
    "suit": "wands",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/wa09.jpg",
    "localImage": "/assets/tarot/wa09.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/wa09.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/wa09.jpg",
    "meaningUpright": "Bền bỉ đến cùng, cảnh giác kiên cường trước chặng cuối, lòng dũng cảm kiên trung.",
    "meaningReversed": "Kiệt sức, phòng thủ thái quá, buông xuôi ngay trước ngưỡng cửa thành công.",
    "keywordsUpright": [
      "Gậy",
      "Chín Gậy",
      "Hoả"
    ],
    "keywordsReversed": [
      "Ngược",
      "Gậy",
      "Cần lưu ý"
    ]
  },
  {
    "id": "wa10",
    "filename": "wa10.jpg",
    "name": "Ten of Wands",
    "vi": "Mười Gậy",
    "arcana": "minor",
    "suit": "wands",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/wa10.jpg",
    "localImage": "/assets/tarot/wa10.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/wa10.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/wa10.jpg",
    "meaningUpright": "Gánh vác trách nhiệm lớn, làm việc chăm chỉ, áp lực nặng nề nhưng sắp về đích.",
    "meaningReversed": "Quá tải trầm trọng, ôm đồm mọi việc, cần học cách buông bỏ hoặc san sẻ.",
    "keywordsUpright": [
      "Gậy",
      "Mười Gậy",
      "Hoả"
    ],
    "keywordsReversed": [
      "Ngược",
      "Gậy",
      "Cần lưu ý"
    ]
  },
  {
    "id": "wa11",
    "filename": "wa11.jpg",
    "name": "Page of Wands",
    "vi": "Tiểu Đồng Gậy",
    "arcana": "minor",
    "suit": "wands",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/wa11.jpg",
    "localImage": "/assets/tarot/wa11.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/wa11.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/wa11.jpg",
    "meaningUpright": "Nhiệt huyết tuổi trẻ, tin tức khám phá mới, sự tò mò và tinh thần phiêu lưu.",
    "meaningReversed": "Bốc đồng nông nổi, lười biếng, thiếu kiên định hoặc tin tức gây thất vọng.",
    "keywordsUpright": [
      "Gậy",
      "Tiểu Đồng Gậy",
      "Hoả"
    ],
    "keywordsReversed": [
      "Ngược",
      "Gậy",
      "Cần lưu ý"
    ]
  },
  {
    "id": "wa12",
    "filename": "wa12.jpg",
    "name": "Knight of Wands",
    "vi": "Hiệp Sĩ Gậy",
    "arcana": "minor",
    "suit": "wands",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/wa12.jpg",
    "localImage": "/assets/tarot/wa12.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/wa12.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/wa12.jpg",
    "meaningUpright": "Hành động dứt khoát, đam mê bùng cháy, dũng cảm tiên phong không ngại khó.",
    "meaningReversed": "Hấp tấp liều lĩnh, nóng nảy mất kiểm soát, cả thèm chóng chán hoặc gây tranh cãi.",
    "keywordsUpright": [
      "Gậy",
      "Hiệp Sĩ Gậy",
      "Hoả"
    ],
    "keywordsReversed": [
      "Ngược",
      "Gậy",
      "Cần lưu ý"
    ]
  },
  {
    "id": "wa13",
    "filename": "wa13.jpg",
    "name": "Queen of Wands",
    "vi": "Hoàng Hậu Gậy",
    "arcana": "minor",
    "suit": "wands",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/wa13.jpg",
    "localImage": "/assets/tarot/wa13.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/wa13.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/wa13.jpg",
    "meaningUpright": "Tự tin rạng ngời, độc lập, ấm áp, có sức hút mạnh mẽ và năng lượng lan tỏa.",
    "meaningReversed": "Đố kỵ, độc đoán, tự ti bên trong, cáu kỉnh hoặc áp đặt người khác.",
    "keywordsUpright": [
      "Gậy",
      "Hoàng Hậu Gậy",
      "Hoả"
    ],
    "keywordsReversed": [
      "Ngược",
      "Gậy",
      "Cần lưu ý"
    ]
  },
  {
    "id": "wa14",
    "filename": "wa14.jpg",
    "name": "King of Wands",
    "vi": "Vua Gậy",
    "arcana": "minor",
    "suit": "wands",
    "element": "Hoả",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/wa14.jpg",
    "localImage": "/assets/tarot/wa14.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/wa14.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/wa14.jpg",
    "meaningUpright": "Tố chất lãnh đạo bẩm sinh, tầm nhìn vĩ mô, truyền cảm hứng và biến ý tưởng thành sự thật.",
    "meaningReversed": "Độc tài, thiếu kiên nhẫn, đòi hỏi khắt khe, áp đặt ý chí lên người khác.",
    "keywordsUpright": [
      "Gậy",
      "Vua Gậy",
      "Hoả"
    ],
    "keywordsReversed": [
      "Ngược",
      "Gậy",
      "Cần lưu ý"
    ]
  },
  {
    "id": "cu01",
    "filename": "cu01.jpg",
    "name": "Ace of Cups",
    "vi": "Át Cốc",
    "arcana": "minor",
    "suit": "cups",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/cu01.jpg",
    "localImage": "/assets/tarot/cu01.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/cu01.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/cu01.jpg",
    "meaningUpright": "Tình yêu thương tràn ngập, mở lòng đón nhận hạnh phúc mới, trực giác thăng hoa.",
    "meaningReversed": "Tổn thương tình cảm, khép kín lòng mình, cảm xúc tiêu cực hoặc tự ti.",
    "keywordsUpright": [
      "Cốc",
      "Át Cốc",
      "Thuỷ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Cốc",
      "Cần lưu ý"
    ]
  },
  {
    "id": "cu02",
    "filename": "cu02.jpg",
    "name": "Two of Cups",
    "vi": "Hai Cốc",
    "arcana": "minor",
    "suit": "cups",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/cu02.jpg",
    "localImage": "/assets/tarot/cu02.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/cu02.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/cu02.jpg",
    "meaningUpright": "Tình cảm tương giao, sự thấu hiểu chân thành, mối quan hệ hòa hợp và cam kết đẹp.",
    "meaningReversed": "Hiểu lầm, rạn nứt tạm thời, thiếu cân bằng trong cho - nhận hoặc bất hòa.",
    "keywordsUpright": [
      "Cốc",
      "Hai Cốc",
      "Thuỷ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Cốc",
      "Cần lưu ý"
    ]
  },
  {
    "id": "cu03",
    "filename": "cu03.jpg",
    "name": "Three of Cups",
    "vi": "Ba Cốc",
    "arcana": "minor",
    "suit": "cups",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/cu03.jpg",
    "localImage": "/assets/tarot/cu03.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/cu03.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/cu03.jpg",
    "meaningUpright": "Tình bạn gắn bó, sum họp vui vẻ, ăn mừng sẻ chia và nâng đỡ lẫn nhau.",
    "meaningReversed": "Tách biệt khỏi nhóm, buôn chuyện gây chia rẽ, tiệc tùng quá đà hao tổn năng lượng.",
    "keywordsUpright": [
      "Cốc",
      "Ba Cốc",
      "Thuỷ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Cốc",
      "Cần lưu ý"
    ]
  },
  {
    "id": "cu04",
    "filename": "cu04.jpg",
    "name": "Four of Cups",
    "vi": "Bốn Cốc",
    "arcana": "minor",
    "suit": "cups",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/cu04.jpg",
    "localImage": "/assets/tarot/cu04.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/cu04.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/cu04.jpg",
    "meaningUpright": "Chiêm nghiệm nội tâm, nhận diện cơ hội mới bỏ quên, vượt qua cảm giác chán chường.",
    "meaningReversed": "Nhận ra phước lành quanh mình, mở lòng đón nhận lời mời, vượt qua u uất.",
    "keywordsUpright": [
      "Cốc",
      "Bốn Cốc",
      "Thuỷ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Cốc",
      "Cần lưu ý"
    ]
  },
  {
    "id": "cu05",
    "filename": "cu05.jpg",
    "name": "Five of Cups",
    "vi": "Năm Cốc",
    "arcana": "minor",
    "suit": "cups",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/cu05.jpg",
    "localImage": "/assets/tarot/cu05.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/cu05.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/cu05.jpg",
    "meaningUpright": "Nhìn nhận sự mất mát, buông bỏ nỗi đau quá khứ để thấy những giá trị quý giá vẫn còn lại.",
    "meaningReversed": "Chữa lành tổn thương, tha thứ, quay đầu nhìn về hy vọng và sự hỗ trợ.",
    "keywordsUpright": [
      "Cốc",
      "Năm Cốc",
      "Thuỷ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Cốc",
      "Cần lưu ý"
    ]
  },
  {
    "id": "cu06",
    "filename": "cu06.jpg",
    "name": "Six of Cups",
    "vi": "Sáu Cốc",
    "arcana": "minor",
    "suit": "cups",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/cu06.jpg",
    "localImage": "/assets/tarot/cu06.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/cu06.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/cu06.jpg",
    "meaningUpright": "Ký ức ngọt ngào, hoài niệm trong sáng, gặp lại người quen cũ hoặc quà tặng chân tình.",
    "meaningReversed": "Mắc kẹt trong quá khứ, không chịu trưởng thành, ngây thơ quá mức hoặc hoài niệm mù quáng.",
    "keywordsUpright": [
      "Cốc",
      "Sáu Cốc",
      "Thuỷ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Cốc",
      "Cần lưu ý"
    ]
  },
  {
    "id": "cu07",
    "filename": "cu07.jpg",
    "name": "Seven of Cups",
    "vi": "Bảy Cốc",
    "arcana": "minor",
    "suit": "cups",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/cu07.jpg",
    "localImage": "/assets/tarot/cu07.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/cu07.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/cu07.jpg",
    "meaningUpright": "Nhiều lựa chọn hấp dẫn, trí tưởng tượng phong phú, phân biệt giữa ước mơ và thực tế.",
    "meaningReversed": "Ảo tưởng tan biến, nhận diện rõ ràng mục tiêu, thoát khỏi sự phân tâm mông lung.",
    "keywordsUpright": [
      "Cốc",
      "Bảy Cốc",
      "Thuỷ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Cốc",
      "Cần lưu ý"
    ]
  },
  {
    "id": "cu08",
    "filename": "cu08.jpg",
    "name": "Eight of Cups",
    "vi": "Tám Cốc",
    "arcana": "minor",
    "suit": "cups",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/cu08.jpg",
    "localImage": "/assets/tarot/cu08.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/cu08.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/cu08.jpg",
    "meaningUpright": "Dũng cảm rời bỏ điều không còn phù hợp, tìm kiếm ý nghĩa sống sâu sắc và chân thực hơn.",
    "meaningReversed": "Sợ hãi bước đi, bám dính vào mối quan hệ bế tắc, do dự rời bỏ nơi độc hại.",
    "keywordsUpright": [
      "Cốc",
      "Tám Cốc",
      "Thuỷ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Cốc",
      "Cần lưu ý"
    ]
  },
  {
    "id": "cu09",
    "filename": "cu09.jpg",
    "name": "Nine of Cups",
    "vi": "Chín Cốc",
    "arcana": "minor",
    "suit": "cups",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/cu09.jpg",
    "localImage": "/assets/tarot/cu09.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/cu09.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/cu09.jpg",
    "meaningUpright": "Ước nguyện thành hiện thực, hài lòng viên mãn, sự đủ đầy về cảm xúc và thể chất.",
    "meaningReversed": "Thỏa mãn quá mức, tự mãn bề ngoài, mong ước chưa trọn vẹn hoặc thiếu chiều sâu.",
    "keywordsUpright": [
      "Cốc",
      "Chín Cốc",
      "Thuỷ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Cốc",
      "Cần lưu ý"
    ]
  },
  {
    "id": "cu10",
    "filename": "cu10.jpg",
    "name": "Ten of Cups",
    "vi": "Mười Cốc",
    "arcana": "minor",
    "suit": "cups",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/cu10.jpg",
    "localImage": "/assets/tarot/cu10.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/cu10.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/cu10.jpg",
    "meaningUpright": "Hạnh phúc gia đình viên mãn, bình yên trọn vẹn, tình yêu thương và sự hòa thuận dài lâu.",
    "meaningReversed": "Bất hòa trong tổ ấm, kỳ vọng ảo về sự hoàn hảo, mâu thuẫn giữa các thành viên.",
    "keywordsUpright": [
      "Cốc",
      "Mười Cốc",
      "Thuỷ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Cốc",
      "Cần lưu ý"
    ]
  },
  {
    "id": "cu11",
    "filename": "cu11.jpg",
    "name": "Page of Cups",
    "vi": "Tiểu Đồng Cốc",
    "arcana": "minor",
    "suit": "cups",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/cu11.jpg",
    "localImage": "/assets/tarot/cu11.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/cu11.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/cu11.jpg",
    "meaningUpright": "Trực giác nhạy bén, thông điệp tình cảm ngọt ngào, tâm hồn nghệ sĩ và lòng trắc ẩn.",
    "meaningReversed": "Nhạy cảm thái quá, non nớt cảm xúc, thất vọng tình cảm hoặc mơ mộng viển vông.",
    "keywordsUpright": [
      "Cốc",
      "Tiểu Đồng Cốc",
      "Thuỷ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Cốc",
      "Cần lưu ý"
    ]
  },
  {
    "id": "cu12",
    "filename": "cu12.jpg",
    "name": "Knight of Cups",
    "vi": "Hiệp Sĩ Cốc",
    "arcana": "minor",
    "suit": "cups",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/cu12.jpg",
    "localImage": "/assets/tarot/cu12.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/cu12.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/cu12.jpg",
    "meaningUpright": "Người mang tình yêu lãng mạn, sự duyên dáng, đi theo tiếng gọi của con tim.",
    "meaningReversed": "Mơ mộng hão huyền, lừa dối tình cảm, tâm trạng thất thường hoặc né tránh thực tế.",
    "keywordsUpright": [
      "Cốc",
      "Hiệp Sĩ Cốc",
      "Thuỷ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Cốc",
      "Cần lưu ý"
    ]
  },
  {
    "id": "cu13",
    "filename": "cu13.jpg",
    "name": "Queen of Cups",
    "vi": "Hoàng Hậu Cốc",
    "arcana": "minor",
    "suit": "cups",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/cu13.jpg",
    "localImage": "/assets/tarot/cu13.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/cu13.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/cu13.jpg",
    "meaningUpright": "Thấu cảm vô bờ, dịu dàng nuôi dưỡng, trực giác tâm linh mạnh mẽ và lòng bao dung.",
    "meaningReversed": "Bất ổn cảm xúc, hy sinh quên mình dẫn đến kiệt sức, thao túng tâm lý.",
    "keywordsUpright": [
      "Cốc",
      "Hoàng Hậu Cốc",
      "Thuỷ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Cốc",
      "Cần lưu ý"
    ]
  },
  {
    "id": "cu14",
    "filename": "cu14.jpg",
    "name": "King of Cups",
    "vi": "Vua Cốc",
    "arcana": "minor",
    "suit": "cups",
    "element": "Thuỷ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/cu14.jpg",
    "localImage": "/assets/tarot/cu14.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/cu14.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/cu14.jpg",
    "meaningUpright": "Làm chủ cảm xúc, điềm đạm trước sóng gió, trí tuệ cảm xúc sâu sắc và sự thấu hiểu.",
    "meaningReversed": "Cảm xúc lạnh lùng, dồn nén nội tâm, thao túng hoặc mất bình tĩnh trước căng thẳng.",
    "keywordsUpright": [
      "Cốc",
      "Vua Cốc",
      "Thuỷ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Cốc",
      "Cần lưu ý"
    ]
  },
  {
    "id": "sw01",
    "filename": "sw01.jpg",
    "name": "Ace of Swords",
    "vi": "Át Kiếm",
    "arcana": "minor",
    "suit": "swords",
    "element": "Khí",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/sw01.jpg",
    "localImage": "/assets/tarot/sw01.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/sw01.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/sw01.jpg",
    "meaningUpright": "Tư duy sáng suốt đột phá, sự thật sáng tỏ, chiến thắng nhờ trí tuệ và công lý.",
    "meaningReversed": "Tư duy rối bời, hiểu lầm tai hại, lời nói sắc nhọn gây tổn thương hoặc thiếu trung thực.",
    "keywordsUpright": [
      "Kiếm",
      "Át Kiếm",
      "Khí"
    ],
    "keywordsReversed": [
      "Ngược",
      "Kiếm",
      "Cần lưu ý"
    ]
  },
  {
    "id": "sw02",
    "filename": "sw02.jpg",
    "name": "Two of Swords",
    "vi": "Hai Kiếm",
    "arcana": "minor",
    "suit": "swords",
    "element": "Khí",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/sw02.jpg",
    "localImage": "/assets/tarot/sw02.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/sw02.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/sw02.jpg",
    "meaningUpright": "Thế lưỡng nan cần cân nhắc, giữ bình tâm lắng nghe trực giác để ra quyết định khách quan.",
    "meaningReversed": "Bế tắc kéo dài, sợ đối mặt sự thật, do dự gây lỡ dở thời cơ.",
    "keywordsUpright": [
      "Kiếm",
      "Hai Kiếm",
      "Khí"
    ],
    "keywordsReversed": [
      "Ngược",
      "Kiếm",
      "Cần lưu ý"
    ]
  },
  {
    "id": "sw03",
    "filename": "sw03.jpg",
    "name": "Three of Swords",
    "vi": "Ba Kiếm",
    "arcana": "minor",
    "suit": "swords",
    "element": "Khí",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/sw03.jpg",
    "localImage": "/assets/tarot/sw03.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/sw03.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/sw03.jpg",
    "meaningUpright": "Nỗi đau cần nhìn thẳng, chấp nhận sự thật đau lòng để bước vào quá trình chữa lành.",
    "meaningReversed": "Hồi phục sau tổn thương, buông bỏ dĩ vãng cay đắng, xoa dịu vết thương lòng.",
    "keywordsUpright": [
      "Kiếm",
      "Ba Kiếm",
      "Khí"
    ],
    "keywordsReversed": [
      "Ngược",
      "Kiếm",
      "Cần lưu ý"
    ]
  },
  {
    "id": "sw04",
    "filename": "sw04.jpg",
    "name": "Four of Swords",
    "vi": "Bốn Kiếm",
    "arcana": "minor",
    "suit": "swords",
    "element": "Khí",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/sw04.jpg",
    "localImage": "/assets/tarot/sw04.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/sw04.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/sw04.jpg",
    "meaningUpright": "Tạm nghỉ ngơi tĩnh dưỡng, phục hồi thể lực và trí lực, chiêm nghiệm chuẩn bị hành động.",
    "meaningReversed": "Kiệt sức do gắng gượng, đến lúc phải thức dậy hành động, chấm dứt thời gian trì trệ.",
    "keywordsUpright": [
      "Kiếm",
      "Bốn Kiếm",
      "Khí"
    ],
    "keywordsReversed": [
      "Ngược",
      "Kiếm",
      "Cần lưu ý"
    ]
  },
  {
    "id": "sw05",
    "filename": "sw05.jpg",
    "name": "Five of Swords",
    "vi": "Năm Kiếm",
    "arcana": "minor",
    "suit": "swords",
    "element": "Khí",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/sw05.jpg",
    "localImage": "/assets/tarot/sw05.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/sw05.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/sw05.jpg",
    "meaningUpright": "Chiến thắng danh nghĩa nhưng hao tổn lòng người, bài học về cái tôi và sự nhượng bộ.",
    "meaningReversed": "Hòa giải xung đột, buông bỏ tranh giành vô nghĩa, nhận ra sai lầm để sửa đổi.",
    "keywordsUpright": [
      "Kiếm",
      "Năm Kiếm",
      "Khí"
    ],
    "keywordsReversed": [
      "Ngược",
      "Kiếm",
      "Cần lưu ý"
    ]
  },
  {
    "id": "sw06",
    "filename": "sw06.jpg",
    "name": "Six of Swords",
    "vi": "Sáu Kiếm",
    "arcana": "minor",
    "suit": "swords",
    "element": "Khí",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/sw06.jpg",
    "localImage": "/assets/tarot/sw06.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/sw06.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/sw06.jpg",
    "meaningUpright": "Chuyển dịch qua vùng sóng gió, hướng đến bến bờ bình yên, vết thương dần liền sẹo.",
    "meaningReversed": "Kẹt trong khó khăn, khó thích nghi hoàn cảnh mới, vướng bận gánh nặng cũ.",
    "keywordsUpright": [
      "Kiếm",
      "Sáu Kiếm",
      "Khí"
    ],
    "keywordsReversed": [
      "Ngược",
      "Kiếm",
      "Cần lưu ý"
    ]
  },
  {
    "id": "sw07",
    "filename": "sw07.jpg",
    "name": "Seven of Swords",
    "vi": "Bảy Kiếm",
    "arcana": "minor",
    "suit": "swords",
    "element": "Khí",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/sw07.jpg",
    "localImage": "/assets/tarot/sw07.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/sw07.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/sw07.jpg",
    "meaningUpright": "Chiến lược thông minh, linh hoạt ứng biến, cẩn trọng bảo vệ ý tưởng cá nhân.",
    "meaningReversed": "Bị phát hiện mưu mô, lừa dối tự hại mình, cảm giác cắn rứt hoặc thiếu minh bạch.",
    "keywordsUpright": [
      "Kiếm",
      "Bảy Kiếm",
      "Khí"
    ],
    "keywordsReversed": [
      "Ngược",
      "Kiếm",
      "Cần lưu ý"
    ]
  },
  {
    "id": "sw08",
    "filename": "sw08.jpg",
    "name": "Eight of Swords",
    "vi": "Tám Kiếm",
    "arcana": "minor",
    "suit": "swords",
    "element": "Khí",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/sw08.jpg",
    "localImage": "/assets/tarot/sw08.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/sw08.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/sw08.jpg",
    "meaningUpright": "Nhận ra rào cản chỉ là do tâm trí tự trói buộc, tự tin tháo gỡ giới hạn để tìm tự do.",
    "meaningReversed": "Giải phóng tư duy, bước ra khỏi nỗi sợ hãi ảo, tìm lại niềm tin vào bản thân.",
    "keywordsUpright": [
      "Kiếm",
      "Tám Kiếm",
      "Khí"
    ],
    "keywordsReversed": [
      "Ngược",
      "Kiếm",
      "Cần lưu ý"
    ]
  },
  {
    "id": "sw09",
    "filename": "sw09.jpg",
    "name": "Nine of Swords",
    "vi": "Chín Kiếm",
    "arcana": "minor",
    "suit": "swords",
    "element": "Khí",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/sw09.jpg",
    "localImage": "/assets/tarot/sw09.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/sw09.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/sw09.jpg",
    "meaningUpright": "Lo âu thái quá giữa đêm tối, nhận diện nỗi sợ để thấy mọi chuyện không tồi tệ như nghĩ.",
    "meaningReversed": "Thoát khỏi cơn ác mộng, hy vọng trở lại, tìm được sự an ủi và bình an.",
    "keywordsUpright": [
      "Kiếm",
      "Chín Kiếm",
      "Khí"
    ],
    "keywordsReversed": [
      "Ngược",
      "Kiếm",
      "Cần lưu ý"
    ]
  },
  {
    "id": "sw10",
    "filename": "sw10.jpg",
    "name": "Ten of Swords",
    "vi": "Mười Kiếm",
    "arcana": "minor",
    "suit": "swords",
    "element": "Khí",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/sw10.jpg",
    "localImage": "/assets/tarot/sw10.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/sw10.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/sw10.jpg",
    "meaningUpright": "Điểm đáy của nghịch cảnh, kết thúc chuỗi ngày đen tối, bình minh sắp bừng sáng trở lại.",
    "meaningReversed": "Hồi sinh từ tro tàn, sự việc chuyển biến tốt hơn, không còn gì tồi tệ hơn nữa.",
    "keywordsUpright": [
      "Kiếm",
      "Mười Kiếm",
      "Khí"
    ],
    "keywordsReversed": [
      "Ngược",
      "Kiếm",
      "Cần lưu ý"
    ]
  },
  {
    "id": "sw11",
    "filename": "sw11.jpg",
    "name": "Page of Swords",
    "vi": "Tiểu Đồng Kiếm",
    "arcana": "minor",
    "suit": "swords",
    "element": "Khí",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/sw11.jpg",
    "localImage": "/assets/tarot/sw11.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/sw11.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/sw11.jpg",
    "meaningUpright": "Hiếu học, tò mò tìm hiểu sự thật, tư duy sắc bén và năng động bảo vệ quan điểm.",
    "meaningReversed": "Soi mói thị phi, ăn nói thiếu suy nghĩ, hiếu chiến trẻ con hoặc lan truyền tin giả.",
    "keywordsUpright": [
      "Kiếm",
      "Tiểu Đồng Kiếm",
      "Khí"
    ],
    "keywordsReversed": [
      "Ngược",
      "Kiếm",
      "Cần lưu ý"
    ]
  },
  {
    "id": "sw12",
    "filename": "sw12.jpg",
    "name": "Knight of Swords",
    "vi": "Hiệp Sĩ Kiếm",
    "arcana": "minor",
    "suit": "swords",
    "element": "Khí",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/sw12.jpg",
    "localImage": "/assets/tarot/sw12.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/sw12.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/sw12.jpg",
    "meaningUpright": "Hành động quyết liệt, tư duy nhanh nhạy, dũng cảm tiến thẳng tới mục tiêu lớn.",
    "meaningReversed": "Hung hăng mù quáng, nóng nảy thô lỗ, đâm đầu vào rủi ro không cần thiết.",
    "keywordsUpright": [
      "Kiếm",
      "Hiệp Sĩ Kiếm",
      "Khí"
    ],
    "keywordsReversed": [
      "Ngược",
      "Kiếm",
      "Cần lưu ý"
    ]
  },
  {
    "id": "sw13",
    "filename": "sw13.jpg",
    "name": "Queen of Swords",
    "vi": "Hoàng Hậu Kiếm",
    "arcana": "minor",
    "suit": "swords",
    "element": "Khí",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/sw13.jpg",
    "localImage": "/assets/tarot/sw13.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/sw13.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/sw13.jpg",
    "meaningUpright": "Trí tuệ sắc sảo, công bằng khách quan, nhìn thấu bản chất vấn đề và độc lập kiên cường.",
    "meaningReversed": "Lạnh lùng hà khắc, cay nghiệt phán xét, cay đắng cô lập hoặc khó gần.",
    "keywordsUpright": [
      "Kiếm",
      "Hoàng Hậu Kiếm",
      "Khí"
    ],
    "keywordsReversed": [
      "Ngược",
      "Kiếm",
      "Cần lưu ý"
    ]
  },
  {
    "id": "sw14",
    "filename": "sw14.jpg",
    "name": "King of Swords",
    "vi": "Vua Kiếm",
    "arcana": "minor",
    "suit": "swords",
    "element": "Khí",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/sw14.jpg",
    "localImage": "/assets/tarot/sw14.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/sw14.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/sw14.jpg",
    "meaningUpright": "Quyền uy trí tuệ, khả năng phán đoán công tâm, kỷ luật thép và sự lãnh đạo lý trí.",
    "meaningReversed": "Lạm quyền, độc đoán tàn nhẫn, sử dụng lý trí để chà đạp cảm xúc người khác.",
    "keywordsUpright": [
      "Kiếm",
      "Vua Kiếm",
      "Khí"
    ],
    "keywordsReversed": [
      "Ngược",
      "Kiếm",
      "Cần lưu ý"
    ]
  },
  {
    "id": "pe01",
    "filename": "pe01.jpg",
    "name": "Ace of Pentacles",
    "vi": "Át Tiền",
    "arcana": "minor",
    "suit": "pentacles",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/pe01.jpg",
    "localImage": "/assets/tarot/pe01.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/pe01.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/pe01.jpg",
    "meaningUpright": "Cơ hội tài chính vững chắc, khởi đầu dự án sinh lời, sự đủ đầy vật chất và may mắn.",
    "meaningReversed": "Cơ hội tài chính bị bỏ lỡ, quản lý chi tiêu yếu kém, đầu tư bất cẩn hoặc thiếu nền tảng.",
    "keywordsUpright": [
      "Tiền",
      "Át Tiền",
      "Thổ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Tiền",
      "Cần lưu ý"
    ]
  },
  {
    "id": "pe02",
    "filename": "pe02.jpg",
    "name": "Two of Pentacles",
    "vi": "Hai Tiền",
    "arcana": "minor",
    "suit": "pentacles",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/pe02.jpg",
    "localImage": "/assets/tarot/pe02.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/pe02.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/pe02.jpg",
    "meaningUpright": "Linh hoạt xoay xở nhiều việc, duy trì cân bằng tài chính và thích nghi hoàn cảnh nhanh.",
    "meaningReversed": "Mất cân bằng, quá tải công việc, căng thẳng vì nợ nần hoặc quản lý thời gian kém.",
    "keywordsUpright": [
      "Tiền",
      "Hai Tiền",
      "Thổ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Tiền",
      "Cần lưu ý"
    ]
  },
  {
    "id": "pe03",
    "filename": "pe03.jpg",
    "name": "Three of Pentacles",
    "vi": "Ba Tiền",
    "arcana": "minor",
    "suit": "pentacles",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/pe03.jpg",
    "localImage": "/assets/tarot/pe03.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/pe03.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/pe03.jpg",
    "meaningUpright": "Làm việc nhóm xuất sắc, tài năng được công nhận, xây dựng nền móng chuyên môn vững chắc.",
    "meaningReversed": "Thiếu phối hợp đồng đội, kỹ năng chưa hoàn thiện, bất đồng quan điểm trong dự án.",
    "keywordsUpright": [
      "Tiền",
      "Ba Tiền",
      "Thổ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Tiền",
      "Cần lưu ý"
    ]
  },
  {
    "id": "pe04",
    "filename": "pe04.jpg",
    "name": "Four of Pentacles",
    "vi": "Bốn Tiền",
    "arcana": "minor",
    "suit": "pentacles",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/pe04.jpg",
    "localImage": "/assets/tarot/pe04.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/pe04.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/pe04.jpg",
    "meaningUpright": "Bảo toàn tài chính an toàn, kiểm soát tài sản ổn định, chuẩn bị nền tảng vững vàng.",
    "meaningReversed": "Keo kiệt bủn xỉn, bám chấp vật chất mù quáng, sợ mất mát nên không dám đầu tư.",
    "keywordsUpright": [
      "Tiền",
      "Bốn Tiền",
      "Thổ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Tiền",
      "Cần lưu ý"
    ]
  },
  {
    "id": "pe05",
    "filename": "pe05.jpg",
    "name": "Five of Pentacles",
    "vi": "Năm Tiền",
    "arcana": "minor",
    "suit": "pentacles",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/pe05.jpg",
    "localImage": "/assets/tarot/pe05.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/pe05.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/pe05.jpg",
    "meaningUpright": "Khó khăn vật chất tạm thời, học cách tìm kiếm sự trợ giúp và nương tựa niềm tin.",
    "meaningReversed": "Hồi phục tài chính, tìm thấy cánh cửa hỗ trợ, vượt qua giai đoạn thiếu thốn.",
    "keywordsUpright": [
      "Tiền",
      "Năm Tiền",
      "Thổ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Tiền",
      "Cần lưu ý"
    ]
  },
  {
    "id": "pe06",
    "filename": "pe06.jpg",
    "name": "Six of Pentacles",
    "vi": "Sáu Tiền",
    "arcana": "minor",
    "suit": "pentacles",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/pe06.jpg",
    "localImage": "/assets/tarot/pe06.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/pe06.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/pe06.jpg",
    "meaningUpright": "Hào phóng sẻ chia, cân bằng giữa cho và nhận, nhận được sự giúp đỡ đúng lúc.",
    "meaningReversed": "Cho đi có điều kiện, nợ nần phụ thuộc, bất công trong phân chia tài chính.",
    "keywordsUpright": [
      "Tiền",
      "Sáu Tiền",
      "Thổ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Tiền",
      "Cần lưu ý"
    ]
  },
  {
    "id": "pe07",
    "filename": "pe07.jpg",
    "name": "Seven of Pentacles",
    "vi": "Bảy Tiền",
    "arcana": "minor",
    "suit": "pentacles",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/pe07.jpg",
    "localImage": "/assets/tarot/pe07.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/pe07.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/pe07.jpg",
    "meaningUpright": "Kiên nhẫn chờ thành quả, đánh giá tiến độ dài hạn, hạt giống sắp cho mùa màng bội thu.",
    "meaningReversed": "Sốt ruột nóng vội, công sức không như kỳ vọng, lười biếng hoặc thiếu kiên trì.",
    "keywordsUpright": [
      "Tiền",
      "Bảy Tiền",
      "Thổ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Tiền",
      "Cần lưu ý"
    ]
  },
  {
    "id": "pe08",
    "filename": "pe08.jpg",
    "name": "Eight of Pentacles",
    "vi": "Tám Tiền",
    "arcana": "minor",
    "suit": "pentacles",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/pe08.jpg",
    "localImage": "/assets/tarot/pe08.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/pe08.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/pe08.jpg",
    "meaningUpright": "Chăm chỉ trau dồi tay nghề, tỉ mỉ từng chi tiết, nỗ lực hết mình để thành chuyên gia.",
    "meaningReversed": "Lười biếng, làm việc qua loa chiếu lệ, thiếu tập trung hoặc kỹ năng dở dang.",
    "keywordsUpright": [
      "Tiền",
      "Tám Tiền",
      "Thổ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Tiền",
      "Cần lưu ý"
    ]
  },
  {
    "id": "pe09",
    "filename": "pe09.jpg",
    "name": "Nine of Pentacles",
    "vi": "Chín Tiền",
    "arcana": "minor",
    "suit": "pentacles",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/pe09.jpg",
    "localImage": "/assets/tarot/pe09.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/pe09.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/pe09.jpg",
    "meaningUpright": "Tự do tài chính, tận hưởng thành quả ngọt ngào, cuộc sống thanh tao tự chủ và quý phái.",
    "meaningReversed": "Phụ thuộc tài chính, bội chi phô trương, cô đơn sau thành công vật chất.",
    "keywordsUpright": [
      "Tiền",
      "Chín Tiền",
      "Thổ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Tiền",
      "Cần lưu ý"
    ]
  },
  {
    "id": "pe10",
    "filename": "pe10.jpg",
    "name": "Ten of Pentacles",
    "vi": "Mười Tiền",
    "arcana": "minor",
    "suit": "pentacles",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/pe10.jpg",
    "localImage": "/assets/tarot/pe10.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/pe10.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/pe10.jpg",
    "meaningUpright": "Gia nghiệp vững bền, thịnh vượng truyền đời, an cư lạc nghiệp và di sản quý báu.",
    "meaningReversed": "Tranh chấp tài sản gia đình, rủi ro tài chính lâu dài, bất đồng về quyền thừa kế.",
    "keywordsUpright": [
      "Tiền",
      "Mười Tiền",
      "Thổ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Tiền",
      "Cần lưu ý"
    ]
  },
  {
    "id": "pe11",
    "filename": "pe11.jpg",
    "name": "Page of Pentacles",
    "vi": "Tiểu Đồng Tiền",
    "arcana": "minor",
    "suit": "pentacles",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/pe11.jpg",
    "localImage": "/assets/tarot/pe11.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/pe11.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/pe11.jpg",
    "meaningUpright": "Học hỏi nghiêm túc, cơ hội nghề nghiệp mới mở ra, thực tế và chăm chỉ tích lũy.",
    "meaningReversed": "Lười biếng, thiếu mục tiêu thực tế, lãng phí cơ hội học hành hoặc chi tiêu hoang phí.",
    "keywordsUpright": [
      "Tiền",
      "Tiểu Đồng Tiền",
      "Thổ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Tiền",
      "Cần lưu ý"
    ]
  },
  {
    "id": "pe12",
    "filename": "pe12.jpg",
    "name": "Knight of Pentacles",
    "vi": "Hiệp Sĩ Tiền",
    "arcana": "minor",
    "suit": "pentacles",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/pe12.jpg",
    "localImage": "/assets/tarot/pe12.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/pe12.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/pe12.jpg",
    "meaningUpright": "Chăm chỉ đáng tin cậy, trách nhiệm tuyệt đối, tiến bước vững chắc không gì lay chuyển.",
    "meaningReversed": "Bảo thủ bướng bỉnh, máy móc rập khuôn, trì trệ chậm tiến hoặc quá thực dụng.",
    "keywordsUpright": [
      "Tiền",
      "Hiệp Sĩ Tiền",
      "Thổ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Tiền",
      "Cần lưu ý"
    ]
  },
  {
    "id": "pe13",
    "filename": "pe13.jpg",
    "name": "Queen of Pentacles",
    "vi": "Hoàng Hậu Tiền",
    "arcana": "minor",
    "suit": "pentacles",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/pe13.jpg",
    "localImage": "/assets/tarot/pe13.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/pe13.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/pe13.jpg",
    "meaningUpright": "Thực tế chu đáo, vun vén ấm no, người chăm sóc tài năng và chỗ dựa an tâm.",
    "meaningReversed": "Bỏ bê trách nhiệm, ghen tị vật chất, vụ lợi hoặc mất cân bằng công việc - gia đình.",
    "keywordsUpright": [
      "Tiền",
      "Hoàng Hậu Tiền",
      "Thổ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Tiền",
      "Cần lưu ý"
    ]
  },
  {
    "id": "pe14",
    "filename": "pe14.jpg",
    "name": "King of Pentacles",
    "vi": "Vua Tiền",
    "arcana": "minor",
    "suit": "pentacles",
    "element": "Thổ",
    "originalUrl": "https://petaloverflow.github.io/tarot-api/cards/pe14.jpg",
    "localImage": "/assets/tarot/pe14.jpg",
    "fallbackUrl": "https://sixseeds.github.io/tarot-api/cards/pe14.jpg",
    "cdnUrl": "https://raw.githubusercontent.com/sixseeds/tarot-api/main/cards/pe14.jpg",
    "meaningUpright": "Thành công vang dội về tài chính, kinh doanh vững mạnh, chỗ dựa tài lực kiên cố.",
    "meaningReversed": "Tham lam ích kỷ, thực dụng tàn nhẫn, đánh giá con người chỉ qua tiền bạc của cải.",
    "keywordsUpright": [
      "Tiền",
      "Vua Tiền",
      "Thổ"
    ],
    "keywordsReversed": [
      "Ngược",
      "Tiền",
      "Cần lưu ý"
    ]
  }
];

export const MAJOR_ARCANA_CARDS = TAROT_CARDS.filter(c => c.arcana === 'major');
export const MINOR_ARCANA_CARDS = TAROT_CARDS.filter(c => c.arcana === 'minor');

// Helper lấy lá bài theo ID
export function getTarotCardById(id: string): TarotCard | undefined {
  return TAROT_CARDS.find(c => c.id === id);
}

// Helper rút ngẫu nhiên n lá bài không trùng nhau từ bộ 78 lá
export function drawRandomCards(count: number = 1): Array<{ card: TarotCard; isReversed: boolean }> {
  const shuffled = [...TAROT_CARDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, TAROT_CARDS.length)).map(card => ({
    card,
    isReversed: Math.random() < 0.35
  }));
}

// Helper xác định lá bài ngày hôm nay (deterministic theo uid + ngày)
export function getDailyCard(uid: string): { card: TarotCard; isReversed: boolean } {
  const today = new Date().toISOString().split('T')[0];
  const seed = (uid + today).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const card = TAROT_CARDS[seed % TAROT_CARDS.length];
  const isReversed = (seed % 10) < 3;
  return { card, isReversed };
}
