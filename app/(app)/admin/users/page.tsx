import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Role = "free" | "premium";

type ProfileRow = {
  id: string;
  role: Role;
};

export default async function AdminUsersPage() {
  const user = await requireUser();
  const adminEmail = process.env.ADMIN_EMAIL ?? "";
  const isAdmin = Boolean(adminEmail && user.email === adminEmail);

  if (!isAdmin) {
    return (
      <section className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="mt-2 text-sm text-zinc-400">Access denied.</p>
        </header>
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          You do not have access to this page.
        </div>
      </section>
    );
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    return (
      <section className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Unable to load users right now.
          </p>
        </header>
      </section>
    );
  }

  const users = data?.users ?? [];
  const userIds = users.map((user) => user.id);

  const { data: profiles } = userIds.length
    ? await admin
        .from("profiles")
        .select("id,role")
        .in("id", userIds)
    : { data: [] as ProfileRow[] };

  const roleById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.role]),
  );

  const now = Date.now();
  const threeHoursAgo = now - 3 * 60 * 60 * 1000;

  const usersWithRole = users.map((authUser) => ({
    id: authUser.id,
    email: authUser.email ?? "unknown",
    created_at: authUser.created_at,
    last_sign_in_at: authUser.last_sign_in_at,
    role: roleById.get(authUser.id) ?? "free",
  }));

  const activeUsers = usersWithRole.filter((user) => user.last_sign_in_at);
  const activeFree = activeUsers.filter((user) => user.role === "free");
  const activePremium = activeUsers.filter((user) => user.role === "premium");

  const newUsers = usersWithRole.filter((user) => {
    const createdAt = user.created_at
      ? new Date(user.created_at).getTime()
      : 0;
    return createdAt >= threeHoursAgo;
  });

  const formatDate = (value: string | null | undefined) =>
    value ? new Date(value).toLocaleString() : "—";

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Active users, premium breakdown, and new signups.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="text-xs uppercase tracking-wide text-zinc-400">
            Active users
          </div>
          <div className="mt-2 text-2xl font-semibold text-zinc-100">
            {activeUsers.length}
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Signed in at least once
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="text-xs uppercase tracking-wide text-zinc-400">
            Active free
          </div>
          <div className="mt-2 text-2xl font-semibold text-zinc-100">
            {activeFree.length}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="text-xs uppercase tracking-wide text-zinc-400">
            Active premium
          </div>
          <div className="mt-2 text-2xl font-semibold text-emerald-300">
            {activePremium.length}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="text-sm font-semibold">New users (last 3 hours)</div>
        {newUsers.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">No new users yet.</p>
        ) : (
          <div className="mt-3 grid gap-2 text-sm">
            {newUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2"
              >
                <div className="font-medium text-zinc-100">{user.email}</div>
                <div className="text-xs text-zinc-400">
                  {user.role} • joined {formatDate(user.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="text-sm font-semibold">Active users by role</div>
        <div className="mt-3 grid gap-2 text-sm">
          {activeUsers.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2"
            >
              <div className="font-medium text-zinc-100">{user.email}</div>
              <div className="text-xs text-zinc-400">
                {user.role} • last sign-in {formatDate(user.last_sign_in_at)}
              </div>
            </div>
          ))}
          {activeUsers.length === 0 ? (
            <p className="text-sm text-zinc-400">No active users yet.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
