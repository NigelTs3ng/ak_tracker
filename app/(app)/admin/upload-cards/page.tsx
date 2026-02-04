import { requireUser } from "@/lib/auth";
import UploadCardsForm from "@/components/UploadCardsForm";

export default async function UploadCardsPage() {
  const user = await requireUser();
  const adminEmail = process.env.ADMIN_EMAIL ?? "";
  const isAdmin = adminEmail && user.email === adminEmail;

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Upload Card List</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Admin-only upload for card lists by version.
        </p>
      </header>

      {isAdmin ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <UploadCardsForm />
        </div>
      ) : (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          You do not have access to upload card lists.
        </div>
      )}
    </section>
  );
}
