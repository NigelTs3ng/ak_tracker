"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateCardQuantityAction(formData: FormData) {
  const user = await requireUser();
  const cardId = String(formData.get("card_id") ?? "");
  const quantityRaw = String(formData.get("quantity") ?? "0");
  const quantity = Number.parseInt(quantityRaw, 10);

  if (!cardId || Number.isNaN(quantity) || quantity < 0) {
    return;
  }

  const supabase = await createSupabaseServerClient({ setCookies: true });
  await supabase.from("user_cards").upsert(
    {
      user_id: user.id,
      card_id: cardId,
      quantity,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,card_id" },
  );

  revalidatePath("/cards");
  revalidatePath("/community");
}

type UploadCardsState = {
  message: string | null;
};

export async function uploadCardsAction(
  _prevState: UploadCardsState,
  formData: FormData,
): Promise<UploadCardsState> {
  const user = await requireUser();
  const adminEmail = process.env.ADMIN_EMAIL ?? "";
  if (!adminEmail || user.email !== adminEmail) {
    return { message: "Only the admin can upload card lists." };
  }

  const selectedVersion = String(formData.get("version") ?? "").trim();
  if (!["v1", "v2", "v3", "v4", "v5", "v6"].includes(selectedVersion)) {
    return { message: "Please select a valid version." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { message: "Please choose a CSV or Excel file." };
  }

  let rows: Record<string, string | number>[];
  if (file.name.toLowerCase().endsWith(".csv")) {
    const text = await file.text();
    const workbook = XLSX.read(text, { type: "string" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, {
      defval: "",
    });
  } else {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) {
      return { message: "No worksheet found in file." };
    }
    rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, {
      defval: "",
    });
  }

  if (!rows || rows.length === 0) {
    return { message: "No rows found in the file." };
  }

  const invalidRows: string[] = [];
  const cards = rows
    .map((row, index) => {
      const name = String(row.name ?? row.Name ?? "").trim();
      const type = String(row.type ?? row.Type ?? "")
        .trim()
        .toLowerCase();
      const rarity = String(row.rarity ?? row.Rarity ?? "")
        .trim()
        .toLowerCase();
      const rowVersion = String(row.version ?? row.Version ?? "")
        .trim()
        .toLowerCase();
      const version = rowVersion || selectedVersion;
      const imageUrl = String(row.image_url ?? row.ImageUrl ?? row.image ?? "")
        .trim()
        .replace(/\s+/g, "");
      const serial = String(row.serial ?? row.Serial ?? "").trim();

      if (
        !name ||
        !type ||
        !rarity ||
        !version ||
        (rowVersion && rowVersion !== selectedVersion)
      ) {
        invalidRows.push(String(index + 1));
        return null;
      }

      return {
        name,
        type,
        rarity,
        version,
        image_url: imageUrl || null,
        serial: serial || null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (cards.length === 0) {
    return {
      message:
        "No valid rows could be parsed. Check required fields and version.",
    };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("cards").insert(cards);
  if (error) {
    return { message: `Failed to upload cards: ${error.message}` };
  }

  revalidatePath("/cards");
  return {
    message: `Uploaded ${cards.length} cards. Skipped ${invalidRows.length}.`,
  };
}
