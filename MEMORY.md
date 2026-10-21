# Quyết định đã chốt

## 2026-10-21 · Thêm trang "Theo thời gian"

- Trang thứ 5 trong nhóm Phân tích, ngoài khuôn 4 trang của dashboard-design → viết tay trong `app/`, không có trong `docs/` (4 tài liệu render từ `dashboard.json` không mô tả trang này).
- Mốc tháng: **ngày đặt** (`created_date`), như cả dashboard. Dữ liệu từ 10/2025 nên YoY hiện chỉ so được tháng 10; các tháng khác tự có YoY khi dữ liệu đủ 13 tháng.
- Nội dung: băng KPI của tháng đang chọn (MoM + YoY) · kênh OTA kéo tăng/giảm so tháng trước · cột doanh thu theo tháng + vạch cùng kỳ năm trước · cột chồng theo kênh · bảng tháng có MoM/YoY.
- Trang bỏ qua khoảng ngày của bộ lọc, giữ bộ lọc kênh / loại phòng / trạng thái.
- Tháng chưa trọn (tháng cuối dữ liệu) so với **cùng số ngày** của tháng trước / năm trước. Tháng mặc định là tháng trọn gần nhất.
- File: `app/lib/monthly.ts`, `app/components/pages/TimePage.tsx`, `app/components/charts/MonthBars.tsx`; nối vào `app/app/dashboard/page.tsx`, `Sidebar.tsx`, `lib/types.ts`, `lib/aggregate.ts` (`applyDims`).
- Chạy lại `dashboard-build` scaffold có thể ghi đè (áp dụng cả cho mục dưới) các file khung đã sửa (page.tsx, Sidebar.tsx, types.ts, aggregate.ts) — kiểm diff sau mỗi lần scaffold.

## 2026-10-21 · "Số booking" thay "Số phòng"

- Mỗi dòng của tab Sale2 là **một phòng** của booking: booking nhiều phòng có nhiều dòng cùng `unique_id`, cùng status, cùng created_date (2.283 dòng / 1.953 booking).
- "Số booking" = số `unique_id` khác nhau, qua cột suy ra `booking_count` (`countDistinct: "unique_id"` trong dashboard.json; tính ở `app/lib/data-source.ts`). `room_amount` chuyển IGNORE.
- Tài liệu skill sinh (spec/design/layout/components) đã sửa tay vì script render của skill không còn trên máy; ghi là G29.
- `booking_total` lặp nguyên giá trị trên mọi dòng của booking nhiều phòng (222 booking) ⇒ đã sửa: chỉ giữ ở dòng đầu (`onePerEntity: "unique_id"`), tổng 7,72 tỷ → 5,60 tỷ (G30).
- Booking huỷ giữ room_total (556 tr) và room night dù booking_total = 0 ⇒ đã sửa: `zeroWhen: status = cancelled` cho room_total, room_night (G31). Số booking vẫn đếm cả booking huỷ.
