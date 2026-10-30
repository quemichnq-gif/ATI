# Cấu hình agent của dự án

Các hướng dẫn dùng lại được đặt trong `.agents/` và chia theo nhóm:

- `rules/` — quy tắc giao diện và prompt vai trò.
- `skills/` — skill Codex `human-ui-design` và `ui-polish`.
- `design/` — design brief, workflow, plan, MCP map và tư liệu tham khảo.

`AGENTS.md` ở gốc repo liên kết các hướng dẫn này với dự án. Không dùng `.claude/` để tránh lưu nhiều bản cấu hình giống nhau.

---

## Quyền truy cập web

Người dùng **đã cho phép truy cập web bên ngoài** để nghiên cứu và cải thiện UI (cập nhật 2026-10-30).

- ✅ Tìm SVG icon từ Lucide, Heroicons, Phosphor.
- ✅ Nghiên cứu nguyên lý UX, typography, spacing, animation từ app thực tế.
- ✅ Đọc tài liệu kỹ thuật (CSS, Framer Motion, Tailwind, React).
- ❌ Sao chép màu sắc, bố cục, content, asset có bản quyền từ web vào Resonancia.
- ❌ Dùng trang tham khảo làm cớ thay đổi yếu tố đã khóa.
- ❌ Cài thêm thư viện/MCP chưa được yêu cầu.

---

## Thứ tự đọc bắt buộc trước khi làm UI

1. `.agents/rules/RULES.md` — quy tắc tổng thể (màu/bố cục, human-first, quyền web).
2. `.agents/design/DESIGN_BRIEF.md` — bối cảnh sản phẩm, giới hạn và nguồn style.
3. `.agents/design/WORKFLOW.md` — quy trình 8 bước và checklist.
4. Role phù hợp trong `.agents/rules/roles/` — ui-designer, ui-builder, ui-critic, ui-researcher hoặc a11y-qa.

---

## Skill dùng lại

- `/human-ui-design` — mọi tác vụ tạo hoặc sửa UI.
- `/ui-polish` — khi người dùng muốn làm đẹp hơn từ UI hiện có mà không đổi cấu trúc.
