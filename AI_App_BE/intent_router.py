# -*- coding: utf-8 -*-
"""
Intent Router for Resonancia AstroBot
100% Local Rule-Based Router (0 Gemini Calls)
Determines: intent ('navigation', 'small_talk', 'unsupported', 'contextual', 'knowledge')
            emotional (True/False or crisis)
            actions (list of navigation action dicts)
            rewritten_query (for contextual RAG retrieval)
"""

import re
import unicodedata
from navigation import (
    NAVIGATION_REGISTRY,
    VALID_ROUTES,
    create_action,
    get_navigation_response,
    get_multi_navigation_response,
    get_form_help_response,
    get_unknown_feature_response
)

def remove_accents(text: str) -> str:
    """Loại bỏ dấu tiếng Việt chuẩn hóa unicodedata."""
    if not text:
        return ""
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    text = text.replace('đ', 'd').replace('Đ', 'D')
    return text.lower().strip()

def normalize_text(text: str) -> str:
    """Chuẩn hóa text: lowercase, bỏ dấu, gom khoảng trắng."""
    no_accents = remove_accents(text)
    return re.sub(r'\s+', ' ', no_accents).strip()

# ==============================================================================
# KEYWORD & PATTERN DEFINITIONS
# ==============================================================================

# Từ khóa biểu thị câu hỏi giải thích / kiến thức (Tuyệt đối KHÔNG gán sang navigation)
EXPLANATION_INDICATORS = [
    "la gi", "nghia la gi", "la cai gi", "y nghia gi", "co y nghia gi",
    "tai sao", "vi sao", "nhu the nao", "the nao", "ra sao",
    "khac nhau", "phan biet", "tinh cach", "dac diem", "uu diem", "nhuoc diem",
    "giai thich", "tim hieu ve", "la sao", "dai dien cho", "cai quan"
]

# Động từ chỉ hành vi điều hướng / thao tác
NAV_ACTION_VERBS = [
    "mo", "xem", "vao", "di toi", "chuyen toi", "chuyen sang", "den",
    "nhap", "dien", "cap nhat", "doi", "sua", "cai dat", "truy cap",
    "muon xem", "muon vao", "muon mo", "cho toi xem", "cho toi vao",
    "cho xem", "hay mo", "giup toi mo", "mo giup", "dat toi toi", "mo trang"
]

# Từ khóa điều hướng tương ứng với từng chức năng
NAV_TARGETS = {
    "tarot": ["tarot", "boi bai", "rut bai", "trai bai", "que bai", "xem bai"],
    "natal": ["ban do sao", "la so", "natal", "birth chart", "bieu do sao", "la so sinh", "ban do sinh"],
    "synastry": ["ban do doi", "synastry", "so sanh la so", "do hop", "do hop nhau", "tuong hop 2 nguoi"],
    "partner": ["nguoi yeu", "doi phuong", "crush", "nguoi ay", "ban doi", "thong tin nguoi yeu"],
    "match": ["ghep doi", "ghep cap", "match", "soulmate", "tim nguoi yeu", "hen ho"],
    "prediction": ["du doan", "horoscope", "tu vi", "du bao", "van menh hom nay"],
    "profile": ["ho so", "profile", "ngay sinh", "gio sinh", "noi sinh", "thong tin ca nhan", "thong tin cua toi"],
    "transit": ["van han", "transit", "qua canh", "hanh tinh qua canh"],
    "glossary": ["tu dien", "glossary", "thuat ngu"],
    "journal": ["nhat ky", "journal", "nhat ky vu tru", "ghi chep"]
}

# Câu hỏi về hướng dẫn điền form (Mixed intent)
FORM_HELP_PATTERNS = [
    "chua biet nhap gi", "chua biet dien gi", "can nhap gi", "can dien gi",
    "nhap nhung gi", "dien nhung gi", "huong dan nhap", "huong dan dien",
    "can thong tin gi", "yeu cau thong tin gi", "chua biet cach xem"
]

# Small talk độc lập
SMALL_TALK_STANDALONE = {
    "chao", "xin chao", "chao ban", "hi", "hello", "halo", "alo", "helo",
    "cam on", "cam on nha", "cam on ban", "thanks", "thank you", "thank",
    "tam biet", "bye", "bye bye", "goodbye", "hen gap lai",
    "ok", "oke", "okay", "oki", "duoc", "da", "vang", "uk", "uh", "o", "roi",
    "ban la ai", "ban ten gi", "may la ai", "who are you"
}

