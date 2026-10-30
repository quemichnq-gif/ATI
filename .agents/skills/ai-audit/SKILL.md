---
name: ai-audit
description: Quét toàn bộ UI web Resonancia, phát hiện các dấu hiệu "AI tạo" và trình bày danh sách gợi ý cụ thể để người dùng chọn lọc và sửa. Không tự sửa code khi chạy audit — chỉ phân tích và báo cáo.
---

# AI Website Visual Audit & Redesign — Resonancia

## Vai trò

Bạn là **Senior UI/UX Designer kết hợp Frontend Engineer**. Nhiệm vụ: đánh giá website thực tế qua trình duyệt, phát hiện các vấn đề khiến giao diện trông rập khuôn, thiếu bản sắc hoặc giống sản phẩm tạo tự động bằng AI — sau đó cải thiện trực tiếp trên codebase.

> **Ràng buộc dự án (đọc trước khi làm bất kỳ điều gì):**
> - Giữ nguyên toàn bộ bảng màu `--cosmic-*` và giá trị CSS trong `index.css`. Không thêm màu mới.
> - Giữ nguyên cấu trúc trang, route, thứ tự component, bố cục và khoảng cách.
> - Không gỡ hiệu ứng vũ trụ (sao, gradient, kính mờ, orbit ring, glow).
> - Không cài thêm thư viện. Stack: React 19, TypeScript, Tailwind 3.4, Framer Motion, Firebase.
> - Nếu bất kỳ thay đổi nào yêu cầu vi phạm các điều trên → dừng, báo xung đột, xin phép.

---

## Giai đoạn 1 — Khảo sát & Quan sát thực tế

**Không kết luận về giao diện chỉ dựa trên code khi chưa quan sát thực tế.**

### 1.1 Chuẩn bị môi trường

```bash
# Xác định lệnh chạy dev của dự án
# Đọc package.json để biết script đúng
cd AI_App_FE/ResonanciaWeb
npm run dev   # hoặc script tương ứng
```

Chờ server khởi động, xác nhận URL (thường `http://localhost:5173`).

### 1.2 Chụp baseline — mỗi trang, mỗi viewport

Dùng trình duyệt (Chrome DevTools hoặc MCP browser tool nếu có) để:

1. Mở từng route: `/home`, `/natal`, `/match`, `/chat`, `/notifications`, `/profile`, `/login`
2. Chụp screenshot toàn trang tại **3 viewport bắt buộc**: `390px · 768px · 1280px`
3. Chụp thêm: hover state trên card, button active, form input focused, empty state, loading state

Ghi nhận quan sát **trực tiếp từ hình ảnh**, không từ code:
- Màu thực tế có khớp ý định không?
- Text có đọc được không?
- Element nào bị cắt, tràn, chồng lấn?
- Cảm giác tổng thể: có trông "template AI" không? Tại sao?

### 1.3 Checklist quan sát

Đánh dấu từng mục sau khi quan sát thực tế:

- [ ] Đã xem `/home` ở desktop + mobile
- [ ] Đã xem `/natal`, `/match`, `/profile`, `/chat`
- [ ] Đã kiểm tra hover state trên card và button
- [ ] Đã kiểm tra loading skeleton
- [ ] Đã kiểm tra empty state
- [ ] Đã kiểm tra sidebar collapse trên mobile

---

## Giai đoạn 2 — AI Visual Audit

Đánh giá **10 tiêu chí** sau khi đã quan sát giao diện thực tế. Chỉ ghi vấn đề khi có **bằng chứng quan sát được** — không suy diễn từ code.

### Tiêu chí đánh giá

| # | Tiêu chí | Câu hỏi kiểm tra |
|---|----------|-----------------|
| C1 | **Visual hierarchy** | Có điểm nhấn rõ ràng? Mắt biết nhìn vào đâu trước? |
| C2 | **Typography** | Font, cỡ chữ, weight có tạo thứ bậc tự nhiên? Có chỗ nào uppercase-widest-tracking trên text dài? |
| C3 | **Color system** | Màu có nhất quán? Có màu nào lạc tông? Contrast có đạt WCAG AA? |
| C4 | **Layout & spacing** | Khoảng cách có nhịp điệu? Hay có chỗ quá chật/quá trống không lý do? |
| C5 | **Components** | Card, button, input có nhất quán về shape, border, shadow không? |
| C6 | **Icons** | Icon SVG có đồng bộ style (stroke width, weight)? Có icon nào trông không phù hợp? |
| C7 | **Branding** | Resonancia có bản sắc riêng? Hay trông như template chiêm tinh generic? |
| C8 | **Product fit** | Thiết kế có hỗ trợ user journey: ghép đôi → trò chuyện → xem lá số? |
| C9 | **Responsive** | Layout mobile có vỡ, tràn, touch target quá nhỏ? |
| C10 | **Accessibility** | Focus ring có thấy? Screen reader có đọc được các label? |

### Format ghi vấn đề

Mỗi vấn đề phát hiện ghi đủ 6 trường:

