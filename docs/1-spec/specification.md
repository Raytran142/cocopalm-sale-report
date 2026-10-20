# CocoPalm Sale Dashboard — Đặc tả

> Sinh tự động từ `docs/1-spec/dashboard.json` lúc 2026-10-20 09:30 (giờ Việt Nam). Muốn đổi điều gì, nói với Claude — Claude sửa JSON rồi chạy lại render. Không sửa tay file này: lần render sau sẽ dừng lại và báo.

Domain: chung · Nguồn: Google Sheets "Sale report CocoPalm", tab `Sale2` · Ngày lập: 2026-10-20

## 1 · Mục tiêu

> Dashboard này giúp người phụ trách bán phòng thấy doanh thu booking, room night và giá phòng trung bình theo kênh OTA và loại phòng mỗi ngày, để quyết định kênh và loại phòng nào cần đẩy bán hoặc điều chỉnh giá.

## 2 · Người dùng

| Nhóm | Mở lúc nào | Quyết định việc gì |
|---|---|---|
| Người phụ trách bán phòng | Đầu tuần và khi cần điều chỉnh giá hoặc phân bổ phòng cho kênh | Kênh OTA và loại phòng nào cần ưu tiên, giá phòng có cần điều chỉnh |

## 3 · Câu hỏi dashboard phải trả lời

1. Kênh OTA nào mang về nhiều doanh thu booking nhất trong 30 ngày gần nhất?
2. Doanh thu booking và room night đang đi lên hay đi xuống so với 30 ngày trước đó?
3. Loại phòng nào có giá phòng trung bình / đêm (ADR) dưới mục tiêu?

## 4 · Bốn trang

| # | Trang | Trả lời câu hỏi gì | Băng KPI |
|---|---|---|---|
| 1 | Tổng quan | Các chỉ số đang đi về đâu, kênh OTA nào chiếm phần lớn doanh thu booking, loại phòng nào dẫn đầu | có |
| 2 | Theo kênh OTA | Kênh OTA nào tốt nhất, kém nhất theo chỉ số đang chọn; xu hướng của top 5 | có |
| 3 | Theo loại phòng | Loại phòng nào tốt nhất, kém nhất; bảng đủ chỉ số để so | có |
| 4 | Nguồn dữ liệu | Dữ liệu lấy từ đâu, có đủ và đúng kiểu không | **không** |

Cấu trúc bốn trang là cố định. Chỉ dimension của trang 2 và trang 3 là quyết định.

## 5 · Năm thẻ KPI

| # | Nhãn | Công thức | Chiều tốt | Đường chuẩn sparkline | Tô màu |
|---|---|---|---|---|---|
| 1 | Doanh thu booking | `SUM(booking_total)` | cao hơn tốt hơn | trung bình kỳ | không |
| 2 | Doanh thu phòng | `SUM(room_total)` | cao hơn tốt hơn | trung bình kỳ | không |
| 3 | Room night | `SUM(room_night)` | cao hơn tốt hơn | trung bình kỳ | không |
| 4 | Số phòng | `SUM(room_amount)` | cao hơn tốt hơn | trung bình kỳ | không |
| 5 | Giá phòng TB / đêm (ADR) | `SUM(room_total) / SUM(room_night)` | cao hơn tốt hơn | mục tiêu 970.000 | có |

1. **Đường chuẩn là bắt buộc.** Sparkline không có mốc chỉ cho thấy hình dáng, không cho biết đang trên hay dưới ngưỡng.
2. **Chỉ KPI có ngưỡng mới được tô màu.** Còn lại giữ mực.
3. **Chỉ số nghịch** (thấp hơn tốt hơn): tăng là xấu, mũi tên so kỳ trước đảo màu.

## 6 · Chức năng chính

