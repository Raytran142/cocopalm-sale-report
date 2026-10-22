# Nhiều property (chọn khách sạn)

> Viết tay, **không** do `dashboard-design` sinh ra. Bốn tài liệu do skill sinh mô tả dashboard cho một tab; file này mô tả phần chọn property thêm vào sau.

## 1. Mục đích

Mỗi khách sạn (CocoPalm, Jade, JM Beach, Aqua Vista…) cập nhật số liệu vào một tab riêng của cùng Google Sheet. Dashboard có nút chọn property; chọn property nào thì toàn bộ dashboard chạy số liệu của tab đó.

## 2. Quy tắc

| Mục | Quy tắc |
|---|---|
| Property là gì | Mọi tab có hàng tiêu đề chứa **đủ bộ cột** dashboard cần (kể cả `unique_id` và `status` mà các cột suy ra dùng). Tab thiếu cột (vd. "tổng quan") bị bỏ qua |
| Tên property | Chính là tên tab. Đổi tên tab = đổi tên property |
| Thêm property | Thêm một tab mới cùng bộ cột → bấm Tải lại hoặc mở lại dashboard là có trong danh sách. Không sửa cấu hình |
| Thứ tự trong danh sách | Thứ tự tab trong Google Sheet |
| Property mặc định | Property đã xem lần trước (nhớ trong trình duyệt); không có thì `source.sheet` nếu còn là property, không thì tab đầu tiên |
| Xem gộp | Không có. Mỗi lần xem một property |
| Tên dashboard | `app.nameTemplate` = `"{property} Sale Dashboard"`, hiện ở sidebar và tiêu đề tab trình duyệt. Trang đăng nhập dùng `app.name` = "Sale Dashboard" |
| Mục tiêu ADR | Tính lại cho **từng property**: phân vị 75 của ADR theo từng booking (gộp các dòng phòng cùng unique_id, bỏ booking có room night = 0), làm tròn lên 2 chữ số có nghĩa. Muốn chốt số riêng: `thresholds[adr_target].byProperty: { "Jade": 1200000 }` — con số chốt thắng con số tự tính |
| Đổi property | Tải dữ liệu mới, đặt lại bộ lọc (khoảng ngày, kênh, loại phòng, trạng thái) và tháng đang chọn ở trang "Theo thời gian", vì nhóm và khoảng ngày của mỗi property khác nhau |
| Xuất CSV | Tên file theo property: `jm-beach-sale-dashboard_<từ>_<đến>.csv` |

Giá trị tự tính (2026-10-22, ADR = booking_total / room_night): CocoPalm 970.000 · Jade 930.000 · JM Beach 1.100.000.

## 3. Giao diện

Nút chọn property nằm ngay dưới tên dashboard ở sidebar: nhãn "Property" + tên property đang xem + mũi tên. Bấm mở menu liệt kê mọi property, dấu tích ở property đang xem. Chỉ có một property thì nút không bấm được. Sidebar thu gọn chỉ còn icon, menu vẫn mở được.

## 4. Mã nguồn

| File | Vai trò |
|---|---|
| `app/lib/data-source.ts` | `listProperties()` đọc danh sách tab + hàng tiêu đề (1 lần gọi batchGet), lọc tab đủ cột; `loadData(property)` đọc tab được chọn |
| `app/app/api/data/route.ts` | `GET /api/data?property=<tên tab>`; `meta.property`, `meta.properties`, `meta.targets` |
| `app/lib/aggregate.ts` | `thresholdTargets()` tính ngưỡng p75 / p25 / median×1,25 theo dữ liệu của property |
| `app/lib/config.ts` | `appName()`, `applyTargets()` nạp ngưỡng của property vào cấu hình |
| `app/app/dashboard/page.tsx` | State property, nhớ property, đổi property |
| `app/components/Sidebar.tsx` · `app/app/globals.css` (`.propsw`, `.pop.prop`) | Nút và menu chọn property |
| `app/components/ExportModal.tsx` | Tên file CSV theo property |

## 5. Lưu ý dữ liệu

- Tab của property mới phải dùng đúng tên cột như tab CocoPalm; đổi tên một cột là tab biến khỏi danh sách.
- Cùng một kênh có thể viết khác nhau giữa các tab (vd. JM Beach có cả `Expedia` và `A-Expedia`); dashboard coi là hai kênh khác nhau.
- Tab CocoPalm trước đây tên `Sale2`, đã đổi thành `CocoPalm` (2026-10-21). Trình duyệt còn nhớ "Sale2" sẽ tự về property mặc định `source.sheet` = CocoPalm.
