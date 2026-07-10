/**
 * @fileoverview OAuth callback route — GET /api/auth/[provider]/callback
 *
 * The identity provider redirects the browser here after the user authenticates
 * (or the start route redirects here directly in dev mode). We validate the CSRF
 * state, hand the authorization code to the Go backend for the secret exchange
 * (POST /api/auth/{provider}/exchange), then relay the backend's sessionid
 * Set-Cookie onto the admin origin and redirect the user back into the app.
 *
 * On the admin origin the AuthContext re-checks /api/auth/status on mount, so no
 * client-side callback page is needed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendRequest } from '@/services/backendApi';

type Ctx = { params: Promise<{ provider: string }> };

function safeReturnTo(raw: string | null): string {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
}

// Browser-facing origin (see the start route): request.nextUrl.origin resolves
// to the container bind address inside Docker, so use the forwarded/Host header.
function requestOrigin(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost:3001';
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest, ctx: Ctx) {
  const { provider } = await ctx.params;
  const origin = requestOrigin(request);
  const params = request.nextUrl.searchParams;
  const dev = params.get('dev') === '1' || process.env.OAUTH_DEV_MODE === 'true';

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(reason)}`, origin));

  let returnTo = safeReturnTo(params.get('returnTo'));
  let exchangeBody: Record<string, string> = {};

  if (!dev) {
    // CSRF: the state param must match the one bound to our httpOnly cookie.
    const stateCookie = request.cookies.get('admin_oauth_state')?.value;
    const stateParam = params.get('state');
    if (!stateCookie || !stateParam) return fail('invalid_state');
    const [boundState, boundReturn] = stateCookie.split('|');
    if (boundState !== stateParam) return fail('invalid_state');
    if (boundReturn) returnTo = safeReturnTo(decodeURIComponent(boundReturn));

    const providerError = params.get('error');
    if (providerError) return fail(providerError);
    const code = params.get('code');
    if (!code) return fail('missing_code');

    // The backend re-uses this exact redirect_uri when exchanging the code.
    exchangeBody = { code, redirect_uri: `${origin}/api/auth/${provider}/callback` };
  }

  const result = await backendRequest(`/api/auth/${provider}/exchange`, {
    method: 'POST',
    json: exchangeBody,
  });

  if (result.status < 200 || result.status >= 300) {
    return fail('signin_failed');
  }

  const response = NextResponse.redirect(new URL(returnTo, origin));
  // Relay the backend's sessionid cookie onto the admin origin, and clear the
  // one-time CSRF state cookie. Both are appended as raw Set-Cookie headers:
  // mixing response.headers.set('set-cookie') with response.cookies.set() makes
  // the latter clobber the former, dropping the session cookie.
  if (result.setCookie) response.headers.append('set-cookie', result.setCookie);
  response.headers.append('set-cookie', 'admin_oauth_state=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
  return response;
}
