'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter, usePathname } from '@/intl/routing';
import { useTheme } from '../ThemeProvider';
import { useSyncExternalStore, useState } from 'react';

export default function Nav() {
  const t = useTranslations('Nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <nav
        className="sticky top-0 z-50 border-b transition-colors"
        style={{
          backgroundColor: 'var(--secondary)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div
                className="text-xl font-bold"
                style={{ color: 'var(--foreground)' }}
              >
                {t('logo')}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex space-x-8">
                <div
                  className="w-12 h-4 animate-pulse rounded"
                  style={{ backgroundColor: 'var(--border)' }}
                ></div>
                <div
                  className="w-12 h-4 animate-pulse rounded"
                  style={{ backgroundColor: 'var(--border)' }}
                ></div>
                <div
                  className="w-12 h-4 animate-pulse rounded"
                  style={{ backgroundColor: 'var(--border)' }}
                ></div>
                <div
                  className="w-16 h-4 animate-pulse rounded"
                  style={{ backgroundColor: 'var(--border)' }}
                ></div>
              </div>
              <div
                className="w-12 h-8 animate-pulse rounded-md"
                style={{ backgroundColor: 'var(--primary)' }}
              ></div>
              <div
                className="w-12 h-8 animate-pulse rounded-md"
                style={{ backgroundColor: 'var(--primary)' }}
              ></div>
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

  const isDark = theme === 'dark-orange';
  const navBg = isDark ? '#1a1a1a' : '#eff6ff';
  const navBorder = isDark ? '#333333' : '#dbeafe';
  const textColor = isDark ? '#ededed' : '#1e3a8a';
  const btnBg = isDark ? '#ff6b35' : '#3b82f6';
  const mobileBg = isDark ? '#1a1a1a' : '#eff6ff';

  return (
    <nav
      className="sticky top-0 z-50 border-b transition-colors"
      style={{
        backgroundColor: navBg,
        borderColor: navBorder,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-bold transition-colors"
              style={{ color: textColor }}
            >
              {t('logo')}
            </Link>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="transition-colors hover:opacity-80 text-sm font-medium"
              style={{ color: textColor }}
            >
              {t('home')}
            </Link>
            <Link
              href="/about"
              className="transition-colors hover:opacity-80 text-sm font-medium"
              style={{ color: textColor }}
            >
              {t('about')}
            </Link>
            <Link
              href="/#portfolio"
              className="transition-colors hover:opacity-80 text-sm font-medium"
              style={{ color: textColor }}
            >
              {t('projects')}
            </Link>
            <Link
              href="/#contact"
              className="transition-colors hover:opacity-80 text-sm font-medium"
              style={{ color: textColor }}
            >
              {t('contact')}
            </Link>
            <button
              onClick={toggleLocale}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: btnBg, color: '#ffffff' }}
            >
              {locale === 'zh-TW' ? 'EN' : '中文'}
            </button>
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: btnBg, color: '#ffffff' }}
              title={
                isDark
                  ? t('Theme.switchToBlueWhite')
                  : t('Theme.switchToDarkOrange')
              }
            >
              {isDark ? '🌙' : '☀️'}
            </button>
          </div>

          {/* Mobile: buttons + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleLocale}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: btnBg, color: '#ffffff' }}
            >
              {locale === 'zh-TW' ? 'EN' : '中文'}
            </button>
            <button
              onClick={toggleTheme}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: btnBg, color: '#ffffff' }}
            >
              {isDark ? '🌙' : '☀️'}
            </button>
            {/* Hamburger icon */}
            <button
              onClick={() => setMenuOpen(prev => !prev)}
              className="p-2 rounded-md transition-colors hover:opacity-80 focus:outline-none"
              style={{ color: textColor }}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                /* X icon */
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                /* Hamburger icon */
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t px-4 py-3 flex flex-col gap-4 transition-all"
          style={{
            backgroundColor: mobileBg,
            borderColor: navBorder,
          }}
        >
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="text-base font-medium transition-colors hover:opacity-70 py-1"
            style={{ color: textColor }}
          >
            {t('home')}
          </Link>
          <Link
            href="/about"
            onClick={() => setMenuOpen(false)}
            className="text-base font-medium transition-colors hover:opacity-70 py-1"
            style={{ color: textColor }}
          >
            {t('about')}
          </Link>
          <Link
            href="/#portfolio"
            onClick={() => setMenuOpen(false)}
            className="text-base font-medium transition-colors hover:opacity-70 py-1"
            style={{ color: textColor }}
          >
            {t('projects')}
          </Link>
          <Link
            href="/#contact"
            onClick={() => setMenuOpen(false)}
            className="text-base font-medium transition-colors hover:opacity-70 py-1"
            style={{ color: textColor }}
          >
            {t('contact')}
          </Link>
        </div>
      )}
    </nav>
  );
}
