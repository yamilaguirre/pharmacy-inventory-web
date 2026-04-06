import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getToken } from '../lib/token';
import type { CreateMovementPayload, MovementType, Stock, StockMovement } from '../lib/api';
import {
  createMovement,
  fetchAllMovements,
  fetchAllStock,
  fetchProducts,
} from '../lib/api';
import type { Product } from '../lib/api';

type Tab = 'stock' | 'movements';

const MOVEMENT_LABELS: Record<MovementType, string> = {
  IN: 'Stock In',
  OUT: 'Stock Out',
  ADJUSTMENT: 'Adjustment',
};

const MOVEMENT_BADGE: Record<MovementType, string> = {
  IN: 'badge-ok',
  OUT: 'badge-danger',
  ADJUSTMENT: 'badge-info',
};

export function InventoryPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const token = getToken() ?? '';

  const [tab, setTab] = useState<Tab>('stock');
  const [stock, setStock] = useState<Stock[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Movement form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateMovementPayload>({
    productId: '',
    type: 'IN',
    quantity: 1,
    reason: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([fetchAllStock(token), fetchAllMovements(token), fetchProducts(token)])
      .then(([s, m, p]) => {
        setStock(s);
        setMovements(m);
        setProducts(p);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load data'))
      .finally(() => setIsLoading(false));
  }, [token]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  async function handleMovementSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const movement = await createMovement(token, {
        ...form,
        quantity: Number(form.quantity),
        reason: form.reason || undefined,
      });
      setMovements((prev) => [movement, ...prev]);

      // Update stock table optimistically
      setStock((prev) =>
        prev.map((s) => {
          if (s.productId !== form.productId) return s;
          let newQty = s.quantity;
          if (form.type === 'IN') newQty += Number(form.quantity);
          else if (form.type === 'OUT') newQty -= Number(form.quantity);
          else newQty = Number(form.quantity);
          return { ...s, quantity: newQty };
        }),
      );

      setShowForm(false);
      setForm({ productId: '', type: 'IN', quantity: 1, reason: '' });
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  const canManage = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER';

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/dashboard')}>← Dashboard</button>
          <span className="dashboard-logo">Inventory</span>
        </div>
        <div className="dashboard-user">
          <span>{user?.email}</span>
          <span className="role-badge">{user?.role}</span>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        {error && <p className="form-error">{error}</p>}

        <div className="page-toolbar">
          <div className="tab-bar">
            <button
              className={`tab-btn${tab === 'stock' ? ' tab-btn-active' : ''}`}
              onClick={() => setTab('stock')}
            >
              Current Stock
            </button>
            <button
              className={`tab-btn${tab === 'movements' ? ' tab-btn-active' : ''}`}
              onClick={() => setTab('movements')}
            >
              Movement History
            </button>
          </div>
          {canManage && (
            <button className="btn-primary btn-sm" onClick={() => setShowForm(true)}>
              + Register Movement
            </button>
          )}
        </div>

        {isLoading ? (
          <p className="page-loading">Loading inventory…</p>
        ) : tab === 'stock' ? (
          <StockTable stock={stock} />
        ) : (
          <MovementsTable movements={movements} />
        )}
      </main>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Register Stock Movement</h2>
            <form onSubmit={handleMovementSubmit} className="modal-form" noValidate>
              <div className="form-group">
                <label>Product *</label>
                <select
                  required
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                >
                  <option value="">Select product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Movement Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as MovementType })}
                  >
                    <option value="IN">Stock In (receive)</option>
                    <option value="OUT">Stock Out (dispatch)</option>
                    <option value="ADJUSTMENT">Adjustment (physical count)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reason / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Purchase order #123, expired stock removal…"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
              </div>

              {formError && <p className="form-error">{formError}</p>}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : 'Register Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StockTable({ stock }: { stock: Stock[] }) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Current Stock</th>
            <th>Min Stock</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {stock.length === 0 ? (
            <tr><td colSpan={5} className="table-empty">No stock records yet. Register the first movement to start tracking.</td></tr>
          ) : (
            stock.map((s) => {
              const isLow = s.quantity <= s.minStock;
              return (
                <tr key={s.id}>
                  <td>{s.product.name}</td>
                  <td><code>{s.product.sku}</code></td>
                  <td><strong>{s.quantity}</strong> units</td>
                  <td>{s.minStock} units</td>
                  <td>
                    {isLow ? (
                      <span className="badge badge-danger">Low Stock</span>
                    ) : (
                      <span className="badge badge-ok">OK</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function MovementsTable({ movements }: { movements: StockMovement[] }) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Product</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>Reason</th>
            <th>Registered by</th>
          </tr>
        </thead>
        <tbody>
          {movements.length === 0 ? (
            <tr><td colSpan={6} className="table-empty">No movements recorded yet.</td></tr>
          ) : (
            movements.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.createdAt).toLocaleString()}</td>
                <td>{m.product.name}</td>
                <td>
                  <span className={`badge ${MOVEMENT_BADGE[m.type]}`}>
                    {MOVEMENT_LABELS[m.type]}
                  </span>
                </td>
                <td>{m.quantity} units</td>
                <td>{m.reason ?? <span style={{ color: '#94a3b8' }}>—</span>}</td>
                <td>{m.createdBy.email}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
