import { requireUser } from "@/lib/auth";
import UploadSequenceForm from "@/components/UploadSequenceForm";

export default async function UploadSequencePage() {
  const user = await requireUser();
  const adminEmail = process.env.ADMIN_EMAIL ?? "";
  const isAdmin = adminEmail && user.email === adminEmail;

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Upload Sequence</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Admin-only upload for new deck sequences.
        </p>
      </header>

      {isAdmin ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <UploadSequenceForm />
        </div>
      ) : (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          You do not have access to upload sequences.
        </div>
      )}
    </section>
  );
}
