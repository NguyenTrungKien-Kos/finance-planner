# AI_LOG – Nhật ký sử dụng AI

> Mức AI của bài này: Mức 3 (AI cộng tác – xem Hướng dẫn sử dụng AI của môn học).
> Khai báo trung thực không bị trừ điểm. Không khai báo = vi phạm liêm chính học thuật.

| Ngày | Công cụ | Việc nhờ AI | Prompt (tóm tắt) | Kết quả dùng thế nào | Mình đã kiểm chứng / sửa gì | Commit/PR |
|---|---|---|---|---|---|---|
| 23/11/2026 | Antigravity AI | Hỗ trợ setup Next.js 16.4, Prisma 7, seed 32 giao dịch và dựng Dashboard chỉ đọc (Mốc fp1) | Đề nghị hướng dẫn từng bước setup Neon + Prisma 7, sinh `seed.ts` (>= 30 giao dịch) và `app/page.tsx` chỉ đọc | Copy code vào từng file và tự chạy migrate, seed, dev server | Đã chạy `prisma migrate dev`, `prisma db seed` (32 giao dịch), sửa lỗi `dynamic` xung đột `cacheComponents` bằng `<Suspense>` + `connection()`, kiểm tra `lint`/`typecheck`/`build` đạt | `fp1` |
| 24/11/2026 | Antigravity AI | Sinh Zod 4 schema, Server Actions CRUD giao dịch, bộ lọc URL `searchParams` và 8 unit test Vitest 5 (Mốc fp2) | Đề nghị hướng dẫn từng bước CRUD giao dịch, lọc URL phía server và viết unit test | Tự cài gói (`@types/node@24`, `vitest@5`, `zod@4`, `shadcn/ui`), tự dán code vào từng file và test trên UI | Đã tự test nhập sai form để kiểm tra lỗi Zod dưới từng ô, test copy URL lọc mở tab mới; tự đổi `balance` sang `+` để thấy test báo đỏ (`15000000` vs `5000000`) rồi sửa lại `-` cho 8/8 test xanh; chạy `lint`/`typecheck`/`vitest`/`build` đạt | `fp2` |
| 24/11/2026 | Antigravity AI | Tích hợp Better Auth 1.7 (Email/Password + GitHub OAuth), DAL `requireUser()`, phân quyền `userId` cho Server Actions và Route Handler `GET /api/transactions` (Mốc fp3) | Đề nghị hướng dẫn từng bước cấu hình Better Auth 1.7, `proxy.ts`, `requireUser()`, lọc `userId` và cập nhật `seed.ts` | Tự tạo GitHub OAuth App, điền `.env`, cài `better-auth@1.7`, chạy `auth generate` + `prisma migrate reset` và dán code vào các file | Đã test `GET /api/transactions` khi chưa đăng nhập trả HTTP `401`, test tài khoản demo (`32` giao dịch) cách ly dữ liệu với tài khoản mới (`0` giao dịch); phát hiện và sửa lỗi `proxy.ts` redirect nhầm request nội bộ gây lặp `/login`; chạy `lint`/`typecheck`/`vitest` đạt | `fp3` |
## Tự đánh giá cuối bài
- Phần mình tự làm hoàn toàn:
- Phần AI giúp nhiều nhất và mình đã hiểu nó thế nào:
- Một lần AI sai và cách mình phát hiện: