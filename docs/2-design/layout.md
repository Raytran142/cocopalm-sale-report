# CocoPalm Sale Dashboard — Bố cục

> Sinh tự động từ `docs/1-spec/dashboard.json` lúc 2026-10-20 09:30 (giờ Việt Nam). Muốn đổi điều gì, nói với Claude — Claude sửa JSON rồi chạy lại render. Không sửa tay file này: lần render sau sẽ dừng lại và báo.

Mọi số đo ở đây là hợp đồng bố cục đã chạy thật, nằm trong `lib/tokens.ts` và `app/globals.css` của skill `dashboard-build`. Không có số nào phải tự nghĩ.

## 1 · Canvas cố định 1600×900

Toàn bộ dashboard vẽ trên khung 1600×900 px, rồi thu vừa cửa sổ: `scale = min(rộng cửa sổ / 1600, cao cửa sổ / 900)`. Không bao giờ phải cuộn trang, và mọi máy ra cùng một bố cục. Bảng và danh sách dài cuộn **bên trong khối của nó**.

Không `ResponsiveContainer`, không đọc `clientWidth`, không `ResizeObserver`: mọi chart nhận bề rộng và chiều cao là số px cứng.

Khung app là tấm bo góc nổi trên mặt bàn `--page`, có lề ở cả bốn phía (sinh bằng `scale: .94` trên `#viewport`).

## 2 · Kiểm tổng chiều cao — phải đúng 900

```
46  header
20  body padding trên
52  thanh chào
14  khe
118 băng KPI
14  khe
301 hàng 2
14  khe
301 hàng 3
20  body padding dưới
───
900
```

Hàng 2 và hàng 3 cao bằng nhau (301) nên cả bốn chart có cùng chiều cao vẽ: 301 − 2×14 − 43 = **230**.

## 3 · Kiểm tổng bề rộng — phải đúng 1600

```
206  sidebar
1    hairline
24   body padding trái
1345 vùng nội dung
24   body padding phải
───
1600
```

## 4 · Kích thước suy ra — cả hai trạng thái sidebar

Mọi kích thước tính từ một biến duy nhất: bề rộng sidebar.

| | Sidebar mở (206) | Sidebar thu gọn (58) |
|---|---|---|
| Vùng nội dung | 1345 | 1493 |
| Hàng 2 · trái 30% / phải 70% | 399 / 932 | 443 / 1036 |
| Hàng 3 · trái 40% / phải 60% | 532 / 799 | 591 / 888 |
| Thẻ KPI | 259 | 289 |
| **Chiều cao vẽ cả 4 chart** | **230** | **230** |

Card có legend trừ thêm chiều cao legend trước khi vẽ: donut −44 (legend 2 hàng), line nhiều đường −24 (1 hàng). Bar, area một chuỗi, bảng, sparkline: không legend.

## 5 · Bố cục bốn trang

### Trang 1 · Tổng quan

| Vị trí | Chart | Vùng vẽ (sidebar mở) | Legend |
|---|---|---|---|
| Hàng 2 · 30% | Donut tỷ trọng theo kênh OTA · bấm để lọc | 371 × 186 | 2 hàng |
| Hàng 2 · 70% | Area xu hướng chỉ số đang chọn · Ngày/Tuần/Tháng | 904 × 230 | không |
| Hàng 3 · 40% | Bar top 7 loại phòng · bấm để lọc chéo | 504 × 230 | không |
| Hàng 3 · 60% | Bảng theo kỳ tô nhiệt: Doanh thu booking, Doanh thu phòng, Room night, Số phòng, Giá phòng TB / đêm (ADR) | 771 × 230 | không |

### Trang 2 · Theo kênh OTA

| Vị trí | Chart | Vùng vẽ (sidebar mở) | Legend |
|---|---|---|---|
| Hàng 2 · 30% | Bar xếp hạng kênh OTA (tối đa 7) | 371 × 230 | không |
| Hàng 2 · 70% | Line top 5 kênh OTA qua thời gian · Ngày/Tuần/Tháng | 904 × 206 | 1 hàng |
| Hàng 3 · 40% | Donut tỷ trọng doanh thu booking (khi chỉ số đang chọn là tỷ lệ) | 504 × 186 | 2 hàng |
| Hàng 3 · 60% | Bảng chỉ số đầy đủ: Doanh thu booking, Doanh thu phòng, Room night, Số phòng, Giá phòng TB / đêm (ADR) | 771 × 230 | không |