```
[Px] Tên vấn đề ngắn
- Trang/khu vực: [route + component]
- Bằng chứng: [mô tả điều thấy được trong screenshot]
- Nguyên nhân có thể: [...]
- Mức độ: Critical / High / Medium / Low
- Giải pháp: [cụ thể, không chung chung]
- File cần sửa: [danh sách file]
```

### Nguyên tắc phán xét

- Gradient, bo tròn, glow **không phải** vấn đề tự động — chỉ vấn đề nếu thiếu mục đích hoặc lặp lại vô nghĩa.
- Typography uppercase + tracking **không phải** vấn đề nếu dùng trên label ngắn (< 3 từ).
- Màu neon **không phải** vấn đề nếu trong bảng màu dự án và dùng có chủ đích.
- Vấn đề phải có **bằng chứng thực tế**, không phải cảm giác.

---

## Giai đoạn 3 — Lập kế hoạch

Trước khi sửa bất kỳ dòng code nào:

### 3.1 Xác định phạm vi

- Liệt kê các vấn đề theo mức độ: Critical → High → Medium → Low
- Xác định vấn đề nào **trong giới hạn cho phép** (không cần xin phép)
- Xác định vấn đề nào **cần xin phép** (ảnh hưởng màu, bố cục, cấu trúc)

### 3.2 Nhóm thay đổi

```
Nhóm A — Sửa ngay, không cần phê duyệt (text, aria, focus, duration nhỏ):
  - [danh sách vấn đề]

Nhóm B — Cần phê duyệt trước (ảnh hưởng visual rõ ràng):
  - [danh sách vấn đề + mô tả thay đổi cụ thể]

Nhóm C — Không sửa (ngoài giới hạn hoặc rủi ro cao):
  - [danh sách + lý do]
```

### 3.3 Trình kế hoạch

Xuất kế hoạch ra artifact Markdown, hỏi người dùng phê duyệt **Nhóm B** trước khi thực hiện. Nhóm A có thể bắt đầu ngay sau khi người dùng xác nhận audit.

---

## Giai đoạn 4 — Thực hiện

Sau khi được phê duyệt:

### Nguyên tắc triển khai

1. Sửa **thay đổi nhỏ nhất** đáp ứng yêu cầu — không refactor ngoài phạm vi.
2. Loại bỏ hiệu ứng trang trí **không có mục đích chức năng**.
3. Cải thiện typography, text content, focus state, aria label.
4. Không xóa hoặc giả lập chức năng thật để giao diện đẹp hơn.
5. Không thay đổi logic nghiệp vụ.
6. Dùng lại component, class, token hiện có — tránh tạo trùng lặp.
7. Ghi comment inline với lý do thay đổi khi không rõ ràng.

### Checklist trước khi commit mỗi file

- [ ] Không có màu mới ngoài CSS variable hiện có
- [ ] Không có thư viện mới
- [ ] Bố cục và cấu trúc DOM không thay đổi
- [ ] Không có emoji chức năng mới
- [ ] Hover scale ≤ 1.03, transition ≤ 250ms (trừ mount animation)
- [ ] SVG mới có aria-label hoặc aria-hidden

---

## Giai đoạn 5 — Xác minh thực tế

**Không tuyên bố đã sửa thành công nếu chưa kiểm tra bằng chứng thực tế.**

### 5.1 Chạy lại website

```bash
npm run dev  # hoặc script tương ứng, reload trang
```

### 5.2 So sánh screenshot trước / sau

- Chụp lại cùng route, cùng viewport, cùng trạng thái như baseline
- Đặt cạnh nhau (hoặc mô tả delta rõ ràng)
- Xác nhận từng vấn đề trong báo cáo audit đã được giải quyết

### 5.3 Regression check

- Màu không đổi so với baseline
- Bố cục không lệch
- Hiệu ứng vũ trụ vẫn hiển thị
- Các trang khác không bị ảnh hưởng

### 5.4 Nếu còn vấn đề

Tiếp tục sửa và xác minh lại — không đóng audit cho đến khi kiểm tra xong.

---

## Báo cáo cuối

Khi hoàn thành, cung cấp:

```markdown
## Kết quả AI Audit — [timestamp]

### Vấn đề đã phát hiện: N
### Vấn đề đã sửa: N
### Vấn đề không sửa (và lý do): N

### File đã chỉnh sửa
- `file.tsx` — mô tả thay đổi

### Kết quả trước / sau
[Screenshot comparison hoặc mô tả delta rõ ràng]

### Còn tồn tại / chưa xác minh được
- [danh sách]
```

---

## Nguồn tham khảo cho nghiên cứu UX

Được dùng để học kỹ thuật, **không** copy màu/bố cục/asset:

| Nguồn | Học gì |
|-------|--------|
| `co-star.app` | Hierarchy tối giản trong dark astro UI |
| `sanctuary.app` | Card zodiac, empty state |
| `linear.app` | Typography nhất quán, skeleton loader |
| `vercel.com` | Focus ring, dark button treatment |
| `refactoringui.com` | Spacing rhythm, visual hierarchy |
| `mobbin.com` | Pattern dating/astro app thực tế |
