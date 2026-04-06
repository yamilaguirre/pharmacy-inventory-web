import { useNavigate } from 'react-router-dom';

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">403</h1>
        <p className="auth-subtitle">You do not have permission to access this page.</p>
        <button className="btn-primary" onClick={() => navigate('/dashboard', { replace: true })}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
