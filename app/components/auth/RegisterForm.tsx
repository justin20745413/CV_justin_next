'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/contexts/AuthContext';

export default function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations('Auth');
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await register(email, password, displayName);
      onSuccess();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('registerButton'));
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
          {t('displayName')}
        </span>
        <input
          type="text"
          required
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
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
          minLength={8}
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
        style={{
          backgroundColor: 'var(--foreground)',
          color: 'var(--background)',
        }}
      >
        {isSubmitting ? t('registering') : t('registerButton')}
      </button>
    </form>
  );
}
