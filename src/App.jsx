import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { PublicLayout } from './components/PublicLayout';
import { Skeleton } from './components/ui';

const HomePage = lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage }))
);
const SubdistrictPage = lazy(() =>
  import('./pages/SubdistrictPage').then((m) => ({ default: m.SubdistrictPage }))
);
const VillageCatalogPage = lazy(() =>
  import('./pages/VillageCatalogPage').then((m) => ({ default: m.VillageCatalogPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);
const AdminApp = lazy(() => import('./admin/AdminApp'));
const DevUiPage = import.meta.env.DEV
  ? lazy(() => import('./pages/DevUiPage'))
  : null;

function PageFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 lg:px-8 space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />

          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            {import.meta.env.DEV && DevUiPage && (
              <Route path="/dev/ui" element={<DevUiPage />} />
            )}
            <Route path="/:kecamatan" element={<SubdistrictPage />} />
            <Route path="/:kecamatan/:desa" element={<VillageCatalogPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

