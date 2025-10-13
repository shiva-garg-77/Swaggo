/**
 * ReactionsService - Frontend abstraction for message reactions
 * Handles API calls and local cache; works with sockets for real-time
 */

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const _cache = new Map(); // key: messageId -> { reactions, ts }

function _key(messageId) {
  return String(messageId);
}

export async function fetchReactions(messageId) {
  const k = _key(messageId);
  const cached = _cache.get(k);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.reactions;
  try {
    const res = await fetch(`/api/messages/${encodeURIComponent(messageId)}/reactions`);
    if (!res.ok) throw new Error('Failed to load reactions');
    const data = await res.json();
    _cache.set(k, { reactions: Array.isArray(data) ? data : [], ts: Date.now() });
    return _cache.get(k).reactions;
  } catch (e) {
    return cached?.reactions || [];
  }
}

export async function addReaction({ messageId, chatId, emoji }) {
  // emoji can be unicode string or URL for custom emoji
  const payload = { messageId, chatId, emoji };
  const res = await fetch(`/api/messages/${encodeURIComponent(messageId)}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to add reaction');
  // Invalidate cache
  _cache.delete(_key(messageId));
}

export async function removeReaction({ messageId, chatId, emoji }) {
  const res = await fetch(`/api/messages/${encodeURIComponent(messageId)}/reactions`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId, chatId, emoji })
  });
  if (!res.ok) throw new Error('Failed to remove reaction');
  _cache.delete(_key(messageId));
}

export function primeReactions(messageId, reactions) {
  _cache.set(_key(messageId), { reactions: reactions || [], ts: Date.now() });
}