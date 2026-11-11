import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input, Sheet } from '../components/ui';
import { useAuth } from './AuthContext';

export function ChangePasswordModal({ open, onClose }) {
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setNewPasswordError('');
    setConfirmPasswordError('');
    setFormError('');
    setSuccessNotice('');
    setIsSubmitting(false);
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNewPasswordError('');
    setConfirmPasswordError('');
    setFormError('');
    setSuccessNotice('');

    const trimmedPassword = newPassword.trim();
    let hasError = false;

    if (!trimmedPassword || trimmedPassword.length < 6) {
      setNewPasswordError('Kata sandi minimal 6 karakter.');
      hasError = true;
    }

    if (confirmPassword !== trimmedPassword) {
      setConfirmPasswordError('Konfirmasi kata sandi tidak cocok.');
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      await updatePassword(trimmedPassword);
      setSuccessNotice('Kata sandi berhasil diperbarui.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setFormError(err?.message || 'Gagal memperbarui kata sandi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title="Ganti Kata Sandi"
      dialogOnLg
      footer={
        successNotice ? (
          <div className="flex w-full justify-end">
            <Button
              type="button"
              variant="primary"
              onClick={handleClose}
              className="min-h-11"
            >
              Tutup
            </Button>
          </div>
        ) : (
          <div className="flex w-full justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
              className="min-h-11"
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="change-password-form"
              disabled={isSubmitting}
              className="min-h-11"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        )
      }
    >
      {successNotice ? (
        <div className="rounded-lg bg-ok-50 p-4 text-sm font-medium text-ok-700">
          {successNotice}
        </div>
      ) : (
        <form
          id="change-password-form"
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4"
        >
          <Input
            label="Kata Sandi Baru"
            type={showNewPassword ? 'text' : 'password'}
            name="newPassword"
            autoComplete="new-password"
            placeholder="Minimal 6 karakter"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (newPasswordError) setNewPasswordError('');
              if (formError) setFormError('');
            }}
            error={newPasswordError}
            required
            suffix={
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? 'Sembunyikan kata sandi baru' : 'Lihat kata sandi baru'}
                className="inline-flex min-h-9 min-w-9 items-center justify-center rounded text-text-3 hover:text-text transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            }
          />

          <Input
            label="Ulangi Kata Sandi Baru"
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Ulangi kata sandi"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (confirmPasswordError) setConfirmPasswordError('');
              if (formError) setFormError('');
            }}
            error={confirmPasswordError}
            required
            suffix={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi kata sandi' : 'Lihat konfirmasi kata sandi'}
                className="inline-flex min-h-9 min-w-9 items-center justify-center rounded text-text-3 hover:text-text transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer"
              >
                {showConfirmPassword ? (
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
        </form>
      )}
    </Sheet>
  );
}

export default ChangePasswordModal;
