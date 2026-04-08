import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getToken } from '../lib/token';
import type { ExpiringProduct, LowStockItem } from '../lib/api';
import { fetchExpiringSoon, fetchLowStock } from '../lib/api';

type Tab = 'low-stock' | 'expiring';

interface AsyncState<T> {
  loading: boolean;
  data: T;
  error: string | null;
}

const DAYS_OPTIONS = [7, 15, 30, 60, 90];

function daysUntil(dateStr: string): number {
  const now = new Date();
  const exp = new Date(dateStr);
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function ReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('low-stock');
  const [days, setDays] = useState(30);

  const [lowState, setLowState] = useState<AsyncState<LowStockItem[]>>({
    loading: true,
    data: [],
    error: null,
  });

  const [expState, setExpState] = useState<AsyncState<ExpiringProduct[]>>({
    loading: true,
    data: [],
    error: null,
  });

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchLowStock(token)
      .then((data) => setLowState({ loading: false, data, error: null }))
      .catch((e: unknown) =>
        setLowState({
          loading: false,
          data: [],
          error: e instanceof Error ? e.message : 'Error loading low stock',
        }),
      );
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchExpiringSoon(token, days)
      .then((data) => setExpState({ loading: false, data, error: null }))
      .catch((e: unknown) =>
        setExpState({
          loading: false,
          data: [],
          error: e instanceof Error ? e.message : 'Error loading expiring products',
        }),
      );
  }, [days]);

  if (!user) return null;

  const error = lowState.error ?? expState.error;

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </button>
        <h1>Reports</h1>
      </header>

      {error && <div className="alert-error">{error}</div>}

      <div className="tabs">
        <button
          className={`tab-btn${tab === 'low-stock' ? ' tab-btn--active' : ''}`}
          onClick={() => setTab('low-stock')}
        >
          Low Stock
          {lowState.data.length > 0 && (
            <span className="badge badge-danger tab-badge">{lowState.data.length}</span>
          )}
        </button>
        <button
          className={`tab-btn${tab === 'expiring' ? ' tab-btn--active' : ''}`}
          onClick={() => setTab('expiring')}
        >
          Expiring Soon
          {expState.data.length > 0 && (
            <span className="badge badge-warning tab-badge">{expState.data.length}</span>
          )}
        </button>
      </div>

      {tab === 'low-stock' && (
        <section className="report-section">
          <p className="report-subtitle">
            Products where current quantity is at or below the minimum stock threshold.
          </p>
          {lowState.loading ? (
            <p className="page-loading">Loading…</p>
          ) : lowState.data.length === 0 ? (
            <div className="report-empty">
              <span>All products are above their minimum stock level.</span>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Min Stock</th>
                  <th>Current Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowState.data.map((item) => (
                  <tr key={item.stockId}>
                    <td>{item.product.name}</td>
                    <td>
                      <code>{item.product.sku}</code>
                    </td>
                    <td>{item.product.category.name}</td>
                    <td>${Number(item.product.price).toFixed(2)}</td>
                    <td>{item.minStock}</td>
                    <td>
                      <strong>{item.quantity}</strong>
                    </td>
                    <td>
                      {item.quantity === 0 ? (
                        <span className="badge badge-danger">Out of stock</span>
                      ) : (
                        <span className="badge badge-warning">Low stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === 'expiring' && (
        <section className="report-section">
          <div className="report-toolbar">
            <p className="report-subtitle">Products expiring within the selected window.</p>
            <label className="days-filter">
              Window:&nbsp;
              <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
                {DAYS_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} days
                  </option>
                ))}
              </select>
            </label>
          </div>
          {expState.loading ? (
            <p className="page-loading">Loading…</p>
          ) : expState.data.length === 0 ? (
            <div className="report-empty">
              <span>No products expiring in the next {days} days.</span>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Expiry Date</th>
                  <th>Days Left</th>
                </tr>
              </thead>
              <tbody>
                {expState.data.map((p) => {
                  const left = daysUntil(p.expiresAt);
                  return (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>
                        <code>{p.sku}</code>
                      </td>
                      <td>{p.category.name}</td>
                      <td>${Number(p.price).toFixed(2)}</td>
                      <td>{p.stock?.quantity ?? '—'}</td>
                      <td>{formatDate(p.expiresAt)}</td>
                      <td>
                        <span className={`badge ${left <= 7 ? 'badge-danger' : 'badge-warning'}`}>
                          {left}d
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}