# Các chủ đề ngoài phạm vi ứng dụng (Unsupported)
UNSUPPORTED_DOMAINS = [
    "viet code", "viet chuong trinh", "lap trinh", "python", "javascript", "c++", "java", "sql",
    "giai bai tap", "giai toan", "hoa hoc", "vat ly", "viet tieu luan", "viet van", "lam tho",
    "dich ho", "dich tieng anh", "translate", "dich van ban", "hack", "crack", "ca do", "bong da"
]

# Dấu hiệu khủng hoảng tâm lý nghiêm trọng (Crisis)
CRISIS_KEYWORDS = [
    "tu tu", "tu sat", "tu hai", "muon chet", "khong muon song",
    "ket thuc cuoc doi", "giet toi di", "khong muon song nua", "muon bien mat"
]

# Dấu hiệu buồn / tổn thương tinh thần thông thường
EMOTIONAL_SAD_KEYWORDS = [
    "buon qua", "that vong", "be tac", "met moi qua", "vua chia tay",
    "that tinh", "co don", "ton thuong", "tuyet vong", "dau kho", "chán nan"
]

# Dấu hiệu câu nối tiếp (Contextual continuation)
CONTINUATION_PATTERNS = [
    r"^(the|con|vay)\s+(trong\s+)?(tinh yeu|tinh cam|cong viec|su nghiep|suc khoe|tien bac|tai chinh)",
    r"^(con|the)\s+ve\s+",
    r"^(the|con)\s+sao\s*$",
    r"^(the|con)\s+thi\s+sao",
    r"^tai sao( lai the| lai nhu vay)?\??$",
    r"^giai thich ro hon( di| duoc khong)?\??$",
    r"^the con cung nay\??$",
    r"^the con nguoi ay\??$",
    r"^vay a\??$",
    r"^co hop nhau khong\??$"
]

# ==============================================================================
# INTENT ROUTING LOGIC
# ==============================================================================

def detect_emotional(norm_text: str) -> dict:
    """Phát hiện mức độ cảm xúc: khủng hoảng (crisis) hoặc buồn bã (sad)."""
    for kw in CRISIS_KEYWORDS:
        if kw in norm_text:
            return {"emotional": True, "level": "crisis"}
    for kw in EMOTIONAL_SAD_KEYWORDS:
        if kw in norm_text:
            return {"emotional": True, "level": "sad"}
    return {"emotional": False, "level": "none"}

def check_small_talk(norm_text: str) -> bool:
    """Kiểm tra xem câu có phải small talk thuần túy độc lập không."""
    cleaned = re.sub(r'[^\w\s]', '', norm_text).strip()
    if cleaned in SMALL_TALK_STANDALONE:
        return True
    # Kiểm tra lời chào đầu câu nếu câu siêu ngắn
    tokens = cleaned.split()
    if len(tokens) <= 3 and any(t in ["chao", "hi", "hello", "alo", "thanks", "bye"] for t in tokens):
        # Đảm bảo không chứa từ khóa nghiệp vụ chiêm tinh
        has_biz = any(k in norm_text for k in ["la so", "tarot", "cung", "sao", "nha", "xem", "mo"])
        if not has_biz:
            return True
    return False

def check_unsupported(norm_text: str) -> bool:
    """Kiểm tra yêu cầu ngoài phạm vi."""
    # Nếu có chứa từ khóa chiêm tinh học hoặc tên app Resonancia thì KHÔNG từ chối
    astro_safelist = ["chiem tinh", "tarot", "cung", "hoang dao", "la so", "natal", "synastry", "resonancia", "astrobot"]
    if any(k in norm_text for k in astro_safelist):
        return False

    return any(p in norm_text for p in UNSUPPORTED_DOMAINS)

