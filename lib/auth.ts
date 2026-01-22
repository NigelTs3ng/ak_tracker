import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

export type Profile = {
  id: string;
  email: string | null;
  role: "free" | "premium";
};

export async function getUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
}

export async function getProfile() {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,email,role")
    .eq("id", user.id)
    .single();

  return (data as Profile | null) ?? null;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requirePremium() {
  const profile = await getProfile();
  if (!profile) {
    redirect("/login");
  }

  return profile;
}