| Chức năng | Mô tả |
|---|---|
| Drawer bộ lọc | 4 lựa chọn chỉ số: Doanh thu booking · Doanh thu phòng · Room night · Giá phòng TB / đêm (ADR) (mặc định **Doanh thu booking**) · khoảng ngày · kênh OTA · trạng thái · loại phòng. Sửa là nháp, bấm Áp dụng mới chạy |
| Khoảng ngày mặc định | 30 ngày cuối của dữ liệu (2026-09-17 → 2026-10-16), không tính từ hôm nay |
| Cảnh báo |  — bấm vào thì lọc đúng các loại phòng đó và mở trang của chúng |
| Xuất dữ liệu hai bước | mở bảng chọn → xem trước số dòng → tải CSV (mặc định dấu `;`). Không PNG/PDF |
| Thanh chào | lời chào và ngày giờ theo **UTC+7**, không theo giờ máy |
| Sáng / tối | chuyển ở hàng tài khoản cuối sidebar; cả hai chế độ đều phải kiểm |

## 7 · Dữ liệu và vai trò từng cột

Nguồn: Google Sheets "Sale report CocoPalm", tab `Sale2` · 2.268 dòng · 2025-10-01 → 2026-10-16 (381 ngày) · Hạt dữ liệu: 1 ngày × một tổ hợp số khách × kênh OTA × trạng thái × loại phòng

| # | Cột | Nhãn | Kiểu | Vai trò | Ví dụ |
|---|---|---|---|---|---|
| 1 | `status` | Trạng thái | text | `SECONDARY_DIM` | new |
| 2 | `unique_id` | Mã booking | text | `IGNORE` | — |
| 3 | `room_type_name` | Loại phòng | text | `SECONDARY_DIM` | Deluxe King |
| 4 | `rate_plan_name` | Rate plan | text | `IGNORE` | — |
| 5 | `checkin_date` | Ngày check-in | date | `IGNORE` | — |
| 6 | `checkout_date` | Ngày check-out | date | `IGNORE` | — |
| 7 | `customer_first_name` | Customer first name | text | `IGNORE` | — |
| 8 | `customer_last_name` | Customer last name | text | `IGNORE` | — |
| 9 | `room_amount` | Số phòng | number | `METRIC` | 1 |
| 10 | `ota_source` | Kênh OTA | text | `PRIMARY_DIM` | BookingCom |
| 11 | `ota_res_id` | Ota res id | text | `IGNORE` | — |
| 12 | `occupancy` | Số khách | text | `SECONDARY_DIM` | A:2 C:0 I:0 |
| 13 | `customer_email` | Customer email | text | `IGNORE` | — |
| 14 | `customer_telephone` | Customer telephone | text | `IGNORE` | — |
| 15 | `room_total` | Doanh thu phòng | number | `METRIC` | 558.000 |
| 16 | `booking_total` | Doanh thu booking | number | `METRIC` | 558.000 |
| 17 | `currency` | Currency | text | `IGNORE` | — |
| 18 | `payment_type` | Payment type | text | `IGNORE` | — |
| 19 | `payment_method` | Payment method | text | `IGNORE` | — |
| 20 | `created_date` | Ngày đặt | date | `DATE` | 2025-10-01 |
| 21 | `last_modified_date` | Last modified date | text | `IGNORE` | — |
| 22 | `cancelled_date` | Cancelled date | text | `IGNORE` | — |
| 23 | `room_night` | Room night | number | `METRIC` | 1 |
| 24 | `Listing Airbnb` | Listing Airbnb | text | `IGNORE` | — |

### Cột ATTRIBUTE — không được SUM

Không có.

## 8 · Chỉ số phái sinh

Tỷ lệ luôn tính lại từ tổng: `SUM(tử) / SUM(mẫu)`. Lấy trung bình tỷ lệ từng dòng là lỗi im lặng — không báo gì, chỉ ra một con số sai trông rất bình thường. Cột cuối là con số sai đó trên chính dữ liệu này:

| Chỉ số | Công thức đúng | Đúng (toàn kỳ) | Sai: trung bình từng dòng |
|---|---|---|---|
| Giá phòng TB / đêm (ADR) | `SUM(room_total) / SUM(room_night)` | 828.315 | 808.645 |

## 9 · Ngưỡng nghiệp vụ

```
ADR mục tiêu           Giá phòng TB / đêm (ADR) ≥ 970.000
```

| Ngưỡng | Loại | Giá trị | Nguồn | Dùng ở đâu |
|---|---|---|---|---|
| ADR mục tiêu | Mục tiêu | Giá phòng TB / đêm (ADR) ≥ 970.000 | suy từ dữ liệu: phân vị 75 theo từng dòng = 966.144, làm tròn lên | KPI Giá phòng TB / đêm (ADR): xanh/đỏ + đường chuẩn sparkline |

