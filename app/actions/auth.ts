"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionState = {
  error: string | null;
};

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createSupabaseServerClient({ setCookies: true });
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/cards");
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://ak-tracker.vercel.app";

  const supabase = await createSupabaseServerClient({ setCookies: true });
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/login`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/cards");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient({ setCookies: true });
  await supabase.auth.signOut();
  redirect("/login");
}
