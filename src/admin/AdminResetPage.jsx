import { useState } from 'react';
import { Link } from 'react-router';
import { Button, Input } from '../components/ui';
import { useAuth } from './AuthContext';

export function AdminResetPage() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [formError, setFormError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setConfirmError('');
    setFormError('');
    setSuccessNotice('');

    let hasError = false;
    if (!password || password.length < 6) {
      setPasswordError('Kata sandi minimal 6 karakter.');
      hasError = true;
    }
    if (confirmPassword !== password) {
      setConfirmError('Konfirmasi kata sandi tidak cocok.');
      hasError = true;
    }
    if (hasError) return;

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      setSuccessNotice('Kata sandi berhasil diperbarui.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setFormError(err?.message || 'Gagal memperbarui kata sandi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4 py-12 text-text">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center gap-3">
          <img
            src="/logo-kdkmp.jpg"
            alt="Logo KDKMP"
            width="40"
            height="40"
            className="h-10 w-10 shrink-0 rounded object-contain"
            decoding="async"
          />
          <h1 className="text-lg font-bold text-text md:text-xl">
            Kata Sandi Baru
          </h1>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Kata Sandi Baru"
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError('');
              if (formError) setFormError('');
            }}
            error={passwordError}
          />

          <Input
            label="Ulangi Kata Sandi Baru"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Ulangi kata sandi"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (confirmError) setConfirmError('');
              if (formError) setFormError('');
            }}
            error={confirmError}
          />

          {formError && (
            <p role="alert" className="text-xs font-medium text-primary-700">
              {formError}
            </p>
          )}

          {successNotice && (
            <p
              role="status"
              className="rounded-lg bg-ok-50 px-3 py-2 text-xs font-medium text-ok-700"
            >
              {successNotice}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Kata Sandi'}
          </Button>
        </form>

        <div className="border-t border-border pt-3 text-center">
          <Link
            to="/admin/login"
            className="inline-flex min-h-11 items-center justify-center text-xs font-medium text-primary-700 hover:underline"
          >
            Kembali ke Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminResetPage;