Ngưỡng suy từ dữ liệu mô tả hiện trạng, không phải mong muốn: một đội đang chạy kém thì phân vị của họ vẫn là con số kém. Xem giả định Cao bên dưới.

Mới có 1/4 ngưỡng. KPI không có ngưỡng thì giữ mực và lấy trung bình kỳ làm đường chuẩn.

## 10 · Phạm vi phiên bản đầu

| Có trong v1 | Để lại sau |
|---|---|
| 4 trang · 5 KPI · 4 chart mỗi trang · lọc · xuất CSV · cảnh báo · sáng/tối | Đăng nhập bằng Google và giới hạn người được xem.; Đưa lên Internet để cả đội mở bằng trình duyệt.; Khử trùng lặp theo unique_id (giữ bản ghi mới nhất) trước khi cộng số liệu. |

Không có trong v1: trang phân tích sâu (phễu, cohort, ma trận thời gian) · chatbox AI · ô tìm kiếm toàn cục · xuất PNG/PDF.

## 11 · Số liệu tham chiếu để tự kiểm

Sau khi build, dashboard phải hiện đúng các số này. Lệch là sai ở khâu đọc hoặc tổng hợp dữ liệu, không phải ở chart. Skill `dashboard-build` tự đối chiếu bằng `check.mjs`.

| Hạng mục | Kỳ mặc định | Toàn bộ thời gian |
|---|---|---|
| Khoảng ngày | 2026-09-17 → 2026-10-16 | 2025-10-01 → 2026-10-16 |
| Số dòng | 143 | 2.268 |
| Doanh thu booking | 652.541.211 | 7.658.471.037 |
| Doanh thu phòng | 428.219.727 | 6.169.293.833 |
| Room night | 483 | 7.448 |
| Số phòng | 215 | 3.206 |
| Giá phòng TB / đêm (ADR) | 886.583 | 828.315 |

Số nhóm: Kênh OTA 5 · Loại phòng 3.

## 12 · Ghi chú nghiệp vụ

- Ngày trên dashboard là ngày đặt (created_date), không phải ngày check-in.
- Tổng mặc định gồm cả booking trạng thái cancelled và modified; dùng bộ lọc Trạng thái để chỉ xem booking new.
- Sheet có 2.268 dòng nhưng chỉ 1.938 mã booking (unique_id): một booking có thể xuất hiện nhiều dòng (bản new / modified / cancelled), cộng dồn có thể bị tính trùng.

## 13 · Dashboard này KHÔNG trả lời được gì

- Công suất phòng (occupancy rate) và RevPAR: dữ liệu không có tổng số phòng sẵn có mỗi đêm.
- Vì sao booking bị huỷ? Dữ liệu chỉ ghi trạng thái, không có lý do huỷ.
- Kỳ tới sẽ ra sao? Dashboard mô tả cái đã xảy ra, không dự báo.

Dashboard theo dõi cho biết *cái gì đang xảy ra*, không cho biết *vì sao*.

## Giả định cần bạn xác nhận

- **G1 · Cao** — Không khớp playbook nào: chỉ số, KPI và phần chữ của spec là bản chung, lấy theo cột thật.  
  Vì: Không đủ cột nhận diện của playbook nào.  
  Nếu sai: dashboard.json › app.domain và các mục lấy từ playbook (metrics, kpis, thresholds), rồi chạy lại render.
- **G2 · Cao** — PRIMARY_DIM = ota_source (5 giá trị); trang 3 theo room_type_name (3); status (3) làm bộ lọc phụ.  
  Vì: Trục chính cần 3–8 nhóm để donut đọc được. Cột chữ khác: status (3), room_type_name (3), occupancy (12).  
  Nếu sai: dashboard.json › pages.primary / pages.secondary và columns[].role, rồi chạy lại render.
- **G3 · Vừa** — Bỏ qua cột unique_id.  
  Vì: Quá nhiều hoặc quá ít giá trị khác nhau để làm nhóm (giống mã hoặc mô tả).  
  Nếu sai: dashboard.json › columns[unique_id].role.
