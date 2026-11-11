import { Navigate, Outlet, useLocation } from 'react-router';
import { Button, Skeleton } from '../components/ui';
import { useAuth } from './AuthContext';

export function AdminGuard({ children }) {
  const { session, admin, isLoading, signOut } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="mx-auto max-w-6xl space-y-4 px-4 py-6 md:px-6 lg:px-8"
        aria-busy="true"
      >
        <Skeleton className="h-10 w-56" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (!admin) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface px-4 py-12 text-text">
        <div className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-surface p-6 text-center">
          <img
            src="/logo-kdkmp.jpg"
            alt="Logo KDKMP"
            width="48"
            height="48"
            className="mx-auto h-12 w-12 rounded object-contain"
            decoding="async"
          />
          <p className="text-sm font-medium text-text">
            Akun belum terdaftar sebagai admin.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={signOut}
          >
            Keluar
          </Button>
        </div>
      </div>
    );
  }

  return children || <Outlet />;
}

export function SuperAdminGuard({ children }) {
  const { role } = useAuth();

  if (role !== 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  return children || <Outlet />;
}

export function VillageAdminGuard({ children }) {
  const { role } = useAuth();

  if (role !== 'village_admin') {
    return <Navigate to="/admin" replace />;
  }

  return children || <Outlet />;
}

export default AdminGuard;

