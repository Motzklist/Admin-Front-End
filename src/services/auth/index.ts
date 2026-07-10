/**
 * @fileoverview Authentication Provider Factory
 *
 * Selects the active authentication provider from NEXT_PUBLIC_AUTH_PROVIDER
 * (default 'api' = username/password). Mirrors the public Front-End factory.
 *
 * To enable Google sign-in: set NEXT_PUBLIC_AUTH_PROVIDER=google (build-time),
 * provide GOOGLE_CLIENT_ID to the admin server (for the authorize redirect) and
 * GOOGLE_CLIENT_SECRET to the backend (for the code exchange).
 *
 * @module services/auth
 */

import type { AuthProvider } from './types';
import { ApiAuthProvider } from './api-provider';
import { OAuthRedirectProvider } from './oauth-provider';

type AuthProviderName = 'api' | 'google' | 'microsoft';

const providers: Record<AuthProviderName, () => AuthProvider> = {
  api: () => new ApiAuthProvider(),
  google: () => new OAuthRedirectProvider('google'),
  microsoft: () => new OAuthRedirectProvider('microsoft'),
};

let cachedProvider: AuthProvider | null = null;

export function getAuthProvider(): AuthProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = (process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'api') as AuthProviderName;

  const factory = providers[providerName];
  if (!factory) {
    throw new Error(
      `[Auth] Unknown provider "${providerName}". Valid options: ${Object.keys(providers).join(', ')}`,
    );
  }
  cachedProvider = factory();
  return cachedProvider;
}