- **G4 · Vừa** — Bỏ qua cột rate_plan_name.  
  Vì: Quá nhiều hoặc quá ít giá trị khác nhau để làm nhóm (giống mã hoặc mô tả).  
  Nếu sai: dashboard.json › columns[rate_plan_name].role.
- **G5 · Vừa** — Bỏ qua cột checkin_date.  
  Vì: Đã có cột ngày chính; cột ngày thứ hai thường là thời điểm ghi nhận.  
  Nếu sai: dashboard.json › columns[checkin_date].role.
- **G6 · Vừa** — Bỏ qua cột checkout_date.  
  Vì: Đã có cột ngày chính; cột ngày thứ hai thường là thời điểm ghi nhận.  
  Nếu sai: dashboard.json › columns[checkout_date].role.
- **G7 · Vừa** — Bỏ qua cột customer_first_name.  
  Vì: Quá nhiều hoặc quá ít giá trị khác nhau để làm nhóm (giống mã hoặc mô tả).  
  Nếu sai: dashboard.json › columns[customer_first_name].role.
- **G8 · Vừa** — Bỏ qua cột customer_last_name.  
  Vì: Quá nhiều hoặc quá ít giá trị khác nhau để làm nhóm (giống mã hoặc mô tả).  
  Nếu sai: dashboard.json › columns[customer_last_name].role.
- **G9 · Vừa** — Bỏ qua cột ota_res_id.  
  Vì: Quá nhiều hoặc quá ít giá trị khác nhau để làm nhóm (giống mã hoặc mô tả).  
  Nếu sai: dashboard.json › columns[ota_res_id].role.
- **G10 · Vừa** — Bỏ qua cột customer_email.  
  Vì: Quá nhiều hoặc quá ít giá trị khác nhau để làm nhóm (giống mã hoặc mô tả).  
  Nếu sai: dashboard.json › columns[customer_email].role.
- **G11 · Vừa** — Bỏ qua cột customer_telephone.  
  Vì: Quá nhiều hoặc quá ít giá trị khác nhau để làm nhóm (giống mã hoặc mô tả).  
  Nếu sai: dashboard.json › columns[customer_telephone].role.
- **G12 · Vừa** — Bỏ qua cột currency.  
  Vì: Quá nhiều hoặc quá ít giá trị khác nhau để làm nhóm (giống mã hoặc mô tả).  
  Nếu sai: dashboard.json › columns[currency].role.
- **G13 · Vừa** — Bỏ qua cột payment_type.  
  Vì: Quá nhiều hoặc quá ít giá trị khác nhau để làm nhóm (giống mã hoặc mô tả).  
  Nếu sai: dashboard.json › columns[payment_type].role.
- **G14 · Vừa** — Bỏ qua cột payment_method.  
  Vì: Quá nhiều hoặc quá ít giá trị khác nhau để làm nhóm (giống mã hoặc mô tả).  
  Nếu sai: dashboard.json › columns[payment_method].role.
- **G15 · Vừa** — Bỏ qua cột last_modified_date.  
  Vì: Quá nhiều hoặc quá ít giá trị khác nhau để làm nhóm (giống mã hoặc mô tả).  
  Nếu sai: dashboard.json › columns[last_modified_date].role.
- **G16 · Vừa** — Bỏ qua cột cancelled_date.  
  Vì: Quá nhiều hoặc quá ít giá trị khác nhau để làm nhóm (giống mã hoặc mô tả).  
  Nếu sai: dashboard.json › columns[cancelled_date].role.
- **G17 · Vừa** — Bỏ qua cột Listing Airbnb.  
  Vì: Quá nhiều hoặc quá ít giá trị khác nhau để làm nhóm (giống mã hoặc mô tả).  
  Nếu sai: dashboard.json › columns[Listing Airbnb].role.
- **G18 · Cao** — ADR mục tiêu: Giá phòng TB / đêm (ADR) ≥ 970.000.  
  Vì: Suy từ dữ liệu (phân vị 75 theo từng dòng = 966.144, làm tròn lên): mô tả hiện trạng, chưa phải mục tiêu kinh doanh. Giá phòng TB / đêm (ADR) toàn kỳ hiện là 828.315.  
  Nếu sai: dashboard.json › thresholds[adr_target].value.
