import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    // Validation
    const trimmedName = typeof fullName === "string" ? fullName.trim() : "";
    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanPassword = typeof password === "string" ? password : "";

    if (!trimmedName || trimmedName.length < 2) {
      return NextResponse.json(
        { error: "Enter your name (at least 2 characters)." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (!cleanPassword || cleanPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Authentication service is currently unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const admin = createAdminSupabaseClient();

    // Check if user already exists
    const { data: userList } = await admin.auth.admin.listUsers();
    const existing = userList?.users?.find(
      (u) => u.email?.toLowerCase() === trimmedEmail
    );

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in instead." },
        { status: 409 }
      );
    }

    // Create user with confirmed email so they can log in seamlessly
    // New accounts strictly default to "user" role. NEVER default to admin.
    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email: trimmedEmail,
      password: cleanPassword,
      email_confirm: true,
      app_metadata: {
        role: "user",
      },
      user_metadata: {
        display_name: trimmedName,
        full_name: trimmedName,
      },
    });


    if (createError) {
      console.error("[SignUp API] Error creating user:", createError.message);
      return NextResponse.json(
        { error: "Could not create account. Please try again." },
        { status: 500 }
      );
    }

    const newUserId = createData.user.id;

    // Ensure idempotent profile row in public.profiles
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        user_id: newUserId,
        display_name: trimmedName,
        avatar_url: "",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (profileError) {
      console.warn("[SignUp API] Profile creation notice:", profileError.message);
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully.",
      user: {
        id: newUserId,
        email: trimmedEmail,
        displayName: trimmedName,
      },
    });
  } catch (error) {
    console.error("[SignUp API Exception]:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
