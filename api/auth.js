import { SignJWT } from 'jose';

const encoder = new TextEncoder();

// 메모리 기반 rate limit (IP별 5회/분)
// Serverless 콜드 스타트 시 리셋되지만, 6자리 PIN(100만 조합)과 조합하면 무차별 대입 비현실적
const failMap = new Map();
const MAX_FAILS = 5;
const COOLDOWN_MS = 60_000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = failMap.get(ip);
  if (!entry) return true;
  if (now > entry.resetAt) { failMap.delete(ip); return true; }
  return entry.count < MAX_FAILS;
}

function recordFail(ip) {
  const now = Date.now();
  const entry = failMap.get(ip) || { count: 0, resetAt: now + COOLDOWN_MS };
  entry.count++;
  if (entry.count >= MAX_FAILS) entry.resetAt = now + COOLDOWN_MS;
  failMap.set(ip, entry);
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const ip = request.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';

  if (!checkRateLimit(ip)) {
    return response.status(429).json({ error: 'Too many attempts. Try again later.' });
  }

  const { pin } = request.body || {};
  const expected = process.env.DASH_PIN;

  if (!pin || String(pin) !== String(expected)) {
    recordFail(ip);
    return response.status(401).json({ error: 'Invalid PIN' });
  }

  failMap.delete(ip);

  const secret = encoder.encode(process.env.DASH_SECRET);
  const token = await new SignJWT({ sub: 'dashboard' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);

  response.setHeader('Set-Cookie', [
    `session=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/`
  ]);

  return response.status(200).json({ ok: true });
}
