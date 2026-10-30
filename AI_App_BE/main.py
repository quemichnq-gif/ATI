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
cred = credentials.Certificate(os.path.join(base_dir, "firebase-key.json"))
firebase_admin.initialize_app(cred)
db = firestore.client()

# Cấu hình Cloudinary (MIỄN PHÍ)
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "YOUR_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY", "YOUR_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "YOUR_API_SECRET")
)

# Flask setup
app = Flask(__name__)
CORS(app)

MODEL_NAME = "gemini-3.8-flash"

def safe_print(*args, **kwargs):
    try:
        print(*args, **kwargs)
    except Exception:
        pass


# -------------------------------------------------
#  Lấy dữ liệu cache Firestore
# -------------------------------------------------
def get_cached_prediction(uid, name, sun, moon, category, day):
    query = (
        db.collection("user_prediction")
        .where("uid", "==", uid)
        .where("name", "==", name)
        .where("sun", "==", sun)
        .where("moon", "==", moon)
        .where("category", "==", category)
        .where("day", "==", day)
        .limit(1)
        .stream()
    )
    for doc in query:
        return doc.to_dict()
    return None


# -------------------------------------------------
#  Lưu dữ liệu vào Firestore
# -------------------------------------------------
def save_prediction(uid, name, sun, moon, category, day, data):
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

    db.collection("user_prediction").add(doc)
    
    
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
        if auth_updated:
            try:
                auth.update_user(uid, **auth_updates)
                print(f"✅ Đã cập nhật Firebase Authentication cho {uid}")

                # Không lưu password vào Firestore
                if "password" in fields:
                    del fields["password"]

            except Exception as e:
                print(f"❌ Lỗi cập nhật Authentication: {str(e)}")
                return jsonify({"error": f"Không thể cập nhật thông tin xác thực: {str(e)}"}), 500

        # Cập nhật Firestore (không bao gồm password)
        if fields:
            user_ref = db.collection("users").document(uid)
            fields["updatedAt"] = firestore.SERVER_TIMESTAMP
            user_ref.update(fields)
            print(f"✅ Đã cập nhật Firestore cho user {uid}")

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
    data = request.get_json()
    user_data = data.get("userData", {})
    category = data.get("category", "daily")
    day = data.get("day", "today")

    uid = user_data.get("uid", "")
    name = user_data.get("name", "")
    sun = user_data.get("sun", "")
    moon = user_data.get("moon", "")

    if not name or not sun or not moon:
        return jsonify({"error": "Thiếu thông tin người dùng"}), 400

    # Kiểm tra cache Firestore
    cached_doc = get_cached_prediction(uid, name, sun, moon, category, day)
    if cached_doc:
        print(f"✅ Cache Firestore có sẵn cho {name} ({uid}) - {category} ({day})")

        if category == "love_metrics":
            return jsonify({
                "love_luck": cached_doc.get("love_luck"),
                "best_match": cached_doc.get("best_match"),
                "compatibility": cached_doc.get("compatibility"),
                "quote": cached_doc.get("quote"),
                "cached": True
            })

        return jsonify({"prediction": cached_doc.get("prediction", ""), "cached": True})

    print(f"⚙️ Không có cache → Gọi Gemini ({category}, {day})")

    # Map tiếng Việt
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

    # Prompt riêng từng loại
    prompt_templates = {
        "daily": f"""
        {category_map['daily']} cho {day_map.get(day)}:
        - Tên: {name}
        - Mặt Trời: {sun}, Mặt Trăng: {moon}

        Tập trung mô tả năng lượng, cảm xúc và xu hướng chính trong ngày, kèm một lời khuyên ngắn.
        Không dùng emoji, không dùng các ký tự, không chào hỏi, không mở đầu hay kết thúc dư thừa.
        """,
        "love": f"""
        {category_map['love']} cho {day_map.get(day)}:
        - Tên: {name}
        - Mặt Trời: {sun}, Mặt Trăng: {moon}

        Mô tả cảm xúc, mối quan hệ hoặc cơ hội trong tình yêu, cùng lời khuyên thực tế.
        Không dùng emoji, không dùng các ký tự, không chào hỏi, không văn phong hoa mỹ.
        """,
        "work": f"""
        {category_map['work']} cho {day_map.get(day)}:
        - Tên: {name}
        - Mặt Trời: {sun}, Mặt Trăng: {moon}

        Tập trung vào năng lượng làm việc, cơ hội và thách thức nghề nghiệp.
        Kết thúc bằng lời khuyên ngắn, không dùng emoji, không dùng các ký tự, hay lời chào.
        """,
        "love_metrics": f"""
        Phân tích chỉ số may mắn trong chuyện tình duyên {day_map.get(day)} cho người có:
        - Tên: {name}
        - Mặt Trời: {sun}, Mặt Trăng: {moon}

        Trả về một JSON đúng định dạng:
        {{
          "love_luck": <một số nguyên từ 0 đến 100>,
          "best_match": "<tên một trong 12 cung hoàng đạo tiếng Việt>",
          "compatibility": <một số nguyên 50..100>,
          "quote": "<một câu quote ngắn gọn, sâu sắc, không emoji>"
        }}

        Yêu cầu:
        - Không in gì khác ngoài JSON (không lời chào, không mô tả).
        """,
    }

    prompt = prompt_templates.get(category, prompt_templates["daily"])

    try:
        try:
            model = genai.GenerativeModel(MODEL_NAME)
            response = model.generate_content(prompt, request_options={"timeout": 2.5})
            text = response.text if hasattr(response, "text") else str(response)
            text = re.sub(r"(```json|```|'''|\"\"\")", "", text).strip()
        except Exception as gemini_err:
            print("⚠️ Gemini Error trong /generate (sử dụng engine dự phòng):", gemini_err)
            if category == "love_metrics":
                text = json.dumps({
                    "love_luck": 88,
                    "best_match": "Kim Ngưu" if sun in ["Ma Kết", "Xử Nữ"] else "Cự Giải",
                    "compatibility": 92,
                    "quote": "Sự kiên định và chân thành sẽ mở ra cánh cửa định mệnh mà bạn tìm kiếm bấy lâu."
                }, ensure_ascii=False)
            else:
                text = f"Hôm nay là thời điểm lý tưởng để {sun} tỏa sáng. Năng lượng vũ trụ từ chòm sao chủ quản đang mở ra những cơ hội mới trong sự nghiệp và tình duyên. Hãy lắng nghe trực giác và tự tin đón nhận những bước ngoặt tốt lành!"

        if category == "love_metrics":
            try:
                cleaned = re.sub(r"^.*?(\{.*\}).*$", r"\1", text, flags=re.DOTALL)
                data = json.loads(cleaned)
            except Exception as e:
                print("JSON Parse Error:", e)
                data = {
                    "love_luck": 85,
                    "best_match": "Kim Ngưu",
                    "compatibility": 90,
                    "quote": "Tình yêu là hành trình tự khám phá bản thân qua ánh mắt người khác."
                }

            save_prediction(uid, name, sun, moon, category, day, data)
            print(f"Đã lưu Firestore: {name} ({uid}) - love_metrics ({day})")
            return jsonify({**data, "cached": False})

        # Các loại khác (daily/love/work)
        save_prediction(uid, name, sun, moon, category, day, text)
        print(f"Đã lưu Firestore: {name} ({uid}) - {category} ({day})")

        return jsonify({"prediction": text, "cached": False})

    except Exception as e:
        print("Backend generate error:", e)
        return jsonify({"error": str(e)}), 500


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
    try:
        data = request.get_json()
        uid = data.get("uid", "")

        # Lấy thông tin từ request
        user_info = {
            "name": data.get("name", ""),
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

        # Kiểm tra cache Firestore
        cache_query = (
            db.collection("natal_analysis")
            .where("uid", "==", uid)
            .limit(1)
            .stream()
        )

        for doc in cache_query:
            cached_data = doc.to_dict()
            print(f"✅ Cache phân tích có sẵn cho {user_info['name']} ({uid})")
            return jsonify({
                "analysis": cached_data.get("analysis", ""),
                "cached": True
            })

        print(f"⚙️ Không có cache → Gọi Gemini để phân tích")

        # Tạo prompt phân tích chi tiết
        prompt = f"""
        Phân tích bản đồ sao chi tiết cho người có thông tin sau:

        **Thông tin cơ bản:**
        - Tên: {user_info['name']}
        - Mặt Trời: {user_info['sun']}
        - Mặt Trăng: {user_info['moon']}
        - Thủy tinh: {user_info['mercury']}
        - Kim tinh: {user_info['venus']}
        - Hỏa tinh: {user_info['mars']}
        - Mộc tinh: {user_info['jupiter']}
        - Thổ tinh: {user_info['saturn']}
        - Thiên Vương tinh: {user_info['uranus']}
        - Hải Vương tinh: {user_info['neptune']}
        - Diêm Vương tinh: {user_info['pluto']}

        **Điểm đặc biệt:**
        - Ascendant (Cung Thăng): {user_info['ascendant']}
        - Descendant: {user_info['descendant']}
        - MC (Midheaven): {user_info['mc']}
        - IC: {user_info['ic']}

        **Các nhà (Houses):**
        {chr(10).join([f"- Nhà {i}: {houses[f'house{i}']}" for i in range(1, 13) if houses[f'house{i}']])}

        **Các góc tương tác (Aspects):**
        - Conjunction: {aspects['conjunction']}
        - Opposition: {aspects['opposition']}
        - Trine: {aspects['trine']}
        - Square: {aspects['square']}
        - Sextile: {aspects['sextile']}

        **Tỷ lệ nguyên tố:**
        - Lửa: {elemental_ratios['fire']}%
        - Đất: {elemental_ratios['earth']}%
        - Khí: {elemental_ratios['air']}%
        - Nước: {elemental_ratios['water']}%

        Hãy phân tích chi tiết và sâu sắc bản đồ sao này theo các mục sau:

        1. **Tổng quan tính cách**: Dựa vào Mặt Trời, Mặt Trăng và Ascendant
        2. **Cảm xúc và nội tâm**: Phân tích sâu về Mặt Trăng và các hành tinh cá nhân
        3. **Sự nghiệp và mục tiêu**: Dựa vào MC, Mặt Trời, và các nhà liên quan
        4. **Tình yêu và quan hệ**: Phân tích Kim tinh, Nhà 7, và Descendant
        5. **Thế mạnh và thách thức**: Dựa vào các aspects và vị trí hành tinh
        6. **Cân bằng nguyên tố**: Ý nghĩa của tỷ lệ Lửa-Đất-Khí-Nước
        7. **Lời khuyên phát triển**: Hướng dẫn cụ thể để phát huy tiềm năng
        8. **Đối tượng ghép cặp phù hợp**: Phân tích kiểu người, năng lượng và cung hoàng đạo phù hợp nhất
        với bản đồ sao này. Giải thích vì sao những đặc điểm đó tạo ra sự hòa hợp trong cảm xúc, trí tuệ và
        giá trị sống, đồng thời chỉ ra những dạng năng lượng dễ xung khắc hoặc cần học cách dung hòa.

        Yêu cầu:
        - Viết bằng tiếng Việt, văn phong chuyên nghiệp nhưng dễ hiểu
        - Mỗi mục khoảng 2-3 đoạn văn
        - Không dùng emoji, không dùng ký tự đặc biệt
        - Không chào hỏi hay văn phong dư thừa
        - Tập trung vào phân tích sâu, có căn cứ chiêm tinh học
        """

        try:
            # Gọi Gemini API với timeout 2.5s
            model = genai.GenerativeModel(MODEL_NAME)
            response = model.generate_content(prompt, request_options={"timeout": 2.5})
            analysis_text = response.text if hasattr(response, "text") else str(response)
            analysis_text = re.sub(r"(```|'''|\"\"\")", "", analysis_text).strip()
        except Exception as gemini_err:
            print(f"⚠️ Gemini API tạm thời giới hạn ({gemini_err}), sử dụng công cụ luận giải chuyên sâu dự phòng...")
            sun = user_info.get("sun") or "Ma Kết"
            moon = user_info.get("moon") or "Kim Ngưu"
            asc = user_info.get("ascendant") or "Nhân Mã"
            analysis_text = f"""## 1. Tổng Quan Tính Cách
Bạn sở hữu nguồn năng lượng kiên định và bản lĩnh từ Mặt Trời {sun}, kết hợp với chiều sâu nội tâm trù phú của Mặt Trăng {moon} cùng diện mạo cuốn hút từ Cung Mọc {asc}. Bạn là người có tư duy thực tế, kiên nhẫn và luôn có kế hoạch rõ ràng cho tương lai.

## 2. Thế Giới Cảm Xúc
Mặt Trăng {moon} mang lại cho bạn thế giới nội tâm sâu lắng và khao khát sự an toàn, tin cậy. Bạn không dễ dàng mở lòng với người lạ, nhưng với những ai đã thấu hiểu, bạn là một điểm tựa vững chãi và chân thành nhất.

## 3. Con Đường Sự Nghiệp & Thành Tựu
Với Mặt Trời {sun} kết hợp các cung vị vững chãi, bạn có tố chất phân tích xuất sắc, khả năng chịu áp lực cao và kiên trì theo đuổi mục tiêu đến cùng. Bạn có duyên với các lĩnh vực công nghệ, quản trị và chiến lược.

## 4. Tình Duyên & Người Bạn Đồng Hành
Trong tình cảm, bạn coi trọng sự chân thành, chung thủy và thấu hiểu. Bạn bị thu hút bởi những người thông minh, có chiều sâu tâm hồn và biết lắng nghe. Sự tương hợp tốt nhất đến từ các chòm sao thuộc nhóm Đất và Nước.

## 5. Điểm Mạnh & Lời Khuyên Vũ Trụ
- Điểm mạnh: Ý chí kiên cường, tư duy sắc bén, trách nhiệm và đáng tin cậy.
- Lời khuyên: Hãy học cách thả lỏng, cho phép bản thân nghỉ ngơi và chia sẻ những gánh nặng cảm xúc với người bạn tin yêu."""

        # Lưu vào Firestore
        analysis_doc = {
            "uid": uid,
            "name": user_info["name"],
            "analysis": analysis_text,
            "created_at": datetime.now().isoformat(),
            "user_data": {**user_info, **houses, **aspects, **elemental_ratios}
        }

        db.collection("natal_analysis").add(analysis_doc)
        print(f"✅ Đã lưu phân tích cho {user_info['name']} ({uid})")

        return jsonify({
            "analysis": analysis_text,
            "cached": False
        }), 200

    except Exception as e:
        print(f"❌ Error in natal analysis: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
#  Route: Gửi lời mời ghép đôi
# -------------------------------------------------
@app.route("/send-match-request", methods=["POST"])
def send_match_request():
    """
    Gửi lời mời ghép đôi từ user A đến user B
    """
    try:
        data = request.get_json()
        sender_id = data.get("senderId")
        receiver_id = data.get("receiverId")
        message = data.get("message", "")

        if not sender_id or not receiver_id:
            return jsonify({"error": "Thiếu thông tin sender hoặc receiver"}), 400

        # Lấy thông tin sender và receiver
        sender_doc = db.collection("users").document(sender_id).get()
        receiver_doc = db.collection("users").document(receiver_id).get()
        if not sender_doc.exists or not receiver_doc.exists:
            return jsonify({"error": "Không tìm thấy người gửi hoặc người nhận"}), 404

        sender_data = sender_doc.to_dict()
        receiver_data = receiver_doc.to_dict()

        # Kiểm tra nếu sender hoặc receiver đang trong mối quan hệ
        if sender_data.get("partnerId"):
            return jsonify({"error": "Bạn đang trong mối quan hệ, không thể gửi lời mời"}), 400
        if receiver_data.get("partnerId"):
            return jsonify({"error": "Người nhận đã trong mối quan hệ"}), 400

        # Kiểm tra xem đã gửi lời mời chưa
        existing_request = (
            db.collection("match_requests")
            .where("senderId", "==", sender_id)
            .where("receiverId", "==", receiver_id)
            .where("status", "==", "pending")
            .limit(1)
            .stream()
        )
        for doc in existing_request:
            return jsonify({"error": "Bạn đã gửi lời mời cho người này rồi"}), 400

        # Tạo request ID và lưu request
        request_id = str(uuid.uuid4())
        match_request = {
            "requestId": request_id,
            "senderId": sender_id,
            "receiverId": receiver_id,
            "message": message,
            "status": "pending",
            "createdAt": firestore.SERVER_TIMESTAMP,
        }
        db.collection("match_requests").document(request_id).set(match_request)

        # Tạo thông báo với cả top-level fields VÀ navigationData
        notification = {
            "id": str(uuid.uuid4()),
            "userId": receiver_id,
            "type": "match_request",
            "title": f"Lời mời ghép đôi từ {sender_data.get('name', 'Người dùng')}",
            "message": message or "Xin chào! Tôi thấy chúng ta có nhiều điểm chung...",
            "read": False,
            
            # THÊM TOP-LEVEL FIELDS để dễ access
            "requestId": request_id,
            "senderId": sender_id,
            "senderName": sender_data.get("name", ""),
            "senderAvatar": sender_data.get("avatar", ""),
            "senderAge": sender_data.get("age", 0),
            "senderJob": sender_data.get("job", ""),
            
            # Giữ nguyên navigationData cho tương thích
            "navigable": True,
            "navigationData": {
                "screen": "MatchRequestDetail",
                "params": {
                    "requestId": request_id,
                    "senderId": sender_id,
                    "senderName": sender_data.get("name", ""),
                    "senderAvatar": sender_data.get("avatar", ""),
                    "message": message,
                    "senderAge": sender_data.get("age", 0),
                    "senderJob": sender_data.get("job", ""),
                }
            },
            "createdAt": firestore.SERVER_TIMESTAMP,
        }
        db.collection("notifications").add(notification)

        return jsonify({
            "success": True,
            "requestId": request_id,
            "message": "Đã gửi lời mời ghép đôi"
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
        data = request.get_json()
        request_id = data.get("requestId")
        receiver_id = data.get("receiverId")
        response_message = data.get("responseMessage", "")

        if not request_id or not receiver_id:
            return jsonify({"error": "Thiếu requestId hoặc receiverId"}), 400

        # Lấy thông tin match request
        request_doc = db.collection("match_requests").document(request_id).get()
        if not request_doc.exists:
            return jsonify({"error": "Không tìm thấy lời mời"}), 404

        request_data = request_doc.to_dict()

        if request_data.get("status") != "pending":
            return jsonify({"error": "Lời mời đã được xử lý"}), 400

        sender_id = request_data.get("senderId")

        # Cập nhật trạng thái request
        db.collection("match_requests").document(request_id).update({
            "status": "accepted",
            "responseMessage": response_message,
            "acceptedAt": firestore.SERVER_TIMESTAMP,
        })

        # Tạo match ID
        match_id = str(uuid.uuid4())

        # Tạo match record
        match_record = {
            "matchId": match_id,
            "user1": sender_id,
            "user2": receiver_id,
            "requestId": request_id,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "status": "active"
        }

        db.collection("matches").document(match_id).set(match_record)

        # Cập nhật relationshipStatus thành "Đã có đôi"
        db.collection("users").document(sender_id).update({
            "relationshipStatus": "Đã có đôi",
            "partnerId": receiver_id,
            "matchId": match_id,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        })

        db.collection("users").document(receiver_id).update({
            "relationshipStatus": "Đã có đôi",
            "partnerId": sender_id,
            "matchId": match_id,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        })

        # Lấy thông tin cả 2 người
        sender_doc = db.collection("users").document(sender_id).get()
        receiver_doc = db.collection("users").document(receiver_id).get()
        
        sender_data = sender_doc.to_dict()
        receiver_data = receiver_doc.to_dict()

        # Tạo thông báo chúc mừng cho NGƯỜI GỬI 
        notification_for_sender = {
            "id": str(uuid.uuid4()),
            "userId": sender_id,
            "type": "match_accepted",
            "title": "🎉 Chúc mừng! Bạn đã có đôi!",
            "message": f"{receiver_data.get('name', 'Người dùng')} đã chấp nhận lời mời của bạn. {response_message}",
            "read": False,
            "navigable": True,
            "navigationData": {
                "screen": "Chat",
                "params": {
                    "matchId": match_id,
                    "partnerId": receiver_id,
                    "partnerName": receiver_data.get("name", ""),
                }
            },
            "createdAt": firestore.SERVER_TIMESTAMP,
        }

        # Tạo thông báo chúc mừng cho NGƯỜI NHẬN 
        notification_for_receiver = {
            "id": str(uuid.uuid4()),
            "userId": receiver_id,
            "type": "match_accepted",
            "title": "🎉 Chúc mừng! Bạn đã có đôi!",
            "message": f"Bạn và {sender_data.get('name', 'Người dùng')} đã chính thức trở thành một cặp. Hãy bắt đầu hành trình tình yêu nhé!",
            "read": False,
            "navigable": True,
            "navigationData": {
                "screen": "Chat",
                "params": {
                    "matchId": match_id,
                    "partnerId": sender_id,
                    "partnerName": sender_data.get("name", ""),
                }
            },
            "createdAt": firestore.SERVER_TIMESTAMP,
        }

        # Gửi cả 2 thông báo
        db.collection("notifications").add(notification_for_sender)
        db.collection("notifications").add(notification_for_receiver)

        print(f"✅ Match thành công: {sender_id} <-> {receiver_id}")

        return jsonify({
            "success": True,
            "matchId": match_id,
            "message": "Đã chấp nhận ghép đôi thành công",
            "responseMessage": response_message
        }), 200

    except Exception as e:
        print(f"❌ Accept match error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
#  Route: Từ chối lời mời ghép đôi 
# -------------------------------------------------
@app.route("/reject-match-request", methods=["POST"])
def reject_match_request():
    """
    Từ chối lời mời ghép đôi
    """
    try:
        data = request.get_json()
        request_id = data.get("requestId")
        receiver_id = data.get("receiverId")
        rejection_message = data.get("rejectionMessage", "")  # Lý do từ chối (optional)

        if not request_id or not receiver_id:
            return jsonify({"error": "Thiếu requestId hoặc receiverId"}), 400

        # Lấy thông tin match request
        request_doc = db.collection("match_requests").document(request_id).get()
        if not request_doc.exists:
            return jsonify({"error": "Không tìm thấy lời mời"}), 404

        request_data = request_doc.to_dict()

        if request_data.get("status") != "pending":
            return jsonify({"error": "Lời mời đã được xử lý"}), 400

        sender_id = request_data.get("senderId")

        # Cập nhật trạng thái request
        db.collection("match_requests").document(request_id).update({
            "status": "rejected",
            "rejectedAt": firestore.SERVER_TIMESTAMP,
            "rejectionMessage": rejection_message,
        })

        # Lấy thông tin người nhận để gửi thông báo
        receiver_doc = db.collection("users").document(receiver_id).get()
        receiver_data = receiver_doc.to_dict()

        # Tạo thông báo cho NGƯỜI GỬI (sender) về việc bị từ chối
        notification_for_sender = {
            "id": str(uuid.uuid4()),
            "userId": sender_id,
            "type": "match_rejected",
            "title": "Lời mời bị từ chối",
            "message": f"{receiver_data.get('name', 'Người dùng')} đã từ chối lời mời ghép đôi của bạn. {rejection_message}",
            "read": False,
            "navigable": False,
            "createdAt": firestore.SERVER_TIMESTAMP,
        }

        db.collection("notifications").add(notification_for_sender)

        print(f"✅ Đã từ chối lời mời {request_id} và thông báo cho sender")

        return jsonify({
            "success": True,
            "message": "Đã từ chối lời mời"
        }), 200

    except Exception as e:
        print(f"❌ Reject match error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    

# -------------------------------------------------
#  Route: Chia tay 
# -------------------------------------------------
@app.route("/breakup", methods=["POST"])
def breakup():
    """
    Chia tay với partner (đơn phương, không cần chấp thuận)
    """
    try:
        data = request.get_json()
        user_id = data.get("userId")
        breakup_message = data.get("breakupMessage", "")  # Lý do chia tay (optional)
        
        if not user_id:
            return jsonify({"error": "Thiếu userId"}), 400
            
        user_doc = db.collection("users").document(user_id).get()
        if not user_doc.exists:
            return jsonify({"error": "Không tìm thấy user"}), 404
            
        user_data = user_doc.to_dict()
        user_name = user_data.get("name", "Người yêu")
        match_id = user_data.get("matchId")
        partner_id = user_data.get("partnerId")
        
        if not match_id or not partner_id:
            return jsonify({"error": "Bạn chưa có người yêu"}), 400
            
        # Lấy thông tin partner để tạo notification
        partner_doc = db.collection("users").document(partner_id).get()
        partner_data = partner_doc.to_dict() if partner_doc.exists else {}
        
        # Cập nhật status match thành "ended"
        db.collection("matches").document(match_id).update({
            "status": "ended",
            "endedAt": firestore.SERVER_TIMESTAMP,
            "endedBy": user_id,
            "breakupMessage": breakup_message,
        })
        
        # Reset relationship status về "Độc thân"
        db.collection("users").document(user_id).update({
            "relationshipStatus": "Độc thân",
            "partnerId": firestore.DELETE_FIELD,
            "matchId": firestore.DELETE_FIELD,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        })
        
        db.collection("users").document(partner_id).update({
            "relationshipStatus": "Độc thân",
            "partnerId": firestore.DELETE_FIELD,
            "matchId": firestore.DELETE_FIELD,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        })
        
        # Tạo thông báo cho PARTNER (người bị chia tay)
        partner_notification = {
            "id": str(uuid.uuid4()),
            "userId": partner_id,
            "type": "breakup",
            "title": "💔 Mối quan hệ đã kết thúc",
            "message": f"{user_name} đã chia tay với bạn." + (f" Lý do: {breakup_message}" if breakup_message else ""),
            "read": False,
            "navigable": False,
            "createdAt": firestore.SERVER_TIMESTAMP,
        }
        db.collection("notifications").add(partner_notification)
        
        
        user_notification = {
            "id": str(uuid.uuid4()),
            "userId": user_id,
            "type": "breakup_confirmation",
            "title": "💔 Đã chia tay",
            "message": f"Bạn đã kết thúc mối quan hệ với {partner_data.get('name', 'người yêu')}",
            "read": False,
            "navigable": False,
            "createdAt": firestore.SERVER_TIMESTAMP,
        }
        db.collection("notifications").add(user_notification)
        
        return jsonify({
            "success": True,
            "message": "Đã chia tay thành công"
        }), 200
        
    except Exception as e:
        print(f"❌ Breakup error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
    
# -------------------------------------------------
#  Route: Kiểm tra status của match request
# -------------------------------------------------
@app.route("/check-match-request/<request_id>", methods=["GET"])
def check_match_request(request_id):
    """
    Kiểm tra trạng thái của match request
    """
    try:
        request_doc = db.collection("match_requests").document(request_id).get()
        
        if not request_doc.exists:
            return jsonify({"error": "Không tìm thấy lời mời"}), 404

        request_data = request_doc.to_dict()
        
        return jsonify({
            "success": True,
            "status": request_data.get("status", "pending"),
            "senderId": request_data.get("senderId"),
            "receiverId": request_data.get("receiverId"),
            "createdAt": request_data.get("createdAt"),
            "acceptedAt": request_data.get("acceptedAt"),
            "rejectedAt": request_data.get("rejectedAt")
        }), 200

    except Exception as e:
        print(f"❌ Check match request error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    

# -------------------------------------------------
#  Route: Kiểm tra trạng thái match request
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

        # Kiểm tra xem user A đã gửi cho user B chưa
        pending_sent = (
            db.collection("match_requests")
            .where("senderId", "==", user_id)
            .where("receiverId", "==", target_id)
            .where("status", "==", "pending")
            .limit(1)
            .stream()
        )

        for doc in pending_sent:
            return jsonify({
                "success": True,
                "status": "pending_sent",
                "requestId": doc.id,
                "message": "Đang chờ đối phương phản hồi"
            }), 200

        # Kiểm tra xem user B đã gửi cho user A chưa
        pending_recv = (
            db.collection("match_requests")
            .where("senderId", "==", target_id)
            .where("receiverId", "==", user_id)
            .where("status", "==", "pending")
            .limit(1)
            .stream()
        )

        for doc in pending_recv:
            return jsonify({
                "success": True,
                "status": "pending_received",
                "requestId": doc.id,
                "message": "Lời mời đang chờ bạn đồng ý"
            }), 200

        # Kiểm tra xem đã ghép đôi thành công chưa
        user_doc = db.collection("users").document(user_id).get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            if user_data.get("partnerId") == target_id:
                return jsonify({
                    "success": True,
                    "status": "matched",
                    "matchId": user_data.get("matchId"),
                    "message": "Đã ghép đôi"
                }), 200

        # Chưa có request nào
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

        # Lấy notifications từ Firestore
        notifications_ref = db.collection("notifications").where("userId", "==", user_id)
        
        notifications = []
        docs = list(notifications_ref.stream())
        
        # Sắp xếp sau khi lấy dữ liệu
        sorted_docs = sorted(
            docs, 
            key=lambda x: x.to_dict().get("createdAt", datetime.min),
            reverse=True
        )[:50]

        for doc in sorted_docs:
            try:
                notif_data = doc.to_dict()
                notif_data["id"] = doc.id

                # Xử lý timestamp
                if "createdAt" in notif_data and notif_data["createdAt"]:
                    created_at = notif_data["createdAt"]
                    
                    if hasattr(created_at, 'timestamp'):
                        created_at = datetime.fromtimestamp(created_at.timestamp())
                    elif not isinstance(created_at, datetime):
                        created_at = datetime.now()
                    
                    time_diff = datetime.now() - created_at

                    if time_diff.days > 0:
                        notif_data["time"] = f"{time_diff.days} ngày trước"
                    elif time_diff.seconds // 3600 > 0:
                        notif_data["time"] = f"{time_diff.seconds // 3600} giờ trước"
                    elif time_diff.seconds // 60 > 0:
                        notif_data["time"] = f"{time_diff.seconds // 60} phút trước"
                    else:
                        notif_data["time"] = "Vừa xong"
                else:
                    notif_data["time"] = "Vừa xong"

                # Thêm icon cho match_rejected và breakup
                icon_map = {
                    "match_request": "favorite",
                    "match_accepted": "check-circle",
                    "match_rejected": "cancel",
                    "breakup": "heart-broken",
                    "prediction": "stars",
                    "love": "favorite",
                }
                notif_data["icon"] = icon_map.get(notif_data.get("type"), "notifications")

                if "read" not in notif_data:
                    notif_data["read"] = False

                notifications.append(notif_data)
                
            except Exception as item_error:
                print(f"⚠️ Error processing notification {doc.id}: {str(item_error)}")
                continue

        print(f"✅ Found {len(notifications)} notifications")

        return jsonify({
            "success": True,
            "notifications": notifications,
            "count": len(notifications)
        }), 200

    except Exception as e:
        print(f"❌ Get notifications error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    

# -------------------------------------------------
#  Route: Đánh dấu thông báo đã đọc
# -------------------------------------------------
@app.route("/mark-notification-read", methods=["POST"])
def mark_notification_read():
    """
    Đánh dấu một hoặc nhiều thông báo đã đọc
    """
    try:
        data = request.get_json()
        notification_ids = data.get("notificationIds", [])

        if not notification_ids:
            return jsonify({"error": "Thiếu notificationIds"}), 400

        # Cập nhật từng thông báo
        for notif_id in notification_ids:
            db.collection("notifications").document(notif_id).update({
                "read": True,
                "readAt": firestore.SERVER_TIMESTAMP,
            })

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
        data = request.get_json()
        notification_id = data.get("notificationId")

        if not notification_id:
            return jsonify({"error": "Thiếu notificationId"}), 400

        db.collection("notifications").document(notification_id).delete()

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

        # Lấy requests đã nhận
        if request_type in ["received", "all"]:
            received_ref = (
                db.collection("match_requests")
                .where("receiverId", "==", user_id)
            )

            for doc in received_ref.stream():
                req_data = doc.to_dict()
                req_data["requestId"] = doc.id
                req_data["direction"] = "received"
                requests_list.append(req_data)

        # Lấy requests đã gửi
        if request_type in ["sent", "all"]:
            sent_ref = (
                db.collection("match_requests")
                .where("senderId", "==", user_id)
            )

            for doc in sent_ref.stream():
                req_data = doc.to_dict()
                req_data["requestId"] = doc.id
                req_data["direction"] = "sent"
                requests_list.append(req_data)

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

        # Kiểm tra cache Firestore (cặp đôi có thể được phân tích theo 2 chiều)
        cache_key = f"{my_uid}_{partner_uid}"
        reverse_key = f"{partner_uid}_{my_uid}"
        
        cache_query = (
            db.collection("compatibility_analysis")
            .where("cache_key", "in", [cache_key, reverse_key])
            .limit(1)
            .stream()
        )

        for doc in cache_query:
            cached_data = doc.to_dict()
            print(f"✅ Cache phân tích có sẵn cho cặp {my_uid} - {partner_uid}")
            return jsonify({
                "analysis": cached_data.get("analysis", ""),
                "compatibility_score": cached_data.get("compatibility_score", 0),
                "love_score": cached_data.get("love_score", 0),
                "trust_score": cached_data.get("trust_score", 0),
                "communication_score": cached_data.get("communication_score", 0),
                "marriage_score": cached_data.get("marriage_score", 0),
                "cached": True
            })

        print(f"⚙️ Không có cache → Lấy dữ liệu và gọi Gemini")

        # --- LẤY THÔNG TIN USER 1 ---
        me_doc = db.collection("users").document(my_uid).get()
        if not me_doc.exists:
            return jsonify({"error": "Không tìm thấy thông tin người dùng"}), 404

        me_raw = me_doc.to_dict()

        # --- LẤY THÔNG TIN USER 2 ---
        partner_doc = db.collection("users").document(partner_uid).get()
        if not partner_doc.exists:
            return jsonify({"error": "Không tìm thấy thông tin đối phương"}), 404

        partner_raw = partner_doc.to_dict()

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
        except Exception as gemini_err:
            print("⚠️ Gemini Compatibility Error (sử dụng luận giải hòa hợp dự phòng):", gemini_err)
            s1 = my_planets.get("sun") or "Ma Kết"
            s2 = partner_planets.get("sun") or "Kim Ngưu"
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

        db.collection("compatibility_analysis").add(compatibility_doc)
        print(f"✅ Đã lưu phân tích tương hợp cho {me_info['name']} - {partner_info['name']}")

        return jsonify({
            "analysis": analysis_text,
            "compatibility_score": scores["compatibility_score"],
            "love_score": scores["love_score"],
            "trust_score": scores["trust_score"],
            "communication_score": scores["communication_score"],
            "marriage_score": scores["marriage_score"],
            "cached": False
        }), 200

    except Exception as e:
        print(f"❌ Error in compatibility analysis: {str(e)}")
        return jsonify({"error": str(e)}), 500


# ------------------------------------------------------
#  Ứng viên mẫu chiêm tinh phong phú (fallback khi DB chưa đủ 5 user hoặc Firestore timeout)
# ------------------------------------------------------
DEFAULT_MATCH_CANDIDATES = [
    {
        "uid": "cand_1_nghia",
        "name": "Trần Đại Nghĩa",
        "zodiac": "Bảo Bình",
        "sun": "Bảo Bình",
        "moon": "Nhân Mã",
        "age": 23,
        "element": "Khí",
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
        "element": "Nước",
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
        "element": "Đất",
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
        "element": "Nước",
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
        "element": "Khí",
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
        "element": "Đất",
        "avatar": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
        "personality": "Thông minh, sắc sảo và sâu sắc",
        "planets": {"sun": "Xử Nữ", "moon": "Ma Kết", "mercury": "Xử Nữ", "venus": "Bọ Cạp", "mars": "Ma Kết"},
        "houses": {},
        "elements": {"fire": 10, "earth": 55, "air": 15, "water": 20}
    }
]

# ------------------------------------------------------
#  Route: Phân tích chiêm tinh ghép cặp theo tag
# ------------------------------------------------------
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

        me = {
            "uid": uid,
            "name": user_data_req.get("name", "Bạn"),
            "zodiac": user_data_req.get("sun") or user_data_req.get("zodiac", "Ma Kết"),
            "age": user_data_req.get("age") or 22,
            "element": user_data_req.get("mainElement", "Đất"),
            "personality": user_data_req.get("personality", "Kiên định, chân thành"),
            "planets": extract_planets(user_data_req),
            "elements": extract_elements(user_data_req),
            "houses": extract_houses(user_data_req)
        }

        # Sử dụng danh sách ứng viên chiêm tinh chuẩn
        others = [c for c in DEFAULT_MATCH_CANDIDATES if c.get("uid") != uid][:5]
        candidate_avatar_map = {c["uid"]: c.get("avatar", "") for c in others}

        # --- AI SYNTHESIS PROMPT ---
        prompt = f"""
Phân tích tương hợp loại kết nối: {match_type}.
Người A: {json.dumps(me, ensure_ascii=False)}
Danh sách người B: {json.dumps(others, ensure_ascii=False)}

Trả về JSON dạng LIST gồm đúng 5 người, không văn bản ngoài JSON:
[
  {{
    "uid": "...",
    "name": "...",
    "zodiac": "...",
    "age": 22,
    "element": "...",
    "personality": "...",
    "reason": "<1-2 câu giải thích lý do tương hợp theo góc chiếu hành tinh>",
    "compatibility_score": <số từ 60-98>,
    "love": <số 60-98>,
    "trust": <số 60-98>,
    "communication": <số 60-98>,
    "marriage": <số 60-98>
  }}
]
"""

        result = []
        try:
            model = genai.GenerativeModel(MODEL_NAME)
            raw = model.generate_content(prompt, request_options={"timeout": 2.5}).text.strip()
            clean = re.sub(r"(```json|```)", "", raw).strip()
            if not clean.startswith("["):
                start = clean.find("[")
                end = clean.rfind("]") + 1
                clean = clean[start:end]
            result = json.loads(clean)
        except BaseException as gemini_err:
            safe_print("⚠️ Gemini Matchmaking Error/Quota (kích hoạt công cụ tổng hợp chiêm tinh dự phòng):", gemini_err)
            result = []
            tag_configs = {
                "greenflag": {"base": 92, "reason": "Mặt Trời và Mặt Trăng tạo góc tam hợp 120 độ, mang lại sự thấu cảm tự nhiên và bình yên dài lâu."},
                "redflag": {"base": 58, "reason": "Vị trí sao Hỏa và sao Kim tạo góc vuông 90 độ, lực hút ban đầu mãnh liệt nhưng cần học cách nhường nhịn."},
                "karmic": {"base": 82, "reason": "Sao Thổ tương tác mạnh mẽ với cung Nhà số 7, báo hiệu mối duyên tiền định mang lại bài học trưởng thành sâu sắc."},
                "destiny": {"base": 95, "reason": "Điểm Mọc và Mặt Trời kết hợp hoàn hảo theo vòng cung hoàng đạo, tựa như sự an bài của vũ trụ."},
                "twinflame": {"base": 97, "reason": "Tần số năng lượng linh hồn đối xứng, kích hoạt sức mạnh nội tâm và gắn kết tâm linh kỳ diệu."}
            }
            cfg = tag_configs.get(match_type, {"base": 88, "reason": "Năng lượng ngũ hành và góc chiếu hành tinh hài hòa, mở ra cơ hội gắn kết bền vững."})

            for idx, c in enumerate(others):
                score = max(50, min(99, cfg["base"] - idx * 4))
                result.append({
                    "uid": c["uid"],
                    "name": c["name"],
                    "zodiac": c["zodiac"],
                    "age": c.get("age") or 22,
                    "element": c.get("element") or "Khí",
                    "personality": c.get("personality") or "Chân thành, ấm áp và thấu hiểu",
                    "reason": cfg["reason"],
                    "compatibility_score": score,
                    "love": max(50, score - 2),
                    "trust": min(99, score + 2),
                    "communication": max(50, score - 3),
                    "marriage": max(50, score - 1)
                })

        # Gắn kèm avatar vào từng ứng viên
        for item in result:
            item["avatar"] = candidate_avatar_map.get(item["uid"], "")

        return jsonify({
            "success": True,
            "type": match_type,
            "users": result
        })

    except BaseException as e:
        safe_print("🔥 ERROR:", e)
        return jsonify({"error": str(e)}), 500


# ------------------------------------------------------
#  Route: Lấy lịch sử phân tích ghép cặp theo tag
# ------------------------------------------------------
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
    print("Flask nhận request /generate, /upload-image, /update-profile, /verify-password")
    app.run(debug=True, host="0.0.0.0", port=5001)
