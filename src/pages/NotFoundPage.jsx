import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { EmptyState } from '../components/ui';

export function NotFoundPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Halaman Tidak Ditemukan – Katalog KDKMP Gresik';
  }, []);

  return (
    <section className="py-8">
      <EmptyState
        message="Halaman tidak ditemukan."
        actionLabel="Kembali ke Beranda"
        onAction={() => navigate('/')}
      />
    </section>
  );
}

export default NotFoundPage;

