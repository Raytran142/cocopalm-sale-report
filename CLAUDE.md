# Sale Dashboard

## 1. Mục đích

<!-- Chủ project sẽ điền sau -->

## 2. Cấu trúc folder

```
Sale Dashboard/
├── CLAUDE.md          # Hướng dẫn làm việc cho Claude (file này)
├── MEMORY.md          # Ghi chú, quyết định đã chốt trong quá trình làm
├── .claude/           # Cấu hình Claude Code cho project
├── docs/
│   ├── 1-spec/        # Đặc tả yêu cầu (specification.md)
│   └── 2-design/      # Thiết kế: design.md, layout.md, components.md (do skill sinh)
│                      #   + time-page.md, multi-property.md (viết tay)
└── app/               # Mã nguồn Next.js (TypeScript, Tailwind, App Router, không dùng src/)
    ├── app/           # Thư mục route của App Router
    └── public/        # Tài nguyên tĩnh
```

## 3. Quy tắc làm việc

- Chỉ làm đúng phạm vi được yêu cầu; không tự tạo thêm file/folder ngoài yêu cầu.
- Không bịa nội dung sản phẩm, không tự quyết định công nghệ hay chức năng; chưa rõ thì hỏi.
- Thứ tự công việc: `docs/1-spec` → `docs/2-design` → `app/`. Code trong `app/` phải bám theo spec và design đã duyệt.
- Mọi lệnh npm chạy trong `app/`; không tạo project Next.js hay folder `app` khác ở cấp `Sale Dashboard`.
- Next.js trong project là bản mới (16.x): đọc `app/AGENTS.md` và tài liệu trong `app/node_modules/next/dist/docs/` trước khi viết code.
- Không đọc, in ra hay commit nội dung file env/secret (`.env*`).
- Quyết định đã chốt ghi vào `MEMORY.md`.
