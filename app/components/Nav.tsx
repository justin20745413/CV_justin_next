'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/intl/routing';
import { useTheme } from './ThemeProvider';
import { useSyncExternalStore } from 'react';

export default function Nav() {
  const t = useTranslations('Nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const mounted = useSyncExternalStore(
    () => () => {}, // 空訂閱函數
    () => true, // Client 端回傳 true
    () => false // Server 端回傳 false
  );
  if (!mounted) {
    return (
      <nav className="sticky top-0 z-50 border-b bg-blue-50 border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-xl font-bold text-blue-900">{t('logo')}</div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex space-x-8">
                <div className="w-12 h-4 bg-blue-200 animate-pulse rounded"></div>
                <div className="w-12 h-4 bg-blue-200 animate-pulse rounded"></div>
                <div className="w-12 h-4 bg-blue-200 animate-pulse rounded"></div>
                <div className="w-16 h-4 bg-blue-200 animate-pulse rounded"></div>
              </div>
              <div className="w-12 h-8 bg-blue-300 animate-pulse rounded-md"></div>
              <div className="w-12 h-8 bg-blue-300 animate-pulse rounded-md"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const toggleLocale = () => {
    const newLocale = locale === 'zh-TW' ? 'en-US' : 'zh-TW';
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <nav
      className="sticky top-0 z-50 border-b transition-colors"
      style={{
        backgroundColor: theme === 'dark-orange' ? '#1a1a1a' : '#eff6ff',
        borderColor: theme === 'dark-orange' ? '#333333' : '#dbeafe',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-bold transition-colors"
              style={{
                color: theme === 'dark-orange' ? '#ededed' : '#1e3a8a',
              }}
            >
              {t('logo')}
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex space-x-8">
              <Link
                href="/"
                className="transition-colors hover:opacity-80"
                style={{
                  color: theme === 'dark-orange' ? '#ededed' : '#1e3a8a',
                }}
              >
                {t('home')}
              </Link>
              <Link
                href="/about"
                className="transition-colors hover:opacity-80"
                style={{
                  color: theme === 'dark-orange' ? '#ededed' : '#1e3a8a',
                }}
              >
                {t('about')}
              </Link>
              <Link
                href="/projects"
                className="transition-colors hover:opacity-80"
                style={{
                  color: theme === 'dark-orange' ? '#ededed' : '#1e3a8a',
                }}
              >
                {t('projects')}
              </Link>
              <Link
                href="/contact"
                className="transition-colors hover:opacity-80"
                style={{
                  color: theme === 'dark-orange' ? '#ededed' : '#1e3a8a',
                }}
              >
                {t('contact')}
              </Link>
            </div>
            <button
              onClick={toggleLocale}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor:
                  theme === 'dark-orange' ? '#ff6b35' : '#3b82f6',
                color: '#ffffff',
              }}
            >
              {locale === 'zh-TW' ? 'EN' : '中文'}
            </button>
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor:
                  theme === 'dark-orange' ? '#ff6b35' : '#3b82f6',
                color: '#ffffff',
              }}
              title={
                theme === 'dark-orange' ? '切換到藍白主題' : '切換到黑橘主題'
              }
            >
              {theme === 'dark-orange' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
