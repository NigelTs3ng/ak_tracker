import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CommunityPage() {
  const supabase = await createSupabaseServerClient();

  const { data: cards } = await supabase
    .from("cards")
    .select("id,name,type,rarity,version")
    .order("name", { ascending: true });

  const { data: globalCounts } = await supabase
    .from("card_global_counts")
    .select("card_id,total_owned");

  const globalMap = new Map(
    (globalCounts ?? []).map((card) => [card.card_id, card.total_owned]),
  );

  const ranked = (cards ?? [])
    .map((card) => ({
      ...card,
      total_owned: globalMap.get(card.id) ?? 0,
    }))
    .sort((a, b) => b.total_owned - a.total_owned);
  const rarityClass = (rarity: string | null) => {
    switch (rarity) {
      case "gold":
        return "bg-yellow-500/20 border-yellow-400/60";
      case "silver":
        return "bg-zinc-700/40 border-zinc-600/40";
      case "bronze":
        return "bg-amber-900/30 border-amber-700/40";
      default:
        return "bg-zinc-900/40 border-zinc-800";
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Community Stats</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Global ownership counts across all players.
        </p>
      </header>

      <div className="grid gap-3">
        {ranked.map((card, index) => (
          <div
            key={card.id}
            className={`flex items-center justify-between rounded-xl border p-4 ${rarityClass(
              card.rarity,
            )}`}
          >
            <div>
              <div className="text-sm font-semibold">
                #{index + 1} {card.name}
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                {card.type} • {card.rarity} • {card.version}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-emerald-400">
                {card.total_owned}
              </div>
              <div className="text-xs text-zinc-500">total owned</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
