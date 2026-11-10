# Resonancia - AI Astrology & Matchmaking Platform

Nền tảng chiêm tinh học và kết nối cặp đôi thông minh dựa trên bản đồ sao (Natal Chart), tương hợp chiêm tinh (Synastry), dịch chuyển hành tinh (Transit) và bói bài Tarot, tích hợp Trợ lý AI AstroBot (RAG Architecture).

---

## 1. Cài đặt và chạy Frontend (React + Vite)

Từ thư mục gốc dự án:

```bash
# Di chuyển vào thư mục Web
cd AI_App_FE/ResonanciaWeb

# Cài đặt thư viện
npm install

# Khởi chạy môi trường phát triển
npm run dev
```

Mở trình duyệt tại địa chỉ hiển thị trên terminal (mặc định là `http://localhost:5173`).

### Cấu hình môi trường Frontend
Tạo file `.env` tại thư mục `AI_App_FE/ResonanciaWeb/` dựa theo mẫu `.env.example`:
```env
VITE_API_BASE_URL=http://localhost:5001
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

---

## 2. Cài đặt và chạy Backend (Python + Flask)

Từ thư mục gốc dự án:

```bash
# Di chuyển vào thư mục Backend
cd AI_App_BE

# Tạo và kích hoạt môi trường ảo (khuyến nghị)
python3 -m venv venv
source venv/bin/activate  # Trên macOS/Linux
# .\venv\Scripts\activate   # Trên Windows PowerShell

# Cài đặt các gói phụ thuộc đã ghim phiên bản
pip install -r requirements.txt

# Khởi chạy server
python main.py
```

Backend API sẽ chạy tại cổng `5001` (`http://localhost:5001`).

### Cấu hình môi trường Backend
Tạo file `.env` tại thư mục `AI_App_BE/` theo mẫu `.env.example`:
```env
GEMINI_API_KEY=your_gemini_api_key
ASTROLOGY_API_KEY=your_astrology_api_key
FIREBASE_API_KEY=your_firebase_web_api_key
FIREBASE_SERVICE_ACCOUNT_PATH=firebase-key.json
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
GEMINI_MODEL=gemini-2.5-flash
```

---

## 3. Kiểm thử (Testing)

Chạy bộ test tự động của Backend:
```bash
./AI_App_BE/venv/bin/pytest tests/
```

Kiểm tra TypeScript và build Frontend:
```bash
cd AI_App_FE/ResonanciaWeb && npm run build
```
