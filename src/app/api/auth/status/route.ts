/**
 * @fileoverview Authentication Status API Route
 *
 * GET /api/auth/status
 * Checks if user is authenticated with the backend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendCheckAuth } from '@/services/backendApi';

export async function GET(request: NextRequest) {
  try {
    // Get session cookie from request
    const cookie = request.headers.get('cookie');

    // Check auth with backend
    const authStatus = await backendCheckAuth(cookie || undefined);

    return NextResponse.json({
      success: true,
      data: {
        authenticated: true,
        ...((typeof authStatus === 'object' && authStatus !== null) ? authStatus : {}),
      },
    });
  } catch (error) {
    console.error('Auth status check error:', error);

    return NextResponse.json(
      {
        authenticated: false,
        error: 'Not authenticated'
      },
      { status: 401 }
    );
  }
}

