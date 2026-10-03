/**
 * Official TMDB API Client
 * SERVER-SIDE ONLY. Never import this file into Client Components.
 */

import "server-only";
import dns from "node:dns";
import https from "node:https";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Configure resilient public DNS resolver to prevent ISP DNS poisoning/timeouts
const dnsResolver = new dns.Resolver();
dnsResolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

const customDnsLookup: https.RequestOptions["lookup"] = (
  hostname,
  options,
  callback
) => {
  const cb = typeof options === "function" ? options : callback;
  const opts = typeof options === "object" && options !== null ? options : {};

  dnsResolver.resolve4(hostname, (err, addresses) => {
    if (err || !addresses || addresses.length === 0) {
      return dns.lookup(hostname, opts as dns.LookupOneOptions, cb as (err: NodeJS.ErrnoException | null, address: string, family: number) => void);
    }
    if ((opts as dns.LookupAllOptions)?.all) {
      const allCb = cb as (err: NodeJS.ErrnoException | null, addresses: dns.LookupAddress[]) => void;
      return allCb(null, addresses.map((a) => ({ address: a, family: 4 })));
    }
    const oneCb = cb as (err: NodeJS.ErrnoException | null, address: string, family: number) => void;
    return oneCb(null, addresses[0], 4);
  });
};

export function isTMDBConfigured(): boolean {
  const token = process.env.TMDB_API_TOKEN;
  return Boolean(token && token.trim().length > 15 && !token.includes("your-tmdb"));
}

export async function tmdbFetch<T>(
  endpoint: string,
  options?: {
    params?: Record<string, string | number | boolean | undefined>;
    revalidateSeconds?: number;
  }
): Promise<T | null> {
  if (typeof window !== "undefined") {
    throw new Error("FATAL: TMDB API requests cannot be made directly from browser client code.");
  }

  const token = process.env.TMDB_API_TOKEN;
  if (!token || !isTMDBConfigured()) {
    return null;
  }

  const url = new URL(`${TMDB_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`);

  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  try {
    const isJwt = token.startsWith("eyJ");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "WeAre-Streaming/1.0",
    };

    if (isJwt) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      url.searchParams.set("api_key", token);
    }

    // Node:https with custom DNS lookup (fast and resilient)
    const result = await new Promise<T | null>((resolve) => {
      const req = https.get(
        url.toString(),
        {
          lookup: customDnsLookup,
          headers,
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            if (res.statusCode !== 404) {
              console.warn(`[TMDB API Notice] ${res.statusCode} for endpoint: ${endpoint}`);
            }
            resolve(null);
            return;
          }
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(body) as T);
            } catch {
              resolve(null);
            }
          });
        }
      );

      req.setTimeout(6000, () => {
        req.destroy();
        resolve(null);
      });

      req.on("error", () => resolve(null));
    });

    return result;
  } catch (error) {
    console.error(`[TMDB Exception] endpoint ${endpoint}:`, error);
    return null;
  }
}
