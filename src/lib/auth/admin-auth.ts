import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/server";

export interface AdminAuthResult {
  authorized: boolean;
  userId?: string;
  errorResponse?: NextResponse;
}

/**
 * Server-side authorization check for admin operations and API endpoints.
 * Validates either Bearer token in the Authorization header or the SSR cookie session.
 * Rejects unauthorized users before any admin data or actions are processed.
 */
export async function authorizeAdminRequest(req?: NextRequest): Promise<AdminAuthResult> {
  if (!isSupabaseAdminConfigured()) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: "Admin access requires server configuration." },
        { status: 503 }
      ),
    };
  }

  try {
    // 1. Check Bearer token if passed in Authorization header
    if (req) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        const token = authHeader.slice(7).trim();
        const adminSupabase = createAdminSupabaseClient();
        const { data: { user }, error } = await adminSupabase.auth.getUser(token);

        if (error || !user) {
          return {
            authorized: false,
            errorResponse: NextResponse.json(
              { error: "Authentication required." },
              { status: 401 }
            ),
          };
        }

        if (user.app_metadata?.role !== "admin") {
          return {
            authorized: false,
            errorResponse: NextResponse.json(
              { error: "Forbidden: Admin privileges required." },
              { status: 403 }
            ),
          };
        }

        return { authorized: true, userId: user.id };
      }
    }

    // 2. Check cookie-based session
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user }, error } = await serverSupabase.auth.getUser();

    if (error || !user) {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          { error: "Authentication required." },
          { status: 401 }
        ),
      };
    }

    if (user.app_metadata?.role !== "admin") {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          { error: "Forbidden: Admin privileges required." },
          { status: 403 }
        ),
      };
    }

    return { authorized: true, userId: user.id };
  } catch (e) {
    console.error("[authorizeAdminRequest] Error:", e);
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: "Authentication check failed." },
        { status: 401 }
      ),
    };
  }
}
