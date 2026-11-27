import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background">
      <AuthForm mode="login" />
    </main>
  );
}