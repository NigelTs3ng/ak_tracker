export type SequenceCard = {
  position_index: number;
  card_id: string;
  card_name: string;
  type: string;
  rarity: string;
  version: string;
  deck_label: string;
};

export type SequenceMatch = {
  match_start_index: number;
  next_position_index: number | null;
  next_card: SequenceCard | null;
  deck_label?: string;
  direction?: "forward" | "reverse";
};

export function findSequenceMatches(
  sequence: SequenceCard[],
  inputCardIds: string[],
  direction: "forward" | "reverse" = "forward",
): SequenceMatch[] {
  if (inputCardIds.length === 0) return [];

  const matches: SequenceMatch[] = [];
  const ids =
    direction === "reverse" ? [...inputCardIds].reverse() : inputCardIds;
  const maxStart = sequence.length - inputCardIds.length;

  for (let i = 0; i <= maxStart; i += 1) {
    let isMatch = true;

    for (let j = 0; j < ids.length; j += 1) {
      if (sequence[i + j]?.card_id !== ids[j]) {
        isMatch = false;
        break;
      }
    }

    if (isMatch) {
      const nextIndex =
        direction === "reverse" ? i - 1 : i + inputCardIds.length;
      const nextCard = sequence[nextIndex] ?? null;
      const matchStart =
        direction === "reverse"
          ? sequence[i + ids.length - 1]?.position_index
          : sequence[i]?.position_index;

      matches.push({
        match_start_index: matchStart ?? sequence[i].position_index,
        next_position_index: nextCard ? nextCard.position_index : null,
        next_card: nextCard,
        direction,
      });
    }
  }

  return matches;
}