### Trang 3 · Theo loại phòng

| Vị trí | Chart | Vùng vẽ (sidebar mở) | Legend |
|---|---|---|---|
| Hàng 2 · 30% | Bar xếp hạng loại phòng (tối đa 7) | 371 × 230 | không |
| Hàng 2 · 70% | Line top 5 loại phòng qua thời gian · Ngày/Tuần/Tháng | 904 × 206 | 1 hàng |
| Hàng 3 · 40% | Donut tỷ trọng doanh thu booking (khi chỉ số đang chọn là tỷ lệ) | 504 × 186 | 2 hàng |
| Hàng 3 · 60% | Bảng chỉ số đầy đủ: Doanh thu booking, Doanh thu phòng, Room night, Số phòng, Giá phòng TB / đêm (ADR) | 771 × 230 | không |

### Trang 4 · Nguồn dữ liệu

| Vị trí | Nội dung |
|---|---|
| Hàng 2 · 30% | Kết nối: nguồn, tab, số dòng, khoảng ngày, quyền |
| Hàng 2 · 70% | Schema và vai trò từng cột, kèm ví dụ |
| Hàng 3 · 40% | Biến môi trường: chỉ tên và có/thiếu, không bao giờ hiện giá trị |
| Hàng 3 · 60% | Chất lượng dữ liệu: dòng trống, ngày lỗi, ô số lỗi, số âm, trùng khoá, ngày trống, thuộc tính đổi giá trị |

Trang 4 không có băng KPI: hai hàng còn lại giãn ra lấp 132px ở đáy (`#body.nokpi`). Chỉ trang này bỏ px cứng.

## 6 · Sidebar

| Trạng thái | Bề rộng | Hiện gì |
|---|---|---|
| Mở (mặc định) | 206px | icon + nhãn, nhóm "Phân tích" và "Hệ thống" |
| Thu gọn | 58px | chỉ icon, nhãn thành tooltip |

Ngăn với vùng nội dung bằng 1px hairline `--line`, không bằng bóng. Đáy sidebar: số dòng đang xem trên tổng số dòng, nút "Xem nguồn dữ liệu", hàng tài khoản (đổi sáng/tối, đặt lại bộ lọc).

## 7 · Drawer bộ lọc

Trượt từ phải, nền sau tối đi, ẩn hoàn toàn khi đóng. Thứ tự từ trên xuống:

1. Chỉ số theo dõi — 4 lựa chọn: Doanh thu booking · Doanh thu phòng · Room night · Giá phòng TB / đêm (ADR)
2. Khoảng thời gian — 7 ngày · 30 ngày · 3 tháng · Toàn bộ · Tuỳ chọn, và hai ô ngày
3. Kênh OTA — checkbox, kèm số dòng mỗi nhóm
4. Trạng thái — danh sách thả
5. Loại phòng — checkbox, cuộn trong khối
6. Chân: Xoá hết · Áp dụng

Hai ô ngày đặt `min`/`max` giao nhau để trình duyệt tự chặn khoảng ngược. Danh sách dài cuộn trong khối cao 140px = đúng 5 hàng 28px.

## 8 · Ba cạm bẫy padding

1. **Padding card do JS quyết định.** Bề rộng vẽ = bề rộng card − 2 × 14. Đặt `.card { padding: 16px }` cho "đẹp" là `overflow: hidden` xén mép phải cả 4 chart.
2. **`.card.kpi` phải đứng sau `.card`** trong CSS. Đảo thứ tự là thẻ KPI phình khỏi băng 118px và mất hàng chân.
3. **Drawer đóng phải ẩn hẳn** (`visibility: hidden`), không chỉ đẩy bằng `transform`: nếu không nó vẫn lòi ra mép phải và vẫn bắt phím Tab.

## Giả định cần bạn xác nhận

- **G29 · Thấp** — Sidebar mặc định mở (206px).  
  Vì: Nhãn đầy đủ giúp người mới định hướng; thu gọn là lựa chọn của người dùng.  
  Nếu sai: Không cần sửa tài liệu; bấm nút thu gọn trên sidebar.
