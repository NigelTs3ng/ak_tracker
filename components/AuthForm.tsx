"use client";

import { useActionState } from "react";

type Props = {
  mode: "login" | "register";
  action: (
    prevState: { error: string | null },
    formData: FormData,
  ) => Promise<{ error: string | null }>;
};

const initialState = { error: null };

export default function AuthForm({ mode, action }: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm text-zinc-200">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-zinc-200">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
        />
      </label>
      {state?.error ? (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
      >
        {isPending
          ? "Working..."
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>
    </form>
  );
}
