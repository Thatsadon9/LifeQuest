/**
 * Redirect unauthenticated users to /login.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useT } from '../hooks';

export function AuthGuard() {
  const { user, loading, bootstrapping } = useAuth();
  const { t } = useT();
  const location = useLocation();

  if (loading || bootstrapping) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface px-4">
        <p className="text-sm font-bold text-secondary">{t('auth.loading')}</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
