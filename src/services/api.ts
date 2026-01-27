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
  ClassEquipmentList,
  EquipmentItem,
  EquipmentListUpdatePayload,
  ApiResponse,
  ApiError,
} from '@/types/api';

// =============================================================================
// Mock Data (used when backend is unavailable)
// =============================================================================

const MOCK_SCHOOLS: School[] = [
  { id: '1', name: 'Lincoln Elementary School', address: '123 Main St, Springfield', contactEmail: 'admin@lincoln.edu', contactPhone: '555-0101' },
  { id: '2', name: 'Washington Middle School', address: '456 Oak Ave, Springfield', contactEmail: 'admin@washington.edu', contactPhone: '555-0102' },
  { id: '3', name: 'Jefferson High School', address: '789 Pine Rd, Springfield', contactEmail: 'admin@jefferson.edu', contactPhone: '555-0103' },
];

const MOCK_GRADES: Record<string, Grade[]> = {
  '1': [
    { id: '1a', schoolId: '1', name: 'Grade 1-A', level: 1, studentCount: 25 },
    { id: '1b', schoolId: '1', name: 'Grade 1-B', level: 1, studentCount: 24 },
    { id: '2a', schoolId: '1', name: 'Grade 2-A', level: 2, studentCount: 26 },
  ],
  '2': [
    { id: '6a', schoolId: '2', name: 'Grade 6-A', level: 6, studentCount: 28 },
    { id: '6b', schoolId: '2', name: 'Grade 6-B', level: 6, studentCount: 27 },
    { id: '7a', schoolId: '2', name: 'Grade 7-A', level: 7, studentCount: 30 },
  ],
  '3': [
    { id: '9a', schoolId: '3', name: 'Grade 9-A', level: 9, studentCount: 32 },
    { id: '10a', schoolId: '3', name: 'Grade 10-A', level: 10, studentCount: 31 },
    { id: '11a', schoolId: '3', name: 'Grade 11-A', level: 11, studentCount: 29 },
  ],
};

const MOCK_EQUIPMENT_LISTS: Record<string, ClassEquipmentList> = {
  '1a': {
    id: 'eq-1a',
    classId: '1a',
    schoolId: '1',
    items: [
      { id: 'item-1', name: 'Pencils', count: 50, category: 'Writing' },
      { id: 'item-2', name: 'Notebooks', count: 30, category: 'Paper' },
      { id: 'item-3', name: 'Crayons (Box)', count: 25, category: 'Art' },
      { id: 'item-4', name: 'Scissors', count: 25, category: 'Tools' },
    ],
    lastUpdated: '2026-01-15T10:30:00Z',
  },
  '1b': {
    id: 'eq-1b',
    classId: '1b',
    schoolId: '1',
    items: [
      { id: 'item-5', name: 'Pencils', count: 48, category: 'Writing' },
      { id: 'item-6', name: 'Notebooks', count: 28, category: 'Paper' },
      { id: 'item-7', name: 'Glue Sticks', count: 24, category: 'Art' },
    ],
    lastUpdated: '2026-01-14T09:15:00Z',
  },
  '6a': {
    id: 'eq-6a',
    classId: '6a',
    schoolId: '2',
    items: [
      { id: 'item-8', name: 'Scientific Calculator', count: 30, category: 'Math' },
      { id: 'item-9', name: 'Geometry Set', count: 28, category: 'Math' },
      { id: 'item-10', name: 'Lab Notebooks', count: 30, category: 'Science' },
    ],
    lastUpdated: '2026-01-13T14:00:00Z',
  },
};

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
// Schools & Grades API (with mock data fallback)
// =============================================================================

/**
 * Get all schools
 * Falls back to mock data if backend is unavailable
 *
 * @returns Promise resolving to array of schools
 */
export async function getSchools(): Promise<School[]> {
  try {
    return await apiFetch<School[]>('/schools', {
      method: 'GET',
    });
  } catch (error) {
    console.warn('Failed to fetch schools from backend, using mock data:', error);
    return MOCK_SCHOOLS;
  }
}

/**
 * Get a single school by ID
 * Falls back to mock data if backend is unavailable
 *
 * @param schoolId - School ID
 * @returns Promise resolving to school or null
 */
export async function getSchoolById(schoolId: string): Promise<School | null> {
  try {
    return await apiFetch<School>(`/schools/${schoolId}`, {
      method: 'GET',
    });
  } catch (error) {
    console.warn('Failed to fetch school from backend, using mock data:', error);
    return MOCK_SCHOOLS.find(s => s.id === schoolId) || null;
  }
}

