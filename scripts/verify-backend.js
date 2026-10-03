/* eslint-disable */
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx > -1) {
    process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tmdbToken = process.env.TMDB_API_TOKEN;

async function checkAll() {
  console.log('\n========================================');
  console.log('WEARE LIVE BACKEND VERIFICATION REPORT');
  console.log('========================================\n');

  // 1. Supabase Connection Check
  let supabaseOk = false;
  try {
    const supabase = createClient(supabaseUrl, anonKey);
    const { data, error } = await supabase.auth.getSession();
    if (!error) {
      console.log('1. Supabase Connection: PASS');
      supabaseOk = true;
    } else {
      console.log('1. Supabase Connection: FAIL -', error.message);
    }
  } catch (e) {
    console.log('1. Supabase Connection: FAIL -', e.message);
  }

  // 2. Database Schema Check
  const tables = [
    'profiles', 'movies', 'series', 'seasons', 'episodes',
    'genres', 'movie_genres', 'series_genres', 'cast_members',
    'movie_cast', 'series_cast', 'watch_progress', 'watch_history',
    'my_list', 'ratings', 'video_sources', 'subtitles'
  ];

  let missingTables = [];
  if (supabaseOk) {
    const supabase = createClient(supabaseUrl, anonKey);
    for (const t of tables) {
      const { error } = await supabase.from(t).select('*').limit(1);
      if (error && error.code === 'PGRST205') {
        missingTables.push(t);
      }
    }

    if (missingTables.length === 0) {
      console.log('2. Database Schema (17 tables): PASS');
    } else {
      console.log(`2. Database Schema: FAIL (${missingTables.length}/${tables.length} tables missing in schema cache)`);
      console.log('   Missing tables:', missingTables.join(', '));
    }
  } else {
    console.log('2. Database Schema: FAIL (Cannot connect to Supabase)');
  }

  // 3. TMDB API Check
  if (tmdbToken && tmdbToken.length > 15) {
    try {
      const isJwt = tmdbToken.startsWith('eyJ');
      const url = isJwt
        ? 'https://api.themoviedb.org/3/movie/popular?page=1'
        : `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbToken}&page=1`;
      const headers = isJwt
        ? { Authorization: `Bearer ${tmdbToken}`, Accept: 'application/json' }
        : { Accept: 'application/json' };

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        console.log(`3. TMDB API: PASS (Successfully fetched ${data.results?.length || 0} movies)`);
      } else {
        console.log(`3. TMDB API: FAIL (HTTP status ${res.status})`);
      }
    } catch (e) {
      console.log('3. TMDB API: FAIL -', e.message);
    }
  } else {
    console.log('3. TMDB API: PENDING (TMDB_API_TOKEN is empty in .env.local)');
  }

  console.log('\n========================================\n');
}

checkAll().catch(console.error);
