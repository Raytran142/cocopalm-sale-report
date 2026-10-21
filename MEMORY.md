# Quyết định đã chốt

## 2026-10-21 · Thêm trang "Theo thời gian"

- Trang thứ 5 trong nhóm Phân tích, ngoài khuôn 4 trang của dashboard-design → viết tay trong `app/`, không có trong `docs/` (4 tài liệu render từ `dashboard.json` không mô tả trang này).
- Mốc tháng: **ngày đặt** (`created_date`), như cả dashboard. Dữ liệu từ 10/2025 nên YoY hiện chỉ so được tháng 10; các tháng khác tự có YoY khi dữ liệu đủ 13 tháng.
- Nội dung: băng KPI của tháng đang chọn (MoM + YoY) · kênh OTA kéo tăng/giảm so tháng trước · cột doanh thu theo tháng + vạch cùng kỳ năm trước · cột chồng theo kênh · bảng tháng có MoM/YoY.
- Trang bỏ qua khoảng ngày của bộ lọc, giữ bộ lọc kênh / loại phòng / trạng thái.
- Tháng chưa trọn (tháng cuối dữ liệu) so với **cùng số ngày** của tháng trước / năm trước. Tháng mặc định là tháng trọn gần nhất.
- File: `app/lib/monthly.ts`, `app/components/pages/TimePage.tsx`, `app/components/charts/MonthBars.tsx`; nối vào `app/app/dashboard/page.tsx`, `Sidebar.tsx`, `lib/types.ts`, `lib/aggregate.ts` (`applyDims`).
- Chạy lại `dashboard-build` scaffold có thể ghi đè các file khung đã sửa (page.tsx, Sidebar.tsx, types.ts, aggregate.ts) — kiểm diff sau mỗi lần scaffold.
