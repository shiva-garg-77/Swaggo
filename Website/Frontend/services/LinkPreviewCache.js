/*
 * LinkPreviewCache - shared cache and in-flight dedupe for link previews
 */

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ENTRIES = 200;

const cache = new Map(); // url -> { data, ts }
const inflight = new Map(); // url -> Promise

function normalize(url) {
  try {
    return new URL(url).toString();
  } catch {
    return String(url || '').trim();
  }
}

function sweep() {
  const now = Date.now();
  for (const [u, entry] of cache.entries()) {
    if (now - entry.ts > TTL_MS) cache.delete(u);
  }
  if (cache.size > MAX_ENTRIES) {
    // Drop oldest
    const items = Array.from(cache.entries()).sort((a, b) => a[1].ts - b[1].ts);
    const excess = items.length - MAX_ENTRIES;
    for (let i = 0; i < excess; i++) cache.delete(items[i][0]);
  }
}

async function fetchPreview(url) {
  const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error('Failed to fetch link preview');
  return await res.json();
}

export async function prefetch(url) {
  const key = normalize(url);
  if (!key) return null;
  sweep();
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < TTL_MS) return entry.data;
  if (inflight.has(key)) return inflight.get(key);
  const p = fetchPreview(key)
    .then((data) => {
      cache.set(key, { data, ts: Date.now() });
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });
  inflight.set(key, p);
  return p;
}

export async function get(url) {
  const key = normalize(url);
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < TTL_MS) return entry.data;
  try {
    return await prefetch(key);
  } catch (e) {
    return entry?.data || null;
  }
}

export function set(url, data) {
  const key = normalize(url);
  cache.set(key, { data, ts: Date.now() });
  sweep();
}

export function clear(url) {
  const key = normalize(url);
  cache.delete(key);
}

export function has(url) {
  const key = normalize(url);
  const entry = cache.get(key);
  return !!entry && Date.now() - entry.ts < TTL_MS;
}
