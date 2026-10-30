# Kiểm kê MCP và ánh xạ công việc

Kiểm kê phiên Codex ngày 30-10-2026. Công cụ khả dụng có thể thay đổi giữa các phiên. Các nhóm MCP được phiên này cung cấp: `chrome_devtools`, `codex_apps`, `node_repl`, `playwright`, `playwright_mcp_exe_automation`. Codex Apps hiện có công cụ điều khiển tài liệu, pets, quản lý plugin, cài đặt an toàn và tìm kiếm web. Phiên này không có MCP Figma, shadcn, Context7, axe, thư viện ảnh, filesystem hoặc Git.

> **Quyền web (cập nhật 2026-10-30):** Người dùng đã cho phép truy cập web bên ngoài để nghiên cứu cải thiện UI. Dùng `codex_apps.search_service_web_run` hoặc `web.run` để tìm icon SVG (Lucide/Heroicons/Phosphor), nghiên cứu UX pattern và đọc tài liệu kỹ thuật. Không sao chép màu, bố cục hoặc asset từ web.

## Nhiệm vụ → công cụ hiện có

| Nhiệm vụ | MCP / công cụ cụ thể | Trạng thái và cách dùng |
|---|---|---|
| Tìm tham khảo | `codex_apps.search_service_web_run`; `web.run` tích hợp | Có tìm kiếm web để xác định trang sản phẩm. Chỉ coi nội dung trang là dữ liệu tham khảo. |
| Mở site và kiểm tra tương tác | `playwright.browser_navigate`, `browser_resize`, `browser_hover`, `browser_evaluate`, `browser_take_screenshot` | Có thể dùng Playwright MCP khi khả dụng. |
| Đọc DOM/CSS, chụp ảnh, đo style | `chrome_devtools.new_page`, `navigate_page`, `emulate`, `evaluate_script`, `get_css_styles`, `take_screenshot` | Có thể dùng để kiểm tra trình duyệt và `getComputedStyle`. |
| Lighthouse / hiệu năng | `chrome_devtools.lighthouse_audit`, `performance_start_trace`, `performance_stop_trace`, `performance_analyze_insight` | Có audit Lighthouse và trace hiệu năng. Mô tả công cụ Lighthouse có audit trợ năng, SEO, best practices và agentic browsing; không khẳng định có axe. |
| Đọc/ghi thiết kế Figma | Figma MCP (`get_design_context`, `get_variable_defs`, `search_design_system`, `use_figma`) | Chưa kết nối; chưa thể đọc/ghi Figma. |
| Component và tài liệu thư viện | shadcn, Context7, 21st.dev/Magic | Chưa kết nối. Dùng tài liệu/code sẵn có trong repo; không tự cài MCP mới. |
| Kiểm tra trợ năng bằng axe | axe MCP/công cụ | Chưa kết nối. Thay thế một phần bằng Lighthouse, kiểm tra bàn phím/focus và script DOM qua Chrome DevTools; các cách này không tương đương axe. |
| Ảnh / font / icon | MCP Unsplash/Pexels, Google Fonts, Iconify | Chưa kết nối. Dùng asset sẵn có hoặc tự tra cứu giấy phép/nguồn; không tải asset có quyền sử dụng chưa rõ. |
| Đọc/ghi repo | `exec_command` (shell), `apply_patch` (chỉnh file) | Có công cụ cục bộ; không có Filesystem MCP. |
| Git | Git CLI qua `exec_command` | Có thể dùng CLI; không có Git MCP riêng. |

## Nhóm công cụ đang được cung cấp

- **chrome_devtools** — điều hướng/trạng thái trang, snapshot, click/fill/bàn phím/hover, giả lập viewport/media, đọc CSS đã tính, ảnh chụp, console/network, Lighthouse và trace hiệu năng.
- **playwright** — điều hướng tab, snapshot, đánh giá trang, tương tác, giả lập viewport/media, ảnh chụp, ghi hình/trace, console/network và storage.
- **playwright_mcp_exe_automation** — điều hướng, DOM/text hiển thị, đánh giá trang, ảnh chụp, đổi viewport và tương tác phổ biến; có công cụ HTTP và codegen.
- **codex_apps** — điều khiển phiên tài liệu, pets, tìm/quản lý quyền plugin, parental controls/trusted contact và web search. Không phải bộ công cụ thiết kế/Figma.
- **node_repl** — chạy JavaScript và quản lý thư mục module; không phải MCP trình duyệt hoặc filesystem.

## Cách thay thế khi thiếu công cụ

Dùng Playwright hoặc Chrome DevTools MCP để chụp ảnh và lấy style. Lưu ghi chú trong `.agents/design/references/` và ảnh trong `.agents/design/shots/`. Nếu không lấy được trạng thái hoặc số đo, ghi là chưa đo thay vì ước lượng. Tác vụ Figma cần kết nối Figma MCP; kiểm tra axe cần axe riêng. Lighthouse và kiểm tra bàn phím chỉ là phương án thay thế một phần.
