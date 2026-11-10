# -*- coding: utf-8 -*-
import os
import re
import time
from datetime import datetime
import requests
import google.generativeai as genai
from app.config import (
    GEMINI_API_KEY,
    ASTROLOGY_API_KEY,
    GEMINI_MODEL,
    FIREBASE_AVAILABLE,
    db
)
from app.shared_state import (
    safe_print,
    get_cached_prediction,
    save_prediction,
    PREDICTION_CACHE
)
try:
    from app.services.astrology_insights import (
        generate_career_insight_text,
        generate_natal_depth_analysis,
        generate_time_based_prediction
    )
    from app.services.rag_service import generate_rag_chat_response
    from app.utils.intent_router import route_intent
except ImportError:
    from astrology_insights import (
        generate_career_insight_text,
        generate_natal_depth_analysis,
        generate_time_based_prediction
    )
    from rag_service import generate_rag_chat_response
    from intent_router import route_intent

ASTROLOGY_ENDPOINTS = {"planets", "houses", "aspects", "natal-wheel-chart"}


def proxy_astrology_call(endpoint, payload):
    if endpoint not in ASTROLOGY_ENDPOINTS:
        return {"error": "Unsupported astrology endpoint", "status": 404}
    if not ASTROLOGY_API_KEY:
        return {"error": "Astrology provider is not configured", "status": 503}

    try:
        upstream = requests.post(
            f"https://json.freeastrologyapi.com/western/{endpoint}",
            json=payload or {},
            headers={"x-api-key": ASTROLOGY_API_KEY, "Content-Type": "application/json"},
            timeout=15,
        )
        if not upstream.ok:
            return {"error": "Astrology provider request failed", "status": 502}
        return {"data": upstream.json(), "status": 200}
    except (requests.RequestException, ValueError):
        return {"error": "Astrology provider is temporarily unavailable", "status": 502}


def process_astrology_chat(messages, user_data):
    start_time = time.time()
    if not isinstance(messages, list) or not messages:
        return {"error": "Hãy nhập câu hỏi trước khi gửi.", "status": 400}

    last_message = messages[-1]
    if not isinstance(last_message, dict) or last_message.get("role") != "user":
        return {"error": "Tin nhắn cuối cần là câu hỏi của bạn.", "status": 400}

    user_query = str(last_message.get("content", "")).strip()
    user_name = str(user_data.get("name") or "Bạn")[:80]
    history = messages[:-1] if len(messages) > 1 else []

    try:
        route_res = route_intent(user_query, history=history, user_name=user_name)
        intent = route_res.get("intent", "knowledge")
        actions = route_res.get("actions", [])
        action = route_res.get("action")

        if not route_res.get("should_call_gemini", True):
            duration_ms = int((time.time() - start_time) * 1000)
            status_tag = "nav_hit" if intent == "navigation" else intent
            safe_print(f"[ASTROBOT] intent={intent} status={status_tag} emb_calls=0 gen_calls=0 cache=hit duration_ms={duration_ms}")
            return {
                "answer": route_res.get("direct_response", ""),
                "intent": intent,
                "action": action,
                "actions": actions,
                "fallback": False,
                "status": 200
            }

        current_api_key = os.getenv("GEMINI_API_KEY", GEMINI_API_KEY)
        current_model = os.getenv("GEMINI_MODEL", GEMINI_MODEL)
        rewritten_query = route_res.get("rewritten_query")
        emotional_level = route_res.get("emotional_level", "none")

        rag_result = generate_rag_chat_response(
            messages=messages,
            user_data=user_data,
            api_key=current_api_key,
            model_name=current_model,
            rewritten_query=rewritten_query,
            emotional_level=emotional_level
        )

        answer = rag_result.get("answer")
        if not answer:
            raise ValueError("RAG service returned no answer")

        duration_ms = int((time.time() - start_time) * 1000)
        emb_calls = rag_result.get("embedding_calls", 1)
        gen_calls = rag_result.get("generation_calls", 1)
        q_cache_hit = rag_result.get("query_cache_hit", False)
        status_tag = "rag_embedding_cache_hit" if q_cache_hit else "rag_gemini"
        safe_print(f"[ASTROBOT] intent={intent} status={status_tag} emb_calls={emb_calls} gen_calls={gen_calls} query_cache={'hit' if q_cache_hit else 'miss'} duration_ms={duration_ms}")

        return {
            "answer": answer,
            "intent": intent,
            "retrieved_topics": rag_result.get("retrieved_topics", []),
            "fallback": rag_result.get("fallback", False),
            "action": action,
            "actions": actions,
            "status": 200
        }
    except Exception as e:
        safe_print("[ASTROBOT] Astrology chat AI error:", e)
        duration_ms = int((time.time() - start_time) * 1000)
        safe_print(f"[ASTROBOT] intent=error status=error_fallback emb_calls=0 gen_calls=0 duration_ms={duration_ms}")
        fallback_msg = "Mình đang gặp giới hạn xử lý một chút, bạn thử lại sau nhé."
        return {
            "answer": fallback_msg,
            "fallback": True,
            "action": None,
            "actions": [],
            "status": 200
        }


