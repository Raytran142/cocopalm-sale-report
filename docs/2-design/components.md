# CocoPalm Sale Dashboard — Component

> Sinh tự động từ `docs/1-spec/dashboard.json` lúc 2026-10-20 09:30 (giờ Việt Nam). Muốn đổi điều gì, nói với Claude — Claude sửa JSON rồi chạy lại render. Không sửa tay file này: lần render sau sẽ dừng lại và báo.

Danh mục là tập đóng: mọi component dưới đây đã có sẵn trong khung app của skill `dashboard-build`. Cần một component mới là dấu hiệu đang trượt khỏi hệ.

## 1 · Khung app

| Component | Nội dung | Quy tắc |
|---|---|---|
| Shell | toàn bộ app, 1600×900 | tấm bo góc nổi trên mặt bàn, không tràn sát mép |
| Sidebar | logo + tên "CocoPalm Sale Dashboard", 4 mục trang, số dòng đang xem, tài khoản | mục đang chọn tô `--sub2`, không tô brand |
| Header 46px | tên trang, giờ cập nhật, Tải lại, Cảnh báo, Xuất dữ liệu, **Bộ lọc** | "Bộ lọc" là nút brand duy nhất |
| Thanh chào 52px | lời chào + kỳ đang xem + ngày giờ theo **UTC+7**; bên phải là chip bộ lọc đang áp | giờ Việt Nam, không theo giờ máy |
| Trang giới thiệu | tên, mô tả, nút "Mở dashboard", nguồn dữ liệu | cùng shell và token với dashboard |

## 2 · Thẻ KPI

Băng 118px, 5 thẻ. Mỗi thẻ: nhãn + icon · số lớn · so kỳ trước (pill, mũi tên đảo màu với chỉ số nghịch) · sparkline có đường chuẩn gạch ngang · chân ghi ngưỡng.

| # | Thẻ | Số lớn | Chân thẻ | Màu |
|---|---|---|---|---|
| 1 | Doanh thu booking | `SUM(booking_total)`, mỗi `unique_id` một lần | so với … kỳ trước | giữ mực |
| 2 | Số booking | `COUNT DISTINCT(unique_id)` | so với … kỳ trước | giữ mực |
| 3 | Booking huỷ | `COUNT DISTINCT(unique_id)` có `status = cancelled` | so với … kỳ trước (tăng là xấu) | giữ mực |
| 4 | Room night | `SUM(room_night)`, bỏ booking huỷ | so với … kỳ trước | giữ mực |
| 5 | Giá phòng TB / đêm (ADR) | `SUM(booking_total) / SUM(room_night)` | mục tiêu 970k · đang thiếu … | xanh khi ≥ 970k, còn lại đỏ |

So kỳ trước = cùng số ngày, ngay trước khoảng đang xem, cùng bộ lọc. Chênh dưới 0,2% hiện trung tính.

## 3 · Sáu loại visual

| Loại | Legend | Dùng ở |
|---|---|---|
| Donut tỷ trọng | 2 hàng (44px) | trang 1, 2, 3 — chỉ vẽ chỉ số cộng được; chỉ số đang chọn là tỷ lệ thì vẽ Doanh thu booking |
| Area một chuỗi | không | trang 1, xu hướng chỉ số đang chọn hoặc Số booking (nút chuyển ở đầu card) |
| Line nhiều đường | 1 hàng (24px) | trang 2, 3 — top 5 nhóm (xếp theo chỉ số đang chọn), vẽ chỉ số đang chọn hoặc Số booking |
| Donut tỷ trọng (trang 2, 3) | 2 hàng (44px) | tab Theo kênh OTA và Theo loại phòng có nút chuyển "chỉ số đang chọn / Số booking" riêng của card (dùng chung 2 tab, không dùng chung với chart xu hướng, mặc định Số booking); tên trong chú thích cắt ở 22 ký tự |
| Bar xếp hạng | không | trang 1 (top loại phòng), trang 2, 3 — tối đa 7 thanh |
| Bảng theo kỳ tô nhiệt | không | trang 1 — cột: Doanh thu booking, Số booking, Booking huỷ, Room night, Giá phòng TB / đêm (ADR); Booking huỷ pha đỏ (càng đậm càng xấu) |
| Bảng chỉ số đầy đủ | không | trang 2, 3 — cột: Doanh thu booking, Số booking, Booking huỷ, Room night, Giá phòng TB / đêm (ADR). Nút chuyển "<nhóm> / <kỳ>" (mặc định theo nhóm, dùng chung 2 trang): theo kỳ = mỗi ngày / tuần / tháng một dòng của các dòng đang lọc, đủ mọi kỳ, kỳ trống = 0, ô tô nhiệt như bảng trang 1 |
| Sparkline | không | trong thẻ KPI |

Legend nằm trên chart, căn trái, chỉ có màu ↔ tên nhóm. Bấm lát donut hoặc thanh bar = lọc theo nhóm đó (bấm lại để bỏ).

