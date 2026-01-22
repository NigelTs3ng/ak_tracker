import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateCardQuantityAction } from "@/app/actions/cards";

export default async function CardsPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: cards } = await supabase
    .from("cards")
    .select("id,name,type,rarity,version,image_url")
    .order("name", { ascending: true });

  const { data: userCards } = await supabase
    .from("user_cards")
    .select("card_id,quantity")
    .eq("user_id", user.id);

  const { data: globalCounts } = await supabase
    .from("card_global_counts")
    .select("card_id,total_owned");

  const userMap = new Map(
    (userCards ?? []).map((card) => [card.card_id, card.quantity]),
  );
  const globalMap = new Map(
    (globalCounts ?? []).map((card) => [card.card_id, card.total_owned]),
  );
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

  const rarityOrder: Record<string, number> = {
    gold: 0,
    silver: 1,
    bronze: 2,
    normal: 3,
  };

  const orderedCards = (cards ?? []).slice().sort((a, b) => {
    const rarityA = rarityOrder[a.rarity ?? "normal"] ?? 4;
    const rarityB = rarityOrder[b.rarity ?? "normal"] ?? 4;
    if (rarityA !== rarityB) return rarityA - rarityB;
    return a.name.localeCompare(b.name);
  });

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Your Card Collection</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Update quantities and see global totals.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {orderedCards.map((card) => {
          const owned = userMap.get(card.id) ?? 0;
          const globalOwned = globalMap.get(card.id) ?? 0;

          return (
            <div
              key={card.id}
              className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${rarityClass(
                card.rarity,
              )}`}
            >
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-12 overflow-hidden rounded-md bg-zinc-800">
                  {card.image_url ? (
                    <Image
                      src={card.image_url}
                      alt={card.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <div className="text-sm font-semibold">{card.name}</div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {card.type} • {card.rarity} • {card.version}
                  </div>
                </div>
              </div>

              <form
                action={updateCardQuantityAction}
                className="flex items-center gap-3"
              >
                <input type="hidden" name="card_id" value={card.id} />
                <label className="flex flex-col text-xs text-zinc-400">
                  You own
                  <input
                    name="quantity"
                    type="number"
                    min={0}
                    defaultValue={owned}
                    className="mt-1 w-20 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
                  />
                </label>
                <div className="flex flex-col text-xs text-zinc-400">
                  Global
                  <span className="mt-1 text-sm text-zinc-200">
                    {globalOwned}
                  </span>
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950"
                >
                  Save
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </section>
  );
}
