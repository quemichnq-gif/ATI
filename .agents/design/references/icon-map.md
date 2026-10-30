# Bản đồ thay thế icon emoji → SVG

Danh sách này được lập sau khi quét toàn bộ codebase (chỉ đọc). Mỗi emoji chức năng cần được thay bằng SVG inline trước khi tính năng liên quan được triển khai hoặc trau chuốt.

> Nguồn SVG: [lucide.dev](https://lucide.dev) · [heroicons.com](https://heroicons.com) · [phosphoricons.com](https://phosphoricons.com)
> Quy tắc: dùng `stroke="currentColor"` · `strokeWidth="1.5"` · `fill="none"` · `aria-label` bắt buộc.

---

## Sidebar.tsx — icon điều hướng

| Emoji hiện tại | Vị trí | SVG đề xuất | Tên Lucide |
|---|---|---|---|
| 🏠 | Nav: Trang Chủ | House icon | `home` |
| 🔮 | Nav: Natal Chart | Telescope/Orbit icon | `telescope` hoặc `orbit` |
| 💫 | Nav: Tìm Kiếm | Search + Sparkle | `search` |
| 💬 | Nav: Trò Chuyện | Message circle | `message-circle` |
| 🔔 | Nav: Thông Báo | Bell icon | `bell` |
| 👤 | Nav: Hồ Sơ | User circle | `user` |
| 🚪 | Đăng Xuất | Log out icon | `log-out` |
| ✨ | Logo Resonancia | **Giữ nguyên** — phần tên thương hiệu | — |

---

## HomePage.tsx — icon chức năng

| Emoji hiện tại | Vị trí | SVG đề xuất | Tên Lucide |
|---|---|---|---|
| 🗺️ | Card: Natal Chart | Map icon | `map` |
| 💘 | Card: Tìm Kiếm | Heart + Arrow | `heart` |
| ⬆️ | Label: Điểm Mọc | Arrow Up | `arrow-up` |
| 🌟 | Label: Nguyên Tố | Star icon | `star` |
| 💬 | Button: Nhắn Tin | Message circle | `message-circle` |
| 👤 | Button: Xem Hồ Sơ | User icon | `user` |

**Dữ liệu chiêm tinh (giữ nguyên emoji):**
- 🌙 Mặt Trăng — hiển thị dữ liệu
- Emoji cung hoàng đạo từ `ZODIAC_EMOJIS` — hiển thị dữ liệu

---

## ProfilePage.tsx — icon nhãn

| Emoji hiện tại | Vị trí | SVG đề xuất | Tên Lucide |
|---|---|---|---|
| 📷 | Nút upload avatar | Camera icon | `camera` |
| ✏️ | Nút Chỉnh sửa | Pen icon | `pen` |
| ✅ | Nút Lưu | Check icon | `check` |
| ⏳ | Trạng thái đang lưu | Loader circle | `loader-circle` |
| 📅 | Label: Ngày sinh | Calendar icon | `calendar` |
| ⏰ | Label: Giờ sinh | Clock icon | `clock` |
| 📍 | Label: Nơi sinh | Map pin | `map-pin` |
| 🎂 | Label: Tuổi | Cake (nếu có) hoặc `calendar` | `calendar` |
| 💼 | Label: Nghề nghiệp | Briefcase | `briefcase` |
| 💑 | Label: Tình trạng | Heart handshake | `heart-handshake` |
| 📏 | Label: Chiều cao | Ruler | `ruler` |
| ⚖️ | Label: Cân nặng | Scale icon | `scale` |
| 🌊 | Tiêu đề Năng Lượng Nguyên Tố | Waves | `waves` |
| 🔥 | Label: Hoả | Flame | `flame` |
| 🌍 | Label: Thổ | Globe | `globe` |
| 💨 | Label: Khí | Wind | `wind` |
| 💧 | Label: Thuỷ | Droplet | `droplet` |

---

## MatchPage.tsx — icon chức năng

| Emoji hiện tại | Vị trí | SVG đề xuất | Tên Lucide |
|---|---|---|---|
| 💫 | Tiêu đề trang | **Text-only** — bỏ emoji | — |
| 🔭 | Empty state | Telescope | `telescope` |

---

## Trạng thái còn lại (quét chưa đầy đủ)

- ChatListPage.tsx, ChatRoomPage.tsx, NatalChartPage.tsx, NotificationsPage.tsx, OnboardingPage.tsx, PredictionPage.tsx, LoginPage.tsx, RegisterPage.tsx — chưa quét đầy đủ. Cần kiểm tra khi làm đến từng trang.

---

> **Ghi chú:** File này là tài liệu tham khảo, không tự động áp dụng vào code. Thay thế thực tế chỉ xảy ra khi có yêu cầu rõ ràng từ người dùng.
