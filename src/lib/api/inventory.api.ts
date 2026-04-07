import { authHeaders, request } from '../request';

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
