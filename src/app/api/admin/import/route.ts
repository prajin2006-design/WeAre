import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseAdminConfigured } from '@/lib/supabase/server';
import { isTMDBConfigured } from '@/lib/tmdb/client';
import { importMoviesFromTMDB, importSeriesFromTMDB, importCatalogFromTMDB } from '@/lib/tmdb/importer';
import { authorizeAdminRequest } from '@/lib/auth/admin-auth';

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeAdminRequest(req);
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        {
          error: 'Supabase admin credentials (SUPABASE_SERVICE_ROLE_KEY) are not configured in .env.local.',
        },
        { status: 503 }
      );
    }


    if (!isTMDBConfigured()) {
      return NextResponse.json(
        {
          error: 'TMDB API Token (TMDB_API_TOKEN) is not configured in .env.local.',
        },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const type = body.type || 'all';
    const movieLimit = Number(body.movieLimit || body.limit) || 20;
    const seriesLimit = Number(body.seriesLimit || body.limit) || 10;

    if (type === 'series') {
      const result = await importSeriesFromTMDB(seriesLimit);
      return NextResponse.json(result);
    } else if (type === 'movies') {
      const result = await importMoviesFromTMDB(movieLimit);
      return NextResponse.json(result);
    } else {
      const result = await importCatalogFromTMDB(movieLimit, seriesLimit);
      return NextResponse.json(result);
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Import failed' },
      { status: 500 }
    );
  }
}

