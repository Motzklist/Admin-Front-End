/**
 * @fileoverview Authentication Provider Interface (Strategy Pattern)
 *
 * Any authentication backend / identity provider — the username/password
 * backend, Google, Microsoft, etc. — implements this interface, so the admin
 * app can switch sign-in mechanisms by setting NEXT_PUBLIC_AUTH_PROVIDER. This
 * mirrors the same abstraction in the public Front-End.
 *
 * Because the admin talks to the Go backend through its own same-origin Next.js
 * `/api/*` proxy (so the sessionid cookie lands on the admin origin), a redirect
 * provider points the browser at the admin's own `/api/auth/{provider}/start`
 * route, which runs the OAuth round-trip server-side.
 *
 * @module services/auth/types
 */

import type { AdminRole } from '@/types/api';

export type AuthMethod = 'credentials' | 'redirect';

export interface AuthUser {
  userid: string;
  username: string;
  role?: AdminRole;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthProvider {
  /** Human-readable provider name (e.g. 'api', 'google'). */
  readonly name: string;
  /** Which sign-in family this provider offers; drives the sign-in UI. */
  readonly method: AuthMethod;

  /** Current session, or null when unauthenticated. Never throws. */
  getSession(): Promise<AuthUser | null>;

  /** Ends the active session. */
  signOut(): Promise<void>;

  /** Credential sign-in. Present on `credentials` providers. */
  signInWithCredentials?(credentials: AuthCredentials): Promise<AuthUser>;

  /**
   * Same-origin URL that begins a redirect sign-in. Present on `redirect`
   * providers. The browser navigates here; the admin's own Next.js route drives
   * the provider round-trip and returns the user to `returnTo`.
   */
  getSignInUrl?(options: { returnTo: string }): string;
}
