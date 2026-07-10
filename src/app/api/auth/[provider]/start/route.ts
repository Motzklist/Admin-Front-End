/**
 * @fileoverview OAuth start route — GET /api/auth/[provider]/start
 *
 * Begins a third-party (redirect) sign-in from the admin origin. Because the
 * admin's sessionid cookie must be issued on the admin origin (its `/api/*`
 * proxy only forwards admin-origin cookies), the admin server — not the Go
 * backend — drives the browser redirect and later issues the cookie. The Go
 * backend still owns the client secret and performs the code exchange
 * (POST /api/auth/{provider}/exchange), called from the callback route.
 *
 * Dev mode (OAUTH_DEV_MODE=true) skips the real provider and goes straight to
 * the callback, which mints a dev session via the backend's own dev mode.
 */

import { NextRequest, NextResponse } from 'next/server';

// Authorization endpoints per provider. The client id is public (server env);
// the client secret stays on the Go backend.
const OAUTH_ENDPOINTS: Record<string, { authURL: string; scopes: string }> = {
  google: {
    authURL: 'https://accounts.google.com/o/oauth2/v2/auth',
    scopes: 'openid email profile',
  },
  microsoft: {
    authURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    scopes: 'openid email profile',
  },
};

type Ctx = { params: Promise<{ provider: string }> };

// Only allow same-origin relative return paths (open-redirect guard).
function safeReturnTo(raw: string | null): string {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
}

// Browser-facing origin. Inside the container request.nextUrl.origin resolves to
// the bind address (http://0.0.0.0:3001), which the browser can't navigate to,
// so derive it from the forwarded/Host header the browser actually sent.
function requestOrigin(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost:3001';
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest, ctx: Ctx) {
  const { provider } = await ctx.params;
  const origin = requestOrigin(request);
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const callbackUrl = `${origin}/api/auth/${provider}/callback`;

  // Dev mode: skip the identity provider; the callback mints a dev session.
  if (process.env.OAUTH_DEV_MODE === 'true') {
    const url = new URL(callbackUrl);
    url.searchParams.set('dev', '1');
    url.searchParams.set('returnTo', returnTo);
    return NextResponse.redirect(url);
  }

  const endpoints = OAUTH_ENDPOINTS[provider];
  if (!endpoints) {
    return NextResponse.json({ error: 'Unknown auth provider' }, { status: 404 });
  }
  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
  if (!clientId) {
    return NextResponse.json(
      { error: `Auth provider "${provider}" is not configured` },
      { status: 503 },
    );
  }

  const state = crypto.randomUUID();
  const authUrl = new URL(endpoints.authURL);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', endpoints.scopes);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'select_account');

  const response = NextResponse.redirect(authUrl);
  // Bind state + returnTo to the browser for CSRF validation at the callback.
  response.cookies.set('admin_oauth_state', `${state}|${encodeURIComponent(returnTo)}`, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return response;
}
