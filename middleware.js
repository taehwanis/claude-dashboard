import { jwtVerify } from 'jose';

const encoder = new TextEncoder();

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export default async function middleware(request) {
  const url = new URL(request.url);

  if (url.pathname === '/api/auth') {
    return;
  }

  const cookie = request.headers.get('cookie') || '';
  const sessionMatch = cookie.match(/session=([^;]+)/);
  const token = sessionMatch?.[1];

  if (token) {
    try {
      const secret = encoder.encode(process.env.DASH_SECRET);
      await jwtVerify(token, secret);
      return;
    } catch {
      // expired or invalid
    }
  }

  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return;
}
