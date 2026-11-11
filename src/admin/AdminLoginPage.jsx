import { useState } from 'react';
import { Navigate, Link } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { useAuth } from './AuthContext';

export function AdminLoginPage({ initialMode = 'login' }) {
  const { session, isLoading, signIn, resetPassword } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [resetNotice, setResetNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && session) {
    return <Navigate to="/admin" replace />;
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setFormError('');
    setResetNotice('');

    const trimmedEmail = email.trim();
    let hasError = false;
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setEmailError('Masukkan email yang valid.');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Kata sandi wajib diisi.');
      hasError = true;
    }
    if (hasError) return;

    setIsSubmitting(true);
    try {
      await signIn({ email: trimmedEmail, password });
    } catch (err) {
      setFormError(err?.message || 'Email atau kata sandi salah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerResetEmail = async (targetEmail) => {
    setEmailError('');
    setPasswordError('');
    setFormError('');
    setResetNotice('');

    const trimmedEmail = String(targetEmail ?? '').trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setEmailError('Masukkan email yang valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(trimmedEmail);
      setResetNotice('Tautan reset kata sandi telah dikirim ke email.');
    } catch (err) {
      setFormError(err?.message || 'Gagal mengirim tautan reset kata sandi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotClick = async () => {
    setEmailError('');
    setPasswordError('');
    setFormError('');
    setResetNotice('');
    setMode('forgot');

    const trimmedEmail = email.trim();
    if (trimmedEmail && trimmedEmail.includes('@')) {
      await triggerResetEmail(trimmedEmail);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    await triggerResetEmail(email);
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
            {mode === 'forgot' ? 'Reset Kata Sandi' : 'Masuk Admin KDKMP'}
          </h1>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="nama@kdkmp-gresik.id"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
                if (formError) setFormError('');
              }}
              error={emailError}
            />

            <Input
              label="Kata Sandi"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
                if (formError) setFormError('');
              }}
              error={passwordError}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded text-text-3 hover:text-text transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              }
            />

            {formError && (
              <p role="alert" className="text-xs font-medium text-primary-700">
                {formError}
              </p>
            )}

            {resetNotice && (
              <p
                role="status"
                className="rounded-lg bg-ok-50 px-3 py-2 text-xs font-medium text-ok-700"
              >
                {resetNotice}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Memproses...' : 'Masuk'}
            </Button>

            <button
              type="button"
              onClick={handleForgotClick}
              disabled={isSubmitting}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg text-xs font-medium text-primary-700 hover:underline outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer"
            >
              Lupa kata sandi
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmit} noValidate className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="nama@kdkmp-gresik.id"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
                if (formError) setFormError('');
              }}
              error={emailError}
            />

            {formError && (
              <p role="alert" className="text-xs font-medium text-primary-700">
                {formError}
              </p>
            )}

            {resetNotice && (
              <p
                role="status"
                className="rounded-lg bg-ok-50 px-3 py-2 text-xs font-medium text-ok-700"
              >
                {resetNotice}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Tautan Reset'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setMode('login');
                setEmailError('');
                setFormError('');
              }}
            >
              Kembali ke Masuk
            </Button>
          </form>
        )}

        <div className="border-t border-border pt-3 text-center">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center text-xs font-medium text-text-2 hover:text-text"
          >
            Ke Katalog Publik
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;

