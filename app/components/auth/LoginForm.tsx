'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/contexts/AuthContext';

export default function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations('Auth');
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('loginButton'));
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errorMessage && (
        <p className="text-xs" style={{ color: '#dc2626' }}>
          {errorMessage}
        </p>
      )}
      <label className="flex flex-col gap-1">
        <span
          className="text-xs uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {t('email')}
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'transparent',
            color: 'var(--foreground)',
          }}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span
          className="text-xs uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {t('password')}
        </span>
        <input
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'transparent',
            color: 'var(--foreground)',
          }}
        />
      </label>
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 px-4 py-2 text-xs uppercase tracking-wider font-semibold"
        style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }}
      >
        {isSubmitting ? t('loggingIn') : t('loginButton')}
      </button>
    </form>
  );
}
