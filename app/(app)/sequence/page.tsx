import Link from "next/link";
import SequenceSearch from "@/components/SequenceSearch";
import { getProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SequencePageProps = {
  searchParams?: Promise<{ version?: string }>;
};

export default async function SequencePage({ searchParams }: SequencePageProps) {
  const profile = await getProfile();
  const supabase = await createSupabaseServerClient();
  const resolvedParams = searchParams ? await searchParams : undefined;
  const selectedVersion =
    resolvedParams?.version && ["v1", "v2", "v3"].includes(resolvedParams.version)
      ? resolvedParams.version
      : null;

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
        <div className="rounded-xl border border-dashed border-emerald-500/50 bg-emerald-500/10 p-6 text-sm text-emerald-200">
          <p className="font-semibold">Upgrade to Premium</p>
          <p className="mt-2 text-emerald-100/80">
            Unlock deck sequences, search by recent draws, and see likely next
            cards.
          </p>
          <button className="mt-4 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950">
            Contact support to upgrade
          </button>
        </div>
      </section>
    );
  }

  const uploadsQuery = supabase
    .from("sequence_uploads")
    .select("id,filename,created_at,version")
    .order("created_at", { ascending: false });

  const { data: uploads } = selectedVersion
    ? await uploadsQuery.eq("version", selectedVersion).limit(1)
    : await uploadsQuery.limit(1);

  const latestUpload = uploads?.[0];
  const { data: allUploads } = await supabase
    .from("sequence_uploads")
    .select("version")
    .order("created_at", { ascending: false });
  const availableVersions = Array.from(
    new Set((allUploads ?? []).map((item) => item.version)),
  );

  if (!latestUpload) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Sequence Viewer</h1>
        <p className="text-sm text-zinc-400">
          No sequences are available yet. Ask an admin to upload a deck file.
        </p>
      </section>
    );
  }

  const { data: cards } = await supabase
    .from("cards")
    .select("id,name,version")
    .order("name", { ascending: true });

  const { data: sequence } = await supabase
    .from("card_sequences")
    .select(
      "position_index, deck_label, version, cards(id, name, type, rarity)",
    )
    .eq("upload_id", latestUpload.id)
    .order("deck_label", { ascending: true })
    .order("position_index", { ascending: true });

  const grouped = (sequence ?? []).reduce<Record<string, typeof sequence>>(
    (acc, row) => {
      const key = row.deck_label ?? "Unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    },
    {},
  );
  const rarityClass = (rarity: string | null | undefined) => {
    switch (rarity) {
      case "gold":
        return "bg-yellow-500/20 border-yellow-400/60";
      case "silver":
        return "bg-zinc-700/40 border-zinc-600/40";
      case "bronze":
        return "bg-amber-900/30 border-amber-700/40";
      default:
        return "bg-zinc-950/60 border-zinc-800";
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Sequence Viewer</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Latest upload: {latestUpload.filename} ({latestUpload.version})
        </p>
      </header>
      {availableVersions.length > 1 ? (
        <div className="flex flex-wrap gap-2 text-xs">
          {availableVersions.map((version) => (
            <Link
              key={version}
              href={`/sequence?version=${version}`}
              className={`rounded-full border px-3 py-1 ${
                latestUpload.version === version
                  ? "border-emerald-400 text-emerald-300"
                  : "border-zinc-700 text-zinc-300"
              }`}
            >
              {version}
            </Link>
          ))}
        </div>
      ) : null}

      <SequenceSearch uploadId={latestUpload.id} cards={cards ?? []} />

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-lg font-semibold">Full Sequence</h2>
        <div className="mt-4 space-y-6 text-sm">
          {Object.entries(grouped).map(([deck, rows]) => (
            <div key={deck}>
              <div className="text-xs font-semibold uppercase text-zinc-400">
                Deck {deck}
              </div>
              <div className="mt-2 grid gap-2">
                {(rows ?? []).map((row) => (
                  <div
                    key={`${deck}-${row.position_index}`}
                    id={`deck-${deck}-${row.position_index}`}
                    className={`sequence-item flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 ${rarityClass(
                      row.cards?.rarity,
                    )}`}
                  >
                    <div className="text-xs text-zinc-400">
                      #{row.position_index}
                    </div>
                    <div className="flex-1 text-sm font-semibold">
                      {row.cards?.name}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {row.cards?.type} • {row.cards?.rarity} • {row.version}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
