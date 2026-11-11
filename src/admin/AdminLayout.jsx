import { useState, useMemo } from 'react';
import { NavLink, Outlet } from 'react-router';
import {
  LayoutDashboard,
  Package,
  Tags,
  Settings,
  MapPin,
  Scale,
  KeyRound,
} from 'lucide-react';
import { Button } from '../components/ui';
import { useAuth } from './AuthContext';
import { ChangePasswordModal } from './ChangePasswordModal';

const BASE_NAV_ITEMS = [
  { to: '/admin', label: 'Ringkasan', icon: LayoutDashboard, end: true },
  { to: '/admin/produk', label: 'Produk', icon: Package, end: false },
  { to: '/admin/kategori', label: 'Kategori', icon: Tags, end: false },
  { to: '/admin/pengaturan', label: 'Pengaturan', icon: Settings, end: false },
];

const SATUAN_NAV_ITEM = {
  to: '/admin/satuan',
  label: 'Satuan',
  icon: Scale,
  end: false,
};

const WILAYAH_NAV_ITEM = {
  to: '/admin/wilayah',
  label: 'Wilayah',
  icon: MapPin,
  end: false,
};

export function AdminLayout({ children, initialPasswordModalOpen = false }) {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(
    initialPasswordModalOpen
  );
  const {
    role,
    activeVillage,
    signOut,
  } = useAuth();

  const navItems = useMemo(() => {
    if (role === 'super_admin') {
      return [
        BASE_NAV_ITEMS[0],
        BASE_NAV_ITEMS[1],
        BASE_NAV_ITEMS[2],
        SATUAN_NAV_ITEM,
        WILAYAH_NAV_ITEM,
      ];
    }
    return BASE_NAV_ITEMS;
  }, [role]);

  return (
    <div className="min-h-dvh bg-surface text-text">
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="flex h-14 items-center justify-between gap-3 px-4 md:h-16 md:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <img
              src="/logo-kdkmp.jpg"
              alt="Logo KDKMP"
              width="32"
              height="32"
              className="h-8 w-8 shrink-0 rounded object-contain"
              decoding="async"
            />
            <span className="truncate text-sm font-bold text-text md:text-base">
              {role === 'super_admin'
                ? 'Super Admin KDKMP Gresik'
                : activeVillage?.business_name || 'KDKMP'}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsPasswordModalOpen(true)}
              title="Ganti Kata Sandi"
              aria-label="Ganti Kata Sandi"
            >
              <KeyRound className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Ganti Sandi</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={signOut}
            >
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100dvh-3.5rem)] md:min-h-[calc(100dvh-4rem)]">
        <aside
          aria-label="Menu Admin"
          className="hidden md:flex md:w-20 lg:w-[240px] md:shrink-0 md:flex-col md:border-r md:border-border md:bg-surface"
        >
          <nav className="flex flex-col gap-1 p-2 lg:p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={item.label}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-600 md:flex-col md:justify-center md:gap-1 md:px-1.5 md:py-2 md:text-[11px] lg:flex-row lg:justify-start lg:gap-3 lg:px-3.5 lg:py-2.5 lg:text-sm ${
                      isActive
                        ? 'bg-primary-50 font-semibold text-primary-700'
                        : 'font-medium text-text-2 hover:bg-surface-3 hover:text-text'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="max-w-full truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 pt-5 pb-20 md:px-6 md:py-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{children || <Outlet />}</div>
        </main>
      </div>

      <nav
        aria-label="Navigasi Bawah Admin"
        className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-stretch border-t border-border bg-surface md:hidden"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex h-14 min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600 ${
                  isActive
                    ? 'font-semibold text-primary-700'
                    : 'font-medium text-text-2 hover:text-text'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="max-w-full truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <ChangePasswordModal
        open={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}

export default AdminLayout;

