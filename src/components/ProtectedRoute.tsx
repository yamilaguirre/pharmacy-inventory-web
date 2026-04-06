import { Navigate } from 'react-router-dom';
import type { Role } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

interface Props {
  children: React.ReactNode;
  /** If provided, only users with one of these roles can access the route. */
  allowedRoles?: Role[];
}

/**
 * Wraps a page component and enforces authentication + optional role check.
 *
 * - Not authenticated  → redirect to /login
 * - Wrong role         → redirect to /unauthorized
 * - OK                 → render children
 */
export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="page-loading">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
