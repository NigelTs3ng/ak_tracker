import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

export type Profile = {
  id: string;
  email: string | null;
  role: "free" | "premium";
  active_device_id: string | null;
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
    .select("id,email,role,active_device_id")
    .eq("id", user.id)
    .single();

  return (data as Profile | null) ?? null;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile();
  if (profile?.active_device_id) {
    const cookieStore = await cookies();
    const deviceId = cookieStore.get("ak_device_id")?.value ?? "";
    if (!deviceId || deviceId !== profile.active_device_id) {
      redirect("/session-ended");
    }
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
