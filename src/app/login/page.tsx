"use client";

import { Suspense } from "react";
import { LoginBackdrop } from "@/components/auth/LoginBackdrop";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <LoginBackdrop />
      <div className="relative w-full max-w-login">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
