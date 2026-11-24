"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">
          {isRegister ? "Tạo tài khoản" : "Đăng nhập Finance Planner"}
        </CardTitle>
        <CardDescription>
          {isRegister
            ? "Đăng ký bằng email để quản lý thu chi cá nhân."
            : "Đăng nhập để xem và quản lý giao dịch của bạn."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Họ tên</Label>
              <Input
                id="name"
                type="text"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="ban@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              placeholder="Tối thiểu 8 ký tự"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {errorMsg && (
            <p className="text-sm text-destructive" role="alert">
              {errorMsg}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? "Đang xử lý..."
              : isRegister
                ? "Đăng ký"
                : "Đăng nhập"}
          </Button>
        </form>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t" />
          <span className="mx-3 text-xs text-muted-foreground uppercase">
            Hoặc
          </span>
          <div className="flex-grow border-t" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGithubSignIn}
          disabled={isLoading}
        >
          Tiếp tục với GitHub
        </Button>
      </CardContent>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        {isRegister ? (
          <>
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="ml-1 font-medium text-primary underline"
            >
              Đăng nhập
            </Link>
          </>
        ) : (
          <>
            Chưa có tài khoản?{" "}
            <Link
              href="/register"
              className="ml-1 font-medium text-primary underline"
            >
              Đăng ký ngay
            </Link>
          </>
        )}
      </CardFooter>
    </Card>
  );
}