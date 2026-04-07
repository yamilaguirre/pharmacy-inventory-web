import { authHeaders, request } from '../request';

export interface LowStockItem {
  stockId: string;
  quantity: number;
  minStock: number;
  product: {
    id: string;
    name: string;
    sku: string;
    price: string;
    category: { id: string; name: string };
  };
}

export interface ExpiringProduct {
  id: string;
  name: string;
  sku: string;
  price: string;
  expiresAt: string;
  category: { id: string; name: string };
  stock: { quantity: number; minStock: number } | null;
}

export function fetchLowStock(token: string): Promise<LowStockItem[]> {
  return request('/api/reports/low-stock', { headers: authHeaders(token) });
}

export function fetchExpiringSoon(token: string, days = 30): Promise<ExpiringProduct[]> {
  return request(`/api/reports/expiring-soon?days=${days}`, { headers: authHeaders(token) });
}
