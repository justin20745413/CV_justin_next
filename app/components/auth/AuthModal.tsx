'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

type AuthMode = 'login' | 'register';

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Auth');
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm border p-8"
        style={{
          backgroundColor: 'var(--background)',
          borderColor: 'var(--border)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-lg font-bold font-serif"
            style={{ color: 'var(--foreground)' }}
          >
            {mode === 'login' ? t('loginTitle') : t('registerTitle')}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-xs uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>

        {mode === 'login' ? (
          <LoginForm onSuccess={onClose} />
        ) : (
          <RegisterForm onSuccess={onClose} />
        )}

        <button
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="mt-6 text-xs underline"
          style={{ color: 'var(--text-muted)' }}
        >
          {mode === 'login' ? t('switchToRegister') : t('switchToLogin')}
        </button>
      </div>
    </div>
  );
}
