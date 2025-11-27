'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useTheme } from './ThemeProvider';
import { useSyncExternalStore } from 'react';

export default function Footer() {
  const t = useTranslations('Footer');
  const { theme } = useTheme();

  const mounted = useSyncExternalStore(
    () => () => {}, // 空訂閱函數
    () => true, // Client 端回傳 true
    () => false // Server 端回傳 false
  );
  if (!mounted) {
    return (
      <footer className="border-t mt-auto bg-blue-50 border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-6 w-24 bg-blue-200 animate-pulse rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-blue-100 animate-pulse rounded"></div>
                  <div className="h-4 bg-blue-100 animate-pulse rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-blue-200">
            <div className="h-4 w-48 bg-blue-100 animate-pulse rounded mx-auto"></div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className="border-t mt-auto transition-colors"
      style={{
        backgroundColor: theme === 'dark-orange' ? '#1a1a1a' : '#eff6ff',
        borderColor: theme === 'dark-orange' ? '#333333' : '#dbeafe',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3
              className="text-lg font-semibold mb-4 transition-colors"
              style={{ color: theme === 'dark-orange' ? '#ff6b35' : '#1e3a8a' }}
            >
              {t('aboutTitle')}
            </h3>
            <p
              className="transition-colors"
              style={{ color: theme === 'dark-orange' ? '#ededed' : '#64748b' }}
            >
              {t('aboutText')}
            </p>
          </div>
          <div>
            <h3
              className="text-lg font-semibold mb-4 transition-colors"
              style={{ color: theme === 'dark-orange' ? '#ff6b35' : '#1e3a8a' }}
            >
              {t('linksTitle')}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:opacity-80"
                  style={{
                    color: theme === 'dark-orange' ? '#ededed' : '#64748b',
                  }}
                >
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:opacity-80"
                  style={{
                    color: theme === 'dark-orange' ? '#ededed' : '#64748b',
                  }}
                >
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link
                  href="/projects"
                  className="transition-colors hover:opacity-80"
                  style={{
                    color: theme === 'dark-orange' ? '#ededed' : '#64748b',
                  }}
                >
                  {t('projects')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3
              className="text-lg font-semibold mb-4 transition-colors"
              style={{ color: theme === 'dark-orange' ? '#ff6b35' : '#1e3a8a' }}
            >
              {t('contactTitle')}
            </h3>
            <p
              className="transition-colors"
              style={{ color: theme === 'dark-orange' ? '#ededed' : '#64748b' }}
            >
              {t('contactText')}
            </p>
          </div>
        </div>
        <div
          className="mt-8 pt-8 border-t text-center transition-colors"
          style={{
            borderColor: theme === 'dark-orange' ? '#333333' : '#dbeafe',
            color: theme === 'dark-orange' ? '#ededed' : '#64748b',
          }}
        >
          <p>{t('copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
