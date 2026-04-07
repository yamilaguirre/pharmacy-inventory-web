import { authHeaders, request } from '../request';

export type DocumentType = 'RUT' | 'PASSPORT';
export type SaleStatus = 'COMPLETED' | 'CANCELLED';

export interface SaleLineInput {
  productId: string;
  quantity: number;
}

export interface CreateSalePayload {
  documentType: DocumentType;
  documentNumber: string;
  customerName: string;
  customerEmail?: string;
  lines: SaleLineInput[];
  prescriptionRef?: string;
}

export interface SaleLineRecord {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  product: { id: string; name: string; sku: string };
}

export interface SaleCustomer {
  id: string;
  documentType: DocumentType;
  documentNumber: string;
  name: string;
  email: string | null;
}

export interface Sale {
  id: string;
  status: SaleStatus;
  totalAmount: string;
  prescriptionRef: string | null;
  createdAt: string;
  customer: SaleCustomer;
  cashier: { id: string; email: string; role: string };
  lines: SaleLineRecord[];
}

export function createSale(token: string, payload: CreateSalePayload): Promise<Sale> {
  return request('/api/sales', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function fetchSales(token: string): Promise<Sale[]> {
  return request('/api/sales', { headers: authHeaders(token) });
}

export function cancelSale(token: string, id: string): Promise<Sale> {
  return request(`/api/sales/${id}/cancel`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
}
