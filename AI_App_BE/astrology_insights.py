# -*- coding: utf-8 -*-
"""
Module cung cấp các luận giải chiêm tinh học chuyên sâu (Depth Astrology & Career Insights)
Dành cho việc tạo phân tích Natal Chart và Bản Đồ Hướng Nghiệp sắc sảo, giàu hàm lượng tri thức.
"""

# Chiêm tinh hướng nghiệp theo Trung Thiên (Midheaven - MC)
MC_CAREER_MAP = {
    "Bạch Dương": {
        "title": "Người Tiên Phong Độc Lập & Dẫn Dắt Đột Phá",
        "archetype": "Nhà khởi nghiệp, chỉ huy chiến lược, tiên phong mở lối",
        "style": "Bạn mang năng lượng của người đi mở đường, ghét sự rập khuôn và luôn muốn làm chủ vận mệnh nghề nghiệp. Bạn phát huy phong độ cao nhất khi được giao quyền tự quyết, đương đầu với thử thách mới hoặc dẫn dắt các dự án đột phá.",
        "fields": ["Khởi nghiệp / Sáng lập dự án", "Quản lý điều hành & Quản trị rủi ro", "Công nghệ đổi mới sáng tạo", "Kinh doanh phát triển thị trường mới"],
        "challenge": "Dễ chán nản ở giai đoạn duy trì ổn định; cần học cách kiên trì và phối hợp đội nhóm thay vì ôm đồm đơn độc.",
    },
    "Kim Ngưu": {
        "title": "Kiến Trúc Sư Giá Trị Bền Vững & Quản Trị Tài Sản",
        "archetype": "Chuyên gia tài chính, nhà phát triển nguồn lực, thẩm mỹ gia",
        "style": "Bạn sở hữu trực giác thực tế sắc bén về giá trị vật chất và sự bền vững. Phong cách làm việc điềm đạm, có phương pháp bài bản và đặc biệt kiên định với các mục tiêu dài hạn.",
        "fields": ["Tài chính - Ngân hàng / Đầu tư định giá", "Kiến trúc / Bất động sản / Quy hoạch", "Nghệ thuật ứng dụng & Thiết kế cao cấp", "Quản lý chuỗi cung ứng & Vận hành"],
        "challenge": "Xu hướng ngại thay đổi, dễ bám víu vào vùng an toàn; cần dũng cảm đón nhận công nghệ mới và linh hoạt chuyển mình.",
    },
    "Song Tử": {
        "title": "Nhà Kết Nối Tri Thức & Chiến Lược Gia Truyền Thông",
        "archetype": "Chuyên gia truyền thông, cố vấn chiến lược, phát triển nội dung đa nền tảng",
        "style": "Trí tuệ linh hoạt, khả năng tổng hợp thông tin đa nguồn cực nhanh và năng khiếu ngôn ngữ vượt trội giúp bạn trở thành cầu nối thông tin không thể thay thế trong mọi tổ chức.",
        "fields": ["Báo chí / Truyền thông đa phương tiện", "Marketing & Quảng cáo sáng tạo", "Quan hệ đối ngoại / Ngoại giao thương mại", "Đào tạo, diễn thuyết & Xuất bản"],
        "challenge": "Dễ bị phân tán bởi quá nhiều ý tưởng cùng lúc; cần xây dựng tính kỷ luật tập trung để hoàn thành trọn vẹn từng mục tiêu.",
    },
    "Cự Giải": {
        "title": "Người Kiến Tạo Không Gian Nuôi Dưỡng & Thấu Cảm Tổ Chức",
        "archetype": "Nhà quản trị nhân sự, cố vấn tâm lý, chuyên gia thương hiệu vì cộng đồng",
        "style": "Bạn có năng lực thấu cảm sâu sắc, khả năng nắm bắt tâm lý khách hàng và xây dựng văn hóa đội ngũ gắn kết bền chặt. Bạn tạo ra những sản phẩm/dịch vụ mang lại cảm giác an tâm và tin cậy tuyệt đối.",
        "fields": ["Quản trị nguồn nhân lực (HR) & Phát triển tổ chức", "Tâm lý học, tư vấn trị liệu & Chăm sóc sức khỏe", "F&B, Khách sạn nghỉ dưỡng & Bất động sản dân dụng", "Hoạt động xã hội & Giáo dục mầm non/cộng đồng"],
        "challenge": "Dễ để cảm xúc cá nhân chi phối quyết định công việc; cần rèn luyện sự tách bạch lý trí trong đàm phán và xử lý khủng hoảng.",
    },
    "Sư Tử": {
        "title": "Nhà Lãnh Đạo Sân Khấu Lớn & Truyền Cảm Hứng Danh Vọng",
        "archetype": "Giám đốc sáng tạo, đại sứ thương hiệu, lãnh đạo truyền cảm hứng",
        "style": "Bạn sinh ra để tỏa sáng ở vị trí trung tâm. Bản lĩnh tự tin, phong thái đĩnh đạc và sức hút tự nhiên giúp bạn dễ dàng thu hút nguồn lực và truyền ngọn lửa nhiệt huyết cho tập thể.",
        "fields": ["Quản lý nghệ thuật & Công nghiệp giải trí", "Xây dựng thương hiệu cá nhân / PR cấp cao", "Lãnh đạo doanh nghiệp & Diễn giả truyền cảm hứng", "Thời trang, Thiết kế xa xỉ & Sự kiện quy mô lớn"],
        "challenge": "Cái tôi cao dễ khiến bạn nhạy cảm trước lời phê bình; hãy học cách lắng nghe ý kiến phản biện đa chiều từ đồng đội.",
    },
    "Xử Nữ": {
        "title": "Chuyên Gia Tinh Chỉnh Hệ Thống & Tối Ưu Hóa Chuẩn Mực",
        "archetype": "Kỹ sư phân tích dữ liệu, chuyên gia kiểm toán / chất lượng, nhà nghiên cứu",
        "style": "Óc phân tích tỉ mỉ, tư duy phản biện sắc lẹm và tiêu chuẩn làm việc không tì vết. Bạn là người giải mã các bài toán hóc búa nhất và biến những quy trình hỗn loạn thành cỗ máy vận hành trơn tru.",
        "fields": ["Phân tích dữ liệu lớn (Data Analysis) & Khoa học máy tính", "Kiểm toán tài chính, Pháp chế & Quản lý chất lượng (QA/QC)", "Nghiên cứu y sinh, Dược phẩm & Chăm sóc sức khỏe", "Biên tập chuyên sâu, Tư vấn tối ưu hóa quy trình"],
        "challenge": "Chủ nghĩa hoàn hảo quá mức dễ gây căng thẳng thần kinh và làm chậm tiến độ; hãy học cách chấp nhận 'đủ tốt để ra mắt'.",
    },
    "Thiên Bình": {
        "title": "Nhà Ngoại Giao Chiến Lược & Cân Bằng Lợi Ích Tổ Chức",
        "archetype": "Chuyên gia đàm phán hợp đồng, cố vấn pháp lý, giám tuyển nghệ thuật",
        "style": "Khả năng cân bằng tuyệt vời giữa thẩm mỹ tinh tế và nghệ thuật dung hòa xung đột. Bạn xuất sắc trong việc xây dựng quan hệ đối tác chiến lược và kiến tạo những thỏa thuận đôi bên cùng có lợi.",
        "fields": ["Luật thương mại, Trọng tài kinh tế & Ngoại giao", "Quan hệ đối tác (Partnerships) & Phát triển kinh doanh quốc tế", "Thiết kế nội thất, Mỹ thuật & Giám tuyển triển lãm", "Tư vấn hòa giải, Nhân sự cấp cao (Headhunter)"],
        "challenge": "Dễ do dự khi phải ra quyết định dứt khoát dưới áp lực thời gian; cần quyết đoán hơn và tin tưởng vào lập trường cá nhân.",
    },
    "Bọ Cạp": {
        "title": "Chiến Lược Gia Chiều Sâu & Chuyên Gia Biến Đổi Khủng Hoảng",
        "archetype": "Nhà đầu tư mạo hiểm, điều tra chiến lược, chuyên gia chuyển đổi số",
        "style": "Tầm nhìn thấu thị xuyên qua vẻ bề ngoài, khả năng giữ bí mật tuyệt đối và bản lĩnh kiên cường trước nghịch cảnh. Càng trong khủng hoảng, bạn càng trở nên tỉnh táo, quyết liệt và tái sinh mạnh mẽ hơn.",
        "fields": ["Đầu tư mạo hiểm (Venture Capital) & Tái cấu trúc doanh nghiệp", "An ninh mạng, Điều tra số liệu & Phân tích tình báo kinh tế", "Phẫu thuật y khoa, Nghiên cứu tâm lý học chiều sâu", "Quản trị rủi ro khủng hoảng & Xử lý tài sản đặc biệt"],
        "challenge": "Tính đa nghi và xu hướng muốn kiểm soát tất cả; cần học cách ủy quyền và xây dựng lòng tin minh bạch với cộng sự.",
    },
    "Nhân Mã": {
        "title": "Nhà Khai Phóng Tầm Nhìn & Cố Vấn Triết Lý Toàn Cầu",
        "archetype": "Chuyên gia hợp tác quốc tế, học giả nghiên cứu, nhà du hành truyền cảm hứng",
        "style": "Tư duy vĩ mô rộng mở, tinh thần khám phá không biên giới và đam mê chia sẻ tri thức chân lý. Bạn không thích bị bó hẹp trong văn phòng gò bó mà luôn hướng tầm mắt ra thế giới rộng lớn.",
        "fields": ["Hợp tác quốc tế, Thương mại xuyên biên giới & Ngoại thương", "Giảng dạy đại học, Nghiên cứu triết học / Tôn giáo / Văn hóa", "Du lịch cao cấp, Xuất bản sách & Phóng viên quốc tế", "Tư vấn chiến lược vĩ mô & Pháp lý quốc tế"],
        "challenge": "Dễ lạc quan tếu hoặc bỏ qua các chi tiết vận hành vi mô; cần có cộng sự tỉ mỉ hỗ trợ triển khai thực tế.",
    },
    "Ma Kết": {
        "title": "Nhà Kiến Tạo Đế Chế & Biểu Tượng Kỷ Luật Thượng Tầng",
        "archetype": "CEO điều hành, nhà kiến tạo thể chế, chuyên gia quản trị danh tiếng",
        "style": "Sức bền phi thường, đạo đức nghề nghiệp mẫu mực và tư duy xây dựng di sản lâu dài. Bạn leo lên đỉnh cao bằng từng bước đi vững chắc, được xã hội nể trọng bởi uy tín và trách nhiệm cao cả.",
        "fields": ["Điều hành doanh nghiệp cấp cao (C-Level) & Quản lý Nhà nước", "Bất động sản công nghiệp, Xây dựng cơ sở hạ tầng lớn", "Quản lý quỹ hưu trí / Quỹ đầu tư giá trị", "Chiến lược quản trị doanh nghiệp truyền thống & Bền vững"],
        "challenge": "Dễ đặt gánh nặng trách nhiệm quá lớn lên vai, trở nên khô cứng; cần học cách tưởng thưởng bản thân và cân bằng cuộc sống.",
    },
    "Bảo Bình": {
        "title": "Nhà Canh Tân Đột Phá & Tiên Tri Tương Lai Xã Hội",
        "archetype": "Kiến trúc sư công nghệ, nhà hoạt động xã hội tiến bộ, nhà phát minh",
        "style": "Tư duy đi trước thời đại cả thập kỷ, tinh thần nhân đạo vì cộng đồng và hoàn toàn không bị trói buộc bởi định kiến cũ kỹ. Bạn xuất sắc trong việc ứng dụng công nghệ để giải quyết các vấn đề vĩ mô của nhân loại.",
        "fields": ["Trí tuệ nhân tạo (AI), Blockchain & Công nghệ tương lai", "Nghiên cứu khoa học không gian, Năng lượng tái tạo", "Tổ chức phi chính phủ (NGO), Hoạt động vì quyền lợi cộng đồng", "Thiết kế sản phẩm số mang tính cách mạng"],
        "challenge": "Tư duy quá trừu tượng đôi khi khiến người xung quanh khó hiểu; cần rèn luyện cách diễn giải thực tế và kết nối cảm xúc đời thường.",
    },
    "Song Ngư": {
        "title": "Nghệ Sĩ Trực Giác & Sứ Giả Hàn Gắn Tâm Hồn",
        "archetype": "Nhà sáng tạo nghệ thuật huyền diệu, chuyên gia trị liệu tinh thần, cố vấn nhân văn",
        "style": "Trực giác thiên bẩm, trí tưởng tượng không giới hạn và lòng vị tha bao dung. Bạn kết nối với thế giới bằng tần số cảm xúc thanh cao, tạo ra những tác phẩm chạm thẳng vào trái tim người khác.",
        "fields": ["Điện ảnh, Âm nhạc, Hội họa & Nhiếp ảnh nghệ thuật", "Tâm lý trị liệu, Trị liệu bằng âm thanh / Nghệ thuật (Art Therapy)", "Thiết kế trải nghiệm người dùng mang tính cảm xúc", "Hoạt động từ thiện, Bảo trợ động vật & Môi trường sinh thái"],
        "challenge": "Dễ mất tập trung hoặc trốn tránh thực tế khi gặp áp lực deadline; cần một hệ thống quản lý thời gian rõ ràng và kỷ luật mềm.",
    },
}

