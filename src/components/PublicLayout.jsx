import { Link, Outlet } from 'react-router';

export function PublicLayout({ children }) {
  return (
    <div className="min-h-dvh bg-surface text-text">
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-16 md:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            <img
              src="/logo-kdkmp.jpg"
              alt="Logo KDKMP"
              width="36"
              height="36"
              className="h-9 w-9 rounded object-contain"
              decoding="async"
            />
            <span className="text-base font-bold text-text">
              Katalog KDKMP Gresik
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        {children || <Outlet />}
      </main>
    </div>
  );
}

export default PublicLayout;

