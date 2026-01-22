import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-100">
        Sign in to Animal Kaiser Plus
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        Track your cards and compare collections.
      </p>
      <AuthForm mode="login" action={loginAction} />
      <p className="mt-6 text-sm text-zinc-400">
        New here?{" "}
        <Link className="text-emerald-400 hover:underline" href="/register">
          Create an account
        </Link>
        .
      </p>
    </div>
  );
}
