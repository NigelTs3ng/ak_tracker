"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ActionState = {
  error: string | null;
};

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const deviceId = String(formData.get("device_id") ?? "");
  if (!deviceId) {
    return { error: "Device session not ready. Please try again." };
  }

  const supabase = await createSupabaseServerClient({ setCookies: true });
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (deviceId && data.user) {
    const cookieStore = await cookies();
    cookieStore.set("ak_device_id", deviceId, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      secure: true,
    });

    try {
      const admin = createSupabaseAdminClient();
      await admin
        .from("profiles")
        .update({ active_device_id: deviceId })
        .eq("id", data.user.id);
    } catch {
      await supabase
        .from("profiles")
        .update({ active_device_id: deviceId })
        .eq("id", data.user.id);
    }

    try {
      const admin = createSupabaseAdminClient();
      await (admin.auth.admin as any).signOut(data.user.id, "others");
    } catch {
      // Ignore admin sign-out failures; device checks still enforce single session.
    }
  }

  redirect("/cards");
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const deviceId = String(formData.get("device_id") ?? "");
  if (!deviceId) {
    return { error: "Device session not ready. Please try again." };
  }
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://ak-tracker.vercel.app";

  const supabase = await createSupabaseServerClient({ setCookies: true });
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/login`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (deviceId && data.user) {
    const cookieStore = await cookies();
    cookieStore.set("ak_device_id", deviceId, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      secure: true,
    });

    try {
      const admin = createSupabaseAdminClient();
      await admin
        .from("profiles")
        .update({ active_device_id: deviceId })
        .eq("id", data.user.id);
    } catch {
      await supabase
        .from("profiles")
        .update({ active_device_id: deviceId })
        .eq("id", data.user.id);
    }
  }

  redirect("/cards");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient({ setCookies: true });
  await supabase.auth.signOut();
  redirect("/login");
}
