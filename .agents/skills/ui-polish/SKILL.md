---
name: ui-polish
description: Trau chuốt màn hình hoặc thành phần Resonancia theo yêu cầu, vẫn giữ nguyên màu sắc, cấu trúc và bố cục. Dùng khi người dùng muốn cải thiện UI hiện tại.
---

# Trau chuốt UI Resonancia

Trước khi sửa, đọc `AGENTS.md`, `.agents/design/DESIGN_BRIEF.md`, `.agents/rules/RULES.md` và `.agents/design/WORKFLOW.md`.

---

## Quy trình trau chuốt

1. **Xác định phạm vi.** Đọc rõ route, component, trạng thái và hành vi được yêu cầu. Chụp baseline ở **390 · 640 · 768 · 1280 · 1536 px** (hoặc tối thiểu 390 · 768 · 1280 px khi hạn chế thời gian).

2. **Kiểm kê "điểm AI".** Trước khi sửa, quét component mục tiêu theo danh sách sau và ghi nhận mục nào cần xử lý:
   - Icon emoji chức năng đang dùng.
   - Animation/transition nào có duration > 400ms hoặc scale > 1.05.
   - Text uppercase + widest letter-spacing cho văn bản chạy dài.
   - Nội dung lấp chỗ trống.

3. **Giữ nguyên responsive.** Ghi nhận breakpoint và viewport đang ổn để tránh hồi quy. Nếu yêu cầu có sửa responsive, áp dụng `.agents/skills/responsive/SKILL.md`.

4. **Giữ nguyên yếu tố bị khóa.** Màu, thứ tự thành phần, hình học, khoảng cách, cách sắp xếp responsive và hiệu ứng vũ trụ. Không cài gói mới.

5. **Chỉ triển khai thay đổi nhỏ nhất** đáp ứng yêu cầu mà không đụng đến yếu tố bị khóa.

6. **Nếu cần đổi bảng màu, cấu trúc hoặc bố cục**, hãy dừng và xin phép người dùng cho đúng sai khác đó.

7. **So sánh trước/sau** trên cùng route, trạng thái, viewport và vị trí cuộn. Với thay đổi responsive, dùng đủ bộ viewport và checklist trong `.agents/skills/responsive/SKILL.md`.

8. **Báo cáo:** các file đã đổi, vấn đề đã xử lý (kể cả "điểm AI" đã loại bỏ), viewport đã kiểm tra, kết quả responsive, kiểm tra đã thực hiện và việc còn tồn.

---

## Phạm vi trau chuốt được phép

| Hạng mục | Được phép | Không được phép |
|---|---|---|
| Icon | Thay emoji chức năng → SVG inline; thay ký hiệu hoàng đạo Unicode ♈♉♊♋♌♍♎♏♐♑♒♓ → SVG inline tùy chỉnh (có thể dùng glow/gradient CSS hiện có); thay 🌙 → SVG | Thêm emoji mới (kể cả 🌙); giữ ký hiệu Unicode hoàng đạo; cài gói icon |
| Màu sắc | Dùng đúng biến CSS hiện có | Thay giá trị, thêm màu mới |
| Typography | Sửa line-height, loại bỏ uppercase không cần thiết | Thay font, đổi font-size tổng thể |
| Animation | Giảm duration/scale về ngưỡng tự nhiên nếu yêu cầu | Thêm animation mới vào phần tử không cần |
| Trạng thái | Thêm/sửa loading, error, empty, success state | Đổi màu trạng thái |
| Trợ năng | Thêm aria-label, role, title cho icon SVG | Đổi DOM structure |
| Focus | Cải thiện focus ring bằng màu hiện có | Đổi kích thước/vị trí phần tử |
| Responsive | Chỉ xử lý theo yêu cầu responsive cụ thể và skill `.agents/skills/responsive/SKILL.md` | Tự ý đổi breakpoint class hoặc grid column count |

---

## SVG inline — hướng dẫn nhanh

Người dùng đã cho phép truy cập web. Khi thay icon emoji bằng SVG:
- Vào `lucide.dev`, `heroicons.com` hoặc `phosphoricons.com` để tìm icon phù hợp.
- Copy SVG `<path>` của icon.
- Dán vào JSX dạng:
  ```tsx
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20" height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-label="Trang chủ"
  >
    <path d="..." />
  </svg>
  ```
- Dùng `stroke="currentColor"` để SVG thừa hưởng màu text từ component cha.
- Không hardcode màu trong SVG trừ khi icon cần màu cố định không phụ thuộc context.
- Ghi URL nguồn icon vào comment inline: `{/* icon: lucide.dev/icons/home */}`
