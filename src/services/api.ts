/**
 * @fileoverview Client-Side API Service
 *
 * This module provides client-side API communication functions for the Admin Front-End.
 *
 * SECURITY APPROACH:
 * - All requests go through Next.js API routes (/api/*) instead of directly to the backend
 * - This provides an additional security layer and allows for:
 *   - Server-side session validation
 *   - Secret management (backend URL hidden from client)
 *   - Request sanitization and rate limiting
 *   - CSRF protection
 *
 * @module services/api
 */

import type {
  LoginCredentials,
  LoginResponse,
  AuthStatusResponse,
  Equipment,
  EquipmentPayload,
  Order,
  OrderStatusUpdate,
  DashboardStats,
  School,
  Grade,
  ApiResponse,
  ApiError,
} from '@/types/api';

/**
 * Base URL for API calls - points to Next.js API routes
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Custom error class for API errors
 */
export class ApiRequestError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Always include cookies for session management
  };

  try {
    const response = await fetch(url, config);

    // Try to parse response body
    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle non-OK responses
    if (!response.ok) {
      const errorMessage =
        (typeof data === 'object' && data?.error) ||
        (typeof data === 'object' && data?.message) ||
        (typeof data === 'string' ? data : undefined) ||
        `Request failed with status ${response.status}`;

      throw new ApiRequestError(errorMessage, response.status);
    }

    // Return data directly if it's a successful response
    return (typeof data === 'object' && data?.data !== undefined) ? data.data : data;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    // Network or other errors
    console.error('API request failed:', error);
    throw new ApiRequestError(
      error instanceof Error ? error.message : 'Network error occurred'
    );
  }
}

// =============================================================================
// Authentication API
// =============================================================================

/**
 * Authenticate admin user
 *
 * @param credentials - Admin login credentials
 * @returns Promise resolving to login response with user data
 * @throws {ApiRequestError} If authentication fails
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

/**
 * Log out current admin user
 *
 * @returns Promise resolving when logout is complete
 * @throws {ApiRequestError} If logout fails
 */
export async function logout(): Promise<void> {
  return apiFetch<void>('/auth/logout', {
    method: 'POST',
  });
}

/**
 * Check current authentication status
 *
 * @returns Promise resolving to authentication status
 * @throws {ApiRequestError} If not authenticated or check fails
 */
export async function checkAuth(): Promise<AuthStatusResponse> {
  return apiFetch<AuthStatusResponse>('/auth/status', {
    method: 'GET',
  });
}

// =============================================================================
// Equipment/Inventory API
// =============================================================================

/**
 * Get all equipment items
 *
 * @returns Promise resolving to array of equipment
 */
export async function getEquipment(): Promise<Equipment[]> {
  return apiFetch<Equipment[]>('/equipment', {
    method: 'GET',
  });
}

/**
 * Get single equipment item by ID
 *
 * @param id - Equipment ID
 * @returns Promise resolving to equipment item
 */
export async function getEquipmentById(id: string): Promise<Equipment> {
  return apiFetch<Equipment>(`/equipment/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new equipment item
 *
 * @param payload - Equipment data
 * @returns Promise resolving to created equipment
 */
export async function createEquipment(payload: EquipmentPayload): Promise<Equipment> {
  return apiFetch<Equipment>('/equipment', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update existing equipment item
 *
 * @param id - Equipment ID
 * @param payload - Updated equipment data
 * @returns Promise resolving to updated equipment
 */
export async function updateEquipment(id: string, payload: Partial<EquipmentPayload>): Promise<Equipment> {
  return apiFetch<Equipment>(`/equipment/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete equipment item
 *
 * @param id - Equipment ID
 * @returns Promise resolving when deletion is complete
 */
export async function deleteEquipment(id: string): Promise<void> {
  return apiFetch<void>(`/equipment/${id}`, {
    method: 'DELETE',
  });
}

// =============================================================================
// Orders API
// =============================================================================

/**
 * Get all orders
 *
 * @param filters - Optional filters (status, date range, etc.)
 * @returns Promise resolving to array of orders
 */
export async function getOrders(filters?: Record<string, string>): Promise<Order[]> {
  const query = filters ? `?${new URLSearchParams(filters).toString()}` : '';
  return apiFetch<Order[]>(`/orders${query}`, {
    method: 'GET',
  });
}

/**
 * Get single order by ID
 *
 * @param id - Order ID
 * @returns Promise resolving to order
 */
export async function getOrderById(id: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}`, {
    method: 'GET',
  });
}

/**
 * Update order status
 *
 * @param id - Order ID
 * @param update - Status update data
 * @returns Promise resolving to updated order
 */
export async function updateOrderStatus(id: string, update: OrderStatusUpdate): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(update),
  });
}

// =============================================================================
// Schools & Grades API
// =============================================================================

/**
 * Get all schools
 *
 * @returns Promise resolving to array of schools
 */
export async function getSchools(): Promise<School[]> {
  return apiFetch<School[]>('/schools', {
    method: 'GET',
  });
}

/**
 * Get grades for a specific school
 *
 * @param schoolId - School ID
 * @returns Promise resolving to array of grades
 */
export async function getGradesBySchool(schoolId: string): Promise<Grade[]> {
  return apiFetch<Grade[]>(`/schools/${schoolId}/grades`, {
    method: 'GET',
  });
}

// =============================================================================
// Dashboard/Analytics API
// =============================================================================

/**
 * Get dashboard statistics
 *
 * @returns Promise resolving to dashboard stats
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/dashboard/stats', {
    method: 'GET',
  });
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if an error is an authentication error
 *
 * @param error - Error to check
 * @returns True if error is authentication-related
 */
export function isAuthError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    (error.statusCode === 401 || error.statusCode === 403)
  );
}

