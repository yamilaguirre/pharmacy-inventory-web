import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  PHARMACIST: 'Pharmacist',
  CASHIER: 'Cashier',
  INVENTORY_MANAGER: 'Inventory Manager',
};

const ROLE_DESCRIPTION: Record<string, string> = {
  ADMIN: 'You have full access to all modules: products, inventory, sales, reports, and user management.',
  PHARMACIST: 'You can manage products and review prescriptions.',
  CASHIER: 'You can process sales and issue receipts.',
  INVENTORY_MANAGER: 'You can manage stock levels and inventory movements.',
};

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  if (!user) return null;

  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const roleDesc = ROLE_DESCRIPTION[user.role] ?? '';

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-header">
        <span className="dashboard-logo">Pharmacy Inventory</span>
        <div className="dashboard-user">
          <span>{user.email}</span>
          <span className="role-badge">{roleLabel}</span>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <h2>Welcome, {user.email}</h2>
        <p className="dashboard-role-desc">{roleDesc}</p>

        <div className="dashboard-cards">
          {user.role === 'ADMIN' && (
            <>
              <DashboardCard title="Products" description="Manage the product catalog" />
              <DashboardCard title="Inventory" description="View and adjust stock levels" />
              <DashboardCard title="Sales" description="Review all transactions" />
              <DashboardCard title="Reports" description="Low stock and expiry alerts" />
              <DashboardCard title="Users" description="Manage staff accounts and roles" />
            </>
          )}
          {user.role === 'PHARMACIST' && (
            <>
              <DashboardCard title="Products" description="Browse and manage the catalog" />
              <DashboardCard title="Prescriptions" description="Review pending prescriptions" />
            </>
          )}
          {user.role === 'CASHIER' && (
            <DashboardCard title="Point of Sale" description="Process a new sale" />
          )}
          {user.role === 'INVENTORY_MANAGER' && (
            <>
              <DashboardCard title="Inventory" description="View and adjust stock levels" />
              <DashboardCard title="Reports" description="Low stock and expiry alerts" />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function DashboardCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="dashboard-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
