---
name: feature-suggest
description: Phân tích sản phẩm Resonancia, nghiên cứu ứng dụng chiêm tinh / hẹn hò thực tế, gợi ý các tính năng hay nên bổ sung — kèm mức độ ưu tiên, độ phức tạp triển khai và lý do phù hợp. Không tự triển khai, chỉ gợi ý để người dùng quyết định.
---

# Feature Suggest — Gợi ý tính năng cho Resonancia

> **Mục tiêu:** Nghiên cứu app chiêm tinh và dating thực tế, đối chiếu với tính năng hiện có của Resonancia, gợi ý danh sách tính năng có giá trị — ưu tiên theo tác động người dùng và khả năng triển khai trong stack hiện tại (React 19, TypeScript, Firebase, FastAPI).

---

## Khi nào dùng skill này

- Người dùng muốn biết nên xây dựng gì tiếp theo.
- Trước sprint planning — cần ý tưởng có căn cứ thực tế.
- Khi muốn benchmark với Co-Star, Sanctuary, Pattern, The League.

---

## Stack & Ràng buộc cần nhớ

| Layer | Công nghệ |
|---|---|
| Frontend Web | React 19, TypeScript, Vite, Tailwind 3.4, Framer Motion |
| Frontend Mobile | React Native (cùng repo) |
| Backend | FastAPI (Python) |
| Database | Firebase Firestore + Auth |
| AI | API generate đã có (category-based) |
| Không cài thêm | Không đề xuất thư viện nặng nếu có giải pháp nhẹ hơn |

---

## Quy trình gợi ý

1. **Đọc codebase hiện tại** — liệt kê tính năng đã có (pages, API calls, data model).
2. **Nghiên cứu app tham khảo** — xem list bên dưới, ghi nhận pattern phổ biến và pattern đặc biệt nổi bật.
3. **Đối chiếu** — xác định gap: tính năng phổ biến mà Resonancia chưa có, hoặc tính năng Resonancia có nhưng chưa đủ sâu.
4. **Phân loại và ưu tiên** theo ma trận Impact × Effort.
5. **Xuất báo cáo** — mỗi gợi ý gồm: tên, mô tả ngắn, lý do phù hợp, độ phức tạp, gợi ý triển khai sơ bộ.
6. **Hỏi người dùng** muốn đào sâu gợi ý nào để lên kế hoạch chi tiết.

---

## Nguồn nghiên cứu

| App | Điểm nổi bật cần học |
|---|---|
| **Co-Star** (`co-star.app`) | Daily push notification cá nhân hóa, compatibility chart chi tiết, "What's happening" feed |
| **Sanctuary** (`sanctuary.app`) | Tarot card reading flow, live astrologer chat, zodiac journal |
| **The Pattern** (`pattern.app`) | Pattern recognition — timing alerts, relationship dynamics |
| **Hinge** | Prompt-based profiles, "Most Compatible" badge, audio prompts |
| **Bumble** | Opening move mechanic, video date, friend mode |
| **League** | AI-curated daily batch, voice intro |
| **Pairs** (JP) | Compatibility meter realtime, match "chemistry" score |

---

## Ma trận ưu tiên

```
         Impact
    Cao  |  🅱️ Làm sau  |  🅰️ Làm ngay  |
         |              |               |
    Thấp |  ❌ Bỏ qua   |  🅲 Nice-to-have|
         +--------------+---------------+
              Effort Cao     Effort Thấp
```

---

## Danh mục tính năng tiềm năng (checklist khởi điểm)

Agent đọc danh sách này, đối chiếu với codebase, đánh dấu đã có / chưa có, rồi ưu tiên gợi ý:

### Lõi chiêm tinh
- [ ] Daily horoscope cá nhân hóa theo lá số (đã có `prediction` — cần deepen?)
- [ ] Lá số chi tiết (Natal Chart) với giải thích từng hành tinh
- [ ] Compatibility report giữa 2 người (synastry chart)
- [ ] Transit alerts — báo khi có sự kiện hành tinh quan trọng ảnh hưởng lá số
- [ ] Lunar calendar — phase Mặt Trăng hàng ngày, ý nghĩa với cung của user
- [ ] Tarot daily card — rút bài ngẫu nhiên, giải nghĩa AI

### Kết nối & Dating
- [ ] "Vũ trụ chọn cho bạn" — daily batch 3–5 người thay vì scroll vô tận
- [ ] Compatibility score realtime khi xem profile người khác
- [ ] Ice-breaker prompt tự động dựa trên sự tương hợp 2 lá số
- [ ] Zodiac-based filter: lọc match theo element (Hoả/Thuỷ/Khí/Thổ)
- [ ] "Cosmic timing" — gợi ý thời điểm tốt để nhắn tin/hẹn gặp
- [ ] Anonymous "vibe check" — gửi ẩn danh xem có hợp không trước khi reveal

### Engagement & Retention
- [ ] Daily check-in streak — "Năng lượng vũ trụ liên tiếp N ngày"
- [ ] Push notification cá nhân hóa theo lá số (morning/evening)
- [ ] Cosmic journal — ghi chú cảm xúc hàng ngày, xem lại theo transit
- [ ] Relationship timeline — lưu lại các milestone với người match
- [ ] Weekly compatibility report với người đang chat nhiều nhất
- [ ] "This week's energy" digest — tóm tắt chiêm tinh tuần qua

### Social & Discovery
- [ ] Public profile zodiac badge hiển thị ra ngoài
- [ ] Community feed ẩn danh — chia sẻ cảm xúc theo năng lượng ngày
- [ ] "Ai cũng Sư Tử hôm nay?" — trending zodiac energy widget
- [ ] Refer a friend — mời bạn vào, so sánh compatibility ngay

### Kỹ thuật & UX
- [ ] Onboarding có hướng dẫn lá số — visual step-by-step
- [ ] Dark/light mode (nếu chưa có — chỉ gợi ý nếu user muốn)
- [ ] Offline mode — cache lá số và prediction gần nhất
- [ ] Voice message trong chat
- [ ] Giới hạn match/ngày — tạo khan hiếm, tăng ý nghĩa

---

## Format báo cáo gợi ý

```markdown
## Feature Suggestions — Resonancia
_Nghiên cứu: [nguồn] — [timestamp]_

### Tính năng hiện có (đã xác nhận)
- ✅ Daily prediction (astro/love categories)
- ✅ Natal Chart page
- ✅ Love matching với 5 tag type
- ✅ Chat realtime (Firebase)
- ✅ Notification page
...

### Gợi ý — Ưu tiên 🅰️ (Impact cao, Effort thấp)

#### 1. Compatibility score realtime trên profile page
> **Mô tả:** Khi xem profile người khác, hiển thị % tương hợp dựa trên sun/moon/ascendant
> **Lý do:** Co-Star và Sanctuary đều có — user expect tính năng này
> **Effort:** Thấp — đã có `apiGenerate`, chỉ cần thêm category `compatibility_quick`
> **Stack:** Gọi thêm 1 API call trong `UserProfilePage.tsx`

...

### Gợi ý — Ưu tiên 🅱️ (Impact cao, Effort cao)
...

### Gợi ý — Ưu tiên 🅲 (Nice-to-have)
...
```

---

## Sau báo cáo

- Hỏi người dùng muốn đào sâu gợi ý nào.
- Khi được chọn, tạo **plan chi tiết**: wireframe text, API cần, component cần tạo/sửa, thứ tự triển khai.
- Không bắt đầu code khi chưa được người dùng phê duyệt plan.
