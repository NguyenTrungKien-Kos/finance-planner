"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  TrendingUp,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFormProps = {
  mode: "login" | "register";
};

function GithubGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4 shrink-0"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        const { error } = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
        });
        if (error) {
          setErrorMsg(error.message ?? "Đăng ký thất bại.");
          return;
        }
        toast.success("Đăng ký thành công!");
      } else {
        const { error } = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (error) {
          setErrorMsg(error.message ?? "Email hoặc mật khẩu không đúng.");
          return;
        }
        toast.success("Đăng nhập thành công!");
      }

      router.push("/");
      router.refresh();
    } catch {
      setErrorMsg("Có lỗi kết nối xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGithubSignIn() {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/",
      });
    } catch {
      setErrorMsg("Không thể kết nối GitHub. Vui lòng thử lại.");
      setIsLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-12">
      {/* Cột trái giới thiệu phong cách Fintech tối màu */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#1B1D22] p-10 text-zinc-100 lg:col-span-5 lg:flex xl:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-[#5B5CE6]/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-indigo-500/15 blur-3xl"
        />

        <BrandLogo dark />

        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-xs font-medium text-indigo-300">
              <TrendingUp className="size-3.5" />
              Kiểm soát tài chính thông minh
            </span>
            <h1 className="text-3xl leading-tight font-bold tracking-tight text-white">
              Theo dõi thu chi, ngân sách và mục tiêu tiết kiệm tại một nơi.
            </h1>
            <p className="text-sm leading-relaxed text-zinc-400">
              Trực quan hóa dòng tiền theo tháng, cảnh báo vượt hạn mức tự động
              và lưu tiến độ Wishlist theo thời gian thực.
            </p>
          </div>

          {/* Thẻ xem trước giao diện */}
          <div className="fp-virtual-card relative overflow-hidden rounded-2xl p-5 text-white shadow-2xl">
            <div
              aria-hidden="true"
              className="absolute -top-10 -right-10 size-36 rounded-full bg-white/10"
            />
            <div
              aria-hidden="true"
              className="absolute -right-4 -bottom-12 size-28 rounded-full bg-white/10"
            />
            <div className="relative flex items-center justify-between text-xs font-medium text-indigo-100">
              <span>Tổng quan tài khoản</span>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold">
                +12.8% tháng này
              </span>
            </div>
            <p className="relative mt-3 font-mono text-2xl font-bold tracking-tight tabular-nums">
              25.400.000 ₫
            </p>
            <div className="relative mt-5 grid grid-cols-3 gap-2 rounded-xl bg-black/15 p-2.5 text-xs">
              <div>
                <p className="text-indigo-100/80">Thu nhập</p>
                <p className="mt-0.5 font-mono font-semibold">+18,5tr</p>
              </div>
              <div>
                <p className="text-indigo-100/80">Chi tiêu</p>
                <p className="mt-0.5 font-mono font-semibold">-6,2tr</p>
              </div>
              <div>
                <p className="text-indigo-100/80">Ngân sách</p>
                <p className="mt-0.5 font-semibold text-emerald-300">An toàn</p>
              </div>
            </div>
          </div>

          <ul className="space-y-2.5 text-sm text-zinc-300">
            {[
              "Biểu đồ so sánh thu chi 6 tháng & phân bổ danh mục",
              "Cảnh báo ngân sách 80% / 100% và giao dịch định kỳ",
              "Nhập/xuất CSV & gợi ý danh mục bằng AI",
            ].map((text) => (
              <li key={text} className="flex items-center gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#5B5CE6]/30 text-indigo-300">
                  <Check className="size-3" />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 flex items-center gap-2 text-xs text-zinc-400">
          <ShieldCheck className="size-4 text-emerald-400" />
          Bảo mật phiên Better Auth · Dữ liệu tách biệt theo tài khoản
        </p>
      </section>

      {/* Cột phải form đăng nhập / đăng ký */}
      <section className="flex flex-col justify-between bg-background p-5 sm:p-8 lg:col-span-7 lg:p-12">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <BrandLogo />
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="mx-auto my-8 w-full max-w-[440px]">
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-[0_12px_36px_-18px_rgba(15,23,42,0.14)] sm:p-8 dark:shadow-none">
            {/* Thanh chuyển tab pill kiểu Finova */}
            <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1">
              <Link
                href="/login"
                className={`rounded-lg py-2 text-center text-sm font-semibold transition-all ${
                  !isRegister
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className={`rounded-lg py-2 text-center text-sm font-semibold transition-all ${
                  isRegister
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Đăng ký
              </Link>
            </div>

            <div className="mb-6 space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight">
                {isRegister ? "Tạo tài khoản mới" : "Chào mừng trở lại 👋"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isRegister
                  ? "Bắt đầu quản lý thu chi và mục tiêu tài chính cá nhân."
                  : "Đăng nhập để xem báo cáo và giao dịch của bạn."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Họ tên</Label>
                  <div className="relative">
                    <User
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ban@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tối thiểu 8 ký tự"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10 pl-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
                >
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full font-semibold"
                disabled={isLoading}
              >
                {isLoading
                  ? "Đang xử lý..."
                  : isRegister
                    ? "Tạo tài khoản"
                    : "Đăng nhập"}
              </Button>
            </form>

            <div className="relative my-5 flex items-center">
              <div className="flex-grow border-t border-border/80" />
              <span className="mx-3 text-xs font-medium text-muted-foreground uppercase">
                Hoặc
              </span>
              <div className="flex-grow border-t border-border/80" />
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full gap-2 font-medium"
              onClick={handleGithubSignIn}
              disabled={isLoading}
            >
              <GithubGlyph />
              Tiếp tục với GitHub
            </Button>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isRegister ? (
                <>
                  Đã có tài khoản?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-primary hover:underline"
                  >
                    Đăng nhập ngay
                  </Link>
                </>
              ) : (
                <>
                  Chưa có tài khoản?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-primary hover:underline"
                  >
                    Đăng ký ngay
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Finance Planner · Next.js 16.4 · Better Auth
        </p>
      </section>
    </div>
  );
}