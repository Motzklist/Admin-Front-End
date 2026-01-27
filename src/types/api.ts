/**
 * @fileoverview TypeScript Type Definitions for API
 *
 * Contains all type definitions for API requests and responses.
 * These types ensure type safety across the admin application.
 *
 * @module types/api
 */

// =============================================================================
// Authentication Types
// =============================================================================

/**
 * Credentials required for admin authentication
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Response from successful login
 */
export interface LoginResponse {
  userid: string;
  username: string;
  role?: 'admin' | 'superadmin';
  token?: string;
}

/**
 * Current authentication status response
 */
export interface AuthStatusResponse {
  authenticated: boolean;
  userid?: string;
  username?: string;
  role?: 'admin' | 'superadmin';
}

/**
 * User profile information
 */
export interface User {
  userid: string;
  username: string;
  email?: string;
  role: 'admin' | 'superadmin';
  createdAt?: string;
  lastLogin?: string;
}

// =============================================================================
// Equipment/Inventory Types
// =============================================================================

/**
 * Equipment item in the system
 */
export interface Equipment {
  id: string;
  name: string;
  description?: string;
  category?: string;
  quantity: number;
  available: number;
  price?: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Request to create or update equipment
 */
export interface EquipmentPayload {
  name: string;
  description?: string;
  category?: string;
  quantity: number;
  price?: number;
  imageUrl?: string;
}

// =============================================================================
// Order/Cart Types
// =============================================================================

/**
 * Order item details
 */
export interface OrderItem {
  equipmentId: string;
  equipmentName: string;
  quantity: number;
  price?: number;
}

/**
 * Order in the system
 */
export interface Order {
  id: string;
  userid: string;
  username?: string;
  items: OrderItem[];
  status: 'pending' | 'approved' | 'fulfilled' | 'cancelled';
  totalAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Request to update order status
 */
export interface OrderStatusUpdate {
  status: 'pending' | 'approved' | 'fulfilled' | 'cancelled';
  notes?: string;
}

// =============================================================================
// School/Grade Types
// =============================================================================

/**
 * School entity
 */
export interface School {
  id: string;
  name: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
}

/**
 * Grade/Class entity
 */
export interface Grade {
  id: string;
  schoolId: string;
  name: string;
  level?: number;
  studentCount?: number;
}

/**
 * Equipment item within a class equipment list
 */
export interface EquipmentItem {
  id: string;
  name: string;
  description?: string;
  count: number;
  category?: string;
}

/**
 * Equipment list for a class
 */
export interface ClassEquipmentList {
  id: string;
  classId: string;
  schoolId: string;
  items: EquipmentItem[];
  lastUpdated?: string;
  updatedBy?: string;
}

/**
 * Payload for updating equipment list
 */
export interface EquipmentListUpdatePayload {
  items: Omit<EquipmentItem, 'id'>[];
}

// =============================================================================
// API Response Wrappers
// =============================================================================

/**
 * Generic successful API response
 */
export interface ApiResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Generic error API response
 */
export interface ApiError {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =============================================================================
// Analytics/Dashboard Types
// =============================================================================

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalEquipment: number;
  lowStockItems: number;
  totalUsers?: number;
  recentActivity?: Activity[];
}

/**
 * Activity log entry
 */
export interface Activity {
  id: string;
  type: 'order' | 'equipment' | 'user';
  action: string;
  description: string;
  timestamp: string;
  userid?: string;
  username?: string;
}