Ô nhiệt pha 5% → 29% mực; chi phí đơn vị pha bằng `--bad`. Pha mạnh hơn thì ô cao nhất lại khó đọc nhất.

## 4 · Điều khiển

| Component | Class | Quy tắc |
|---|---|---|
| Segmented control | `.seg` | Ngày/Tuần/Tháng ở card có trục thời gian; "chỉ số đang chọn / Số booking" ở 3 chart xu hướng (dùng chung cho cả 3 trang, mặc định Số booking); mặc định kỳ là Ngày; 4 chỉ số trong drawer |
| Nút header | `.ibtn` · `.ibtn.pri` | chỉ "Bộ lọc" mang `.pri` |
| Nút trong drawer / bảng xuất | `.dbtn.ghost` · `.dbtn.pri` | nút chính tô mực, không tô brand |
| Checkbox | `.cbx` + `.box` | tick tô mực: chọn/không chọn không phải tốt/xấu |
| Radio | `.rad` | phạm vi dòng trong bảng xuất |
| Công tắc | `.sw` | không dùng: chưa có ngưỡng lỗ |
| Ô ngày | `.dates` | hai ô có `min`/`max` giao nhau |
| Chip | `.chip` | bộ lọc đang áp trên thanh chào, bấm × để bỏ |
| Popover | `.pop` | cảnh báo (header), tài khoản (sidebar) |
| Badge | `.bdg` | số nhóm trên nav; số cảnh báo tô `--warn` |

## 5 · Drawer bộ lọc

Chứa: 4 lựa chọn chỉ số (Doanh thu booking · Số booking · Room night · Giá phòng TB / đêm (ADR), mặc định **Doanh thu booking**) · khoảng thời gian (7 ngày · 30 ngày · 3 tháng · toàn bộ · tuỳ chọn) · kênh OTA (checkbox, kèm số dòng) · trạng thái (danh sách thả) · loại phòng (danh sách cuộn) · `Xoá hết` · `Áp dụng`.

Mọi thay đổi trong drawer là nháp, chỉ áp dụng khi bấm `Áp dụng`. Mặc định mở ra là 30 ngày cuối **của dữ liệu**, không tính từ hôm nay.

## 6 · Bảng xuất dữ liệu — hai bước

1. Bấm "Xuất dữ liệu" mở bảng chọn: phạm vi dòng (theo bộ lọc dashboard / toàn bộ / tuỳ chỉnh, kèm số dòng) · khoảng ngày · kênh OTA · cột xuất (chọn/bỏ tất cả) · định dạng CSV dấu phẩy hoặc dấu chấm phẩy (mặc định **;**).
2. Xem trước "Sẽ xuất n dòng × m cột", rồi mới có nút `Tải xuống`.

"Theo bộ lọc dashboard" trả về đúng tập dòng đang hiển thị. Sửa trong bảng xuất không đụng bộ lọc dashboard. File UTF-8 có BOM để Excel đọc đúng tiếng Việt. Chỉ xuất dữ liệu: không PNG, không PDF.

## 7 · Cảnh báo

Chuông trên header đếm số loại phòng vượt ngưỡng trong kỳ đang xem. Bấm một dòng = lọc đúng các loại phòng đó và mở trang "Theo loại phòng".

Chưa có ngưỡng nào sinh cảnh báo.

## 8 · Bốn trạng thái runtime

| Trạng thái | Hiển thị |
|---|---|
| Đang tải | vòng quay trong card |
| Lỗi | thông báo lỗi + gợi ý cách sửa + nút **Thử lại** |
| Có dữ liệu | 5 KPI + 4 chart |
| Không dòng nào khớp bộ lọc | thông báo + gợi ý nới khoảng ngày hoặc "Xoá tất cả" |

## 9 · Icon

33 icon Lucide nhúng sẵn trong `lib/icons.ts`, không cài gì thêm, không vẽ path theo trí nhớ, không emoji. Icon riêng của dashboard này: KPI Doanh thu booking → `coins` · KPI Số booking → `circle-check` · KPI Booking huỷ → `x` · KPI Room night → `clock` · KPI Giá phòng TB / đêm (ADR) → `gauge` · trang kênh OTA → `chart-pie` · trang loại phòng → `layout-dashboard`.

## Giả định cần bạn xác nhận

- **G30 · Vừa** — Cảnh báo xét theo room_type_name; bấm vào thì lọc đúng các nhóm đó và mở trang của dimension đó.  
  Vì: Trang 3 là nơi người dùng ra tay trên từng nhóm.  
  Nếu sai: dashboard.json › alerts.dim.
- **G31 · Vừa** — Xuất CSV mặc định dấu chấm phẩy.  
  Vì: Excel bản Việt đọc dấu phẩy thành một cột duy nhất.  
  Nếu sai: dashboard.json › export.separator.
