# Kế hoạch thiết lập design system và cải thiện UI

## Giới hạn cố định

- Giữ nguyên bảng màu và từng giá trị màu hiện tại.
- Giữ nguyên cấu trúc trang, phân cấp route, thứ tự component, bố cục, kích thước, khoảng cách và cách sắp xếp responsive.
- Không gỡ hoặc thay đổi phong cách/hiệu ứng vũ trụ hiện có.
- Không tự cài dependency hoặc MCP.
- Không thêm icon emoji chức năng; thay bằng SVG inline nếu cần.

---

## Đã hoàn tất

- [x] Khảo sát CSS web và xác định nơi khai báo style hiện tại.
- [x] Ghi lại công cụ MCP đang có trong `.agents/design/MCP_MAP.md`.
- [x] Tạo các ghi chú tham khảo và brief bảo vệ thiết kế hiện hữu.
- [x] Tạo quy tắc, workflow, hướng dẫn Codex, prompt vai trò và skill dùng lại trong `.agents/`.
- [x] **Nâng cấp v2:** Bổ sung nguyên tắc "trông như người làm" vào toàn bộ hệ thống agents — RULES, DESIGN_BRIEF, WORKFLOW, tất cả roles và cả 2 skills.

---

## Các bước tiếp theo

1. **Kiểm kê icon emoji chức năng:** liệt kê toàn bộ emoji đang dùng làm icon UI trong các component (Sidebar, HomePage, ProfilePage, MatchPage...). Chỉ ghi nhận, không sửa mã.
2. **Chuẩn bị bản đồ thay thế:** với mỗi emoji chức năng, xác định SVG Lucide/Heroicons tương đương và ghi vào `references/icon-map.md`.
3. **Chụp baseline:** chụp các màn hình đang có ở kích thước đã thống nhất và lưu vào `shots/baseline/`.
4. **Thay thế icon theo thứ tự ưu tiên:** Sidebar (điều hướng chính) → ProfilePage → HomePage → MatchPage → các trang còn lại.
5. **Rà soát trợ năng:** kiểm tra SVG mới có `aria-label` đúng không; Lighthouse audit sau mỗi nhóm thay thế.
6. **Tìm và loại bỏ dấu hiệu AI khác** (animation quá mức, uppercase không cần thiết...) — chỉ làm khi được yêu cầu riêng.

---

## Phạm vi cho phép

Kế hoạch này cho phép:
- Tạo tài liệu design và file cấu hình agent/skill/workflow.
- Thay thế emoji icon chức năng bằng SVG inline (được yêu cầu tại v2).

Không cho phép:
- Sửa CSS ứng dụng (màu, layout, spacing).
- Đổi route hoặc cấu trúc component.
- Thiết kế lại thị giác, sửa Figma hoặc dịch vụ bên ngoài.
- Muốn đổi màu hay bố cục phải cập nhật giới hạn bằng yêu cầu rõ ràng trước.
