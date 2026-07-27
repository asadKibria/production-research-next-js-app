"use client";

import { useActionState } from "react";
import Image from "next/image";
import { loginAdmin, type LoginFormState } from "@/app/lib/actions/auth";

const initialLoginFormState: LoginFormState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialLoginFormState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-plum-950 px-6">
      <div className="w-full max-w-sm rounded-3xl border border-plum-800 bg-plum-900 p-8">
        <Image
          src="/brand/logo-light.png"
          alt="Hizjaab"
          width={120}
          height={48}
          className="mx-auto h-10 w-auto object-contain"
        />
        <h1 className="mt-6 text-center text-lg font-semibold text-cream-050">অ্যাডমিন লগইন</h1>

        {state.error ? (
          <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-center text-sm text-red-300">
            {state.error}
          </p>
        ) : null}

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-cream-100">ইউজারনেম</span>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              className="rounded-xl border border-plum-700 bg-plum-950 px-4 py-2.5 text-cream-050 outline-none focus:border-taupe-400"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-cream-100">পাসওয়ার্ড</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-xl border border-plum-700 bg-plum-950 px-4 py-2.5 text-cream-050 outline-none focus:border-taupe-400"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-full bg-cream-050 px-6 py-3 text-sm font-medium text-plum-900 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
          >
            লগইন করুন
          </button>
        </form>
      </div>
    </main>
  );
}
