# AI_LOG – Nhật ký sử dụng AI

> Mức AI của bài này: Mức 3 (AI cộng tác – xem Hướng dẫn sử dụng AI của môn học).
> Khai báo trung thực không bị trừ điểm. Không khai báo = vi phạm liêm chính học thuật.

| Ngày | Công cụ | Việc nhờ AI | Prompt (tóm tắt) | Kết quả dùng thế nào | Mình đã kiểm chứng / sửa gì | Commit/PR |
|---|---|---|---|---|---|---|
| 23/11/2026 | Antigravity AI | Hỗ trợ setup Next.js 16.4, Prisma 7, seed 32 giao dịch và dựng Dashboard chỉ đọc (Mốc fp1) | Đề nghị hướng dẫn từng bước setup Neon + Prisma 7, sinh `seed.ts` (>= 30 giao dịch) và `app/page.tsx` chỉ đọc | Copy code vào từng file và tự chạy migrate, seed, dev server | Đã chạy `prisma migrate dev`, `prisma db seed` (32 giao dịch), sửa lỗi `dynamic` xung đột `cacheComponents` bằng `<Suspense>` + `connection()`, kiểm tra `lint`/`typecheck`/`build` đạt | `fp1` |

## Tự đánh giá cuối bài
- Phần mình tự làm hoàn toàn:
- Phần AI giúp nhiều nhất và mình đã hiểu nó thế nào:
- Một lần AI sai và cách mình phát hiện: