import { NextResponse } from "next/server";
import { createServerSupabaseClient, isSupabaseServerConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({ authenticated: false, role: "guest", isAdmin: false });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ authenticated: false, role: "guest", isAdmin: false });
    }

    const role = user.app_metadata?.role === "admin" ? "admin" : "user";
    return NextResponse.json({
      authenticated: true,
      userId: user.id,
      email: user.email,
      role,
      isAdmin: role === "admin",
    });
  } catch (e) {
    console.error("[Role API] Error:", e);
    return NextResponse.json({ authenticated: false, role: "guest", isAdmin: false });
  }
}
