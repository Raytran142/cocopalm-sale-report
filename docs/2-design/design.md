# CocoPalm Sale Dashboard — Thiết kế

> Sinh tự động từ `docs/1-spec/dashboard.json` lúc 2026-10-20 09:30 (giờ Việt Nam). Muốn đổi điều gì, nói với Claude — Claude sửa JSON rồi chạy lại render. Không sửa tay file này: lần render sau sẽ dừng lại và báo.

## 1 · Hướng thị giác

Dashboard theo dõi cho người phụ trách bán phòng: mở ra là thấy ngay có gì vượt ngưỡng, không phải đọc từng con số. Vì vậy giao diện đơn sắc, và màu chỉ xuất hiện khi có một con số so với một ngưỡng.

| Quyết định | Chọn gì | Vì sao |
|---|---|---|
| Tách lớp bằng gì | ba sắc độ nền + một hairline | không kính mờ, không gradient: chữ 10,5px đọc được ở mọi vùng |
| Màu xuất hiện ở đâu | chỉ nơi màu mang nghĩa | chỉ khi so với ngưỡng: Giá phòng TB / đêm (ADR) ≥ 970k |
| Mật độ | canvas 1600×900 cố định, thu vừa màn hình | mọi máy ra cùng một bố cục, không cuộn trang |

## 2 · Design system: Monochrome Blue

Bố cục của hệ Monochrome Near-White, bảng màu của deck tư vấn Buổi 4: xanh dương đơn sắc, sàn xanh rất nhạt, card trắng. Token chép nguyên từ `app/globals.css` của skill `dashboard-build`. Khi tài liệu này và `globals.css` khác nhau, `globals.css` đúng.

Nguyên tắc số một — một mặt phẳng, không vật liệu:

| Lớp | Token | Dùng cho |
|---|---|---|
| Mặt bàn | `--page` | nền ngoài shell — shell **nổi trên** nó |
| Khung app | `--shell` | sidebar + header |
| Sàn nội dung | `--page` | `#body` — card nổi trên sàn này |
| Card | `--card` | card KPI, card chart, bảng |

Hai điều dễ làm sai:

1. **Shell không tràn hết màn hình.** Nó là một tấm bo `--r-shell: 20px` nổi trên `--page`, có `--sh-shell`, thấy bo góc và lề ở cả bốn phía.
2. **`#body` không cùng màu với `--shell`.** Sàn thấp hơn card một bậc, nếu không card trắng trên nền trắng sẽ mất mép.

Muốn đổi sang Linear, Geist, Stripe, Raycast, Radix hoặc Apple HIG: ghi quyết định vào file này trước, rồi thay khối `:root` và `[data-theme="dark"]` trong `globals.css`, giữ nguyên khối bí danh tương thích.

## 3 · Bảng token

| Token | Light | Dark | Dùng cho |
|---|---|---|---|
| `--page` | `#EAF2FC` | `#0B0C0E` | mặt bàn + sàn `#body` |
| `--shell` / `--card` | `#FFFFFF` | `#141518` | khung app, card |
| `--sub` | `#F5F5F5` | `#1A1B1F` | hover, ô nhập |
| `--sub2` | `#EAF2FC` | `#202227` | nav đang chọn, nút phụ |
| `--line` / `--line2` | `#E8E8E8` / `#F2F2F3` | `#25272C` / `#1D1F23` | hairline |
| `--ink` / `--ink2` / `--ink3` | `#1A1A1A` / `#5A5A5A` / `#6B6B6B` | `#F3F4F6` / `#A1A4AB` / `#868A92` | chữ chính / phụ / nhãn trục |
| `--brand` | `#024AD8` | `#2F6BF0` | **chỉ** thứ bấm được |
| `--ok` / `--warn` / `--bad` | `#128A54` / `#B45309` / `#C62B3C` | `#34C98A` / `#E5A93B` / `#FF7080` | **chỉ** nghĩa ngưỡng |
| `--focus` | `#013BAC` | `#7FAEFF` | chuỗi dữ liệu hạng 1 |
| `--series-2..5` | `#0171AD` → `#0096D6` → `#74BCE6` → `#BFD5F2` | `#3BA7E3` → `#2B7CC4` → `#3E5F8F` → `#2E405F` | chuỗi dữ liệu hạng 2 trở đi |

