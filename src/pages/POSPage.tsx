import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getToken } from '../lib/token';
import type { CreateSalePayload, DocumentType, Product } from '../lib/api';
import { createSale, fetchProducts } from '../lib/api';

interface CartLine {
  product: Product;
  quantity: number;
}

export function POSPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const token = getToken() ?? '';

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState('');

  // Customer form
  const [documentType, setDocumentType] = useState<DocumentType>('RUT');
  const [documentNumber, setDocumentNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [prescriptionRef, setPrescriptionRef] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<{ id: string; total: string } | null>(null);

  useEffect(() => {
    fetchProducts(token).catch(() => null);
    fetchProducts(token).then(setProducts).catch(() => null);
  }, [token]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) return prev.map((l) => l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l);
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQty(productId: string, qty: number) {
    if (qty < 1) return removeFromCart(productId);
    setCart((prev) => prev.map((l) => l.product.id === productId ? { ...l, quantity: qty } : l));
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  }

  const total = cart.reduce((sum, l) => sum + Number(l.product.price) * l.quantity, 0);
  const needsPrescription = cart.some((l) => l.product.requiresPrescription);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleSale(e: FormEvent) {
    e.preventDefault();
    if (cart.length === 0) { setError('Add at least one product to the cart'); return; }
    setError(null);
    setIsSubmitting(true);

    const payload: CreateSalePayload = {
      documentType,
      documentNumber,
      customerName,
      customerEmail: customerEmail || undefined,
      prescriptionRef: prescriptionRef || undefined,
      lines: cart.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
    };

    try {
      const sale = await createSale(token, payload);
      setLastSale({ id: sale.id, total: sale.totalAmount });
      setCart([]);
      setDocumentNumber('');
      setCustomerName('');
      setCustomerEmail('');
      setPrescriptionRef('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sale failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/dashboard')}>← Dashboard</button>
          <span className="dashboard-logo">Point of Sale</span>
        </div>
        <div className="dashboard-user">
          <span>{user?.email}</span>
          <span className="role-badge">{user?.role}</span>
          <button className="btn-logout" onClick={() => { logout(); navigate('/login', { replace: true }); }}>Logout</button>
        </div>
      </header>

      <main className="pos-layout">
        {/* ── Left: product catalog ── */}
        <section className="pos-catalog">
          <input
            className="search-input"
            type="search"
            placeholder="Search product by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', marginBottom: '1rem' }}
          />
          <div className="pos-products-grid">
            {filtered.map((product) => (
              <button key={product.id} className="pos-product-card" onClick={() => addToCart(product)}>
                <span className="pos-product-name">{product.name}</span>
                <span className="pos-product-sku">{product.sku}</span>
                <span className="pos-product-price">${Number(product.price).toLocaleString('es-CL')}</span>
                {product.requiresPrescription && (
                  <span className="badge badge-warning" style={{ marginTop: '0.4rem', fontSize: '0.7rem' }}>Rx</span>
                )}
              </button>
            ))}
            {filtered.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No products found.</p>}
          </div>
        </section>

        {/* ── Right: cart + customer form ── */}
        <section className="pos-checkout">
          <h2 className="pos-section-title">Cart</h2>

          {lastSale && (
            <div className="sale-success">
              <strong>Sale completed!</strong>
              <p>ID: <code>{lastSale.id.slice(0, 8)}…</code></p>
              <p>Total: <strong>${Number(lastSale.total).toLocaleString('es-CL')}</strong></p>
              <button className="btn-secondary btn-sm" onClick={() => setLastSale(null)} style={{ marginTop: '0.5rem', width: 'auto' }}>
                New Sale
              </button>
            </div>
          )}

          {cart.length === 0 && !lastSale ? (
            <p className="pos-empty-cart">Click a product to add it to the cart.</p>
          ) : (
            !lastSale && (
              <>
                <div className="table-wrapper" style={{ marginBottom: '1rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>Product</th><th>Qty</th><th>Unit</th><th>Sub</th><th></th></tr>
                    </thead>
                    <tbody>
                      {cart.map((line) => (
                        <tr key={line.product.id}>
                          <td>{line.product.name}</td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) => updateQty(line.product.id, Number(e.target.value))}
                              className="qty-input"
                            />
                          </td>
                          <td>${Number(line.product.price).toLocaleString('es-CL')}</td>
                          <td>${(Number(line.product.price) * line.quantity).toLocaleString('es-CL')}</td>
                          <td>
                            <button className="btn-table-danger" onClick={() => removeFromCart(line.product.id)}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pos-total">
                  Total: <strong>${total.toLocaleString('es-CL')}</strong>
                </div>

                <form onSubmit={handleSale} className="pos-customer-form" noValidate>
                  <h3 className="pos-section-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Customer</h3>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Document Type *</label>
                      <select value={documentType} onChange={(e) => setDocumentType(e.target.value as DocumentType)}>
                        <option value="RUT">RUT (Chile)</option>
                        <option value="PASSPORT">Passport</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Document Number *</label>
                      <input required placeholder={documentType === 'RUT' ? '12345678-9' : 'AB123456'} value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                    </div>
                  </div>

                  {needsPrescription && (
                    <div className="form-group">
                      <label>Prescription Reference * <span className="badge badge-warning">Required</span></label>
                      <input required={needsPrescription} placeholder="e.g. REC-2024-0042" value={prescriptionRef} onChange={(e) => setPrescriptionRef(e.target.value)} />
                    </div>
                  )}

                  {error && <p className="form-error">{error}</p>}

                  <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ marginTop: '0.5rem' }}>
                    {isSubmitting ? 'Processing…' : `Confirm Sale — $${total.toLocaleString('es-CL')}`}
                  </button>
                </form>
              </>
            )
          )}
        </section>
      </main>
    </div>
  );
}
