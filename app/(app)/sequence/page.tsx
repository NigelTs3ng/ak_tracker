import Image from "next/image";
import SequenceSearch from "@/components/SequenceSearch";
import VersionSelect from "@/components/VersionSelect";
import { getProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SequencePageProps = {
  searchParams?: Promise<{ version?: string }>;
};

export default async function SequencePage({ searchParams }: SequencePageProps) {
  const profile = await getProfile();
  const supabase = await createSupabaseServerClient();
  const versions = ["v1", "v2", "v3", "v4", "v5", "v6"];
  const resolvedParams = searchParams ? await searchParams : undefined;
  const selectedVersion =
    resolvedParams?.version && versions.includes(resolvedParams.version)
      ? resolvedParams.version
      : "v3";

  if (!profile) {
    return null;
  }

  if (profile.role !== "premium") {
    return (
      <section className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold">Sequence Viewer</h1>
          <p className="mt-2 text-sm text-zinc-400">
            This feature is available to premium members only.
          </p>
        </header>
        <div className="grid gap-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-sm text-emerald-100 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-lg font-semibold">Upgrade to Premium</p>
            <p className="mt-2 text-emerald-100/80">
              Unlock deck sequences, search by recent draws, and view the
              upcoming card window with confidence.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-emerald-100/70">
              <li>• Full sequence intelligence per deck</li>
              <li>• Fast search from your last 1–3 draws</li>
              <li>• Highlighted likely next cards</li>
            </ul>
            <a
              href="https://t.me/twentytree233?text=Hi%20there%2C%20I%20would%20like%20to%20upgrade%20to%20premium%20on%20the%20animal%20kaiser%20plus%20app%20to%20use%20the%20card%20list%20function%21"
              className="mt-5 inline-flex rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact support to upgrade
            </a>
          </div>
          <div className="rounded-xl border border-emerald-400/30 bg-zinc-950/60 p-3">
            <div className="text-xs uppercase tracking-wide text-emerald-200/70">
              Premium preview
            </div>
            <div className="relative mt-3 aspect-[9/16] overflow-hidden rounded-lg border border-emerald-400/20 bg-black">
              <Image
                src="/images/seq1.jpg"
                alt="Premium sequence preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 360px"
                priority
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const uploadsQuery = supabase
    .from("sequence_uploads")
    .select("id,filename,created_at,version")
    .order("created_at", { ascending: false });

  const { data: uploads } = await uploadsQuery
    .eq("version", selectedVersion)
    .limit(1);

  const latestUpload = uploads?.[0];
  const { data: allUploads } = await supabase
    .from("sequence_uploads")
    .select("version")
    .order("created_at", { ascending: false });
  const availableVersions = new Set(
    (allUploads ?? []).map((item) => item.version),
  );
  const hasUpload = Boolean(latestUpload);

  if (!hasUpload || !latestUpload) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Sequence Viewer</h1>
        <p className="text-sm text-zinc-400">
          No sequence uploaded for {selectedVersion}. Coming soon....
        </p>
        <VersionSelect versions={versions} selected={selectedVersion} />
      </section>
    );
  }

  const { data: cards } = await supabase
    .from("cards")
    .select("id,name,version")
    .eq("version", selectedVersion)
    .order("name", { ascending: true });

  // Full sequence is intentionally hidden until a search is performed.

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Sequence Viewer</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Latest upload: {latestUpload.filename} ({latestUpload.version})
        </p>
      </header>
      <VersionSelect versions={versions} selected={selectedVersion} />

      {availableVersions.has(selectedVersion) ? (
        <SequenceSearch
          key={latestUpload.id}
          uploadId={latestUpload.id}
          cards={cards ?? []}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 p-6 text-sm text-zinc-300">
          Coming soon....
        </div>
      )}

      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-400">
        Enter cards above to reveal 5 cards before and 10 cards after the
        match.
      </div>
    </section>
  );
}
