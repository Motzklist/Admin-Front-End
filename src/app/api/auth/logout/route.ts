/**
 * @fileoverview Authentication Logout API Route
 *
 * POST /api/auth/logout
 * Proxies logout requests to the backend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendLogout } from '@/services/backendApi';

export async function POST(request: NextRequest) {
  try {
    // Get session cookie from request
    const cookie = request.headers.get('cookie');

    // Call backend logout
    await backendLogout(cookie || undefined);

    // Clear session cookie
    const response = NextResponse.json({ success: true });

    // Clear any session cookies
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout API error:', error);

    // Return success anyway (local logout)
    return NextResponse.json({ success: true });
  }
}

