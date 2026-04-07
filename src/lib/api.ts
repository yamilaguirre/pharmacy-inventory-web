export type Role = 'ADMIN' | 'PHARMACIST' | 'CASHIER' | 'INVENTORY_MANAGER';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
}

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? '';
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function fetchHealth(): Promise<{ status: string }> {
  return request('/api/health');
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchMe(token: string): Promise<AuthUser> {
  return request('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Types ────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  price: string;
  requiresPrescription: boolean;
  active: boolean;
  categoryId: string;
  category: Category;
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  price: string;
  categoryId: string;
  description?: string;
  barcode?: string;
  requiresPrescription?: boolean;
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  active?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// ── Categories ───────────────────────────────────────────────

export function fetchCategories(token: string): Promise<Category[]> {
  return request('/api/categories', { headers: authHeaders(token) });
}

export function createCategory(token: string, name: string): Promise<Category> {
  return request('/api/categories', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
}

// ── Products ─────────────────────────────────────────────────

export function fetchProducts(token: string): Promise<Product[]> {
  return request('/api/products', { headers: authHeaders(token) });
}

export function createProduct(token: string, payload: CreateProductPayload): Promise<Product> {
  return request('/api/products', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function updateProduct(
  token: string,
  id: string,
  payload: UpdateProductPayload,
): Promise<Product> {
  return request(`/api/products/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function deleteProduct(token: string, id: string): Promise<Product> {
  return request(`/api/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

// ── Inventory ────────────────────────────────────────────────

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface Stock {
  id: string;
  productId: string;
  quantity: number;
  minStock: number;
  updatedAt: string;
  product: { id: string; name: string; sku: string; active: boolean };
}

export interface StockMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string | null;
  createdAt: string;
  product: { id: string; name: string; sku: string };
  createdBy: { id: string; email: string; role: string };
}

export interface CreateMovementPayload {
  productId: string;
  type: MovementType;
  quantity: number;
  reason?: string;
}

export function fetchAllStock(token: string): Promise<Stock[]> {
  return request('/api/inventory/stock', { headers: authHeaders(token) });
}

export function fetchAllMovements(token: string): Promise<StockMovement[]> {
  return request('/api/inventory/movements', { headers: authHeaders(token) });
}

export function createMovement(
  token: string,
  payload: CreateMovementPayload,
): Promise<StockMovement> {
  return request('/api/inventory/movements', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}