Bo góc giảm theo độ sâu: shell 20 → card 11 → phần tử trong card 9. Đúng ba bóng: `--sh-card` (gần như không thấy), `--sh-pop` (popover, drawer, modal), `--sh-shell` (shell nổi trên mặt bàn).

Khối bí danh tương thích (`--label`, `--fill4`, `--blue`, `--red`…) ánh xạ tên cũ về token mới tại một chỗ. Không xoá: chart đọc màu qua các tên đó.

## 4 · Typography

Inter, dự phòng `-apple-system, Segoe UI, system-ui`. Mọi con số dùng `tabular-nums` để cột số không nhảy.

| Vai trò | Cỡ | Đậm |
|---|---|---|
| Lời chào | 20px | 600 |
| Số KPI | 23px | 600 |
| Tiêu đề card | 13px | 600 |
| Chữ thường | 12–13px | 400 |
| Chữ phụ, legend | 11–11,5px | 400–500 |
| Nhãn trục | 10,5px | 400 |

## 5 · Ba luật màu

**Luật 1 — `--brand` chỉ dành cho thứ bấm được.** Nút chính, viền focus, link. Không bao giờ làm màu chuỗi dữ liệu. Mục nav đang chọn tô nền `--sub2` + chữ `--ink`, không tô brand. Mỗi màn hình đúng một nút brand: trên dashboard là nút **Bộ lọc**.

**Luật 2 — `--ok` / `--warn` / `--bad` chỉ mang nghĩa ngưỡng.** Chỉ dùng khi có một con số so với một ngưỡng. Không bao giờ làm màu chuỗi dữ liệu: "Agoda tô đỏ vì là chuỗi thứ 3" nghĩa là lúc nó thật sự vượt ngưỡng sẽ không ai nhận ra.

**Luật 3 — không có ngoại lệ.** Mọi màu là token. Mọi dimension đi chung một thang: màu nói **thứ hạng**, danh tính do icon và nhãn chở.

Thứ tự quyết định màu một chuỗi, đọc từ trên xuống, gặp là dừng:

```
1. chưa có ngưỡng lỗ        →  bỏ qua bước này
2. hạng 1                      →  --focus
3. còn lại                     →  --series-N theo hạng, tối đa bậc 5
```

Áp vào dashboard này:

| | Chỉ số |
|---|---|
| KPI tô xanh/đỏ (có ngưỡng) | Giá phòng TB / đêm (ADR) |
| KPI giữ mực (không có ngưỡng) | Doanh thu booking · Doanh thu phòng · Room night · Số booking |
| Ô nhiệt pha `--bad` (chi phí đơn vị, càng đậm càng xấu) | không có |

## 6 · Nguyên tắc tương tác

| Nguyên tắc | Nội dung |
|---|---|
| Một nút brand mỗi màn | "Bộ lọc" trên dashboard; trong drawer và bảng xuất, nút chính tô mực |
| Điều khiển một chart ở header card đó | Ngày/Tuần/Tháng, căn phải |
| Điều khiển cả trang trong drawer | khoảng ngày, dimension, chỉ số — không có bản sao ở chỗ khác |
| Sửa trong drawer là nháp | chỉ áp dụng khi bấm `Áp dụng` |
| Bốn trạng thái runtime | đang tải · lỗi + nút thử lại · có dữ liệu · không dòng nào khớp bộ lọc + gợi ý nới lọc |

## 7 · Sáng / tối

Hai bảng token riêng, không đảo màu. Ba luật màu giữ nguyên ở cả hai chế độ. Kiểm cả hai: mọi chữ đạt tương phản 4,5:1, kể cả nhãn trục 10,5px.

## Giả định cần bạn xác nhận

Không có giả định riêng ở file này.
