import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-100">
        Create your Animal Kaiser Plus account
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        Join the community and unlock premium sequences.
      </p>
      <AuthForm mode="register" action={registerAction} />
      <p className="mt-6 text-sm text-zinc-400">
        Already have an account?{" "}
        <Link className="text-emerald-400 hover:underline" href="/login">
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-100">
        Create your Animal Kaiser Plus account
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        Join the community and unlock premium sequences.
      </p>
      <AuthForm mode="register" action={registerAction} />
      <p className="mt-6 text-sm text-zinc-400">
        Already have an account?{" "}
        <Link className="text-emerald-400 hover:underline" href="/login">
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}
