import { Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from './AuthContext';
import { AdminGuard, SuperAdminGuard, VillageAdminGuard } from './AdminGuard';
import { AdminLayout } from './AdminLayout';
import { AdminLoginPage } from './AdminLoginPage';
import { AdminResetPage } from './AdminResetPage';
import { AdminSummaryPage } from './AdminSummaryPage';
import { AdminProductsPage } from './AdminProductsPage';
import { AdminCategoriesPage } from './AdminCategoriesPage';
import { AdminSettingsPage } from './AdminSettingsPage';
import { AdminWilayahPage } from './AdminWilayahPage';
import { AdminUnitsPage } from './AdminUnitsPage';
import { AdminOrdersPage } from './AdminOrdersPage';
import { AdminOrderFormPage } from './AdminOrderFormPage';

export default function AdminApp({
  initialAuthState = null,
  initialSummary = null,
  initialStats = null,
  initialOrders = null,
  initialOrderPage = 1,
  initialOrderStatus = 'all',
  initialOrderSearch = '',
  initialSelectedOrder = null,
  initialProducts = null,
  initialCategories = null,
  initialQuickPriceMode = false,
  initialVillage = null,
  initialQrDataUrl = '',
  initialSubdistricts = null,
  initialVillages = null,
  initialVillageAdmins = null,
  initialUnits = null,
  initialWilayahTab = 'kecamatan',
  initialPasswordModalOpen = false,
  initialVillagePage = 1,
  initialSubdistrictPage = 1,
  initialAdminPage = 1,
  initialProductPage = 1,
  initialCategoryPage = 1,
  initialUnitPage = 1,
}) {
  return (
    <AuthProvider initialState={initialAuthState}>
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route path="reset" element={<AdminResetPage />} />

        <Route
          element={
            <AdminGuard>
              <AdminLayout
                initialPasswordModalOpen={initialPasswordModalOpen}
              />
            </AdminGuard>
          }
        >
          <Route
            index
            element={
              <AdminSummaryPage
                initialSummary={initialSummary}
                initialStats={initialStats}
              />
            }
          />
          <Route
            path="transaksi"
            element={
              <AdminOrdersPage
                initialOrders={initialOrders}
                initialPage={initialOrderPage}
                initialStatus={initialOrderStatus}
                initialSearch={initialOrderSearch}
                initialSelectedOrder={initialSelectedOrder}
              />
            }
          />
          <Route
            path="transaksi/tambah"
            element={
              <VillageAdminGuard>
                <AdminOrderFormPage mode="create" />
              </VillageAdminGuard>
            }
          />
          <Route
            path="transaksi/:orderId/edit"
            element={
              <VillageAdminGuard>
                <AdminOrderFormPage mode="edit" />
              </VillageAdminGuard>
            }
          />
          <Route
            path="produk"
            element={
              <AdminProductsPage
                initialProducts={initialProducts}
                initialCategories={initialCategories}
                initialQuickPriceMode={initialQuickPriceMode}
                initialPage={initialProductPage}
              />
            }
          />
          <Route
            path="kategori"
            element={
              <AdminCategoriesPage
                initialCategories={initialCategories}
                initialProducts={initialProducts}
                initialPage={initialCategoryPage}
              />
            }
          />
          <Route
            path="pengaturan"
            element={
              <VillageAdminGuard>
                <AdminSettingsPage
                  initialVillage={initialVillage}
                  initialQrDataUrl={initialQrDataUrl}
                />
              </VillageAdminGuard>
            }
          />
          <Route
            path="satuan"
            element={
              <SuperAdminGuard>
                <AdminUnitsPage
                  initialUnits={initialUnits}
                  initialPage={initialUnitPage}
                />
              </SuperAdminGuard>
            }
          />
          <Route
            path="wilayah"
            element={
              <SuperAdminGuard>
                <AdminWilayahPage
                  initialSubdistricts={initialSubdistricts}
                  initialVillages={initialVillages}
                  initialVillageAdmins={initialVillageAdmins}
                  initialTab={initialWilayahTab}
                  initialVillagePage={initialVillagePage}
                  initialSubdistrictPage={initialSubdistrictPage}
                  initialAdminPage={initialAdminPage}
                />
              </SuperAdminGuard>
            }
          />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