def generate_prediction_content(data):
    user_data = data.get("userData", {})
    raw_cat = data.get("category", "daily")
    category = "daily" if raw_cat == "astro" else raw_cat
    day = data.get("day", "today")

    uid = user_data.get("uid", "")
    name = user_data.get("name", "Bạn")
    sun = user_data.get("sun") or user_data.get("zodiac", "Ma Kết")
    moon = user_data.get("moon") or "Kim Ngưu"
    ascendant = user_data.get("ascendant") or data.get("extra", {}).get("ascendant", "")

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
            return {
                **metrics_payload,
                "prediction": metrics_payload,
                "cached": True,
                "status": 200
            }
        return {"prediction": cached_doc.get("prediction", ""), "cached": True, "status": 200}

    safe_print(f"⚙️ Tạo dự đoán mới ({category}, {day}) cho {name} ({sun})")
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
    elif category.endswith("_week") or category.endswith("_month") or category.endswith("_future"):
        if category.endswith("_future"):
            period_str = "trong tương lai dài hạn (6 - 12 tháng tới)"
            base_cat = category.replace("_future", "")
        elif category.endswith("_month"):
            period_str = "tháng này"
            base_cat = category.replace("_month", "")
        else:
            period_str = "tuần này"
            base_cat = category.replace("_week", "")

        cat_map2 = {"astro": "tổng quan chiêm tinh", "daily": "tổng quan chiêm tinh", "love": "tình duyên", "work": "công việc"}
        base_label = cat_map2.get(base_cat, "chiêm tinh")
        prompt = f"""
        Bạn là bậc thầy Chiêm Tinh Học Tâm Lý Chiều Sâu. Hãy viết bản dự báo chi tiết, toàn diện về {base_label} {period_str} cho {name}:
        - Bản đồ sao: Mặt Trời {sun}, Mặt Trăng {moon}{f', Cung Mọc {ascendant}' if ascendant else ''}.

        YÊU CẦU ĐỘ DÀI & ĐỘ SÂU:
        - Viết một bài luận giải phong phú, sâu sắc dài khoảng 400 - 600 từ.
        - Chia thành từng giai đoạn rõ ràng:
          + Giai đoạn 1 (Khởi đầu): Xu hướng năng lượng, cơ hội tiềm ẩn và điểm khởi sắc.
          + Giai đoạn 2 (Phát triển & Biến động): Điểm rơi cảm xúc, thách thức cần lưu tâm, cạm bẫy tâm lý cần phòng tránh.
          + Giai đoạn 3 (Thu hoạch & Định hình): Kết quả đạt được, sự hòa hợp và bước đệm chuyển tiếp.
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
            model = genai.GenerativeModel(GEMINI_MODEL)
            generation_config = {"temperature": 0.8}
            response = model.generate_content(prompt, generation_config=generation_config, request_options={"timeout": 10.0})
            text = response.text if hasattr(response, "text") else str(response)
            text = re.sub(r"(```json|```|'''|\"\"\")", "", text).strip()
        except Exception as gemini_err:
            safe_print("⚠️ Gemini Error trong generate_prediction (sử dụng engine dự phòng):", gemini_err)
            if category == "transit_overview":
                active_events = extra.get("active_events", [])
                p_names = [e.get("planet", "") for e in active_events if e.get("planet")]
                text = f"Giai đoạn này mở ra cơ hội vàng để người cung {sun} củng cố nội lực, hãy chủ động đón nhận sự chuyển dịch từ các hành tinh ({', '.join(p_names[:2]) or 'vũ trụ'}) và giữ vững sự điềm tĩnh."
            elif category.startswith("transit_"):
                text = f"Sự kiện này tác động mạnh mẽ đến trực giác của người cung {sun}. Hãy kiên định với mục tiêu cá nhân, lắng nghe cảm xúc sâu sắc và tránh để những xao nhãng nhất thời làm chậm bước tiến."
            elif category == "career_chart":
                text = generate_career_insight_text(sun, moon, extra.get("mc", "Ma Kết"), extra.get("saturn", "Sao Thổ"), extra.get("jupiter", "Sao Mộc"))
            elif category == "love_metrics":
                import random
                best_matches_map = {
                    "Bạch Dương": "Sư Tử", "Kim Ngưu": "Cự Giải", "Song Tử": "Thiên Bình", "Cự Giải": "Bọ Cạp",
                    "Sư Tử": "Bạch Dương", "Xử Nữ": "Kim Ngưu", "Thiên Bình": "Bảo Bình", "Bọ Cạp": "Song Ngư",
                    "Nhân Mã": "Bạch Dương", "Ma Kết": "Kim Ngưu", "Bảo Bình": "Song Tử", "Song Ngư": "Bọ Cạp"
                }
                quotes = [
                    "Sự chân thành và kiên định chính là chìa khóa mở ra cánh cửa định mệnh mà bạn tìm kiếm bấy lâu.",
                    "Khi hai tâm hồn cùng tần số rung động, mọi khoảng cách không gian hay thời gian đều trở nên vô nghĩa.",
                    "Vũ trụ luôn sắp đặt những cuộc hội ngộ đẹp đẽ nhất vào khoảnh khắc bạn biết yêu thương chính mình trọn vẹn.",
                    "Tình yêu đích thực không phải là tìm kiếm một mảnh ghép hoàn hảo, mà là học cách nhìn thấy sự hoàn hảo qua lăng kính bao dung."
                ]
                metrics_doc = {
                    "love_luck": random.randint(82, 96),
                    "best_match": best_matches_map.get(sun, "Cự Giải"),
                    "compatibility": random.randint(85, 98),
                    "quote": random.choice(quotes),
                }
                save_prediction(uid, name, sun, moon, category, day, metrics_doc)
                return {
                    **metrics_doc,
                    "prediction": metrics_doc,
                    "cached": False,
                    "status": 200
                }
            elif category.startswith("tarot_"):
                card_name = category.replace("tarot_", "").replace("_", " ").title()
                card_vi = extra.get("card_vi", card_name)
                is_reversed = extra.get("is_reversed", False)
                orientation_str = "Ngược" if is_reversed else "Xuôi"
                meaning_snippet = extra.get("meaning", "")
                text = f"Lá bài {card_vi} ({orientation_str}) mang đến thông điệp nhắc nhở bạn hãy tĩnh tâm cảm nhận dòng chảy cuộc sống. {meaning_snippet}\n\nLời khuyên cho bạn hôm nay: Hãy tin tưởng vào lựa chọn nội tại và hành động với sự chân thành."
            else:
                text = generate_time_based_prediction(sun, moon, category, day)

        if category == "love_metrics":
            import json
            try:
                metrics_data = json.loads(text)
                save_prediction(uid, name, sun, moon, category, day, metrics_data)
                return {
                    **metrics_data,
                    "prediction": metrics_data,
                    "cached": False,
                    "status": 200
                }
            except Exception:
                pass

        if not text:
            text = f"Dự báo {cat_label} ({day_label}): Năng lượng hôm nay đang thúc đẩy bạn phát triển mạnh mẽ. Hãy tập trung vào những mục tiêu quan trọng và giữ vững sự bình an trong tâm hồn."

        save_prediction(uid, name, sun, moon, category, day, text)
        return {"prediction": text, "cached": False, "status": 200}
    except Exception as e:
        safe_print(f"❌ Error in generate: {str(e)}")
        return {"error": str(e), "status": 500}


def analyze_natal_chart(data):
    try:
        uid = data.get("uid", "")
        birth_date = data.get("birthDate", "")

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
        houses = {f"house{i}": data.get(f"house{i}", "") for i in range(1, 13)}
        aspects = {
            "conjunction": data.get("conjunctionAspect", ""),
            "opposition": data.get("oppositionAspect", ""),
            "trine": data.get("trineAspect", ""),
            "square": data.get("squareAspect", ""),
            "sextile": data.get("sextileAspect", ""),
        }
        elemental_ratios = {
            "fire": data.get("fireRatio", 0),
            "earth": data.get("earthRatio", 0),
            "air": data.get("airRatio", 0),
            "water": data.get("waterRatio", 0),
        }

        if not user_info["name"] or not user_info["sun"] or not user_info["moon"]:
            return {"error": "Thiếu thông tin cơ bản", "status": 400}

        prompt = f"""
        Bạn là bậc thầy Chiêm Tinh Học Tâm Lý Chiều Sâu. Hãy phân tích bản đồ sao cá nhân cực kỳ chi tiết cho đương số:
        - Tên: {user_info['name']}
        - Mặt Trời: {user_info['sun']}, Mặt Trăng: {user_info['moon']}, Cung Mọc: {user_info['ascendant']}
        - Thiên Đỉnh: {user_info['mc']}, Cung Lặn: {user_info['descendant']}
        - Sao Thủy: {user_info['mercury']}, Sao Kim: {user_info['venus']}, Sao Hỏa: {user_info['mars']}, Sao Thổ: {user_info['saturn']}, Sao Mộc: {user_info['jupiter']}

        BẮT BUỘC PHÂN TÍCH ĐỦ 8 MỤC:
        1. Tính Cách
        2. Cảm Xúc
        3. Sự Nghiệp
        4. Tình Yêu
        5. Điểm Mạnh
        6. Nguyên Tố
        7. Lời Khuyên
        8. Người Lý Tưởng
        Văn phong tâm lý học sâu sắc, chữa lành, không emoji.
        """

        try:
            model = genai.GenerativeModel(GEMINI_MODEL)
            response = model.generate_content(prompt, request_options={"timeout": 25.0})
            analysis_text = response.text if hasattr(response, "text") else str(response)
            analysis_text = re.sub(r"(```|'''|\"\"\")", "", analysis_text).strip()
        except Exception as gemini_err:
            safe_print(f"⚠️ Gemini API fallback: {gemini_err}")
            analysis_text = generate_natal_depth_analysis(user_info, houses, aspects, elemental_ratios, birth_date)

        return {"analysis": analysis_text, "cached": False, "status": 200}
    except Exception as e:
        safe_print(f"❌ Error in natal analysis: {str(e)}")
        return {"error": str(e), "status": 500}

