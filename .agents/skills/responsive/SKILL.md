---
name: responsive
description: Kiểm tra hoặc sửa giao diện responsive của Resonancia trên các viewport desktop và mobile. Dùng khi người dùng yêu cầu xử lý responsive, lỗi tràn ngang, breakpoint hoặc trải nghiệm mobile.
---

# Responsive cho Resonancia

Trước khi sửa, đọc `AGENTS.md`, `.agents/design/DESIGN_BRIEF.md`, `.agents/rules/RULES.md` và `.agents/design/WORKFLOW.md`.

## Giới hạn

- Giữ nguyên màu sắc, cấu trúc trang, thứ tự nội dung, bố cục, kích thước, khoảng cách và cách sắp xếp responsive hiện có, trừ khi người dùng yêu cầu rõ thay đổi tương ứng.
- Không đổi breakpoint class hoặc số cột chỉ để làm giao diện vừa viewport. Sửa lỗi bằng thay đổi nhỏ nhất phù hợp với yêu cầu.
- Không cài dependency mới.
- Nếu yêu cầu cần thay đổi yếu tố đang bị khóa, nêu rõ xung đột và xin phép trước khi thực hiện phần đó.

## Quy trình

1. Xác định route, component, trạng thái và hành vi liên quan. Đọc các breakpoint hiện có (`sm:`, `md:`, `lg:`, `xl:`) và ghi nhận viewport đang lỗi cũng như viewport đang ổn.
2. Chụp hoặc xác nhận baseline tại `390 · 640 · 768 · 1280 · 1536 px` trong cùng route, trạng thái và vị trí cuộn. Ghi rõ viewport nào không thể kiểm tra.
3. Sửa nguyên nhân nhỏ nhất có thể, giữ nguyên các yếu tố bị khóa và breakpoint hiện có.
4. Kiểm tra lại đủ năm viewport và đối chiếu với baseline.

## Checklist

- [ ] Không có scrollbar ngang.
- [ ] Grid và flex hoạt động đúng tại các breakpoint đang dùng.
- [ ] Sidebar không che nội dung trên mobile.
- [ ] Văn bản không bị cắt hoặc tràn.
- [ ] Touch target trên mobile đạt tối thiểu `44 × 44 px`.
- [ ] Bố cục và viewport đang ổn trước đó không bị hồi quy.

## Báo cáo

Nêu file đã sửa, nguyên nhân và hành vi responsive đã đổi, viewport đã kiểm tra và kết quả từng viewport. Không nói đã xác minh ở viewport nào nếu chưa kiểm tra viewport đó.
