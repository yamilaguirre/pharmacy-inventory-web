import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Category, CreateProductPayload, Product } from '../lib/api';
import {
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchProducts,
  updateProduct,
} from '../lib/api';
import { getToken } from '../lib/token';
import { useAuth } from '../hooks/useAuth';

const EMPTY_FORM: CreateProductPayload = {
  name: '',
  sku: '',
  price: '',
  categoryId: '',
  description: '',
  barcode: '',
  requiresPrescription: false,
};

export function ProductsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const token = getToken() ?? '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateProductPayload>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([fetchProducts(token), fetchCategories(token)])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load data'))
      .finally(() => setIsLoading(false));
  }, [token]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
    setShowModal(true);
  }

  function openEdit(product: Product) {
    setForm({
      name: product.name,
      sku: product.sku,
      price: product.price,
      categoryId: product.categoryId,
      description: product.description ?? '',
      barcode: product.barcode ?? '',
      requiresPrescription: product.requiresPrescription,
    });
    setEditingId(product.id);
    setFormError(null);
    setShowModal(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (editingId) {
        const updated = await updateProduct(token, editingId, form);
        setProducts((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      } else {
        const created = await createProduct(token, form);
        setProducts((prev) => [...prev, created]);
      }
      setShowModal(false);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeactivate(product: Product) {
    if (!confirm(`Deactivate "${product.name}"? It will no longer appear in the catalog.`)) return;
    try {
      await deleteProduct(token, product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to deactivate product');
    }
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.name.toLowerCase().includes(search.toLowerCase()),
  );

  const canWrite = user?.role === 'ADMIN' || user?.role === 'PHARMACIST';
  const canDelete = user?.role === 'ADMIN';

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            ← Dashboard
          </button>
          <span className="dashboard-logo">Products</span>
        </div>
        <div className="dashboard-user">
          <span>{user?.email}</span>
          <span className="role-badge">{user?.role}</span>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="page-toolbar">
          <input
            className="search-input"
            type="search"
            placeholder="Search by name, SKU or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {canWrite && (
            <button className="btn-primary btn-sm" onClick={openCreate}>
              + New Product
            </button>
          )}
        </div>

        {error && <p className="form-error">{error}</p>}

        {isLoading ? (
          <p className="page-loading">Loading products…</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Prescription</th>
                  {(canWrite || canDelete) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty">No products found.</td>
                  </tr>
                ) : (
                  filtered.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td><code>{product.sku}</code></td>
                      <td>{product.category.name}</td>
                      <td>${Number(product.price).toFixed(2)}</td>
                      <td>
                        {product.requiresPrescription ? (
                          <span className="badge badge-warning">Required</span>
                        ) : (
                          <span className="badge badge-ok">No</span>
                        )}
                      </td>
                      {(canWrite || canDelete) && (
                        <td className="table-actions">
                          {canWrite && (
                            <button className="btn-table-edit" onClick={() => openEdit(product)}>
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="btn-table-danger"
                              onClick={() => handleDeactivate(product)}
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editingId ? 'Edit Product' : 'New Product'}</h2>

            <form onSubmit={handleSubmit} className="modal-form" noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>SKU *</label>
                  <input
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (CLP) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  >
                    <option value="">Select category…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Barcode</label>
                  <input
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  />
                </div>
                <div className="form-group form-group-check">
                  <label>
                    <input
                      type="checkbox"
                      checked={form.requiresPrescription}
                      onChange={(e) =>
                        setForm({ ...form, requiresPrescription: e.target.checked })
                      }
                    />
                    Requires prescription
                  </label>
                </div>
              </div>

              {formError && <p className="form-error">{formError}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : editingId ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
