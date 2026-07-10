/**
 * @fileoverview Redirect (OAuth) Authentication Provider
 *
 * A redirect-based provider for third-party identity providers (Google,
 * Microsoft, …). It points the browser at the admin's OWN same-origin
 * `/api/auth/{provider}/start` route; that server-side route runs the OAuth
 * round-trip, delegates the secret code-exchange to the Go backend, and issues
 * the sessionid cookie on the admin origin (see src/app/api/auth/[provider]/).
 *
 * Session checks and sign-out reuse the same `/api/auth/*` proxy as the
 * credential provider, so the rest of the app is provider-agnostic.
 *
 * @module services/auth/oauth-provider
 */

import * as api from '@/services/api';
import type { AuthProvider, AuthUser } from './types';

export class OAuthRedirectProvider implements AuthProvider {
  readonly method = 'redirect' as const;

  constructor(readonly name: string) {}

  getSignInUrl({ returnTo }: { returnTo: string }): string {
    const base = `/api/auth/${encodeURIComponent(this.name)}/start`;
    return returnTo ? `${base}?returnTo=${encodeURIComponent(returnTo)}` : base;
  }

  async getSession(): Promise<AuthUser | null> {
    try {
      const status = await api.checkAuth();
      if (status.authenticated && status.userid && status.username) {
        return { userid: status.userid, username: status.username, role: status.role };
      }
      return null;
    } catch {
      return null;
    }
  }

  async signOut(): Promise<void> {
    await api.logout();
  }
}
