from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import google.generativeai as genai
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore, auth
import json
import re
import base64
import cloudinary
import cloudinary.uploader
from datetime import datetime, timedelta
import uuid
from astrology_insights import (
    generate_career_insight_text,
    generate_natal_depth_analysis,
    generate_time_based_prediction
)

# Load biến môi trường
base_dir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(base_dir, ".env"))

api_key = os.getenv("GEMINI_API_KEY")
firebase_api_key = os.getenv("FIREBASE_API_KEY")

if not api_key:
    raise ValueError("⚠️ Chưa load được GEMINI_API_KEY!")

# Cấu hình Gemini
genai.configure(api_key=api_key)


# Firebase Admin (chỉ Firestore)
FIREBASE_AVAILABLE = False
db = None
try:
    key_path = os.path.join(base_dir, "firebase-key.json")
    if os.path.exists(key_path):
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        FIREBASE_AVAILABLE = True
        print("Firebase Admin initialized.")
    else:
        print("Firebase key not found; using fallback mode.")
except Exception as fe:
    print(f"Firebase Admin initialization failed; using fallback mode: {fe}")
    FIREBASE_AVAILABLE = False
    db = None

# Cấu hình Cloudinary (MIỄN PHÍ)
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "YOUR_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY", "YOUR_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "YOUR_API_SECRET")
)

# Flask setup
app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False
CORS(app)

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

def safe_print(*args, **kwargs):
    try:
        print(*args, **kwargs)
    except Exception:
        pass


# In-memory prediction cache
PREDICTION_CACHE = {}

# -------------------------------------------------
#  Lấy dữ liệu cache dự đoán
# -------------------------------------------------
def get_cached_prediction(uid, name, sun, moon, category, day):
    cache_key = f"{uid}_{category}_{day}"
    if cache_key in PREDICTION_CACHE:
        return PREDICTION_CACHE[cache_key]
    return None


# -------------------------------------------------
#  Lưu dữ liệu vào cache
# -------------------------------------------------
def save_prediction(uid, name, sun, moon, category, day, data):
    cache_key = f"{uid}_{category}_{day}"
    doc = {
        "uid": uid,
        "name": name,
        "sun": sun,
        "moon": moon,
        "category": category,
        "day": day,
        "created_at": datetime.now().isoformat(),
    }

    if isinstance(data, dict):
        doc.update(data)
    else:
        doc["prediction"] = data

    PREDICTION_CACHE[cache_key] = doc
    
    
# ===============================
#  Lọc user có đầy đủ dữ liệu chiêm tinh
# ===============================
def is_valid_user(u):
    try:
        planets = u.get("planets", {})
        required_planets = ["sun", "moon", "mercury", "venus", "mars"]

        # thiếu 1 planets → loại
        if any(p not in planets or not planets[p] for p in required_planets):
            return False

        # houses phải có ít nhất 12 nhà
        houses = u.get("houses", {})
        if not houses or len(houses) < 12:
            return False

        # elements phải có 4 loại
        elements = u.get("elements", {})
        required_elements = ["fire", "earth", "air", "water"]
        if any(e not in elements for e in required_elements):
            return False

        return True

    except:
        return False


