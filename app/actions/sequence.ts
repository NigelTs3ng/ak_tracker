"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findSequenceMatches, SequenceCard } from "@/lib/sequence";

type SearchState = {
  matches: ReturnType<typeof findSequenceMatches>;
  message: string | null;
};

type UploadState = {
  message: string | null;
};

export async function searchSequenceAction(
  _prevState: SearchState,
  formData: FormData,
): Promise<SearchState> {
  const uploadId = String(formData.get("upload_id") ?? "");
  const inputCardIds = [
    formData.get("card_1"),
    formData.get("card_2"),
    formData.get("card_3"),
  ]
    .map((value) => (value ? String(value) : ""))
    .filter(Boolean);

  if (!uploadId || inputCardIds.length === 0) {
    return { matches: [], message: "Select at least one card to search." };
  }

  const supabase = await createSupabaseServerClient({ setCookies: true });
  const { data, error } = await supabase
    .from("card_sequences")
    .select(
      "position_index, deck_label, version, cards(id, name, type, rarity)",
    )
    .eq("upload_id", uploadId)
    .order("position_index", { ascending: true });

  if (error || !data) {
    return { matches: [], message: "Unable to search sequence right now." };
  }

  const sequence: SequenceCard[] = data.map((row) => ({
    position_index: row.position_index as number,
    card_id: row.cards?.id as string,
    card_name: row.cards?.name as string,
    type: row.cards?.type as string,
    rarity: row.cards?.rarity as string,
    version: row.version as string,
    deck_label: row.deck_label as string,
  }));

  const byDeck = new Map<string, SequenceCard[]>();
  sequence.forEach((row) => {
    const list = byDeck.get(row.deck_label) ?? [];
    list.push(row);
    byDeck.set(row.deck_label, list);
  });

  const matches = Array.from(byDeck.entries()).flatMap(([deck, cards]) => {
    const ordered = [...cards].sort(
      (a, b) => a.position_index - b.position_index,
    );
    const forward = findSequenceMatches(ordered, inputCardIds, "forward");
    const reverse = findSequenceMatches(ordered, inputCardIds, "reverse");
    return [...forward, ...reverse].map((match) => ({
      ...match,
      deck_label: deck,
    }));
  });
  if (matches.length === 0) {
    return {
      matches: [],
      message: "Deck may be shuffled or sequence not found.",
    };
  }

  return { matches, message: null };
}

export async function uploadSequenceAction(
  _prevState: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const user = await requireUser();
  const adminEmail = process.env.ADMIN_EMAIL ?? "";
  if (!adminEmail || user.email !== adminEmail) {
    return { message: "Only the admin can upload sequences." };
  }

  const selectedVersion = String(formData.get("version") ?? "").trim();
  if (!["v1", "v2", "v3"].includes(selectedVersion)) {
    return { message: "Please select a valid version." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { message: "Please choose an Excel (.xlsx) file." };
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    return { message: "No worksheet found in file." };
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, {
    defval: "",
  });

  if (rows.length === 0) {
    return { message: "No rows found in the spreadsheet." };
  }

  const admin = createSupabaseAdminClient();
  const { data: upload, error: uploadError } = await admin
    .from("sequence_uploads")
    .insert({ filename: file.name, uploaded_by: user.id, version: selectedVersion })
    .select("id")
    .single();

  if (uploadError || !upload) {
    return { message: "Failed to create upload record." };
  }

  const storagePath = `${upload.id}/${file.name}`;
  await admin.storage
    .from("sequence-files")
    .upload(storagePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: true,
    });

  const { data: cards } = await admin
    .from("cards")
    .select("id,name,version");

  if (!cards || cards.length === 0) {
    return {
      message:
        "No cards found in the database. Import cards before uploading sequences.",
    };
  }

  const cardLookup = new Map(
    (cards ?? []).map((card) => [
      `${String(card.name).toLowerCase()}::${card.version}`,
      card.id,
    ]),
  );

  const missingNames = new Set<string>();
  let invalidDeckCount = 0;
  let invalidPositionCount = 0;
  let versionMismatchCount = 0;

  const sequenceRows = rows
    .map((row, index) => {
      const name = String(
        row.name ??
          row.Name ??
          row["card_name"] ??
          row["Card Name"] ??
          "",
      ).trim();
      const rowVersion = String(row.version ?? row.Version ?? "")
        .trim()
        .toLowerCase();
      const version = rowVersion || selectedVersion;
      const deckLabel = String(
        row.deck_label ??
          row.Deck ??
          row.deck ??
          row["deck label"] ??
          row["Deck Label"] ??
          "",
      ).trim();
      const positionIndexRaw =
        row.position_index ??
        row.Position ??
        row["position index"] ??
        row["Position Index"] ??
        index + 1;
      const positionIndex = Number.parseInt(String(positionIndexRaw), 10);
      const cardId = cardLookup.get(`${name.toLowerCase()}::${version}`);
      const normalizedDeck = deckLabel.toUpperCase();

      if (
        !name ||
        !version ||
        (rowVersion && rowVersion !== selectedVersion)
      ) {
        if (rowVersion && rowVersion !== selectedVersion) {
          versionMismatchCount += 1;
        }
        return null;
      }

      if (Number.isNaN(positionIndex)) {
        invalidPositionCount += 1;
        return null;
      }

      if (!["A", "B", "C", "D"].includes(normalizedDeck)) {
        invalidDeckCount += 1;
        return null;
      }

      if (!cardId) {
        missingNames.add(name);
        return null;
      }

      return {
        upload_id: upload.id,
        position_index: positionIndex,
        card_id: cardId,
        deck_label: normalizedDeck,
        version: selectedVersion,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (sequenceRows.length === 0) {
    const missingList = Array.from(missingNames).slice(0, 8).join(", ");
    const missingMessage = missingNames.size
      ? `Missing cards (${missingNames.size}): ${missingList}.`
      : "";
    const deckMessage = invalidDeckCount
      ? `Invalid deck labels: ${invalidDeckCount}.`
      : "";
    const positionMessage = invalidPositionCount
      ? `Invalid positions: ${invalidPositionCount}.`
      : "";
    const versionMessage = versionMismatchCount
      ? `Rows with other versions: ${versionMismatchCount}.`
      : "";

    return {
      message:
        "No valid rows could be parsed. " +
        [missingMessage, deckMessage, positionMessage, versionMessage]
          .filter(Boolean)
          .join(" "),
    };
  }

  const { error: insertError } = await admin
    .from("card_sequences")
    .insert(sequenceRows);

  if (insertError) {
    return { message: "Failed to store sequence rows." };
  }

  revalidatePath("/sequence");
  return { message: "Sequence uploaded successfully." };
}