- **G19 · Cao** — Chỉ có 1/4 ngưỡng.  
  Vì: Thiếu cột để tính các ngưỡng còn lại. KPI không có ngưỡng thì giữ mực, sparkline lấy trung bình kỳ làm đường chuẩn.  
  Nếu sai: dashboard.json › thresholds.
- **G20 · Vừa** — 5 KPI: Doanh thu booking · Doanh thu phòng · Room night · Số phòng · Giá phòng TB / đêm (ADR).  
  Vì: 5 chỉ số có tổng lớn nhất trong dữ liệu.  
  Nếu sai: dashboard.json › kpis.
- **G21 · Vừa** — 4 lựa chọn chỉ số: Doanh thu booking · Doanh thu phòng · Room night · Giá phòng TB / đêm (ADR); mặc định Doanh thu booking.  
  Vì: Mặc định là chỉ số có ngưỡng lỗ: nó trả lời ngay "có gì cần xử lý không".  
  Nếu sai: dashboard.json › params / defaultParam.
- **G22 · Vừa** — Donut vẽ Doanh thu booking khi chỉ số đang chọn là tỷ lệ.  
  Vì: Tỷ trọng của một tỷ lệ là con số vô nghĩa; donut cần chỉ số cộng được.  
  Nếu sai: dashboard.json › donutMetric.
- **G23 · Thấp** — Tên dashboard "CocoPalm Sale Dashboard", lời chào gọi "bạn".  
  Vì: Lấy theo tên spreadsheet; chưa biết tên người xem.  
  Nếu sai: dashboard.json › app.name / app.user.
- **G24 · Cao** — DATE = created_date (ngày đặt, 2025-10-01 → 2026-10-16) thay vì checkin_date (2025-10-03 → 2027-08-20).  
  Vì: Đây là dashboard bán hàng: số bán ghi theo ngày đặt. checkin_date kéo dài 10 tháng vào tương lai và có 214/687 ngày trống, nên cửa sổ 30 ngày gần nhất sẽ gần như rỗng.  
  Nếu sai: dashboard.json › columns (role DATE của created_date / checkin_date)
- **G25 · Cao** — PRIMARY_DIM = ota_source (5 kênh) thay vì status (3 giá trị: new · cancelled · modified); status chuyển thành bộ lọc (pages.filter).  
  Vì: Trục chính cần 3–8 nhóm có ý nghĩa kinh doanh; status là trạng thái bản ghi, không phải trục bán hàng, và cộng tổng theo status trộn booking huỷ với booking thật.  
  Nếu sai: dashboard.json › pages.primary, pages.filter, columns (role)
- **G26 · Cao** — Thêm KPI thứ 5 adr = SUM(room_total) / SUM(room_night), format money; trang 3 theo room_type_name (3 loại phòng); payment_type chuyển IGNORE.  
  Vì: Bản nháp chỉ có 4 METRIC nên thiếu KPI thứ 5; ADR là chỉ số hiệu quả giá chuẩn của khách sạn và dùng được đủ cột. payment_type chỉ có N/A · ota, không phân tích được.  
  Nếu sai: dashboard.json › metrics, kpis, pages.secondary
- **G27 · Cao** — Ngưỡng duy nhất: adr_target = phân vị 75 của ADR (kind target). Không có ngưỡng loss, unit_cost, resource.  
  Vì: Dữ liệu không có cột chi phí, công suất phòng hay chỉ tiêu nên không suy được ngưỡng lỗ / chi phí đơn vị / cạn nguồn lực; các KPI còn lại giữ màu trung tính, sparkline lấy trung bình kỳ làm đường chuẩn.  
  Nếu sai: dashboard.json › thresholds
- **G28 · Cao** — room_amount đổi format money → int, nhãn 'Số phòng'; room_total, booking_total đổi int → money (VND).  
  Vì: room_amount có trung vị 1, max 8 (số phòng mỗi booking); hai cột doanh thu có trung vị 1.916.460 và 2.090.000 VND.  
  Nếu sai: dashboard.json › columns, metrics (format)