/**
 * Get grades/classes for a specific school
 * Falls back to mock data if backend is unavailable
 *
 * @param schoolId - School ID
 * @returns Promise resolving to array of grades
 */
export async function getGradesBySchool(schoolId: string): Promise<Grade[]> {
  try {
    return await apiFetch<Grade[]>(`/schools/${schoolId}/grades`, {
      method: 'GET',
    });
  } catch (error) {
    console.warn('Failed to fetch grades from backend, using mock data:', error);
    return MOCK_GRADES[schoolId] || [];
  }
}

/**
 * Get a single class by ID
 * Falls back to mock data if backend is unavailable
 *
 * @param schoolId - School ID
 * @param classId - Class ID
 * @returns Promise resolving to grade or null
 */
export async function getClassById(schoolId: string, classId: string): Promise<Grade | null> {
  try {
    return await apiFetch<Grade>(`/schools/${schoolId}/grades/${classId}`, {
      method: 'GET',
    });
  } catch (error) {
    console.warn('Failed to fetch class from backend, using mock data:', error);
    const grades = MOCK_GRADES[schoolId] || [];
    return grades.find(g => g.id === classId) || null;
  }
}

// =============================================================================
// Equipment List API (with mock data fallback)
// =============================================================================

/**
 * Get equipment list for a class
 * Falls back to mock data if backend is unavailable
 *
 * @param classId - Class ID
 * @returns Promise resolving to equipment list
 */
export async function getEquipmentList(classId: string): Promise<ClassEquipmentList> {
  try {
    return await apiFetch<ClassEquipmentList>(`/classes/${classId}/equipment`, {
      method: 'GET',
    });
  } catch (error) {
    console.warn('Failed to fetch equipment list from backend, using mock data:', error);
    return MOCK_EQUIPMENT_LISTS[classId] || {
      id: `eq-${classId}`,
      classId,
      schoolId: '',
      items: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Update equipment list for a class
 * Falls back to updating mock data if backend is unavailable
 *
 * @param classId - Class ID
 * @param items - Updated equipment items
 * @returns Promise resolving to updated equipment list
 */
export async function updateEquipmentList(
  classId: string,
  items: EquipmentItem[]
): Promise<ClassEquipmentList> {
  try {
    return await apiFetch<ClassEquipmentList>(`/classes/${classId}/equipment`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  } catch (error) {
    console.warn('Failed to update equipment list on backend, updating mock data:', error);
    // Update mock data in memory
    const existing = MOCK_EQUIPMENT_LISTS[classId];
    const updated: ClassEquipmentList = {
      id: existing?.id || `eq-${classId}`,
      classId,
      schoolId: existing?.schoolId || '',
      items,
      lastUpdated: new Date().toISOString(),
    };
    MOCK_EQUIPMENT_LISTS[classId] = updated;
    return updated;
  }
}

/**
 * Add a single equipment item to a class
 *
 * @param classId - Class ID
 * @param item - Equipment item to add (without ID)
 * @returns Promise resolving to updated equipment list
 */
export async function addEquipmentItem(
  classId: string,
  item: Omit<EquipmentItem, 'id'>
): Promise<ClassEquipmentList> {
  const equipmentList = await getEquipmentList(classId);
  const newItem: EquipmentItem = {
    ...item,
    id: `item-${Date.now()}`,
  };
  return updateEquipmentList(classId, [...equipmentList.items, newItem]);
}

/**
 * Update a single equipment item in a class
 *
 * @param classId - Class ID
 * @param itemId - Equipment item ID
 * @param updates - Partial updates to the item
 * @returns Promise resolving to updated equipment list
 */
export async function updateEquipmentItem(
  classId: string,
  itemId: string,
  updates: Partial<Omit<EquipmentItem, 'id'>>
): Promise<ClassEquipmentList> {
  const equipmentList = await getEquipmentList(classId);
  const updatedItems = equipmentList.items.map(item =>
    item.id === itemId ? { ...item, ...updates } : item
  );
  return updateEquipmentList(classId, updatedItems);
}

/**
 * Delete a single equipment item from a class
 *
 * @param classId - Class ID
 * @param itemId - Equipment item ID
 * @returns Promise resolving to updated equipment list
 */
export async function deleteEquipmentItem(
  classId: string,
  itemId: string
): Promise<ClassEquipmentList> {
  const equipmentList = await getEquipmentList(classId);
  const filteredItems = equipmentList.items.filter(item => item.id !== itemId);
  return updateEquipmentList(classId, filteredItems);
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

