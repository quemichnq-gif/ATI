# Resonancia — Tóm tắt định hướng thiết kế

## Bối cảnh sản phẩm

- Sản phẩm: ứng dụng web ghép đôi dựa trên chiêm tinh, giao diện tiếng Việt; repo cũng có ứng dụng React Native.
- Stack web: React 19, TypeScript, Vite, Tailwind CSS 3.4, React Router 7 và Framer Motion.
- Đối tượng: người trưởng thành nói tiếng Việt, quan tâm đến tương hợp và nội dung về mối quan hệ.
- Nhận diện hiện tại: bảng màu vũ trụ tối, nền sao, thứ bậc thành phần và cách bố cục trang đã có là lựa chọn chính thức của dự án.

---

## Giới hạn phải giữ nguyên

1. Không đổi, thay thế, chuẩn hóa hoặc mở rộng bảng màu chủ đạo hiện có. Giữ nguyên chính xác các giá trị CSS, kể cả giá trị chưa được đưa thành token.
2. Không đổi cấu trúc trang, kiến trúc thông tin, phân cấp route, thứ tự thành phần, bố cục, căn chỉnh, khoảng cách, kích thước hoặc cách sắp xếp responsive.
3. Không gỡ hoặc sửa lại hiệu ứng vũ trụ hiện tại như gradient, glow, kính mờ và sao.
4. Việc trau chuốt UI chỉ giới hạn ở chất lượng không làm thay đổi bố cục: nhãn trợ năng, thao tác bàn phím, focus trong hình học sẵn có, ngữ nghĩa trạng thái, tính nhất quán mã và thay thế icon emoji chức năng bằng SVG. Thay đổi ảnh hưởng màu, cấu trúc hoặc bố cục cần yêu cầu riêng và người dùng cho phép rõ ràng.

---

## Nguyên tắc thiết kế

Coi giao diện hiện tại là chuẩn tham chiếu. Trước khi đề xuất token, ghi lại giá trị đang dùng. Mọi quy tắc và quy trình mới phải bảo vệ diện mạo hiện tại và giúp bảo trì nhất quán hơn, không phải thiết kế lại.

### "Trông như người làm" — định nghĩa

Sản phẩm phải trông như do một designer có gu thẩm mỹ tốt tạo ra, không phải do AI sinh ra. Các tiêu chí cụ thể:

- **Icon:** Dùng SVG inline (Lucide/Heroicons/Phosphor path dán thẳng vào JSX) thay cho emoji Unicode chức năng. Ký hiệu cung hoàng đạo Unicode (♈♉♊♋♌♍♎♏♐♑♒♓) **không còn là ngoại lệ** — thay toàn bộ bằng SVG inline tùy chỉnh, có thể kết hợp glow/gradient CSS hiện có. Không dùng 🌙 ở bất kỳ đâu.
- **Typography:** Không dùng uppercase + widest letter-spacing cho văn bản chạy dài. Không căn giữa toàn trang. Line-height thoải mái.
- **Interaction:** Hover scale ≤ 1.03. Transition 150–250ms. Không animate mọi thứ — chỉ ở nơi có ý nghĩa.
- **Content:** Không có nội dung lấp chỗ trống, không bịa số liệu, không dùng ngôn ngữ chatbot.
- **Bố cục:** Không có sự đối xứng hoàn hảo không có lý do; nội dung dài nên left-align.

---

## Nguồn style hiện tại

Bảng màu và lớp tiện ích UI của web được khai báo tại `AI_App_FE/ResonanciaWeb/src/index.css`.
Các token màu: `--cosmic-dark`, `--cosmic-mid`, `--cosmic-purple`, `--cosmic-pink`, `--cosmic-blue`, `--cosmic-gold`.
Các lớp tiện ích: `.glass`, `.glass-card`, `.gradient-text`, `.gradient-text-gold`, `.glow-purple`, `.glow-pink`, `.glow-blue`, `.cosmic-input`, `.btn-cosmic`, `.card-hover`, `.message-sent`, `.message-received`, `.cosmic-progress`, `.cosmic-spinner`, `.orbit-ring`.
Không sửa các khai báo này trong quá trình thiết lập.

---

## Từ khóa định hướng

**Thân mật · Vũ trụ · Gần gũi** — chỉ dùng để mô tả giọng điệu của trải nghiệm hiện hữu, không làm căn cứ thay đổi màu hoặc bố cục.

---

## Tài liệu tham khảo

Người dùng **đã cho phép truy cập web bên ngoài** để nghiên cứu và cải thiện UI.

**Được dùng web để:**
- Tìm SVG icon từ Lucide (`lucide.dev`), Heroicons (`heroicons.com`), Phosphor (`phosphoricons.com`).
- Nghiên cứu nguyên lý spacing, typography, micro-interaction từ sản phẩm thực tế.
- Tham khảo pattern UX (loading state, empty state, error state) từ app tương tự.
- Đọc tài liệu kỹ thuật CSS, Framer Motion, Tailwind.

**Không được dùng web để:**
- Lấy màu sắc, bố cục, nội dung hay asset từ trang tham khảo áp vào Resonancia.
- Biện hộ cho việc thay đổi yếu tố đã khóa bằng cách dẫn trang tham khảo.

Ristara, StarDate, The Pattern, Co–Star và Sanctuary có thể được nghiên cứu kỹ hơn (không chỉ nguyên lý mà cả chi tiết UX pattern), nhưng màu sắc, bố cục, nội dung và nhận diện của họ vẫn không phải sự cho phép thay đổi Resonancia.
