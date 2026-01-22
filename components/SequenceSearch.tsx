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

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h2 className="text-lg font-semibold">Sequence Search</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Enter up to three cards in order to find the next likely draw.
      </p>

      <form action={formAction} className="mt-4 grid gap-3">
        <input type="hidden" name="upload_id" value={uploadId} />
        {[1, 2, 3].map((slot) => {
          const key = `card_${slot as 1 | 2 | 3}` as const;
          const filterValue = filters[key] || "";
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
              <input type="hidden" name={key} value={selected[key]} />
              <div className="mt-2 rounded-md border border-zinc-700 bg-zinc-950">
                <input
                  type="text"
                  value={filterValue}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      [key]: event.target.value,
                    }))
                  }
                  placeholder="Type to filter cards..."
                  className="w-full rounded-md bg-transparent px-3 py-2 text-sm text-zinc-100 outline-none"
                />
                <div className="max-h-40 overflow-y-auto border-t border-zinc-800">
                  {filteredCards.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-zinc-500">
                      No matches
                    </div>
                  ) : (
                    filteredCards.map((card) => (
                      <button
                        key={`${card.id}-${slot}`}
                        type="button"
                        onClick={() => {
                          setSelected((prev) => ({ ...prev, [key]: card.id }));
                          setFilters((prev) => ({
                            ...prev,
                            [key]: `${card.name} (${card.version})`,
                          }));
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-zinc-900 ${
                          selected[key] === card.id
                            ? "bg-zinc-900 text-emerald-300"
                            : "text-zinc-200"
                        }`}
                      >
                        <span>{card.name}</span>
                        <span className="text-xs text-zinc-500">
                          {card.version}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </label>
          );
        })}

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
              if (typeof window !== "undefined") {
                window.sessionStorage.removeItem(storageKey);
                window.location.reload();
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
        <div className="mt-4 space-y-3 text-sm text-zinc-200">
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Likely next cards
          </p>
          {state.matches.map((match, index) => (
            <div
              key={`${match.match_start_index}-${index}`}
              className="rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2"
            >
              <div className="text-xs text-zinc-400">
                Deck {match.deck_label} • {match.direction ?? "forward"} match •
                start {match.match_start_index}
              </div>
              {match.next_card ? (
                <div className="mt-1 font-semibold">
                  {match.next_card.card_name} • {match.next_card.rarity} •{" "}
                  {match.next_card.deck_label}
                </div>
              ) : (
                <div className="mt-1 text-zinc-400">
                  End of sequence reached.
                </div>
              )}
              {match.next_position_index ? (
                <a
                  href={`#deck-${match.deck_label}-${match.next_position_index}`}
                  className="mt-2 inline-flex text-xs font-semibold text-emerald-300 hover:underline"
                >
                  Highlight card #{match.next_position_index}
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
