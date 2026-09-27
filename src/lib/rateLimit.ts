const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfter: 0 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, retryAfter: 0 };
}

const CLEANUP_INTERVAL = 60000;
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store) {
    if (now > record.resetAt) store.delete(key);
  }
}, CLEANUP_INTERVAL);

export function extractIp(request: Request): string {
  // Prefer Cloudflare's authoritative header over spoofable x-forwarded-for
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || '127.0.0.1';
}