def check_navigation(raw_text: str, norm_text: str) -> tuple:
    """
    Phân tích xem người dùng có muốn điều hướng đến trang nào không.
    Trả về (is_nav, matched_keys, is_form_help, is_unknown_page)
    """
    # 1. Nếu có dấu hiệu hỏi giải thích định nghĩa -> Không phải navigation
    if any(exp in norm_text for exp in EXPLANATION_INDICATORS):
        return (False, [], False, False)

    # 2. Kiểm tra câu hỏi trợ giúp điền form (Mixed intent)
    if any(p in norm_text for p in FORM_HELP_PATTERNS) and any(k in norm_text for k in ["la so", "ban do sao", "natal", "xem"]):
        return (True, ["profile", "natal"], True, False)

    # 3. Kiểm tra xem có động từ điều hướng không
    has_nav_verb = any(v in norm_text for v in NAV_ACTION_VERBS)
    
    # 4. Tìm các đối tượng đích (targets)
    matched_keys = []
    for key, keywords in NAV_TARGETS.items():
        if any(kw in norm_text for kw in keywords):
            matched_keys.append(key)

    # Xử lý trường hợp "xem lá số và tarot" hoặc "lá số và người yêu"
    if has_nav_verb and matched_keys:
        return (True, matched_keys[:2], False, False)

    # Các câu đặc trưng ngắn gọn không cần động từ dài dòng (ví dụ "mở tarot", "xem la so", "tarot di", "ban do sao")
    if norm_text.startswith("mo ") or norm_text.startswith("xem ") or norm_text.endswith(" di"):
        if matched_keys:
            return (True, matched_keys[:2], False, False)

    # 5. Kiểm tra trường hợp yêu cầu mở trang không tồn tại (ví dụ: "mở trang abc", "vào trang test")
    if re.search(r'\b(mo|vao|xem)\s+(trang|chuc nang|muc)\s+([a-zA-Z0-9_\-]+)', norm_text):
        target_name_match = re.search(r'\b(mo|vao|xem)\s+(trang|chuc nang|muc)\s+([a-zA-Z0-9_\-]+)', norm_text)
        target_name = target_name_match.group(3) if target_name_match else "khong ro"
        if not matched_keys:
            return (True, [], False, target_name)

    return (False, [], False, False)

def check_contextual(norm_text: str, history: list) -> tuple:
    """
    Kiểm tra câu hỏi nối tiếp cần bổ sung chủ thể từ lịch sử.
    Trả về (is_contextual, rewritten_query)
    """
    is_continuation = any(re.search(p, norm_text) for p in CONTINUATION_PATTERNS)
    if not is_continuation or not history:
        return (False, "")

    # Tìm chủ thể gần nhất từ history (các turn của người dùng)
    last_user_turns = [t for t in history if isinstance(t, dict) and t.get("role") == "user"]
    if not last_user_turns:
        return (True, "")  # Không tìm thấy chủ thể -> giữ nguyên câu

    prev_text = last_user_turns[-1].get("content", "")
    prev_norm = normalize_text(prev_text)

    # Tìm xem turn trước đang nói về cung hoàng đạo nào hoặc chủ đề nào
    subject = ""
    for sign in ["bach duong", "kim nguu", "song tu", "cu giai", "su tu", "xu nu",
                 "thien binh", "bo cap", "thien yet", "nhan ma", "ma ket", "bao binh", "song ngu"]:
        if sign in prev_norm:
            subject = sign
            break

    if not subject:
        for topic in ["the tower", "the lovers", "the fool", "the empress", "the star", "the moon", "the sun",
                      "nha 7", "nha 10", "nha 1", "nha 8", "sao kim", "sao hoa", "sao moc", "sao tho"]:
            if topic in prev_norm:
                subject = topic
                break

    if subject:
        rewritten = f"{norm_text} đối với {subject}"
        return (True, rewritten)

    return (True, "")

# ==============================================================================
# MAIN ROUTE_INTENT FUNCTION
# ==============================================================================