def generate_career_insight_text(name: str, sun: str, moon: str, asc: str, mc: str, house10: str, saturn: str, jupiter: str, mercury: str) -> str:
    """Tạo bản luận giải hướng nghiệp cực kỳ sâu sắc, chuẩn xác về mặt chiêm tinh học."""
    clean_mc = (mc or sun or "Ma Kết").replace("Midheaven", "").replace("MC", "").strip()
    # Tìm cung MC phù hợp trong dictionary
    matched_sign = "Ma Kết"
    for sign in MC_CAREER_MAP.keys():
        if sign in clean_mc:
            matched_sign = sign
            break
    if matched_sign not in MC_CAREER_MAP:
        matched_sign = "Ma Kết"

    info = MC_CAREER_MAP[matched_sign]
    clean_sun = sun or "Bản mệnh"
    clean_moon = moon or "Nội tâm"
    clean_saturn = saturn or "Sao Thổ"
    clean_jupiter = jupiter or "Sao Mộc"

    fields_str = "\n".join([f"  • {f}" for f in info["fields"]])

    report = f"""### 🌟 BẢN ĐỒ HƯỚNG NGHIỆP CHIÊM TINH HỌC CHO {name.upper()}

**Định Vị Thiên Phú:** {info['title']}
*(Phân tích tương tác giữa Midheaven tại {clean_mc}, Mặt Trời {clean_sun} và Mặt Trăng {clean_moon})*

---

#### 1. Khí Chất Nghề Nghiệp & Thương Hiệu Cá Nhân
Với Trung Thiên (Midheaven - MC) tọa lạc tại **{matched_sign}**, bạn xuất hiện trước thế giới như một {info['archetype']}. {info['style']} Sự kết hợp cùng bản lĩnh cốt lõi của Mặt Trời {clean_sun} giúp bạn không chỉ có tầm nhìn mà còn có động lực nội tại mạnh mẽ để hiện thực hóa tham vọng.

#### 2. Sở Trường Năng Lực & Phong Cách Thực Thi
• **Tư duy & Giải quyết vấn đề:** Sự nhạy bén của Mặt Trăng {clean_moon} tạo nên một trực giác nghề nghiệp chính xác, giúp bạn 'ngửi' thấy cơ hội hoặc rủi ro trước khi chúng hiển hiện.
• **Thế mạnh độc bản:** Bạn có khả năng làm chủ chuyên môn sâu, phong thái đĩnh đạc và tạo dựng được lòng tin tự nhiên nơi đối tác cũng như cấp trên.

#### 3. Các Lĩnh Vực & Môi Trường Bứt Phá Lý Tưởng
Để tài năng nở rộ nhất, bạn nên ưu tiên những môi trường tôn trọng sự tự chủ, có lộ trình phát triển minh bạch và giá trị thực chất:
{fields_str}

#### 4. Bài Học Kỷ Luật ({clean_saturn}) & Đòn Bẩy Thăng Tiến ({clean_jupiter})
• **Thách thức cần vượt qua:** {info['challenge']}
• **Kim chỉ nam sự nghiệp:** Sao Mộc ({clean_jupiter}) bảo trợ cho sự mở rộng tri thức và quan hệ chất lượng cao. Đừng bao giờ ngừng nâng cấp kỹ năng chuyên môn cốt lõi. Hãy biến kỷ luật thép thành thói quen hằng ngày, bạn chắc chắn sẽ gặt hái vị thế vững chắc và danh tiếng xứng đáng với tầm vóc của mình."""

    return report.strip()


