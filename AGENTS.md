# Hướng dẫn cho dự án

## Bảo toàn giao diện hiện tại

Với mọi công việc giao diện, hãy đọc `.agents/design/DESIGN_BRIEF.md` và `.agents/rules/RULES.md` trước.

- Giữ nguyên bảng màu hiện tại và toàn bộ giá trị màu. Không đổi màu, thay bảng màu, chuẩn hóa hay thêm bảng màu mới.
- Giữ nguyên cấu trúc trang/thành phần, thứ tự nội dung, kiến trúc thông tin và bố cục. Không sắp xếp lại, đổi kích thước, thêm hoặc xóa khu vực hiển thị.
- Không thiết kế lại hoặc gỡ hiệu ứng nền vũ trụ, sao, gradient, kính mờ hay glow.
- Website tham khảo **được phép dùng để nghiên cứu UX, tìm SVG icon và cải thiện UI** (người dùng đã cho phép 2026-10-30), nhưng không phải lý do để đổi màu, cấu trúc hoặc bố cục Resonancia.
- Nếu yêu cầu buộc phải thay đổi màu, cấu trúc hoặc bố cục, hãy nêu xung đột và xin người dùng cho phép rõ ràng trước khi làm.

Trong phạm vi trên, ưu tiên: cải thiện ngữ nghĩa HTML, nhãn trợ năng, thao tác bàn phím, trạng thái biểu mẫu, tính đúng đắn của trạng thái giao diện và **thay thế icon emoji chức năng bằng SVG inline**. Không cài thư viện hoặc MCP nếu chưa được yêu cầu.

Dùng `.agents/skills/human-ui-design/SKILL.md` cho công việc UI nói chung và `.agents/skills/ui-polish/SKILL.md` (gọi bằng `/ui-polish`) cho yêu cầu trau chuốt giao diện. Dùng `.agents/skills/visual-effects/SKILL.md` khi yêu cầu liên quan đến cải thiện hiệu ứng thị giác (glow, gradient, animation, zodiac SVG, glassmorphism). Prompt vai trò nằm tại `.agents/rules/roles/`. Quy trình và kế hoạch nằm trong `.agents/design/`.
