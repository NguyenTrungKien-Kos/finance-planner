import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-background">
      <AuthForm mode="register" />
    </main>
  );
}