def generate_natal_depth_analysis(user_info: dict, houses: dict, aspects: dict, elemental_ratios: dict) -> str:
    """Tạo phân tích bản đồ sao cá nhân sâu sắc, giàu giá trị tâm lý học chiêm tinh."""
    sun = user_info.get("sun") or "Ma Kết"
    moon = user_info.get("moon") or "Kim Ngưu"
    asc = user_info.get("ascendant") or "Nhân Mã"
    mercury = user_info.get("mercury") or "Ma Kết"
    venus = user_info.get("venus") or "Bọ Cạp"
    mars = user_info.get("mars") or "Bạch Dương"
    mc = user_info.get("mc") or "Thiên Bình"

    fire = elemental_ratios.get("fire", 25)
    earth = elemental_ratios.get("earth", 35)
    air = elemental_ratios.get("air", 20)
    water = elemental_ratios.get("water", 20)

    # Tìm nguyên tố thống trị
    elements_sorted = sorted([("Lửa", fire), ("Đất", earth), ("Khí", air), ("Nước", water)], key=lambda x: x[1], reverse=True)
    dominant_elem, dom_val = elements_sorted[0]

    return f"""## 1. Tính Cách
Bản sắc của bạn được định hình bởi sự kết hợp độc đáo của bộ ba trụ cột (Big 3): Bản ngã kiên cường của Mặt Trời {sun}, chiều sâu tâm lý từ Mặt Trăng {moon} và chiếc 'mặt nạ xã hội' lôi cuốn của Cung Mọc {asc}. Bạn sở hữu tư duy có chiều sâu, không thích những mối quan hệ hời hợt hay sự phù phiếm. Cách bạn bước vào thế giới là sự tự chủ, điềm tĩnh nhưng chứa đựng ngọn lửa nội lực âm thầm rất lớn.

## 2. Cảm Xúc
Mặt Trăng tại {moon} bộc lộ một thế giới nội tâm phong phú và đòi hỏi sự an toàn tinh thần rất cao. Dưới áp lực, bạn có xu hướng tự xử lý cảm xúc trong không gian riêng trước khi chia sẻ. Bạn rất tinh tế trong việc cảm nhận năng lượng xung quanh, trân trọng những giá trị chân thực và sẵn sàng là chỗ dựa vững chãi nhất cho những người xứng đáng với niềm tin của bạn.

## 3. Sự Nghiệp
Với Trung Thiên (MC) tại {mc} cùng tư duy sắc sảo từ Thủy tinh {mercury}, con đường công danh của bạn gắn liền với khả năng xây dựng hệ thống, đàm phán chiến lược và tối ưu hóa nguồn lực. Bạn không chạy theo những ảo vọng ngắn hạn mà luôn có lộ trình dài hạn rõ ràng. Bạn đạt phong độ rực rỡ nhất trong các vai trò lãnh đạo chuyên môn, hoạch định dự án hoặc quản trị chiến lược.

## 4. Tình Yêu
Sao Kim tại {venus} kết hợp cùng Hỏa tinh {mars} tạo nên một phong cách yêu mãnh liệt, chân thành và tuyệt đối trung thành. Bạn không vội vã trong chuyện tình cảm; bạn cần thời gian để quan sát và thẩm định. Khi đã tìm được người tri kỷ đồng điệu về tần số tâm hồn, bạn sẽ dành trọn sự ấm áp, chở che và tận tụy để vun đắp tổ ấm vững bền.

## 5. Điểm Mạnh
Thế mạnh vượt trội của bạn là năng lực tập trung phi thường, sự kiên nhẫn và khả năng phục hồi sau thất bại cực kỳ đáng nể. Bạn sở hữu trực giác thực tế nhạy bén, biết cách biến các ý tưởng trừu tượng thành kết quả cụ thể. Thách thức lớn nhất là xu hướng ôm đồm trách nhiệm và tự khắt khe quá mức với bản thân; hãy học cách buông lỏng và cho phép mình được nghỉ ngơi.

## 6. Nguyên Tố
Cấu trúc năng lượng bản mệnh: {dominant_elem} chiếm ưu thế ({dom_val}%), Đất {earth}%, Lửa {fire}%, Khí {air}%, Nước {water}%. Sự phân bổ này mang đến sự vững vàng trong hành động kết hợp với khả năng thích ứng linh hoạt. Năng lượng trội giúp bạn giữ vững lập trường ngay cả khi nghịch cảnh bủa vây, đồng thời bảo toàn sự tỉnh táo cần thiết trong mọi quyết định quan trọng.

## 7. Lời Khuyên
Hãy nhớ rằng giá trị của bạn không chỉ đo bằng những thành tựu hữu hình. Hãy học cách tin tưởng và ủy quyền nhiều hơn cho đồng đội, mở lòng đón nhận sự giúp đỡ từ những người yêu thương. Dành thời gian kết nối với thiên nhiên và nuôi dưỡng đời sống tinh thần sẽ giúp bạn tái tạo nguồn sinh khí dồi dào.

## 8. Người Lý Tưởng
Mẫu người đồng điệu lý tưởng với bạn là người sở hữu trí tuệ sâu sắc, tính cách chín chắn và có chung hệ giá trị sống tử tế, bền vững. Sự kết hợp giữa năng lượng ổn định của nhóm Đất và sự thấu hiểu ấm áp của nhóm Nước sẽ tạo nên một mối quan hệ tri kỷ bền vững theo năm tháng, nơi cả hai cùng nâng đỡ nhau phát triển trọn vẹn."""
