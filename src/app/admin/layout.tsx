import { redirect } from "next/navigation";
import { verifyServerAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Server-side security guard for all /admin routes.
 *
 * Rules:
 * - NOT LOGGED IN -> redirect to /login
 * - LOGGED IN + NORMAL USER -> redirect to /
 * - LOGGED IN + ADMIN -> allow access
 *
 * Prevents unauthorized data access before sensitive admin content is exposed.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = await verifyServerAdmin();

  if (status === "unauthenticated") {
    redirect("/login?redirect=/admin");
  }

  if (status === "forbidden") {
    redirect("/");
  }

  return <>{children}</>;
}