def route_intent(text: str, history: list = None, user_name: str = "Bạn") -> dict:
    """
    Phân loại intent và chuẩn bị phản hồi cho AstroBot.
    
    Trả về dictionary:
    {
        "intent": "navigation" | "small_talk" | "unsupported" | "contextual" | "knowledge",
        "emotional": bool,
        "emotional_level": "none" | "sad" | "crisis",
        "actions": list of action dicts,
        "action": single action dict (nếu có),
        "rewritten_query": str,
        "direct_response": str (nếu intent có thể trả ngay không qua LLM),
        "should_call_gemini": bool
    }
    """
    if history is None:
        history = []

    raw_text = text.strip()
    norm = normalize_text(raw_text)

    # Kiểm tra trạng thái cảm xúc
    emo_info = detect_emotional(norm)

    # TRƯỜNG HỢP KHỦNG HOẢNG NGIÊM TRỌNG: Trả về template hỗ trợ tâm lý ngay lập tức
    if emo_info["level"] == "crisis":
        crisis_response = (
            f"Chào {user_name}, tôi cảm nhận được bạn đang phải trải qua những cảm xúc vô cùng nặng nề và khó khăn. "
            "Bạn không hề đơn độc trên hành trình này. Xin bạn hãy chia sẻ ngay với người thân, bạn bè tin cậy, "
            "hoặc liên hệ với các đường dây nóng hỗ trợ tâm lý miễn phí tại Việt Nam:\n\n"
            "- **Đường dây nóng Ngày Mai**: 096 306 1414 (hỗ trợ người trầm cảm và khủng hoảng tâm lý)\n"
            "- **Tổng đài Quốc gia Bảo vệ Trẻ em & Thanh thiếu niên**: 111\n"
            "- **Viện Sức khỏe Tâm thần - Bệnh viện Bạch Mai**: 024 3869 3731\n\n"
            "Xin bạn hãy giữ an toàn cho bản thân và tìm kiếm sự hỗ trợ kịp thời nhé. Chúng tôi luôn ở đây lắng nghe bạn."
        )
        return {
            "intent": "small_talk",
            "emotional": True,
            "emotional_level": "crisis",
            "actions": [],
            "action": None,
            "rewritten_query": "",
            "direct_response": crisis_response,
            "should_call_gemini": False
        }

    # THỨ TỰ ƯU TIÊN: navigation -> small_talk -> unsupported -> contextual -> knowledge

    # 1. NAVIGATION
    is_nav, nav_keys, is_form_help, unknown_name = check_navigation(raw_text, norm)
    if is_nav:
        if is_form_help:
            resp = get_form_help_response(user_name)
        elif unknown_name:
            resp = get_unknown_feature_response(user_name, unknown_name)
        elif len(nav_keys) == 1:
            resp = get_navigation_response(nav_keys[0], user_name)
        else:
            resp = get_multi_navigation_response(nav_keys, user_name)

        return {
            "intent": "navigation",
            "emotional": emo_info["emotional"],
            "emotional_level": emo_info["level"],
            "actions": resp.get("actions", []),
            "action": resp.get("action"),
            "rewritten_query": "",
            "direct_response": resp.get("answer", ""),
            "should_call_gemini": False
        }

    # 2. SMALL TALK
    if check_small_talk(norm):
        if any(w in norm for w in ["cam on", "thanks", "thank"]):
            st_text = f"Không có gì đâu {user_name}! Rất vui được đồng hành cùng bạn trên hành trình khám phá vũ trụ và chiêm tinh học. Bất cứ khi nào bạn cần giải mã bản đồ sao hay trải bài Tarot, tôi luôn sẵn sàng nhé!"
        elif any(w in norm for w in ["tam biet", "bye"]):
            st_text = f"Tạm biệt {user_name}! Chúc bạn luôn mang nguồn năng lượng tích cực và bình an từ các vì sao. Hẹn gặp lại bạn sớm nhé!"
        elif any(w in norm for w in ["ban la ai", "who are you", "may la ai"]):
            st_text = f"Tôi là AstroBot ✨ - Cố vấn Chiêm tinh học và Tarot của nền tảng Resonancia. Tôi có thể giúp bạn giải mã Bản Đồ Sao, phân tích độ hợp đôi, giải nghĩa các lá bài Tarot và theo dõi vận hạn mỗi ngày đấy!"
        else:
            st_text = f"Chào {user_name}! Tôi là AstroBot của Resonancia ✨. Hôm nay bạn muốn tìm hiểu về cung hoàng đạo, khám phá Bản Đồ Sao cá nhân, hay rút một quẻ bài Tarot để đón nhận thông điệp?"

        return {
            "intent": "small_talk",
            "emotional": emo_info["emotional"],
            "emotional_level": emo_info["level"],
            "actions": [],
            "action": None,
            "rewritten_query": "",
            "direct_response": st_text,
            "should_call_gemini": False
        }

    # 3. UNSUPPORTED
    if check_unsupported(norm):
        unsupported_text = (
            f"Chào {user_name}, tôi là AstroBot - trợ lý chuyên sâu về Chiêm tinh học, Bản Đồ Sao và bài Tarot của Resonancia. "
            "Yêu cầu này hiện nằm ngoài phạm vi chiêm tinh của tôi. "
            "Bạn có muốn hỏi tôi về ý nghĩa các cung hoàng đạo, giải mã lá số cá nhân hoặc bói bài Tarot không?"
        )
        return {
            "intent": "unsupported",
            "emotional": emo_info["emotional"],
            "emotional_level": emo_info["level"],
            "actions": [],
            "action": None,
            "rewritten_query": "",
            "direct_response": unsupported_text,
            "should_call_gemini": False
        }

    # 4. CONTEXTUAL (Câu hỏi nối tiếp)
    is_context, rewritten = check_contextual(norm, history)
    if is_context:
        return {
            "intent": "contextual",
            "emotional": emo_info["emotional"],
            "emotional_level": emo_info["level"],
            "actions": [],
            "action": None,
            "rewritten_query": rewritten if rewritten else raw_text,
            "direct_response": "",
            "should_call_gemini": True
        }

    # 5. KNOWLEDGE (Mặc định khi không chắc chắn)
    return {
        "intent": "knowledge",
        "emotional": emo_info["emotional"],
        "emotional_level": emo_info["level"],
        "actions": [],
        "action": None,
        "rewritten_query": raw_text,
        "direct_response": "",
        "should_call_gemini": True
    }