# -------------------------------------------------
#  Route Verify Password
# -------------------------------------------------
@app.route("/verify-password", methods=["POST"])
def verify_password():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        print(f"=== VERIFY PASSWORD DEBUG ===")
        print(f"Email nhận được: {email}")
        print(f"Password length: {len(password) if password else 0}")
        print(f"Firebase API Key có tồn tại: {bool(firebase_api_key)}")

        if not email or not password:
            return jsonify({"success": False, "error": "Thiếu email hoặc password"}), 400

        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={firebase_api_key}"

        payload = {
            "email": email.strip(),  # Thêm strip() để loại bỏ khoảng trắng
            "password": password,
            "returnSecureToken": True
        }

        print(f"Gửi request đến Firebase Auth...")
        response = requests.post(url, json=payload)
        result = response.json()

        print(f"Response status: {response.status_code}")
        print(f"Response body: {result}")

        if response.status_code == 200 and result.get("idToken"):
            print(f"Xác thực thành công cho {email}")
            return jsonify({"success": True}), 200
        else:
            error_msg = result.get("error", {}).get("message", "Invalid password")
            print(f"Xác thực thất bại: {error_msg}")
            return jsonify({"success": False, "error": "Mật khẩu không đúng"}), 401

    except Exception as e:
        print(f"❌ Verify error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


# -------------------------------------------------
# Route Update Profile 
# -------------------------------------------------
@app.route("/update-profile", methods=["POST"])
def update_profile():
    """
    Cập nhật profile bao gồm Firebase Authentication
    """
    try:
        data = request.get_json()
        uid = data.get("uid")
        fields = data.get("fields", {})

        if not uid or not fields:
            return jsonify({"error": "Thiếu uid hoặc fields"}), 400

        # Cập nhật Firebase Authentication nếu có email hoặc password
        auth_updated = False
        auth_updates = {}

        if "email" in fields:
            auth_updates["email"] = fields["email"]
            auth_updated = True

        if "password" in fields:
            auth_updates["password"] = fields["password"]
            auth_updated = True

        # Cập nhật Authentication
        if auth_updated and FIREBASE_AVAILABLE:
            try:
                auth.update_user(uid, **auth_updates)
                print(f"✅ Đã cập nhật Firebase Authentication cho {uid}")
            except Exception as e:
                print(f"❌ Lỗi cập nhật Authentication: {str(e)}")
                return jsonify({"error": f"Không thể cập nhật thông tin xác thực: {str(e)}"}), 500

        # Không lưu password vào Firestore
        clean_fields = {k: v for k, v in fields.items() if k != "password"}

        # Cập nhật Firestore (không bao gồm password)
        if clean_fields:
            if FIREBASE_AVAILABLE and db is not None:
                try:
                    user_ref = db.collection("users").document(uid)
                    save_data = {**clean_fields, "updatedAt": firestore.SERVER_TIMESTAMP}
                    user_ref.set(save_data, merge=True)
                    print(f"✅ Đã cập nhật Firestore cho user {uid}")
                except Exception as fe:
                    print(f"⚠️ Lỗi cập nhật Firestore cho user {uid}: {fe}")
            else:
                print(f"ℹ️ Firebase Admin ở chế độ fallback, đã ghi nhận cập nhật thông tin cho {uid}")

        # Đồng bộ trạng thái mối quan hệ vào memory nếu có
        if "relationshipStatus" in clean_fields:
            if uid not in IN_MEMORY_USER_RELATIONSHIPS:
                IN_MEMORY_USER_RELATIONSHIPS[uid] = {}
            IN_MEMORY_USER_RELATIONSHIPS[uid]["relationshipStatus"] = clean_fields["relationshipStatus"]

        return jsonify({
            "success": True,
            "message": "Cập nhật thành công",
            "authUpdated": auth_updated
        }), 200

    except Exception as e:
        print(f"❌ Update error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# Route chính: /generate
# -------------------------------------------------
@app.route("/generate", methods=["POST"])
def generate_prediction():
    data = request.get_json() or {}
    user_data = data.get("userData", {})
    raw_cat = data.get("category", "daily")
    category = "daily" if raw_cat == "astro" else raw_cat
    day = data.get("day", "today")

    uid = user_data.get("uid", "")
    name = user_data.get("name", "Bạn")
    sun = user_data.get("sun") or user_data.get("zodiac", "Ma Kết")
    moon = user_data.get("moon") or "Kim Ngưu"
    ascendant = user_data.get("ascendant") or data.get("extra", {}).get("ascendant", "")

    # Kiểm tra cache
    cached_doc = get_cached_prediction(uid, name, sun, moon, category, day)
    if cached_doc:
        safe_print(f"✅ Cache có sẵn cho {name} ({uid}) - {category} ({day})")
        if category == "love_metrics":
            metrics_payload = {
                "love_luck": cached_doc.get("love_luck"),
                "best_match": cached_doc.get("best_match"),
                "compatibility": cached_doc.get("compatibility"),
                "quote": cached_doc.get("quote"),
            }
            return jsonify({
                **metrics_payload,
                "prediction": metrics_payload,
                "cached": True
            })
        return jsonify({"prediction": cached_doc.get("prediction", ""), "cached": True})

    safe_print(f"⚙️ Tạo dự đoán mới ({category}, {day}) cho {name} ({sun})")


    # Extra data (synastry, transit, etc.)
    extra = data.get("extra", {})

    category_map = {
        "daily": "Dự đoán hằng ngày",
        "love": "Dự đoán tình duyên",
        "work": "Dự đoán công việc",
        "love_metrics": "Chỉ số tình duyên và cung hợp",
    }
    day_map = {
        "yesterday": "hôm qua",
        "today": "hôm nay",
        "tomorrow": "ngày mai",
    }

    day_label = day_map.get(day, "hôm nay")
    cat_label = category_map.get(category, "Dự đoán chiêm tinh")

    # Build prompt based on category
    if category == "synastry":
        p2_name = extra.get("person2_name", "Người kia")
        p2_sun = extra.get("person2_sun", "Không rõ")
        p2_moon = extra.get("person2_moon", "Không rõ")
        p2_asc = extra.get("person2_ascendant", "")
        p2_venus = extra.get("person2_venus", "")
        p2_mars = extra.get("person2_mars", "")
        prompt = f"""
        Phân tích tuyệt đối tương hợp cặp đôi theo chiêm tinh. Trả lời JSON với cấu trúc:
        {{"overall": <số 0-100>, "love": <số 0-100>, "communication": <số 0-100>, "passion": <số 0-100>, "spiritual": <số 0-100>, "summary": "tóm tắt 2-3 câu", "strengths": "2-3 câu về điểm mạnh", "challenges": "2-3 câu về thách thức", "advice": "lời khuyên 2-3 câu"}}
        Người 1: {name}, Mặt Trời {sun}, Mặt Trăng {moon}
        Người 2: {p2_name}, Mặt Trời {p2_sun}, Mặt Trăng {p2_moon}, Cung Mọc {p2_asc}, Sao Kim {p2_venus}, Sao Hỏa {p2_mars}
        Chỉ trả lời JSON thuần, không thêm giải thích ngoài.
        """
    elif category == "career_chart":
        mc = extra.get("mc") or user_data.get("mc", "Ma Kết")
        house10 = extra.get("house10") or user_data.get("house10", "Ma Kết")
        saturn = extra.get("saturn") or user_data.get("saturn", "Sao Thổ")
        jupiter = extra.get("jupiter") or user_data.get("jupiter", "Sao Mộc")
        mercury = extra.get("mercury") or user_data.get("mercury", "Sao Thủy")
        asc = extra.get("ascendant") or user_data.get("ascendant", "Nhân Mã")
        prompt = f"""
        Bạn là chuyên gia chiêm tinh học hướng nghiệp phương Tây. Hãy phân tích chuyên sâu bản đồ hướng nghiệp (Career Astrology) cho {name}:
        - Mặt Trời: {sun}, Mặt Trăng: {moon}, Cung Mọc: {asc}
        - Trung Thiên (Midheaven - MC): {mc}
        - Nhà 10 (Sự nghiệp & Danh tiếng): {house10}
        - Sao Thổ (Kỷ luật & Bài học thử thách): {saturn}
        - Sao Mộc (Cơ hội & May mắn mở rộng): {jupiter}
        - Sao Thủy (Tư duy & Kỹ năng làm việc): {mercury}

        Yêu cầu nghiêm ngặt:
        - Đây là phân tích ĐỊNH HƯỚNG NGHỀ NGHIỆP DÀI HẠN. TUYỆT ĐỐI KHÔNG dự đoán vận hạn hằng ngày hay quan hệ tình cảm.
        - Trình bày 4 phần rõ ràng:
          1. Khí Chất Nghề Nghiệp & Thương Hiệu Cá Nhân (phân tích MC tại {mc})
          2. Sở Trường Năng Lực Bẩm Sinh (kết hợp {sun}, {moon} và {mercury})
          3. Các Ngành Nghề & Môi Trường Bứt Phá Phù Hợp Nhất
          4. Thách Thức Cần Vượt Qua & Kim Chỉ Nam Sự Nghiệp (tác động của {saturn} và {jupiter})
        - Viết bằng tiếng Việt sâu sắc, chuyên môn cao, truyền cảm hứng và tính ứng dụng thực tế. Không dùng emoji.
        """
    elif category == "love_metrics":
        prompt = f"""
        Bạn là chuyên gia chiêm tinh học tình cảm. Hãy phân tích chỉ số tình cảm hôm nay cho {name} (Mặt Trời {sun}, Mặt Trăng {moon}).
        Trả lời DUY NHẤT một đối tượng JSON hợp lệ (không kèm markdown) theo cấu trúc:
        {{"love_luck": 88, "best_match": "Kim Ngưu", "compatibility": 92, "quote": "Sự kiên định và chân thành sẽ mở ra cánh cửa định mệnh mà bạn tìm kiếm bấy lâu."}}

        Quy định:
        - love_luck: số nguyên 72-98 (chỉ số may mắn tình duyên).
        - best_match: tên một cung hoàng đạo tương hợp nhất bằng tiếng Việt chuẩn (Bạch Dương, Kim Ngưu, Song Tử, Cự Giải, Sư Tử, Xử Nữ, Thiên Bình, Bọ Cạp, Nhân Mã, Ma Kết, Bảo Bình, Song Ngư).
        - compatibility: số nguyên 80-99 (mức độ hòa hợp).
        - quote: một câu thông điệp vũ trụ chiêm tinh thi vị, sâu sắc, truyền cảm hứng về tình yêu và kết nối tâm hồn, viết bằng tiếng Việt chuẩn ngữ pháp, có dấu đầy đủ, giàu cảm xúc, không bị lặp từ.
        Chỉ trả lời JSON thuần.
        """
    elif category == "transit_overview":
        active_events = extra.get("active_events", [])
        ascendant = user_data.get("ascendant") or extra.get("ascendant", "")
        events_formatted = []
        for e in active_events:
            p_name = e.get("planet", "")
            e_name = e.get("event", "")
            cat = e.get("category", "")
            imp = e.get("impact", "")
            aff = e.get("affected", [])
            dates = e.get("dateRange", "")
            is_aff = sun in aff or moon in aff
            events_formatted.append(
                f"- {p_name} ({e_name}), thời gian: {dates}, lĩnh vực: {cat}, tác động: {imp}. "
                f"Các cung chịu ảnh hưởng chính: {', '.join(aff)}. "
                f"({'KÍCH HOẠT TRỰC TIẾP lên đương số' if is_aff else 'Không chiếu trực tiếp lên cung chính, tác động gián tiếp'})"
            )
        events_str = "\n".join(events_formatted) if events_formatted else "Các dịch chuyển hành tinh quan trọng hiện tại."

        prompt = f"""
        Bạn là chuyên gia Chiêm Tinh Học phương Tây (Western Astrology) chuyên sâu về Bản Đồ Sao Cá Nhân (Natal Chart) và Vận Hạn Thiên Văn (Transits).
        Hãy phân tích tương tác vận hạn cho đương số {name}:
        - Bản đồ sao cá nhân: Cung Mặt Trời {sun}, Cung Mặt Trăng {moon}{f', Cung Mọc {ascendant}' if ascendant else ''}.
        - Các sự kiện thiên văn hiện tại:
{events_str}

        QUY TẮC LUẬN GIẢI CHIÊM TINH HỌC CHUẨN XÁC:
        1. Cơ sở dữ liệu: Dựa THUẦN TÚY trên Chiêm Tinh Học phương Tây (tương tác giữa hành tinh quá cảnh Transit và các tọa độ nhạy cảm của Natal Chart qua các góc chiếu Aspects: Trùng tụ 0°, Lục hợp 60°, Vuông góc 90°, Tam hợp 120°, Đối đỉnh 180°). TUYỆT ĐỐI KHÔNG dùng khái niệm Tử Vi, Tứ Trụ hay thuật ngữ bói toán phương Đông.
        2. Sửa lỗi ngộ nhận tác động:
           - Chỉ luận giải trọng tâm vào những hành tinh THỰC SỰ đang tạo góc chiếu kích hoạt đến {sun} hoặc {moon} của đương số.
           - LƯU Ý ĐẶC BIỆT: KHÔNG tự động mặc định rằng 'Sao Thủy nghịch hành đang tác động trực tiếp' lên đương số nếu góc chiếu hoặc cung chủ quản ({sun}) không có liên kết kích hoạt (hard aspect) trực tiếp. Nếu Sao Thủy nghịch hành không chiếu trực tiếp vào {sun}, hãy luận giải đúng trọng tâm các hành tinh đang trực tiếp tác động (như Sao Hỏa, Mặt Trăng, Sao Mộc...) hoặc định hướng tích lũy năng lượng.
        3. Kết quả yêu cầu:
           - Đưa ra DUY NHẤT 1 câu tóm tắt định hướng tổng quan (Actionable advice) mang tính thời điểm, sắc bén, khách quan và truyền cảm hứng hành động thiết thực cho người cung {sun}.
           - Không dùng emoji, không tiêu đề, không ngoặc kép hay mở bài/kết bài thừa. Chỉ trả lời đúng 1 câu duy nhất.
        """
    elif category.startswith("transit_"):
        transit_event = extra.get("transit_event", "Sự kiện thiên văn")
        planet_name = extra.get("planet", "")
        event_name = extra.get("event", "")
        cat_type = extra.get("category", "")
        field_hint = f"thuộc lĩnh vực {cat_type}" if cat_type else ""
        prompt = f"""
        Bạn là chuyên gia chiêm tinh học ứng dụng. Hãy phân tích tác động của sự kiện thiên văn '{planet_name} {event_name} - {transit_event}' {field_hint} lên người dùng {name} (Mặt Trời {sun}, Mặt Trăng {moon}):
        Yêu cầu:
        - Đưa ra 1-2 câu hướng dẫn ứng xử cụ thể, thực tế và mang tính hành động cao cho cung {sun} trong giai đoạn này, chỉ rõ cơ hội cần nắm bắt và cạm bẫy tâm lý cần phòng tránh.
        - Tránh hoàn toàn văn mẫu giáo điều, câu chữ sắc sảo, hiện đại và sâu sắc.
        - Không dùng emoji, không tiêu đề thừa.
        """
    elif category.startswith("tarot_"):
        card_name = category.replace("tarot_", "").replace("_", " ").title()
        card_vi = extra.get("card_vi", card_name)
        is_reversed = extra.get("is_reversed", False)
        orientation_str = "Ngược (Reversed)" if is_reversed else "Xuôi (Upright)"
        position = extra.get("position", "Lá bài ngày")
        core_meaning = extra.get("meaning", "")
        all_cards = extra.get("all_cards", [])
        cards_context = ""
        if len(all_cards) > 1:
            card_desc_list = []
            for c in all_cards:
                c_pos = c.get("position", "")
                c_vi = c.get("vi", "")
                c_dir = "Ngược" if c.get("isReversed") else "Xuôi"
                card_desc_list.append(f"{c_pos}: {c_vi} ({c_dir})")
            cards_context = "Toàn bộ quẻ bài: " + "; ".join(card_desc_list)

        core_meaning_line = f"- Ý nghĩa cốt lõi: {core_meaning}" if core_meaning else ""

        prompt = f"""
        Bạn là chuyên gia biểu tượng Tarot và Chiêm tinh học. Hãy giải nghĩa quẻ bài cho {name} (Mặt Trời {sun}, Mặt Trăng {moon}):
        - Lá bài chính: {card_vi} ({card_name}) - Chiều hướng: {orientation_str}
        - Vị trí trải bài: {position}
        {core_meaning_line}
        {cards_context}

        Yêu cầu:
        1. Giải nghĩa thông điệp cốt lõi của lá bài ở trạng thái {orientation_str} phù hợp với năng lượng {sun} (1-2 câu).
        2. Đưa ra 1-2 câu hướng dẫn ứng xử hành động cụ thể, thực tế cho {name} hôm nay, nêu rõ việc nên làm hoặc thái độ tâm lý cần chuyển hóa, thay vì các câu template chung chung lặp lại.
        - Lời văn thi vị, tinh tế nhưng sắc bén và hữu ích. Không dùng emoji, không tiêu đề thừa.
        """
    elif category.endswith("_week") or category.endswith("_month"):
        period_str = "tuần này" if category.endswith("_week") else "tháng này"
        base_cat = category.replace("_week", "").replace("_month", "")
        cat_map2 = {"astro": "tổng quan chiêm tinh", "love": "tình duyên", "work": "công việc"}
        base_label = cat_map2.get(base_cat, "chiêm tinh")
        prompt = f"""
        Bạn là bậc thầy Chiêm Tinh Học Tâm Lý Chiều Sâu. Hãy viết bản dự báo chi tiết, toàn diện về {base_label} {period_str} cho {name}:
        - Bản đồ sao: Mặt Trời {sun}, Mặt Trăng {moon}{f', Cung Mọc {ascendant}' if ascendant else ''}.

        YÊU CẦU ĐỘ DÀI & ĐỘ SÂU:
        - Viết khoảng 350 - 500 từ thật chi tiết, phân tích rõ ràng và sâu sắc.
        - Chia thành từng giai đoạn cụ thể:
          + Giai đoạn 1 (Đầu kỳ): Xu hướng năng lượng, cơ hội tiềm ẩn và điểm khởi sắc.
          + Giai đoạn 2 (Giữa kỳ): Điểm rơi cảm xúc, biến động cần lưu tâm, cạm bẫy tâm lý cần phòng tránh.
          + Giai đoạn 3 (Cuối kỳ): Kết quả đạt được, sự hòa hợp và bước đệm chuyển tiếp.
          + Lời khuyên vàng: Chỉ dẫn hành động thực tế, sắc bén, mang tính ứng dụng cao.
        - Lời văn truyền cảm hứng, tinh tế, hiện đại, không dùng emoji, không mở/kết bài sáo rỗng.
        """
    else:
        prompt = f"""
        Bạn là bậc thầy Chiêm Tinh Học Tâm Lý Chiều Sâu. Hãy phân tích chuyên sâu vận trình {cat_label} cho {day_label} của {name}:
        - Bản đồ sao: Mặt Trời {sun}, Mặt Trăng {moon}{f', Cung Mọc {ascendant}' if ascendant else ''}.

        YÊU CẦU ĐỘ DÀI & NỘI DUNG CHI TIẾT:
        - Viết một bài luận giải sâu sắc dài khoảng 300 - 400 từ, giàu hàm lượng tri thức chiêm tinh học.
        - Phân tích rõ nét:
          1. Năng lượng vũ trụ chi phối và diễn biến tâm lý nội tâm trong ngày.
          2. Cơ hội cụ thể cần nắm bắt (trong các mối quan hệ xã hội, giao tiếp hoặc công việc).
          3. Cạm bẫy cảm xúc hoặc áp lực tiềm thức cần chú ý kiểm soát.
          4. Chỉ dẫn hành động vàng (Actionable advice): điều nên ưu tiên làm và điều cần tránh để đạt được sự thuận hòa cao nhất.
        - Tuyệt đối không dùng emoji, không viết câu ngắn cụt ngủn hoặc chung chung sáo rỗng.
        """

    try:
        text = ""
        try:
            model = genai.GenerativeModel(MODEL_NAME)
            generation_config = {"temperature": 0.8}
            response = model.generate_content(prompt, generation_config=generation_config, request_options={"timeout": 10.0})
            text = response.text if hasattr(response, "text") else str(response)
            text = re.sub(r"(```json|```|'''|\"\"\")", "", text).strip()
        except BaseException as gemini_err:
            safe_print("⚠️ Gemini Error trong /generate (sử dụng engine dự phòng):", gemini_err)
            if category == "transit_overview":
                active_events = extra.get("active_events", [])
                direct_events = [e for e in active_events if sun in e.get("affected", [])]
                if direct_events:
                    target_event = direct_events[0]
                    t_planet = target_event.get("planet", "các hành tinh")
                    t_event = target_event.get("event", "quá cảnh")
                    t_cat = target_event.get("category", "career")
                    field_map = {
                        "career": "sự nghiệp và mục tiêu dài hạn",
                        "energy": "năng lượng hành động và sức bền",
                        "spiritual": "trực giác và chiều sâu nội tâm",
                        "communication": "giao tiếp và đàm phán",
                        "love": "các mối quan hệ và sự thấu cảm"
                    }
                    field_name = field_map.get(t_cat, "định hướng trọng tâm")
                    text = f"Dưới góc chiếu kích hoạt từ {t_planet} ({t_event}), {sun} hãy tập trung củng cố {field_name}, hành động quyết đoán nhưng luôn duy trì sự điềm tĩnh và kỷ luật."
                else:
                    text = f"Bầu trời vận hạn hiện tại không tạo góc chiếu xung khắc lớn lên {sun}; hãy duy trì sự cân bằng nội tại, tập trung củng cố mục tiêu cá nhân và chủ động tích lũy năng lượng."
            elif category.startswith("transit_"):
                planet_name = extra.get("planet", "Các hành tinh")
                text = f"Năng lượng từ {planet_name} thôi thúc {sun} tái định hình mục tiêu thực tế; hãy giữ sự kiên nhẫn, tránh nóng vội và biến áp lực thành bàn đạp phát triển."
            elif category.startswith("tarot_"):
                card_vi = extra.get("card_vi", "Lá bài Tarot")
                is_reversed = extra.get("is_reversed", False)
                orientation_str = "ngược" if is_reversed else "xuôi"
                text = f"Lá bài {card_vi} ở chiều {orientation_str} nhắc nhở {sun} hãy lắng nghe trực giác mách bảo hôm nay; tiếp cận mọi vấn đề bằng sự thấu đáo và chủ động đón nhận chuyển biến mới."
            elif category == "career_chart":
                mc = extra.get("mc") or user_data.get("mc", "Ma Kết")
                house10 = extra.get("house10") or user_data.get("house10", "Ma Kết")
                saturn = extra.get("saturn") or user_data.get("saturn", "Sao Thổ")
                jupiter = extra.get("jupiter") or user_data.get("jupiter", "Sao Mộc")
                mercury = extra.get("mercury") or user_data.get("mercury", "Sao Thủy")
                asc = extra.get("ascendant") or user_data.get("ascendant", "Nhân Mã")
                text = generate_career_insight_text(name, sun, moon, asc, mc, house10, saturn, jupiter, mercury)
            elif category.startswith("love") or category.startswith("work") or category.startswith("astro"):
                pred_period = "month" if category.endswith("_month") else ("week" if category.endswith("_week") else "today")
                text = generate_time_based_prediction(category, pred_period, {"name": name, "sun": sun, "moon": moon}, day_label)
            elif category == "love_metrics":
                love_fallbacks = {
                    "Bạch Dương": {"match": "Thiên Bình", "luck": 89, "comp": 94, "quote": "Ngọn lửa chân thành từ trái tim bạn sẽ sưởi ấm và thu hút người tri kỷ đích thực."},
                    "Kim Ngưu": {"match": "Ma Kết", "luck": 92, "comp": 96, "quote": "Sự kiên định và bình yên trong tâm hồn là thỏi nam châm mạnh mẽ nhất kết nối nhân duyên."},
                    "Song Tử": {"match": "Bảo Bình", "luck": 88, "comp": 93, "quote": "Khi hai tâm hồn đồng điệu về tần số, mọi khoảng cách đều biến thành nhịp cầu thấu hiểu."},
                    "Cự Giải": {"match": "Song Ngư", "luck": 95, "comp": 97, "quote": "Sự thấu cảm dịu dàng là bến đỗ an yên nhất giữa những thăng trầm của cuộc đời."},
                    "Sư Tử": {"match": "Nhân Mã", "luck": 91, "comp": 95, "quote": "Tình yêu đích thực là cùng nhau tỏa sáng và tự do là chính mình trong ánh mắt người kia."},
                    "Xử Nữ": {"match": "Kim Ngưu", "luck": 87, "comp": 94, "quote": "Những cử chỉ quan tâm âm thầm và tinh tế luôn chạm đến nơi sâu lắng nhất của trái tim."},
                    "Thiên Bình": {"match": "Song Tử", "luck": 90, "comp": 95, "quote": "Khoảnh khắc bạn tìm thấy sự an yên nội tại cũng là lúc vũ trụ dẫn lối người đồng điệu bước vào."},
                    "Bọ Cạp": {"match": "Cự Giải", "luck": 94, "comp": 98, "quote": "Lòng trung thành và sự thấu suốt sâu sắc sẽ biến mọi thử thách thành minh chứng cho tình yêu bền chặt."},
                    "Nhân Mã": {"match": "Bạch Dương", "luck": 89, "comp": 93, "quote": "Hành trình ý nghĩa nhất của cuộc đời là cùng người bạn thương khám phá những chân trời mới."},
                    "Ma Kết": {"match": "Xử Nữ", "luck": 93, "comp": 96, "quote": "Sự đồng hành bền bỉ và trách nhiệm sắt son là nền tảng vững chãi nhất của một mái ấm tri kỷ."},
                    "Bảo Bình": {"match": "Thiên Bình", "luck": 88, "comp": 92, "quote": "Tôn trọng thế giới quan của nhau là dạng thức biểu đạt cao quý nhất của tình yêu tự do."},
                    "Song Ngư": {"match": "Bọ Cạp", "luck": 96, "comp": 98, "quote": "Hãy lắng nghe tiếng gọi của trực giác; những mảnh ghép định mệnh luôn tìm thấy nhau đúng thời điểm."},
                }
                fb = love_fallbacks.get(sun, {"match": "Kim Ngưu", "luck": 88, "comp": 92, "quote": "Sự kiên định và chân thành sẽ mở ra cánh cửa định mệnh mà bạn tìm kiếm bấy lâu."})
                text = json.dumps({
                    "love_luck": fb["luck"],
                    "best_match": fb["match"],
                    "compatibility": fb["comp"],
                    "quote": fb["quote"]
                }, ensure_ascii=False)
            else:
                text = f"Hôm nay Mặt Trời {sun} kết hợp hài hòa với Mặt Trăng {moon}, mang lại cho bạn nguồn sinh khí dồi dào và tinh thần lạc quan. Trực giác nhạy bén giúp bạn dễ dàng đưa ra những lựa chọn đúng đắn trong các mối quan hệ xã hội. Hãy giữ vững sự điềm tĩnh và tự tin đón nhận những cơ hội tốt lành đang tới!"

        if category == "love_metrics":
            try:
                cleaned = re.sub(r"^.*?(\{.*\}).*$", r"\1", text, flags=re.DOTALL)
                data = json.loads(cleaned)
            except Exception:
                data = {
                    "love_luck": 85,
                    "best_match": "Kim Ngưu",
                    "compatibility": 90,
                    "quote": "Tình yêu là hành trình tự khám phá bản thân qua ánh mắt người khác."
                }
            save_prediction(uid, name, sun, moon, category, day, data)
            return jsonify({**data, "prediction": data, "cached": False})

        # Các loại khác (daily/love/work)
        save_prediction(uid, name, sun, moon, category, day, text)
        return jsonify({"prediction": text, "cached": False})

    except BaseException as e:
        safe_print("Backend generate error:", e)
        fallback_msg = f"Năng lượng chiêm tinh hôm nay của {sun} rất tích cực và hài hòa. Hãy lắng nghe trực giác và tự tin vào các kế hoạch của mình."
        return jsonify({"prediction": fallback_msg, "cached": False}), 200


# -------------------------------------------------
#  Route test server
# -------------------------------------------------
@app.route("/", methods=["GET"])
def home():
    return "Flask server đang hoạt động bình thường!"


# -------------------------------------------------
#  Route Upload Image (CLOUDINARY)
# -------------------------------------------------
@app.route("/upload-image", methods=["POST"])
def upload_image():
    """
    Upload ảnh lên Cloudinary (MIỄN PHÍ)
    """
    try:
        data = request.get_json() or {}
        uid = data.get("uid") or data.get("userId")
        image_type = data.get("imageType", "avatar")
        image_data = data.get("imageData") or data.get("imageBase64") or data.get("image")

        if not uid or not image_data:
            return jsonify({"error": "Thiếu uid hoặc dữ liệu ảnh (imageData/imageBase64)"}), 400

        # Decode / Chuẩn hóa base64
        try:
            if "," in image_data:
                header, image_data = image_data.split(",", 1)

            # Upload lên Cloudinary
            upload_result = cloudinary.uploader.upload(
                f"data:image/jpeg;base64,{image_data}",
                folder=f"astrolove/{image_type}",
                public_id=f"{uid}_{image_type}",
                overwrite=True,
                resource_type="image"
            )

            image_url = upload_result.get("secure_url")

        except Exception as e:
            print(f"❌ Cloudinary upload error: {str(e)}")
            return jsonify({"error": f"Lỗi upload: {str(e)}"}), 400

        # Cập nhật Firestore an toàn (timeout 1.5s để không làm nghẽn client)
        try:
            user_ref = db.collection("users").document(uid)
            user_ref.set({
                image_type: image_url,
                "updatedAt": firestore.SERVER_TIMESTAMP
            }, merge=True, timeout=1.5)
            print(f"✅ Đã lưu {image_type} vào Firestore cho user {uid}: {image_url}")
        except Exception as fe:
            print(f"⚠️ Cảnh báo Firestore Admin update (frontend client sẽ tự sync): {str(fe)}")

        return jsonify({
            "success": True,
            "imageUrl": image_url,
            "imageType": image_type
        }), 200

    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
#  Route Delete Image (CLOUDINARY)
# -------------------------------------------------
@app.route("/delete-image", methods=["POST"])
def delete_image():
    """
    Xóa ảnh từ Cloudinary
    """
    try:
        data = request.get_json()
        uid = data.get("uid")
        image_type = data.get("imageType")
        image_url = data.get("imageUrl")

        if not uid or not image_type:
            return jsonify({"error": "Thiếu uid hoặc imageType"}), 400

        # Xóa từ Cloudinary
        if image_url and "cloudinary" in image_url:
            try:
                # Extract public_id từ URL
                public_id = f"astrolove/{image_type}/{uid}_{image_type}"
                cloudinary.uploader.destroy(public_id)
                print(f"🗑️ Đã xóa ảnh: {public_id}")
            except Exception as e:
                print(f"⚠️ Không thể xóa ảnh: {str(e)}")

        # Reset field trong Firestore
        user_ref = db.collection("users").document(uid)
        user_ref.update({
            image_type: "",
            "updatedAt": firestore.SERVER_TIMESTAMP
        })

        return jsonify({
            "success": True,
            "message": "Đã xóa ảnh"
        }), 200

    except Exception as e:
        print(f"❌ Delete error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
#  Route phân tích bản đồ sao
# -------------------------------------------------
@app.route("/natal-analysis", methods=["POST"])
def natal_chart_analysis():
    """
    Phân tích chi tiết bản đồ sao dựa trên thông tin chiêm tinh
    """
    global FIREBASE_AVAILABLE
    try:
        data = request.get_json() or {}
        uid = data.get("uid", "")
        birth_date = data.get("birthDate", "")

        # Lấy thông tin từ request
        user_info = {
            "name": data.get("name", "Người dùng"),
            "sun": data.get("sun", ""),
            "moon": data.get("moon", ""),
            "mercury": data.get("mercury", ""),
            "venus": data.get("venus", ""),
            "mars": data.get("mars", ""),
            "jupiter": data.get("jupiter", ""),
            "saturn": data.get("saturn", ""),
            "uranus": data.get("uranus", ""),
            "neptune": data.get("neptune", ""),
            "pluto": data.get("pluto", ""),
            "ascendant": data.get("ascendant", ""),
            "descendant": data.get("descendant", ""),
            "mc": data.get("mc", ""),
            "ic": data.get("ic", ""),
        }

        # Lấy thông tin houses
        houses = {
            f"house{i}": data.get(f"house{i}", "") for i in range(1, 13)
        }

        # Lấy thông tin aspects
        aspects = {
            "conjunction": data.get("conjunctionAspect", ""),
            "opposition": data.get("oppositionAspect", ""),
            "trine": data.get("trineAspect", ""),
            "square": data.get("squareAspect", ""),
            "sextile": data.get("sextileAspect", ""),
        }

        # Lấy tỷ lệ nguyên tố
        elemental_ratios = {
            "fire": data.get("fireRatio", 0),
            "earth": data.get("earthRatio", 0),
            "air": data.get("airRatio", 0),
            "water": data.get("waterRatio", 0),
        }

        if not user_info["name"] or not user_info["sun"] or not user_info["moon"]:
            return jsonify({"error": "Thiếu thông tin cơ bản"}), 400

        # Kiểm tra cache Firestore một cách an toàn
        if FIREBASE_AVAILABLE and db is not None and uid:
            try:
                cache_docs = (
                    db.collection("natal_analysis")
                    .where("uid", "==", uid)
                    .limit(1)
                    .get(timeout=1.5)
                )
                for doc in cache_docs:
                    cached_data = doc.to_dict()
                    safe_print(f"✅ Cache phân tích có sẵn cho {user_info['name']} ({uid})")
                    return jsonify({
                        "analysis": cached_data.get("analysis", ""),
                        "cached": True
                    })
            except BaseException as cache_err:
                safe_print(f"⚠️ Bỏ qua đọc cache Firestore ({cache_err})")
                if "invalid_grant" in str(cache_err) or "Invalid JWT" in str(cache_err):
                    FIREBASE_AVAILABLE = False

        safe_print(f"⚙️ Luận giải Natal Chart cho {user_info['name']}")

        # Tạo prompt phân tích chi tiết
        prompt = f"""
        Bạn là bậc thầy Chiêm Tinh Học Tâm Lý Chiều Sâu (Depth Psychological Astrologer). Hãy phân tích bản đồ sao cá nhân cực kỳ chi tiết, sâu sắc và toàn diện cho đương số sau:

        **Thông tin bản đồ sao:**
        - Tên: {user_info['name']}
        - Cung Mặt Trời (Bản ngã & Ý chí): {user_info['sun']}
        - Cung Mặt Trăng (Nội tâm & Nhu cầu an toàn): {user_info['moon']}
        - Cung Mọc / Ascendant (Khí chất, diện mạo & lăng kính tiếp cận): {user_info['ascendant']}
        - Cung Lặn / Descendant (Hình mẫu đối tác & người bạn đời lý tưởng): {user_info['descendant']}
        - Thiên Đỉnh / MC (Đỉnh cao công danh & định vị sự nghiệp): {user_info['mc']}
        - Thiên Đế / IC (Cội nguồn gia đình & chốn ẩn náu tâm hồn): {user_info['ic']}
        - Thủy tinh (Tư duy & giao tiếp): {user_info['mercury']}
        - Kim tinh (Giá trị & ngôn ngữ tình yêu): {user_info['venus']}
        - Hỏa tinh (Động lực hành động & tham vọng): {user_info['mars']}
        - Mộc tinh (Vận may & sự mở rộng): {user_info['jupiter']}
        - Thổ tinh (Kỷ luật, thử thách & nghiệp lực): {user_info['saturn']}
        - Thiên Vương tinh: {user_info['uranus']}, Hải Vương tinh: {user_info['neptune']}, Diêm Vương tinh: {user_info['pluto']}

        **Các nhà (Houses):**
        {chr(10).join([f"- Nhà {i}: {houses[f'house{i}']}" for i in range(1, 13) if houses[f'house{i}']])}

        **Các góc tương tác nổi bật (Aspects):**
        - Trùng tụ (Conjunction): {aspects['conjunction']}
        - Đối đỉnh (Opposition): {aspects['opposition']}
        - Tam hợp (Trine): {aspects['trine']}
        - Vuông góc (Square): {aspects['square']}
        - Lục hợp (Sextile): {aspects['sextile']}

        **Tỷ lệ 4 nguyên tố:** Lửa {elemental_ratios['fire']}%, Đất {elemental_ratios['earth']}%, Khí {elemental_ratios['air']}%, Nước {elemental_ratios['water']}%

        BẮT BUỘC PHÂN TÍCH ĐỦ VÀ ĐÚNG THEO 8 MỤC SAU (mỗi mục dùng tiêu đề số 1 đến 8):

        1. Tính Cách
        Phân tích chuyên sâu sự hòa hợp giữa Cung Mọc ({user_info['ascendant']}) và Mặt Trời ({user_info['sun']}). Cách đương số bước vào một không gian, phong thái tiếp cận, cơ chế tự vệ, sự tự tôn và cách khẳng định giá trị bản thân.

        2. Cảm Xúc
        Mặt Trăng ({user_info['moon']}) và nhà của Mặt Trăng. Nhu cầu an toàn cốt lõi, cơ chế xoa dịu bản thân, cách kiểm soát hay che giấu cảm xúc, mâu thuẫn giữa lý trí và thế giới nội tâm sâu kín.

        3. Sự Nghiệp
        Thiên Đỉnh ({user_info['mc']}), sao Thổ ({user_info['saturn']}) và Mặt Trời. Động lực thành công dài hạn, các lĩnh vực phát huy tối đa tiềm năng, phong cách quản lý/lãnh đạo và định vị sự nghiệp bền vững.

        4. Tình Yêu
        Kim tinh ({user_info['venus']}), Cung Lặn ({user_info['descendant']}) và Mặt Trăng. Ngôn ngữ tình cảm, cách trao đi và đón nhận yêu thương, xu hướng gắn kết và điều kiện để cảm thấy an tâm trong một mối quan hệ.

        5. Điểm Mạnh
        Tổng hợp năng khiếu thiên bẩm từ Big 3 (Mọc - Trời - Trăng) và các góc chiếu thuận lợi. Sức bền, trực giác, năng lực tổ chức hoặc sức hút cá nhân nổi trội.

        6. Nguyên Tố
        Phân tích sự phân bổ 4 nguyên tố. Ưu thế từ nguyên tố trội và cách bù đắp năng lượng cho nguyên tố còn thiếu để đạt trạng thái cân bằng nội tại.

        7. Lời Khuyên
        Chỉ dẫn chuyển hóa tâm lý thực tế: bài học buông bỏ cầu toàn, chấp nhận sự không hoàn hảo, quản trị năng lượng và khai phóng tiềm năng cao nhất của bản mệnh.

        8. Người Lý Tưởng
        Chân dung người bạn đời và tri kỷ đồng điệu (dựa trên Cung Lặn {user_info['descendant']}, Kim tinh và Mặt Trăng): tính cách, phong thái, giá trị sống và cách họ bù trừ cho đương số.

        QUY TẮC BẮT BUỘC VỀ ĐỘ DÀI VÀ VĂN PHONG:
        - Bài phân tích phải thật DÀI, CHI TIẾT và CHUYÊN MÔN CAO (khoảng 1500 - 2000 từ toàn bài, mỗi mục từ 180 - 250 từ).
        - Văn phong tâm lý học sâu sắc, chạm đến tiềm thức, thấu đáo và chữa lành.
        - Tuyệt đối không dùng emoji, không chào hỏi, không kết bài thừa.
        """

        analysis_text = ""
        try:
            # Gọi Gemini API với timeout 25.0s để AI có đủ thời gian sinh bài viết dài và chi tiết
            model = genai.GenerativeModel(MODEL_NAME)
            response = model.generate_content(prompt, request_options={"timeout": 25.0})
            analysis_text = response.text if hasattr(response, "text") else str(response)
            analysis_text = re.sub(r"(```|'''|\"\"\")", "", analysis_text).strip()
        except BaseException as gemini_err:
            safe_print(f"⚠️ Gemini API tạm thời giới hạn ({gemini_err}), sử dụng luận giải chiêm tinh chuyên sâu dự phòng...")
            analysis_text = generate_natal_depth_analysis(user_info, houses, aspects, elemental_ratios, birth_date)

        # Lưu vào Firestore an toàn
        if FIREBASE_AVAILABLE and db is not None and uid:
            try:
                analysis_doc = {
                    "uid": uid,
                    "name": user_info["name"],
                    "analysis": analysis_text,
                    "created_at": datetime.now().isoformat(),
                    "user_data": {**user_info, **houses, **aspects, **elemental_ratios}
                }
                db.collection("natal_analysis").add(analysis_doc, timeout=1.5)
                safe_print(f"✅ Đã lưu phân tích cache cho {user_info['name']} ({uid})")
            except BaseException as save_err:
                safe_print(f"⚠️ Bỏ qua lưu cache Firestore ({save_err})")
                if "invalid_grant" in str(save_err) or "Invalid JWT" in str(save_err):
                    FIREBASE_AVAILABLE = False

        return jsonify({
            "analysis": analysis_text,
            "cached": False
        }), 200

    except Exception as e:
        safe_print(f"❌ Error in natal analysis: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# -------------------------------------------------
#  Bộ nhớ quản lý Match Requests & Relationships an toàn
# -------------------------------------------------
IN_MEMORY_MATCH_REQUESTS = {}       # requestId -> dict
IN_MEMORY_USER_RELATIONSHIPS = {}   # userId -> dict(partnerId, matchId, relationshipStatus)
IN_MEMORY_NOTIFICATIONS = {}       # userId -> list

def get_user_match_info(uid):
    if FIREBASE_AVAILABLE and db is not None:
        try:
            doc_snap = db.collection("users").document(uid).get(timeout=1.5)
            if doc_snap.exists:
                d = doc_snap.to_dict() or {}
                if uid in IN_MEMORY_USER_RELATIONSHIPS:
                    d.update(IN_MEMORY_USER_RELATIONSHIPS[uid])
                return d
        except Exception:
            pass
    cand = next((c for c in DEFAULT_MATCH_CANDIDATES if c.get("uid") == uid or c.get("id") == uid), None)
    rel = IN_MEMORY_USER_RELATIONSHIPS.get(uid, {})
    if cand:
        return {
            "name": cand.get("name") or cand.get("fullName", "Người dùng"),
            "avatar": cand.get("avatar", ""),
            "age": cand.get("age", 24),
            "job": cand.get("job") or cand.get("occupation", "Thành viên Resonancia"),
            "partnerId": rel.get("partnerId"),
            "relationshipStatus": rel.get("relationshipStatus", "Độc thân")
        }
    return {
        "name": "Thành viên Resonancia",
        "avatar": "",
        "age": 24,
        "job": "Thành viên Resonancia",
        "partnerId": rel.get("partnerId"),
        "relationshipStatus": rel.get("relationshipStatus", "Độc thân")
    }

# -------------------------------------------------
#  Route: Gửi lời mời ghép đôi / Kết bạn lại
# -------------------------------------------------
@app.route("/send-match-request", methods=["POST"])
def send_match_request():
    """
    Gửi lời mời ghép đôi từ user A đến user B (cho phép kết bạn lại nếu đã chia tay / hủy)
    """
    try:
        data = request.get_json() or {}
        sender_id = data.get("senderId")
        receiver_id = data.get("receiverId")
        message = data.get("message", "")

        if not sender_id or not receiver_id:
            return jsonify({"error": "Thiếu thông tin sender hoặc receiver"}), 400

        sender_data = get_user_match_info(sender_id)
        receiver_data = get_user_match_info(receiver_id)

        # Hủy các request cũ nếu muốn kết bạn lại
        for rid, req_item in list(IN_MEMORY_MATCH_REQUESTS.items()):
            if (req_item.get("senderId") == sender_id and req_item.get("receiverId") == receiver_id) or \
               (req_item.get("senderId") == receiver_id and req_item.get("receiverId") == sender_id):
                req_item["status"] = "canceled"

        request_id = str(uuid.uuid4())
        match_request = {
            "requestId": request_id,
            "senderId": sender_id,
            "receiverId": receiver_id,
            "senderName": sender_data.get("name", "Người dùng"),
            "senderAvatar": sender_data.get("avatar", ""),
            "message": message or "Xin chào! Hãy kết nối chiêm tinh cùng mình nhé ✨",
            "status": "pending",
            "createdAt": datetime.now().isoformat(),
        }
        IN_MEMORY_MATCH_REQUESTS[request_id] = match_request

        # Đồng bộ Firestore nếu có
        if FIREBASE_AVAILABLE and db is not None:
            try:
                db.collection("match_requests").document(request_id).set({
                    **match_request,
                    "createdAt": firestore.SERVER_TIMESTAMP,
                })
            except Exception as fe:
                safe_print("⚠️ Firestore sync match request warning:", fe)

        print(f"✅ Đã gửi lời mời kết bạn: {sender_id} -> {receiver_id} ({request_id})")
        return jsonify({
            "success": True,
            "requestId": request_id,
            "message": "Đã gửi lời mời ghép đôi thành công"
        }), 200

    except Exception as e:
        print(f"❌ Send match request error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
#  Route: Chấp nhận lời mời ghép đôi
# -------------------------------------------------
@app.route("/accept-match-request", methods=["POST"])
def accept_match_request():
    """
    Chấp nhận lời mời ghép đôi và tạo match
    """
    try:
        data = request.get_json() or {}
        request_id = data.get("requestId")
        receiver_id = data.get("receiverId") or data.get("uid")
        sender_id = data.get("senderId") or data.get("targetUid")
        response_message = data.get("responseMessage", "")

        match_req = IN_MEMORY_MATCH_REQUESTS.get(request_id) if request_id else None
        if not match_req and receiver_id and sender_id:
            for r_id, r in IN_MEMORY_MATCH_REQUESTS.items():
                if (r.get("senderId") == sender_id and r.get("receiverId") == receiver_id and r.get("status") == "pending") or \
                   (r.get("senderId") == receiver_id and r.get("receiverId") == sender_id and r.get("status") == "pending"):
                    request_id = r_id
                    match_req = r
                    break

        if match_req:
            if not sender_id:
                sender_id = match_req.get("senderId")
            if not receiver_id:
                receiver_id = match_req.get("receiverId")
            match_req["status"] = "accepted"

        # Đồng bộ Firestore nếu có
        if FIREBASE_AVAILABLE and db is not None and request_id:
            try:
                r_doc = db.collection("match_requests").document(request_id).get(timeout=1.5)
                if r_doc.exists:
                    sender_id = r_doc.to_dict().get("senderId")
                    db.collection("match_requests").document(request_id).update({
                        "status": "accepted",
                        "responseMessage": response_message,
                        "acceptedAt": firestore.SERVER_TIMESTAMP,
                    })
            except Exception:
                pass

        if not sender_id:
            sender_id = "user_sender"

        match_id = str(uuid.uuid4())
        IN_MEMORY_USER_RELATIONSHIPS[sender_id] = {
            "partnerId": receiver_id,
            "matchId": match_id,
            "relationshipStatus": "Đã có đôi"
        }
        if receiver_id:
            IN_MEMORY_USER_RELATIONSHIPS[receiver_id] = {
                "partnerId": sender_id,
                "matchId": match_id,
                "relationshipStatus": "Đã có đôi"
            }

        print(f"✅ Ghép đôi thành công: {sender_id} <-> {receiver_id}")
        return jsonify({
            "success": True,
            "matchId": match_id,
            "message": "Đã chấp nhận ghép đôi thành công"
        }), 200

    except Exception as e:
        print(f"❌ Accept match error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
#  Route: Từ chối lời mời ghép đôi 
# -------------------------------------------------
@app.route("/reject-match-request", methods=["POST"])
def reject_match_request():
    try:
        data = request.get_json() or {}
        request_id = data.get("requestId")
        receiver_id = data.get("receiverId") or data.get("uid")
        sender_id = data.get("senderId") or data.get("targetUid")

        match_req = IN_MEMORY_MATCH_REQUESTS.get(request_id) if request_id else None
        if not match_req and receiver_id and sender_id:
            for r_id, r in IN_MEMORY_MATCH_REQUESTS.items():
                if (r.get("senderId") == sender_id and r.get("receiverId") == receiver_id and r.get("status") == "pending") or \
                   (r.get("senderId") == receiver_id and r.get("receiverId") == sender_id and r.get("status") == "pending"):
                    request_id = r_id
                    match_req = r
                    break

        if match_req:
            match_req["status"] = "rejected"

        if FIREBASE_AVAILABLE and db is not None and request_id:
            try:
                db.collection("match_requests").document(request_id).update({
                    "status": "rejected",
                    "rejectedAt": firestore.SERVER_TIMESTAMP
                })
            except Exception:
                pass

        return jsonify({"success": True, "message": "Đã từ chối lời mời"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
#  Route: Chia tay / Hủy kết đôi để kết bạn lại
# -------------------------------------------------
@app.route("/breakup", methods=["POST"])
def breakup():
    """
    Hủy ghép đôi và giải phóng trạng thái để cho phép kết bạn lại bất cứ lúc nào
    """
    try:
        data = request.get_json() or {}
        user_id = data.get("userId")
        target_partner_id = data.get("partnerId")

        if not user_id:
            return jsonify({"error": "Thiếu userId"}), 400

        rel = IN_MEMORY_USER_RELATIONSHIPS.get(user_id, {})
        partner_id = target_partner_id or rel.get("partnerId")

        # Đánh dấu các match request cũ giữa 2 user thành ended
        for req in IN_MEMORY_MATCH_REQUESTS.values():
            if (req.get("senderId") == user_id and req.get("receiverId") == partner_id) or \
               (req.get("senderId") == partner_id and req.get("receiverId") == user_id):
                req["status"] = "ended"

        IN_MEMORY_USER_RELATIONSHIPS[user_id] = {
            "relationshipStatus": "Độc thân",
            "partnerId": None,
            "matchId": None
        }
        if partner_id:
            IN_MEMORY_USER_RELATIONSHIPS[partner_id] = {
                "relationshipStatus": "Độc thân",
                "partnerId": None,
                "matchId": None
            }

        # Đồng bộ Firestore nếu có
        if FIREBASE_AVAILABLE and db is not None:
            try:
                db.collection("users").document(user_id).update({
                    "relationshipStatus": "Độc thân",
                    "partnerId": firestore.DELETE_FIELD,
                    "matchId": firestore.DELETE_FIELD,
                })
                if partner_id:
                    db.collection("users").document(partner_id).update({
                        "relationshipStatus": "Độc thân",
                        "partnerId": firestore.DELETE_FIELD,
                        "matchId": firestore.DELETE_FIELD,
                    })
            except Exception:
                pass

        print(f"✅ Đã hủy ghép đôi cho {user_id}. Hai bạn đã có thể kết bạn lại với nhau.")
        return jsonify({
            "success": True,
            "message": "Đã hủy kết đôi thành công. Bạn đã có thể kết bạn lại với nhau bất cứ lúc nào."
        }), 200

    except Exception as e:
        print(f"❌ Breakup error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
#  Route: Kiểm tra trạng thái match request giữa 2 user
# -------------------------------------------------
@app.route("/check-match-status", methods=["GET"])
def check_match_status():
    """
    Kiểm tra trạng thái match request giữa 2 user
    """
    try:
        user_id = request.args.get("userId") or request.args.get("uid1") or request.args.get("uid")
        target_id = request.args.get("targetId") or request.args.get("uid2") or request.args.get("partnerUid") or request.args.get("targetUid")

        if not user_id or not target_id:
            return jsonify({"error": "Thiếu userId hoặc targetId"}), 400

        # 1. Kiểm tra xem 2 người đã kết đôi chưa
        rel = IN_MEMORY_USER_RELATIONSHIPS.get(user_id, {})
        if rel.get("partnerId") == target_id:
            return jsonify({
                "success": True,
                "status": "matched",
                "matchId": rel.get("matchId"),
                "message": "Đã ghép đôi"
            }), 200

        # 2. Kiểm tra match requests trong memory
        for req in sorted(IN_MEMORY_MATCH_REQUESTS.values(), key=lambda r: r.get("createdAt", ""), reverse=True):
            if req.get("senderId") == user_id and req.get("receiverId") == target_id:
                if req.get("status") == "pending":
                    return jsonify({
                        "success": True,
                        "status": "pending_sent",
                        "requestId": req.get("requestId"),
                        "message": "Đang chờ đối phương phản hồi"
                    }), 200
                elif req.get("status") == "accepted":
                    return jsonify({
                        "success": True,
                        "status": "matched",
                        "message": "Đã ghép đôi"
                    }), 200
            elif req.get("senderId") == target_id and req.get("receiverId") == user_id:
                if req.get("status") == "pending":
                    return jsonify({
                        "success": True,
                        "status": "pending_received",
                        "requestId": req.get("requestId"),
                        "message": "Lời mời đang chờ bạn đồng ý"
                    }), 200
                elif req.get("status") == "accepted":
                    return jsonify({
                        "success": True,
                        "status": "matched",
                        "message": "Đã ghép đôi"
                    }), 200

        # 3. Đồng bộ Firestore nếu có
        if FIREBASE_AVAILABLE and db is not None:
            try:
                ps = db.collection("match_requests").where("senderId", "==", user_id).where("receiverId", "==", target_id).where("status", "==", "pending").limit(1).get(timeout=1.0)
                for d in ps:
                    return jsonify({"success": True, "status": "pending_sent", "requestId": d.id}), 200
                pr = db.collection("match_requests").where("senderId", "==", target_id).where("receiverId", "==", user_id).where("status", "==", "pending").limit(1).get(timeout=1.0)
                for d in pr:
                    return jsonify({"success": True, "status": "pending_received", "requestId": d.id}), 200
            except Exception:
                pass

        return jsonify({
            "success": True,
            "status": "none",
            "message": "Chưa gửi lời mời"
        }), 200

    except Exception as e:
        print(f"❌ Check match status error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
#  Route: Lấy danh sách thông báo
# ------------------------------------------------
@app.route("/get-notifications", methods=["GET"])
def get_notifications():
    """
    Lấy tất cả thông báo của một user
    """
    try:
        user_id = request.args.get("userId") or request.args.get("uid")

        if not user_id:
            return jsonify({"error": "Thiếu userId"}), 400

        print(f"🔍 Fetching notifications for user: {user_id}")

        notifications = []
        if FIREBASE_AVAILABLE and db is not None:
            try:
                notifications_ref = db.collection("notifications").where("userId", "==", user_id)
                docs = list(notifications_ref.stream())
                sorted_docs = sorted(
                    docs, 
                    key=lambda x: x.to_dict().get("createdAt", datetime.min),
                    reverse=True
                )[:50]

                for doc in sorted_docs:
                    try:
                        notif_data = doc.to_dict()
                        notif_data["id"] = doc.id
                        if "read" not in notif_data:
                            notif_data["read"] = False
                        notifications.append(notif_data)
                    except Exception:
                        pass
            except Exception as fe:
                print(f"⚠️ Firestore notification fetch fallback: {fe}")

        # In-memory notifications fallback
        mem_notifs = IN_MEMORY_NOTIFICATIONS.get(user_id, [])
        for n in mem_notifs:
            if not any(existing.get("id") == n.get("id") for existing in notifications):
                notifications.append(n)

        print(f"✅ Found {len(notifications)} notifications")
        return jsonify({
            "success": True,
            "notifications": notifications,
            "count": len(notifications)
        }), 200

    except Exception as e:
        print(f"❌ Get notifications error: {str(e)}")
        return jsonify({
            "success": True,
            "notifications": [],
            "count": 0
        }), 200
    

# -------------------------------------------------
#  Route: Đánh dấu thông báo đã đọc
# -------------------------------------------------
@app.route("/mark-notification-read", methods=["POST"])
def mark_notification_read():
    """
    Đánh dấu một hoặc nhiều thông báo đã đọc
    """
    try:
        data = request.get_json() or {}
        notification_ids = data.get("notificationIds") or [data.get("notificationId")]
        notification_ids = [nid for nid in notification_ids if nid]

        if not notification_ids:
            return jsonify({"error": "Thiếu notificationIds"}), 400

        if FIREBASE_AVAILABLE and db is not None:
            for notif_id in notification_ids:
                try:
                    db.collection("notifications").document(notif_id).update({
                        "read": True,
                        "readAt": firestore.SERVER_TIMESTAMP,
                    })
                except Exception:
                    pass

        # Update in-memory notifications
        for uid, notifs in IN_MEMORY_NOTIFICATIONS.items():
            for n in notifs:
                if n.get("id") in notification_ids:
                    n["read"] = True

        return jsonify({
            "success": True,
            "message": f"Đã đánh dấu {len(notification_ids)} thông báo"
        }), 200

    except Exception as e:
        print(f"❌ Mark read error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
#  Route: Xóa thông báo
# -------------------------------------------------
@app.route("/delete-notification", methods=["POST"])
def delete_notification():
    """
    Xóa một thông báo
    """
    try:
        data = request.get_json() or {}
        notification_id = data.get("notificationId")

        if not notification_id:
            return jsonify({"error": "Thiếu notificationId"}), 400

        if FIREBASE_AVAILABLE and db is not None:
            try:
                db.collection("notifications").document(notification_id).delete()
            except Exception:
                pass

        for uid in list(IN_MEMORY_NOTIFICATIONS.keys()):
            IN_MEMORY_NOTIFICATIONS[uid] = [n for n in IN_MEMORY_NOTIFICATIONS[uid] if n.get("id") != notification_id]

        return jsonify({
            "success": True,
            "message": "Đã xóa thông báo"
        }), 200

    except Exception as e:
        print(f"❌ Delete notification error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
#  Route: Lấy danh sách match requests của user
# -------------------------------------------------
@app.route("/get-match-requests", methods=["GET"])
def get_match_requests():
    """
    Lấy tất cả lời mời ghép đôi của user (cả đã gửi và đã nhận)
    """
    try:
        user_id = request.args.get("userId") or request.args.get("uid")
        request_type = request.args.get("type", "received")  # received, sent, all

        if not user_id:
            return jsonify({"error": "Thiếu userId"}), 400

        requests_list = []

        if FIREBASE_AVAILABLE and db is not None:
            try:
                # Lấy requests đã nhận
                if request_type in ["received", "all"]:
                    received_ref = db.collection("match_requests").where("receiverId", "==", user_id)
                    for doc in received_ref.stream():
                        req_data = doc.to_dict()
                        req_data["requestId"] = doc.id
                        req_data["direction"] = "received"
                        requests_list.append(req_data)

                # Lấy requests đã gửi
                if request_type in ["sent", "all"]:
                    sent_ref = db.collection("match_requests").where("senderId", "==", user_id)
                    for doc in sent_ref.stream():
                        req_data = doc.to_dict()
                        req_data["requestId"] = doc.id
                        req_data["direction"] = "sent"
                        requests_list.append(req_data)
            except Exception as fe:
                print(f"⚠️ Firestore get-match-requests fallback: {fe}")

        # In-memory requests fallback
        for r_id, req in IN_MEMORY_MATCH_REQUESTS.items():
            if not any(x.get("requestId") == r_id for x in requests_list):
                if req.get("receiverId") == user_id and request_type in ["received", "all"]:
                    req_copy = dict(req)
                    req_copy["direction"] = "received"
                    requests_list.append(req_copy)
                elif req.get("senderId") == user_id and request_type in ["sent", "all"]:
                    req_copy = dict(req)
                    req_copy["direction"] = "sent"
                    requests_list.append(req_copy)

        # Sắp xếp trong bộ nhớ theo createdAt giảm dần
        requests_list.sort(key=lambda x: str(x.get("createdAt") or ""), reverse=True)

        return jsonify({
            "success": True,
            "requests": requests_list,
            "count": len(requests_list)
        }), 200

    except Exception as e:
        print(f"❌ Get match requests error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    

# -------------------------------------------------
#  Route phân tích tương hợp giữa 2 người
# -------------------------------------------------
@app.route("/compatibility-analysis", methods=["POST"])
def compatibility_analysis():
    """
    Phân tích chi tiết độ tương hợp giữa 2 người dựa trên thông tin chiêm tinh
    """
    try:
        data = request.get_json() or {}
        my_uid = data.get("myUid") or data.get("uid1") or data.get("uid", "")
        partner_uid = data.get("partnerUid") or data.get("uid2") or data.get("targetUid", "")

        if not my_uid or not partner_uid:
            return jsonify({"error": "Thiếu thông tin UID"}), 400

        cache_key = f"{my_uid}_{partner_uid}"

        # Ưu tiên lấy trực tiếp từ request payload
        user1_req = data.get("user1Data") or {}
        user2_req = data.get("user2Data") or {}

        me_raw = user1_req
        if not me_raw:
            cand = next((c for c in DEFAULT_MATCH_CANDIDATES if c["uid"] == my_uid), None)
            if cand:
                me_raw = cand

        partner_raw = user2_req
        if not partner_raw:
            cand = next((c for c in DEFAULT_MATCH_CANDIDATES if c["uid"] == partner_uid), None)
            if cand:
                partner_raw = cand

        if not me_raw or not partner_raw:
            try:
                if not me_raw:
                    d1 = db.collection("users").document(my_uid).get(timeout=1.5)
                    if d1.exists:
                        me_raw = d1.to_dict()
                if not partner_raw:
                    d2 = db.collection("users").document(partner_uid).get(timeout=1.5)
                    if d2.exists:
                        partner_raw = d2.to_dict()
            except Exception as e:
                safe_print("Firestore query fallback:", e)

        if not me_raw:
            me_raw = {"name": "Bạn", "sun": "Ma Kết", "moon": "Kim Ngưu"}
        if not partner_raw:
            partner_raw = {"name": "Đối phương", "sun": "Bảo Bình", "moon": "Nhân Mã"}

        # --- HELPER FUNCTIONS ---
        def extract_user_info(user_data):
            return {
                "name": user_data.get("name", ""),
                "sun": user_data.get("sun", ""),
                "moon": user_data.get("moon", ""),
                "mercury": user_data.get("mercury", ""),
                "venus": user_data.get("venus", ""),
                "mars": user_data.get("mars", ""),
                "jupiter": user_data.get("jupiter", ""),
                "saturn": user_data.get("saturn", ""),
                "uranus": user_data.get("uranus", ""),
                "neptune": user_data.get("neptune", ""),
                "pluto": user_data.get("pluto", ""),
                "ascendant": user_data.get("ascendant", ""),
                "descendant": user_data.get("descendant", ""),
                "mc": user_data.get("mc", ""),
                "ic": user_data.get("ic", ""),
            }

        def extract_houses(user_data):
            return {f"house{i}": user_data.get(f"house{i}", "") for i in range(1, 13)}

        def extract_aspects(user_data):
            return {
                "conjunction": user_data.get("conjunctionAspect", ""),
                "opposition": user_data.get("oppositionAspect", ""),
                "trine": user_data.get("trineAspect", ""),
                "square": user_data.get("squareAspect", ""),
                "sextile": user_data.get("sextileAspect", ""),
            }

        def extract_elements(user_data):
            return {
                "fire": user_data.get("fireRatio", 0),
                "earth": user_data.get("earthRatio", 0),
                "air": user_data.get("airRatio", 0),
                "water": user_data.get("waterRatio", 0),
            }

        me_info = extract_user_info(me_raw)
        me_houses = extract_houses(me_raw)
        me_aspects = extract_aspects(me_raw)
        me_elements = extract_elements(me_raw)

        partner_info = extract_user_info(partner_raw)
        partner_houses = extract_houses(partner_raw)
        partner_aspects = extract_aspects(partner_raw)
        partner_elements = extract_elements(partner_raw)

        my_name = me_info.get("name") or "Bạn"
        partner_name = partner_info.get("name") or "Đối phương"
        s1 = me_info.get("sun") or "Ma Kết"
        s2 = partner_info.get("sun") or "Bảo Bình"

        #  prompt phân tích tương hợp
        prompt = f"""
        Phân tích độ tương hợp chi tiết giữa 2 người dựa trên thông tin chiêm tinh sau:
        
        **NGƯỜI 1:**
        - Tên: {me_info['name']}
        - Mặt Trời: {me_info['sun']}
        - Mặt Trăng: {me_info['moon']}
        - Thủy tinh: {me_info['mercury']}
        - Kim tinh: {me_info['venus']}
        - Hỏa tinh: {me_info['mars']}
        - Mộc tinh: {me_info['jupiter']}
        - Thổ tinh: {me_info['saturn']}
        - Thiên Vương tinh: {me_info['uranus']}
        - Hải Vương tinh: {me_info['neptune']}
        - Diêm Vương tinh: {me_info['pluto']}
        - Ascendant: {me_info['ascendant']}
        - Descendant: {me_info['descendant']}
        - MC: {me_info['mc']}
        - IC: {me_info['ic']}
        
        Các nhà: {json.dumps(me_houses, ensure_ascii=False)}
        Aspects: {json.dumps(me_aspects, ensure_ascii=False)}
        Tỷ lệ nguyên tố: {json.dumps(me_elements, ensure_ascii=False)}
        
        **NGƯỜI 2:**
        - Tên: {partner_info['name']}
        - Mặt Trời: {partner_info['sun']}
        - Mặt Trăng: {partner_info['moon']}
        - Thủy tinh: {partner_info['mercury']}
        - Kim tinh: {partner_info['venus']}
        - Hỏa tinh: {partner_info['mars']}
        - Mộc tinh: {partner_info['jupiter']}
        - Thổ tinh: {partner_info['saturn']}
        - Thiên Vương tinh: {partner_info['uranus']}
        - Hải Vương tinh: {partner_info['neptune']}
        - Diêm Vương tinh: {partner_info['pluto']}
        - Ascendant: {partner_info['ascendant']}
        - Descendant: {partner_info['descendant']}
        - MC: {partner_info['mc']}
        - IC: {partner_info['ic']}
        
        Các nhà: {json.dumps(partner_houses, ensure_ascii=False)}
        Aspects: {json.dumps(partner_aspects, ensure_ascii=False)}
        Tỷ lệ nguyên tố: {json.dumps(partner_elements, ensure_ascii=False)}
        
        Hãy phân tích chi tiết và sâu sắc độ tương hợp của cặp đôi này theo các mục sau:
        
        1. **Tổng quan về mối quan hệ**: Đánh giá tổng thể về sự hòa hợp giữa 2 người
        2. **Tương thích cảm xúc**: Phân tích Mặt Trăng, Kim tinh và các hành tinh cá nhân
        3. **Giao tiếp và tư duy**: Dựa vào Thủy tinh, Không khí trong nguyên tố
        4. **Tình yêu và lãng mạn**: Phân tích Kim tinh, Hỏa tinh và Nhà 5, 7
        5. **Cam kết dài hạn và hôn nhân**: Dựa vào Thổ tinh, Mộc tinh, MC và các góc tương tác
        6. **Thách thức và xung đột**: Các aspects khó khăn, điểm bất hòa cần lưu ý
        7. **Điểm mạnh của mối quan hệ**: Những gì làm cho mối quan hệ này đặc biệt
        8. **Lời khuyên để phát triển**: Hướng dẫn cụ thể để xây dựng mối quan hệ bền vững
        
        Sau khi phân tích, hãy đánh giá các chỉ số sau (0-100):
        - Độ tương thích tổng thể (compatibility_score)
        - Tình yêu và hấp dẫn (love_score)
        - Lòng tin và an toàn (trust_score)
        - Giao tiếp và hiểu biết (communication_score)
        - Tiềm năng hôn nhân (marriage_score)
        
        Yêu cầu:
        - Viết bằng tiếng Việt, văn phong chuyên nghiệp nhưng ấm áp
        - Mỗi mục khoảng 2-3 đoạn văn
        - Không dùng emoji, không dùng ký tự đặc biệt
        - Không chào hỏi hay văn phong dư thừa
        - Tập trung vào phân tích sâu, có căn cứ chiêm tinh học
        - Cuối cùng, ghi rõ 5 chỉ số theo format:
        
        SCORES:
        compatibility_score: [số]
        love_score: [số]
        trust_score: [số]
        communication_score: [số]
        marriage_score: [số]
        """

        try:
            # Gọi Gemini API với timeout 2.5s
            model = genai.GenerativeModel(MODEL_NAME)
            response = model.generate_content(prompt, request_options={"timeout": 2.5})
            analysis_text = response.text if hasattr(response, "text") else str(response)
            analysis_text = re.sub(r"(```|'''|\"\"\")", "", analysis_text).strip()
        except BaseException as gemini_err:
            safe_print("⚠️ Gemini Compatibility Error (sử dụng luận giải hòa hợp dự phòng):", gemini_err)
            analysis_text = f"""1. Tổng quan về mối quan hệ:
Sự kết hợp giữa {my_name} ({s1}) và {partner_name} ({s2}) tạo nên một liên kết chiêm tinh học vô cùng bền vững và hài hòa. Hai bạn có tiếng nói chung trong quan điểm sống và dễ dàng đồng cảm với nhau.

2. Tương thích cảm xúc & tình yêu:
Năng lượng giữa hai biểu đồ sao mang đến sự ấm áp, tin cậy và gắn kết tự nhiên. Cả hai luôn tôn trọng ranh giới cá nhân và ủng hộ ước mơ của nhau.

3. Lời khuyên nuôi dưỡng mối quan hệ:
Hãy dành cho nhau những khoảng không gian lãng mạn riêng tư và thường xuyên chia sẻ những suy nghĩ nhỏ bé nhất trong cuộc sống hàng ngày.

SCORES:
compatibility_score: 92
love_score: 90
trust_score: 95
communication_score: 88
marriage_score: 93"""

        # Trích xuất scores từ text
        scores = {
            "compatibility_score": 75,  # default
            "love_score": 75,
            "trust_score": 75,
            "communication_score": 75,
            "marriage_score": 75,
        }

        # Parse scores từ phần cuối của analysis
        score_pattern = r"(compatibility_score|love_score|trust_score|communication_score|marriage_score):\s*(\d+)"
        matches = re.findall(score_pattern, analysis_text, re.IGNORECASE)
        
        for key, value in matches:
            scores[key.lower()] = int(value)
        
        # Loại bỏ phần SCORES khỏi analysis text
        analysis_text = re.sub(r"SCORES:[\s\S]*$", "", analysis_text).strip()

        # Lưu vào Firestore
        compatibility_doc = {
            "cache_key": cache_key,
            "my_uid": my_uid,
            "partner_uid": partner_uid,
            "my_name": me_info["name"],
            "partner_name": partner_info["name"],
            "analysis": analysis_text,
            "compatibility_score": scores["compatibility_score"],
            "love_score": scores["love_score"],
            "trust_score": scores["trust_score"],
            "communication_score": scores["communication_score"],
            "marriage_score": scores["marriage_score"],
            "created_at": datetime.now().isoformat(),
            "user_data": {
                "person1": {**me_info, **me_houses, **me_aspects, **me_elements},
                "person2": {**partner_info, **partner_houses, **partner_aspects, **partner_elements}
            }
        }



        return jsonify({
            "analysis": analysis_text,
            "compatibility_score": scores["compatibility_score"],
            "love_score": scores["love_score"],
            "trust_score": scores["trust_score"],
            "communication_score": scores["communication_score"],
            "marriage_score": scores["marriage_score"],
            "scores": {
                "overall": scores["compatibility_score"],
                "love": scores["love_score"],
                "trust": scores["trust_score"],
                "communication": scores["communication_score"],
                "marriage": scores["marriage_score"],
            },
            "cached": False
        }), 200

    except Exception as e:
        print(f"❌ Error in compatibility analysis: {str(e)}")
        return jsonify({"error": str(e)}), 500


# ------------------------------------------------------
#  Ứng viên mẫu chiêm tinh phong phú (fallback khi DB chưa đủ 5 user hoặc Firestore timeout)
# ------------------------------------------------------
REGISTERED_ACTIVE_USERS = {}  # Lưu trữ các user đang sử dụng để họ cũng xuất hiện ở màn hình của người khác

DEFAULT_MATCH_CANDIDATES = [
    {
        "uid": "cand_1_nghia",
        "name": "Trần Đại Nghĩa",
        "zodiac": "Bảo Bình",
        "sun": "Bảo Bình",
        "moon": "Nhân Mã",
        "age": 23,
        "gender": "Nam",
        "element": "Khí",
        "job": "Product Designer & Sáng tạo nội dung",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        "personality": "Sáng tạo, tự do và cởi mở",
        "planets": {"sun": "Bảo Bình", "moon": "Nhân Mã", "mercury": "Bảo Bình", "venus": "Bạch Dương", "mars": "Song Tử"},
        "houses": {},
        "elements": {"fire": 25, "earth": 15, "air": 45, "water": 15}
    },
    {
        "uid": "cand_2_hamy",
        "name": "Hà My",
        "zodiac": "Song Ngư",
        "sun": "Song Ngư",
        "moon": "Cự Giải",
        "age": 21,
        "gender": "Nữ",
        "element": "Nước",
        "job": "Nhiếp ảnh gia & Nhà trị liệu nghệ thuật",
        "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
        "personality": "Dịu dàng, trực giác và lãng mạn",
        "planets": {"sun": "Song Ngư", "moon": "Cự Giải", "mercury": "Bảo Bình", "venus": "Kim Ngưu", "mars": "Song Ngư"},
        "houses": {},
        "elements": {"fire": 10, "earth": 20, "air": 20, "water": 50}
    },
    {
        "uid": "cand_3_linhdan",
        "name": "Linh Đan",
        "zodiac": "Kim Ngưu",
        "sun": "Kim Ngưu",
        "moon": "Xử Nữ",
        "age": 22,
        "gender": "Nữ",
        "element": "Đất",
        "job": "Chuyên viên Phân tích Dữ liệu",
        "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
        "personality": "Chân thành, kiên định và ấm áp",
        "planets": {"sun": "Kim Ngưu", "moon": "Xử Nữ", "mercury": "Song Tử", "venus": "Cự Giải", "mars": "Kim Ngưu"},
        "houses": {},
        "elements": {"fire": 15, "earth": 50, "air": 15, "water": 20}
    },
    {
        "uid": "cand_4_maianh",
        "name": "Mai Anh",
        "zodiac": "Cự Giải",
        "sun": "Cự Giải",
        "moon": "Kim Ngưu",
        "age": 22,
        "gender": "Nữ",
        "element": "Nước",
        "job": "Giảng viên Yoga & Thiền định",
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
        "personality": "Chu đáo, biết lắng nghe và tình cảm",
        "planets": {"sun": "Cự Giải", "moon": "Kim Ngưu", "mercury": "Cự Giải", "venus": "Sư Tử", "mars": "Xử Nữ"},
        "houses": {},
        "elements": {"fire": 20, "earth": 25, "air": 10, "water": 45}
    },
    {
        "uid": "cand_5_quocbao",
        "name": "Quốc Bảo",
        "zodiac": "Thiên Bình",
        "sun": "Thiên Bình",
        "moon": "Bảo Bình",
        "age": 24,
        "gender": "Nam",
        "element": "Khí",
        "job": "Kiến trúc sư",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        "personality": "Lịch thiệp, hòa nhã và tinh tế",
        "planets": {"sun": "Thiên Bình", "moon": "Bảo Bình", "mercury": "Thiên Bình", "venus": "Nhân Mã", "mars": "Thiên Bình"},
        "houses": {},
        "elements": {"fire": 25, "earth": 10, "air": 50, "water": 15}
    },
    {
        "uid": "cand_6_khanhlinh",
        "name": "Khánh Linh",
        "zodiac": "Xử Nữ",
        "sun": "Xử Nữ",
        "moon": "Ma Kết",
        "age": 23,
        "gender": "Nữ",
        "element": "Đất",
        "job": "Biên kịch & Nhà sáng tạo nội dung",
        "avatar": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
        "personality": "Thông minh, sắc sảo và sâu sắc",
        "planets": {"sun": "Xử Nữ", "moon": "Ma Kết", "mercury": "Xử Nữ", "venus": "Bọ Cạp", "mars": "Ma Kết"},
        "houses": {},
        "elements": {"fire": 10, "earth": 55, "air": 15, "water": 20}
    },
    {
        "uid": "cand_7_hoangnam",
        "name": "Hoàng Nam",
        "zodiac": "Bạch Dương",
        "sun": "Bạch Dương",
        "moon": "Nhân Mã",
        "age": 24,
        "gender": "Nam",
        "element": "Lửa",
        "job": "Nhiếp ảnh gia đường phố & Nhà thám hiểm",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
        "personality": "Năng động, quả quyết, bộc trực và nhiệt huyết",
        "planets": {"sun": "Bạch Dương", "moon": "Nhân Mã", "mercury": "Song Ngư", "venus": "Kim Ngưu", "mars": "Bạch Dương"},
        "houses": {},
        "elements": {"fire": 55, "earth": 10, "air": 20, "water": 15}
    },
    {
        "uid": "cand_8_thutrang",
        "name": "Thu Trang",
        "zodiac": "Kim Ngưu",
        "sun": "Kim Ngưu",
        "moon": "Ma Kết",
        "age": 22,
        "gender": "Nữ",
        "element": "Đất",
        "job": "Giảng viên Mỹ thuật & Gốm thủ công",
        "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
        "personality": "Điềm đạm, ấm áp, kiên nhẫn và bình dị",
        "planets": {"sun": "Kim Ngưu", "moon": "Ma Kết", "mercury": "Kim Ngưu", "venus": "Song Ngư", "mars": "Kim Ngưu"},
        "houses": {},
        "elements": {"fire": 10, "earth": 55, "air": 15, "water": 20}
    },
    {
        "uid": "cand_9_minhtriet",
        "name": "Minh Triết",
        "zodiac": "Song Tử",
        "sun": "Song Tử",
        "moon": "Thiên Bình",
        "age": 23,
        "gender": "Nam",
        "element": "Khí",
        "job": "Kỹ sư AI & Podcaster công nghệ",
        "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
        "personality": "Hoạt ngôn, hài hước, tư duy logic nhạy bén",
        "planets": {"sun": "Song Tử", "moon": "Thiên Bình", "mercury": "Song Tử", "venus": "Bảo Bình", "mars": "Sư Tử"},
        "houses": {},
        "elements": {"fire": 20, "earth": 10, "air": 55, "water": 15}
    },
    {
        "uid": "cand_10_ngocanh",
        "name": "Ngọc Ánh",
        "zodiac": "Sư Tử",
        "sun": "Sư Tử",
        "moon": "Bạch Dương",
        "age": 23,
        "gender": "Nữ",
        "element": "Lửa",
        "job": "Brand Manager & Stylist thời trang",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        "personality": "Tự tin, cuốn hút, hào phóng và tích cực",
        "planets": {"sun": "Sư Tử", "moon": "Bạch Dương", "mercury": "Sư Tử", "venus": "Song Tử", "mars": "Nhân Mã"},
        "houses": {},
        "elements": {"fire": 55, "earth": 15, "air": 20, "water": 10}
    },
    {
        "uid": "cand_11_tuananh",
        "name": "Tuấn Anh",
        "zodiac": "Bọ Cạp",
        "sun": "Bọ Cạp",
        "moon": "Cự Giải",
        "age": 25,
        "gender": "Nam",
        "element": "Nước",
        "job": "Chuyên viên Phân tích Đầu tư",
        "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
        "personality": "Trầm tĩnh, sâu sắc, trực giác bén nhọn",
        "planets": {"sun": "Bọ Cạp", "moon": "Cự Giải", "mercury": "Bọ Cạp", "venus": "Ma Kết", "mars": "Bọ Cạp"},
        "houses": {},
        "elements": {"fire": 15, "earth": 20, "air": 15, "water": 50}
    },
    {
        "uid": "cand_12_phuongthao",
        "name": "Phương Thảo",
        "zodiac": "Nhân Mã",
        "sun": "Nhân Mã",
        "moon": "Sư Tử",
        "age": 22,
        "gender": "Nữ",
        "element": "Lửa",
        "job": "Hướng dẫn viên du lịch & Blogger",
        "avatar": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80",
        "personality": "Phóng khoáng, lạc quan và yêu tự do",
        "planets": {"sun": "Nhân Mã", "moon": "Sư Tử", "mercury": "Bảo Bình", "venus": "Nhân Mã", "mars": "Bạch Dương"},
        "houses": {},
        "elements": {"fire": 50, "earth": 15, "air": 25, "water": 10}
    },
    {
        "uid": "cand_13_duclong",
        "name": "Đức Long",
        "zodiac": "Ma Kết",
        "sun": "Ma Kết",
        "moon": "Kim Ngưu",
        "age": 24,
        "gender": "Nam",
        "element": "Đất",
        "job": "Quản lý Dự án Bền vững",
        "avatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80",
        "personality": "Điềm tĩnh, có trách nhiệm và kiên trì",
        "planets": {"sun": "Ma Kết", "moon": "Kim Ngưu", "mercury": "Ma Kết", "venus": "Xử Nữ", "mars": "Kim Ngưu"},
        "houses": {},
        "elements": {"fire": 10, "earth": 60, "air": 15, "water": 15}
    },
    {
        "uid": "cand_14_thanhhuyen",
        "name": "Thanh Huyền",
        "zodiac": "Bảo Bình",
        "sun": "Bảo Bình",
        "moon": "Song Tử",
        "age": 23,
        "gender": "Nữ",
        "element": "Khí",
        "job": "UI/UX Designer & Nghệ sĩ minh họa",
        "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
        "personality": "Độc lập, sáng tạo và nhân hậu",
        "planets": {"sun": "Bảo Bình", "moon": "Song Tử", "mercury": "Bảo Bình", "venus": "Bạch Dương", "mars": "Bảo Bình"},
        "houses": {},
        "elements": {"fire": 20, "earth": 10, "air": 55, "water": 15}
    },
    {
        "uid": "cand_15_vietanh",
        "name": "Việt Anh",
        "zodiac": "Song Ngư",
        "sun": "Song Ngư",
        "moon": "Bọ Cạp",
        "age": 23,
        "gender": "Nam",
        "element": "Nước",
        "job": "Nhạc sĩ Indie & Sản xuất âm nhạc",
        "avatar": "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=400&q=80",
        "personality": "Giàu cảm xúc, lãng tử và thấu cảm",
        "planets": {"sun": "Song Ngư", "moon": "Bọ Cạp", "mercury": "Song Ngư", "venus": "Kim Ngưu", "mars": "Cự Giải"},
        "houses": {},
        "elements": {"fire": 10, "earth": 15, "air": 20, "water": 55}
    },
    {
        "uid": "cand_16_thuyduong",
        "name": "Thùy Dương",
        "zodiac": "Thiên Bình",
        "sun": "Thiên Bình",
        "moon": "Bảo Bình",
        "age": 24,
        "gender": "Nữ",
        "element": "Khí",
        "job": "Chuyên viên Quan hệ Công chúng (PR)",
        "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
        "personality": "Thanh lịch, khéo léo và hòa nhã",
        "planets": {"sun": "Thiên Bình", "moon": "Bảo Bình", "mercury": "Thiên Bình", "venus": "Sư Tử", "mars": "Thiên Bình"},
        "houses": {},
        "elements": {"fire": 20, "earth": 15, "air": 50, "water": 15}
    }
]

@app.route("/love-matching/<match_type>", methods=["POST"])
def love_matching_single(match_type):
    try:
        valid_types = ["redflag", "greenflag", "karmic", "destiny", "twinflame"]
        if match_type not in valid_types:
            return jsonify({"error": "Loại kết nối không hợp lệ"}), 400

        data = request.get_json() or {}
        uid = data.get("uid") or data.get("userId")
        user_data_req = data.get("userData", {})

        if not uid:
            return jsonify({"error": "Thiếu uid"}), 400

        def extract_planets(u):
            keys = ["sun","moon","mercury","venus","mars"]
            return {k: u.get(k, "") for k in keys}

        def extract_houses(u):
            return {f"house{i}": u.get(f"house{i}", "") for i in range(1,13)}

        def extract_elements(u):
            return {
                "fire": u.get("fireRatio", 0),
                "earth": u.get("earthRatio", 0),
                "air": u.get("airRatio", 0),
                "water": u.get("waterRatio", 0)
            }

        my_sign = user_data_req.get("sun") or user_data_req.get("zodiac", "Ma Kết")
        my_gender = user_data_req.get("gender", "")

        me = {
            "uid": uid,
            "name": user_data_req.get("name", "Bạn"),
            "zodiac": my_sign,
            "age": user_data_req.get("age") or 22,
            "element": user_data_req.get("element") or user_data_req.get("mainElement", "Đất"),
            "personality": user_data_req.get("bio") or user_data_req.get("personality", "Kiên định, chân thành"),
            "planets": extract_planets(user_data_req),
            "elements": extract_elements(user_data_req),
            "houses": extract_houses(user_data_req)
        }

        # Lưu trữ user đang sử dụng vào hệ thống để user này cũng xuất hiện trên màn hình của người khác
        REGISTERED_ACTIVE_USERS[uid] = {
            "uid": uid,
            "name": me["name"],
            "zodiac": my_sign,
            "sun": my_sign,
            "moon": user_data_req.get("moon", "Kim Ngưu"),
            "ascendant": user_data_req.get("ascendant", "Song Tử"),
            "age": me["age"],
            "gender": my_gender,
            "element": me["element"],
            "job": user_data_req.get("job", "Thành viên Resonancia"),
            "avatar": user_data_req.get("avatar", ""),
            "personality": me["personality"],
            "planets": me["planets"],
            "elements": me["elements"],
            "houses": me["houses"],
            "isRealUser": True
        }

        # Thuật toán tính góc chiếu chiêm tinh chính xác giữa 2 cung hoàng đạo
        ZODIAC_ORDER = [
            "Bạch Dương", "Kim Ngưu", "Song Tử", "Cự Giải",
            "Sư Tử", "Xử Nữ", "Thiên Bình", "Bọ Cạp",
            "Nhân Mã", "Ma Kết", "Bảo Bình", "Song Ngư"
        ]
        
        def calculate_synastry(s1, s2, target_tag):
            if s1 not in ZODIAC_ORDER or s2 not in ZODIAC_ORDER:
                return 75, "Năng lượng hai cung hoàng đạo mang lại cơ hội gắn kết.", 75, 75, 75, 75
            i1 = ZODIAC_ORDER.index(s1)
            i2 = ZODIAC_ORDER.index(s2)
            diff = abs(i1 - i2)
            dist = min(diff, 12 - diff) # 0 to 6
            
            # Góc chiếu
            if dist == 4: # Tam hợp Trine 120° (cùng nguyên tố)
                base = 95
                reason = f"Góc tam hợp 120° giữa {s1} và {s2} mang lại sự đồng điệu tâm hồn sâu sắc và bình yên tự nhiên."
                love, trust, comm, marr = 96, 95, 93, 94
                suitability = {"greenflag": 100, "twinflame": 95, "destiny": 90, "karmic": 70, "redflag": 40}
            elif dist == 2: # Lục hợp Sextile 60° (nguyên tố bổ trợ Lửa-Khí, Đất-Nước)
                base = 90
                reason = f"Góc lục hợp 60° giữa {s1} và {s2} kích thích cảm hứng sáng tạo và sự tôn trọng lẫn nhau."
                love, trust, comm, marr = 89, 91, 93, 88
                suitability = {"greenflag": 95, "destiny": 88, "twinflame": 85, "karmic": 75, "redflag": 45}
            elif dist == 6: # Đối đỉnh Opposition 180° (trục bổ khuyết)
                base = 88
                reason = f"Trục đối đỉnh 180° giữa {s1} và {s2} tạo lực hút nam châm mãnh liệt, vừa bù trừ vừa định mệnh."
                love, trust, comm, marr = 93, 82, 85, 90
                suitability = {"destiny": 98, "twinflame": 92, "greenflag": 80, "karmic": 85, "redflag": 65}
            elif dist == 0: # Trùng tụ Conjunction 0° (cùng cung)
                base = 92
                reason = f"Cùng mang cung {s1}, hai bạn như hai mảnh gương phản chiếu chính xác cảm xúc và suy nghĩ của nhau."
                love, trust, comm, marr = 92, 90, 94, 89
                suitability = {"twinflame": 100, "greenflag": 88, "destiny": 85, "karmic": 78, "redflag": 50}
            elif dist == 3: # Vuông góc Square 90° (xung khắc phương thức)
                base = 62
                reason = f"Góc vuông 90° giữa {s1} và {s2} tạo ra lực hút bốc đồng ban đầu nhưng đòi hỏi rất nhiều bao dung để hóa giải bất đồng."
                love, trust, comm, marr = 68, 58, 60, 56
                suitability = {"redflag": 100, "karmic": 82, "destiny": 60, "greenflag": 50, "twinflame": 45}
            elif dist == 5: # Bất đồng vị Quincunx 150° (duyên nợ chuyển hóa)
                base = 78
                reason = f"Góc 150° báo hiệu mối liên kết nghiệp duyên sâu sắc, giúp cả hai đối diện và chữa lành tổn thương nội tâm."
                love, trust, comm, marr = 79, 76, 75, 80
                suitability = {"karmic": 100, "destiny": 82, "redflag": 78, "greenflag": 65, "twinflame": 60}
            else: # dist == 1: Bán lục hợp 30°
                base = 74
                reason = f"Hai cung kề cận mang năng lượng kế thừa bài học cuộc sống, cần thời gian để thấu hiểu sự khác biệt."
                love, trust, comm, marr = 75, 76, 78, 73
                suitability = {"karmic": 88, "greenflag": 72, "redflag": 70, "destiny": 68, "twinflame": 65}
                
            rank_score = suitability.get(target_tag, base)
            return rank_score, reason, love, trust, comm, marr

        # Gộp kho ứng viên mẫu và tất cả các user đã đăng ký hoạt động
        all_candidates_pool = list(DEFAULT_MATCH_CANDIDATES)
        for act_uid, act_user in REGISTERED_ACTIVE_USERS.items():
            if act_uid != uid and act_user.get("name") != me["name"]:
                if not any(c.get("uid") == act_uid for c in all_candidates_pool):
                    all_candidates_pool.append(act_user)

        # Lọc ứng viên từ kho (loại trừ chính bản thân người gửi request)
        pool = [c for c in all_candidates_pool if c.get("uid") != uid and c.get("name") != me["name"]]
        
        # Nếu biết giới tính, ưu tiên ghép khác giới lên đầu
        if my_gender in ["Nam", "Nữ"]:
            target_gender = "Nữ" if my_gender == "Nam" else "Nam"
            gender_matches = [c for c in pool if c.get("gender") == target_gender]
            other_matches = [c for c in pool if c.get("gender") != target_gender]
            pool = gender_matches + other_matches

        # Tính điểm chiêm tinh cho từng ứng viên đối với người đang đăng nhập
        scored_candidates = []
        for c in pool:
            cand_sign = c.get("zodiac") or c.get("sun") or "Bạch Dương"
            score, reason, love, trust, comm, marr = calculate_synastry(my_sign, cand_sign, match_type)
            scored_candidates.append({
                "candidate": c,
                "score": score,
                "reason": reason,
                "love": love,
                "trust": trust,
                "comm": comm,
                "marr": marr
            })

        # Sắp xếp theo độ phù hợp từ cao xuống thấp (hoặc trải đều từ hợp tới thử thách)
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)
        
        # Lấy top 10 - 12 ứng viên để người dùng thấy đầy đủ các mức độ tương hợp (từ hợp nhất cho đến không hợp)
        selected_pairs = scored_candidates[:12] if len(scored_candidates) >= 12 else scored_candidates

        result = []
        for p in selected_pairs:
            c = p["candidate"]
            score = p["score"]
            level = "high" if score >= 85 else "medium" if score >= 70 else "challenge"
            level_text = "Tương hợp cao" if score >= 85 else "Tương hợp vừa" if score >= 70 else "Thử thách / Khác biệt"
            result.append({
                "uid": c.get("uid", ""),
                "name": c.get("name", "Người dùng"),
                "zodiac": c.get("zodiac", ""),
                "age": c.get("age", 22),
                "gender": c.get("gender", ""),
                "element": c.get("element", "Đất"),
                "job": c.get("job", "Thành viên Resonancia"),
                "personality": c.get("personality", ""),
                "reason": p["reason"],
                "compatibility_score": score,
                "match_level": level,
                "match_level_text": level_text,
                "love": p["love"],
                "trust": p["trust"],
                "communication": p["comm"],
                "marriage": p["marr"],
                "avatar": c.get("avatar", ""),
                "isRealUser": c.get("isRealUser", False)
            })

        return jsonify({
            "success": True,
            "type": match_type,
            "user_sign": my_sign,
            "total": len(result),
            "users": result
        })

    except BaseException as e:
        safe_print("🔥 ERROR in love_matching:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/love-matching/history/<uid>/<match_type>", methods=["GET"])
def get_matching_history(uid, match_type):
    # Trả về kết quả nhanh, frontend client sẽ dùng Firestore client cache trực tiếp
    return jsonify({
        "success": True,
        "cached": False,
        "users": []
    })

# -------------------------------------------------
#  Run Flask App
# -------------------------------------------------
if __name__ == "__main__":
    print("Starting Flask server on port 5001.")
    app.run(debug=True, host="0.0.0.0", port=5001)
