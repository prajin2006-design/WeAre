import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export function isSupabaseServerConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && anonKey && url.startsWith('http') && !url.includes('your-project'));
}

export function isSupabaseAdminConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && serviceKey && url.startsWith('http') && !url.includes('your-project') && !serviceKey.includes('your-service'));
}

/**
 * Creates a server-side Supabase client with Next.js cookie handling.
 * Safe for Server Components, Server Actions, and Route Handlers.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}

/**
 * Creates an admin Supabase client with the service role key.
 * Strictly SERVER-SIDE ONLY. Never import or use in client components.
 */
export function createAdminSupabaseClient() {
  if (typeof window !== 'undefined') {
    throw new Error('FATAL: createAdminSupabaseClient cannot be called from browser client code.');
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || url.includes('your-project') || serviceKey.includes('your-service')) {
    throw new Error('Supabase admin credentials (SUPABASE_SERVICE_ROLE_KEY) are not configured in .env.local.');
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export interface ServerAdminVerification {
  isAdmin: boolean;
  status: 'unauthenticated' | 'forbidden' | 'authorized';
  user: {
    id: string;
    email?: string;
    role: string;
  } | null;
}

/**
 * Verifies if the incoming request / SSR session has legitimate admin authority.
 * Strictly SERVER-SIDE ONLY. Checks the session user and their secure app_metadata.
 */
export async function verifyServerAdmin(): Promise<ServerAdminVerification> {
  if (!isSupabaseServerConfigured()) {
    return { isAdmin: false, status: 'unauthenticated', user: null };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { isAdmin: false, status: 'unauthenticated', user: null };
    }

    const role = user.app_metadata?.role;
    if (role === 'admin') {
      return {
        isAdmin: true,
        status: 'authorized',
        user: { id: user.id, email: user.email, role: 'admin' },
      };
    }

    return {
      isAdmin: false,
      status: 'forbidden',
      user: { id: user.id, email: user.email, role: 'user' },
    };
  } catch (e) {
    console.error('[verifyServerAdmin] Error:', e);
    return { isAdmin: false, status: 'unauthenticated', user: null };
  }
}

