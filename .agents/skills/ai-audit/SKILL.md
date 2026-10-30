---
name: ai-audit
description: Quét toàn bộ UI web Resonancia, phát hiện các dấu hiệu "AI tạo" và trình bày danh sách gợi ý cụ thể để người dùng chọn lọc và sửa. Không tự sửa code khi chạy audit — chỉ phân tích và báo cáo.
---

# AI Audit — Phát hiện dấu hiệu "AI tạo" trong UI Resonancia

> **Mục tiêu:** Đọc toàn bộ file `.tsx` trong `AI_App_FE/ResonanciaWeb/src/`, phân loại theo 8 nhóm dấu hiệu, xuất báo cáo Markdown để người dùng xem xét và chọn mục cần sửa. **Không tự sửa code trong bước này.**

---

## Khi nào dùng skill này

- Người dùng muốn kiểm tra tổng thể xem UI có trông quá "AI-generated" không.
- Trước khi ra mắt tính năng mới — kiểm tra lần cuối.
- Sau một đợt thêm nhiều component — đảm bảo không có regression.

---

## 8 Nhóm dấu hiệu cần quét

### G1 — Icon emoji chức năng
Tìm emoji Unicode dùng làm icon điều hướng, nút, nhãn thông tin trong JSX.

**Patterns cần tìm:**
- Emoji trực tiếp trong JSX: `🏠`, `🔮`, `💬`, `🔔`, `👤`, `📅`, `⏰`, `💼`, `✏️`, `✅`, `⏳`, `📷`, `🌊`, `🔥`, `🌍`, `💨`, `💧`, `⭐`, `🚀`, `💫`
- Emoji trong string template: `` `${emoji}` `` nếu emoji là Unicode symbol
- **Không** tính: ký hiệu hoàng đạo (♈♉♊♋♌♍♎♏♐♑♒♓) trong data display

**Mức độ:** 🔴 Cao — trông rõ ràng nhất là AI-generated

---

### G2 — Animation/Transition quá kịch tính
Tìm giá trị vượt ngưỡng tự nhiên.

**Patterns cần tìm:**
- `scale` > 1.03 trong Framer Motion props hoặc CSS `transform`
- `duration` > 0.4 (400ms) trong Framer Motion transition không phải mount animation
- `transition: all Xs` với X > 0.35 trong CSS inline
- `animation-duration` > 400ms trong CSS class thông thường (không phải orbit/twinkle)
- `bounce`, `spring` với `stiffness` < 100 hoặc `damping` < 10 (quá lò xo)

**Mức độ:** 🟡 Trung bình

---

### G3 — Typography AI-ish
Tìm kiểu chữ trông "template".

**Patterns cần tìm:**
- `tracking-widest` kết hợp `uppercase` trên văn bản chạy dài (> 3 từ)
- `font-weight: 900` hoặc `font-black` trên body text
- `text-center` trên khối nội dung > 2 dòng (prose block)
- `letter-spacing` > 0.15em trên text thường

**Mức độ:** 🟡 Trung bình

---

### G4 — Nội dung lấp chỗ trống / placeholder
Tìm text trông như AI sinh ra để điền chỗ.

**Patterns cần tìm:**
- Chuỗi "Lorem", "placeholder", "test", "demo", "sample" trong JSX text
- Số liệu giả trông có vẻ chính xác trong text cứng: "87%", "3.4k", "12,345"
- Tên người giả trong text cứng: "Nguyễn Văn A", "User 1"
- CTA với emoji đầu dòng trong text cứng: `"✨ Xem ngay"`, `"🚀 Bắt đầu"`
- Văn bản nghe như chatbot: "Vũ trụ đang phân tích...", "AI đang xử lý..."

**Mức độ:** 🟠 Quan trọng — ảnh hưởng độ tin cậy

---

### G5 — Layout đối xứng hoàn hảo không có lý do
Tìm layout trông quá "cân đối máy móc".

