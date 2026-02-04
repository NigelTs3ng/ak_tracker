import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

export default function SessionEndedPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-100">
        This account is active on another device
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        You’ve been signed out because a newer login was detected.
      </p>
      <form action={logoutAction} className="mt-6">
        <button className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900">
          Sign in again
        </button>
      </form>
      <p className="mt-4 text-xs text-zinc-500">
        If this wasn’t you, change your password and sign in again.
      </p>
      <Link className="mt-4 inline-flex text-sm text-emerald-400" href="/login">
        Back to login
      </Link>
    </div>
  );
}
