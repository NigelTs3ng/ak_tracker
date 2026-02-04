"use client";

import { useActionState, useEffect, useState } from "react";
import { searchSequenceAction } from "@/app/actions/sequence";

type CardOption = {
  id: string;
  name: string;
  version: string;
};

type Props = {
  uploadId: string;
  cards: CardOption[];
};

type SelectedState = {
  card_1: string;
  card_2: string;
  card_3: string;
};

type FilterState = {
  card_1: string;
  card_2: string;
  card_3: string;
};

const initialState = { matches: [], message: null };

export default function SequenceSearch({ uploadId, cards }: Props) {
  const [state, formAction, isPending] = useActionState(
    searchSequenceAction,
    initialState,
  );
  const storageKey = `ak-sequence-inputs:${uploadId}`;
  const [selected, setSelected] = useState<SelectedState>(() => {
    if (typeof window === "undefined") {
      return { card_1: "", card_2: "", card_3: "" };
    }
    const stored = window.sessionStorage.getItem(storageKey);
    if (!stored) {
      return { card_1: "", card_2: "", card_3: "" };
    }
    try {
      const parsed = JSON.parse(stored);
      return { card_1: "", card_2: "", card_3: "", ...parsed };
    } catch {
      return { card_1: "", card_2: "", card_3: "" };
    }
  });
  const [filters, setFilters] = useState<FilterState>({
    card_1: "",
    card_2: "",
    card_3: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKey, JSON.stringify(selected));
  }, [selected, storageKey]);

  const rarityClass = (rarity: string) => {
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
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h2 className="text-lg font-semibold">Sequence Search</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Enter up to three cards in order to find the next likely draw.
      </p>

      <form action={formAction} className="mt-4 grid gap-3">
        <input type="hidden" name="upload_id" value={uploadId} />
        {[1, 2, 3].map((slot) => {
          const filterValue = filters[`card_${slot as 1 | 2 | 3}`] || "";
          const filteredCards =
            filterValue.trim().length > 0
              ? cards.filter((card) =>
                  `${card.name} ${card.version}`
                    .toLowerCase()
                    .includes(filterValue.toLowerCase()),
                )
              : cards;

          return (
          <label key={slot} className="text-xs text-zinc-400">
            Card {slot}
            <input
              type="text"
              value={filterValue}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  [`card_${slot}`]: event.target.value,
                }))
              }
              placeholder="Type to filter cards..."
              className="mt-2 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            />
            <select
              name={`card_${slot}`}
              value={selected[`card_${slot as 1 | 2 | 3}`]}
              onChange={(event) =>
                setSelected((prev) => ({
                  ...prev,
                  [`card_${slot}`]: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="">Select a card</option>
              {filteredCards.map((card) => (
                <option key={`${card.id}-${slot}`} value={card.id}>
                  {card.name} ({card.version})
                </option>
              ))}
            </select>
          </label>
        )})}

        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
          >
            {isPending ? "Searching..." : "Find next cards"}
          </button>
          <button
            type="button"
            onClick={() => {
              const cleared = { card_1: "", card_2: "", card_3: "" };
              setSelected(cleared);
              setFilters(cleared);
              if (typeof window !== "undefined") {
                window.sessionStorage.removeItem(storageKey);
              }
            }}
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200"
          >
            Clear inputs
          </button>
        </div>
      </form>

      {state.message ? (
        <p className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {state.message}
        </p>
      ) : null}

      {state.matches.length > 0 ? (
        <div className="mt-4 space-y-4 text-sm text-zinc-200">
          {/* <p className="text-xs uppercase tracking-wide text-zinc-400">
            5 cards before, 10 cards after
          </p> */}
          {state.matches.map((match, index) => (
            <div
              key={`${match.match_start_index}-${index}`}
              className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3"
            >
              <div className="text-xs text-zinc-400">
                Deck {match.deck_label} • {match.direction ?? "forward"} match •
                start {match.match_start_index}
              </div>
              {match.next_card ? (
                <div className="mt-1 text-sm font-semibold">
                  Likely next: {match.next_card.card_name} •{" "}
                  {match.next_card.rarity}
                </div>
              ) : (
                <div className="mt-1 text-zinc-400">
                  End of sequence reached.
                </div>
              )}
              <div className="mt-3 grid gap-2">
                {match.context.map((card) => (
                  <div
                    key={`${match.deck_label}-${card.position_index}`}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs ${rarityClass(
                      card.rarity,
                    )} ${
                      card.position_index === match.focus_position_index
                        ? "border-emerald-400 bg-emerald-500/25 text-emerald-100"
                        : "text-zinc-200"
                    }`}
                  >
                    <span className="text-zinc-400">
                      #{card.position_index}
                    </span>
                    <span className="flex-1 px-2 font-semibold">
                      {card.card_name}
                    </span>
                    <span className="text-zinc-400">
                      {card.type} • {card.rarity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