**Patterns cần tìm:**
- 3 column grid với 3 card identical (cùng height, cùng padding, cùng icon size)
- Hero section: title + subtitle + CTA button căn giữa hoàn toàn, không có element lệch
- Danh sách tính năng 3-4 mục mỗi mục đều có icon + title + description cùng độ dài
- `grid-cols-3` hoặc `grid-cols-4` trong section marketing

**Mức độ:** 🟡 Thấp — cần ngữ cảnh để đánh giá

---

### G6 — Màu sắc / gradient quá rực
Tìm giá trị màu neon cường độ cao không có trong bảng màu dự án.

**Patterns cần tìm:**
- Màu hex/rgb không nằm trong: `#0a0015`, `#1a0030`, `#9d4edd`, `#ff6eb4`, `#4cc9f0`, `#ffd700` và các biến thể rgba của chúng
- `opacity` của màu neon > 0.7 trên diện rộng (background area)
- Nhiều hơn 3 màu neon khác nhau trong cùng 1 component

**Mức độ:** 🔴 Cao nếu có màu ngoài bảng

---

### G7 — Hover/Focus state thiếu hoặc không tự nhiên
Kiểm tra trạng thái tương tác.

**Patterns cần tìm:**
- Element bấm được (`button`, `[role="link"]`, `NavLink`) không có hover state
- Hover chỉ có `opacity` thay đổi mà không có gì khác (quá đơn giản)
- Focus ring bị `outline: none` mà không có focus-visible thay thế
- `cursor: pointer` thiếu trên element bấm được

**Mức độ:** 🟠 Quan trọng cho UX

---

### G8 — SVG / Icon thiếu aria-label
Tìm SVG không có accessibility.

**Patterns cần tìm:**
- `<svg>` không có `aria-label`, `aria-hidden`, hoặc `role="img"` + `<title>`
- Icon SVG chức năng (không phải decorative) có `aria-hidden="true"`
- `<img>` không có `alt`

**Mức độ:** 🟠 Quan trọng cho a11y

---

## Quy trình audit

1. **Đọc từng file** trong `AI_App_FE/ResonanciaWeb/src/` — pages, components, (bỏ qua services, store, types).
2. **Quét theo 8 nhóm** — ghi nhận: file, số dòng, đoạn code vi phạm, nhóm lỗi.
3. **Phân loại mức độ:** 🔴 Cao / 🟠 Quan trọng / 🟡 Thấp
4. **Xuất báo cáo Markdown** với cấu trúc:
   - Bảng tổng hợp: số vấn đề theo nhóm và mức độ
   - Chi tiết từng vấn đề: file + dòng + snippet + giải thích + gợi ý sửa
   - Phần "Không cần sửa" — ghi rõ lý do ngoại lệ
5. **Hỏi người dùng** chọn mục nào muốn sửa trước khi thực hiện bất kỳ thay đổi nào.

---

## Format báo cáo

```markdown
## AI Audit Report — Resonancia Web
_Quét lúc: [timestamp] — [N] file — [N] vấn đề_

### Tổng hợp
| Nhóm | 🔴 Cao | 🟠 Quan trọng | 🟡 Thấp | Tổng |
|------|--------|--------------|---------|------|
| G1 Icon emoji    | N | - | - | N |
| G2 Animation     | - | N | N | N |
...

### Chi tiết

#### [G1] Icon emoji chức năng — 🔴 Cao
| # | File | Dòng | Code | Gợi ý |
|---|------|------|------|-------|
| 1 | `ProfilePage.tsx` | 62 | `{zodiacEmoji}` | Thay bằng `<ZodiacIcon>` SVG |

...

### Không cần sửa (ngoại lệ hợp lệ)
- `astrologyMap.ts` line 17–29: ký hiệu hoàng đạo trong data map — đúng thiết kế.
```

---

## Sau audit

- **Không tự sửa.** Chờ người dùng xác nhận mục muốn sửa.
- Khi người dùng chọn mục, dùng skill tương ứng:
  - Icon → `human-ui-design/SKILL.md` + `ui-polish/SKILL.md`
  - Animation → `visual-effects/SKILL.md`
  - Typography, layout → `human-ui-design/SKILL.md`
