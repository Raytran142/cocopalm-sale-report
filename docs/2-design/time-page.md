# Trang "Theo thời gian"

> Viết tay, **không** do `dashboard-design` sinh ra. Bốn tài liệu còn lại (`specification.md`, `design.md`, `layout.md`, `components.md`) render từ `docs/1-spec/dashboard.json` và chỉ mô tả 4 trang chuẩn; trang này nằm ngoài khuôn đó nên được ghi riêng ở đây. Sửa file này trực tiếp được, render lại không ảnh hưởng.

## 1. Mục đích

Thấy doanh thu thay đổi qua các tháng và so sánh với tháng trước (MoM) và cùng kỳ năm trước (YoY). Câu hỏi trang trả lời:

- Tháng này doanh thu tăng hay giảm so với tháng trước, so với cùng tháng năm trước?
- Kênh OTA nào kéo tăng / kéo giảm so với tháng trước?
- Cơ cấu doanh thu theo kênh thay đổi thế nào qua các tháng?

## 2. Dữ liệu và quy tắc tính

| Mục | Quy tắc |
|---|---|
| Mốc tháng | Ngày đặt (`created_date`), giống cả dashboard |
| Phạm vi tháng | Liên tục từ tháng đầu đến tháng cuối của dữ liệu gốc; tháng không có dòng nào vẫn hiện (giá trị 0, bảng ghi "—") |
| Bộ lọc | **Bỏ qua** khoảng ngày (7/30/90 ngày không đủ để so tháng). **Giữ** bộ lọc kênh OTA, loại phòng, trạng thái |
| MoM | (tháng này − tháng trước) / tháng trước |
| YoY | (tháng này − cùng tháng năm trước) / cùng tháng năm trước |
| Không có kỳ so sánh | Hiện "—" / "chưa có dữ liệu", không hiện 0% hay +∞ |
| Tháng chưa trọn | Tháng cuối của dữ liệu, nếu chưa tới ngày cuối tháng, đánh dấu `*`. MoM và YoY so với **cùng số ngày** (ngày 1..N) của tháng so sánh, ví dụ T10/26 (tới ngày 19) so với 1–19/10/25 |
| Tháng mặc định | Tháng trọn gần nhất |
| Tỷ lệ (ADR) | SUM(room_total) / SUM(room_night) của tháng, bỏ booking huỷ, như luật chung của app |

Giới hạn hiện tại: dữ liệu bắt đầu từ 10/2025 nên YoY chỉ có cho tháng 10/2026. Các tháng khác tự có YoY khi dữ liệu đủ 13 tháng.

## 3. Bố cục

Giữ khung chung của app (canvas 1600×900, Row 2 chia 30/70, Row 3 chia 40/60). Băng KPI chuẩn được thay bằng băng KPI của tháng đang chọn.

| Vị trí | Thành phần |
|---|---|
| Băng KPI | 5 KPI (Doanh thu booking, Doanh thu phòng, Room night, Số booking, ADR) của tháng đang chọn |
| Row 2 · trái 30% | Kênh OTA kéo tăng / giảm |
| Row 2 · phải 70% | Doanh thu theo tháng + cùng kỳ năm trước |
| Row 3 · trái 40% | Doanh thu tháng theo kênh OTA (cột chồng) |
| Row 3 · phải 60% | Bảng theo tháng |

Thanh chào ghi: số tháng, khoảng tháng, tháng đang xem, và nhắc "trang này không áp khoảng ngày của bộ lọc".

## 4. Thành phần

**KPI tháng.** Số lớn = giá trị tháng đang chọn; chip = % MoM (xanh/đỏ theo chiều tốt của chỉ số). Sparkline = giá trị từng tháng, đường chuẩn = trung bình các tháng. Dòng chân: `YoY ±x% · <kỳ so sánh>: <giá trị>` hoặc `YoY: chưa có dữ liệu T../..`.

**Kênh OTA kéo tăng / giảm.** Thanh phân kỳ quanh trục 0: chênh lệch doanh thu của từng kênh giữa tháng đang chọn và tháng trước. Tăng sang phải (`--ok`), giảm sang trái (`--bad`), xếp từ tăng nhiều nhất xuống giảm nhiều nhất. Không có tháng trước thì ghi "Chưa có tháng trước để so".

**Doanh thu theo tháng.** Mỗi tháng một cột; tháng đang chọn `--focus`, tháng khác `--series-4`, tháng chưa trọn vẽ nhạt. Vạch ngang `--ink` trên cột = giá trị cùng kỳ năm trước (chỉ có khi có dữ liệu). Tooltip: giá trị, MoM, cùng kỳ năm trước kèm % YoY.

**Doanh thu tháng theo kênh OTA.** Cột chồng theo kênh, thứ tự màu theo tổng doanh thu toàn kỳ của kênh; tháng không chọn làm nhạt. Tooltip: tổng tháng và từng kênh.

**Bảng theo tháng.** Tháng mới nhất trên cùng. Cột: Tháng · chỉ số đang chọn · Room night · ADR · MoM · YoY (MoM/YoY tính trên chỉ số đang chọn, tô xanh/đỏ). Dòng tháng đang chọn tô nền.

Chỉ số của chart và bảng lấy theo lựa chọn chỉ số trong drawer bộ lọc (mặc định Doanh thu booking). Cột chồng và chênh lệch theo kênh chỉ dùng chỉ số cộng được; chọn ADR thì hai chart này dùng Doanh thu booking.

## 5. Tương tác

- Bấm một cột (chart tháng hoặc cột chồng) hoặc một dòng bảng → chọn tháng đó cho cả trang.
- Đổi bộ lọc kênh / loại phòng / trạng thái → mọi số liệu tính lại; tháng đang chọn giữ nguyên nếu còn trong dữ liệu.

## 6. Mã nguồn

| File | Vai trò |
|---|---|
| `app/lib/monthly.ts` | Gom theo tháng, tháng chưa trọn, MoM/YoY, chênh lệch theo kênh |
| `app/components/pages/TimePage.tsx` | Băng KPI tháng, 4 card, bảng tháng |
| `app/components/charts/MonthBars.tsx` | Chart cột tháng, cột chồng, thanh phân kỳ |
| `app/app/dashboard/page.tsx` | State tháng đang chọn, nối trang |
| `app/components/Sidebar.tsx` · `app/lib/types.ts` · `app/lib/aggregate.ts` | Mục menu, `PageId 'time'`, `applyDims` |

Lưu ý: chạy lại scaffold của `dashboard-build` có thể ghi đè các file khung ở hai dòng cuối bảng trên. Kiểm `git diff` sau mỗi lần scaffold.
