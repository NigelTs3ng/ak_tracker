import { getProfile } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

export default async function ProfilePage() {
  const profile = await getProfile();
  if (!profile) return null;

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Manage your account and subscription status.
        </p>
      </header>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="text-zinc-400">Email</span>
          <span className="font-semibold">{profile.email}</span>
        </div>
        <div className="flex items-center justify-between pt-3">
          <span className="text-zinc-400">Role</span>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            {profile.role}
          </span>
        </div>
      </div>

      <form action={logoutAction}>
        <button className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900">
          Sign out
        </button>
      </form>
    </section>
  );
}
