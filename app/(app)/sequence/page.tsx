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
        <div className="rounded-xl border border-dashed border-emerald-500/50 bg-emerald-500/10 p-6 text-sm text-emerald-200">
          <p className="font-semibold">Upgrade to Premium</p>
          <p className="mt-2 text-emerald-100/80">
            Unlock deck sequences, search by recent draws, and see likely next
            cards.
          </p>
          <a
            href="https://t.me/twentytree233?text=Hi%20there%2C%20I%20would%20like%20to%20upgrade%20to%20premium%20on%20the%20animal%20kaiser%20plus%20app%20to%20use%20the%20card%20list%20function%21"
            className="mt-4 inline-flex rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact support to upgrade
          </a>
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

  type SequenceCard = {
    id: string;
    name: string;
    type: string;
    rarity: string;
  };

  type SequenceRow = {
    position_index: number;
    deck_label: string;
    version: string;
    cards: SequenceCard[] | SequenceCard | null;
  };

  const { data: sequenceData } = await supabase
    .from("card_sequences")
    .select(
      "position_index, deck_label, version, cards(id, name, type, rarity)",
    )
    .eq("upload_id", latestUpload.id)
    .order("deck_label", { ascending: true })
    .order("position_index", { ascending: true });

  const sequence = (sequenceData ?? []) as SequenceRow[];
  const resolveCard = (row: SequenceRow): SequenceCard | null => {
    if (!row.cards) return null;
    return Array.isArray(row.cards) ? row.cards[0] ?? null : row.cards;
  };

  const grouped = sequence.reduce<Record<string, SequenceRow[]>>(
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
                      resolveCard(row)?.rarity,
                    )}`}
                  >
                    <div className="text-xs text-zinc-400">
                      #{row.position_index}
                    </div>
                    <div className="flex-1 text-sm font-semibold">
                      {resolveCard(row)?.name}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {resolveCard(row)?.type} • {resolveCard(row)?.rarity} •{" "}
                      {row.version}
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
