"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
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
