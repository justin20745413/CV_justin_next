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

  const toggleLocale = () => {
    const newLocale = locale === 'zh-TW' ? 'en-US' : 'zh-TW';
    router.replace(pathname, { locale: newLocale });
  };

  const isDark = theme === 'dark-orange';

  const navLinks = [
    { href: '/' as const, label: t('home') },
    { href: '/about' as const, label: t('about') },
    { href: '/#portfolio' as const, label: t('projects') },
    { href: '/#contact' as const, label: t('contact') },
  ];

  if (!mounted) {
    return (
      <nav
        className="sticky top-0 z-50 border-b"
        style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex justify-between items-center h-14">
            <div className="h-4 w-20 animate-pulse rounded" style={{ backgroundColor: 'var(--border)' }}></div>
            <div className="hidden md:flex gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-3 w-10 animate-pulse rounded" style={{ backgroundColor: 'var(--border)' }}></div>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="h-6 w-8 animate-pulse rounded" style={{ backgroundColor: 'var(--border)' }}></div>
              <div className="h-6 w-6 animate-pulse rounded" style={{ backgroundColor: 'var(--border)' }}></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="sticky top-0 z-50 border-b transition-colors"
      style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex justify-between items-center h-14">

          {/* Logo */}
          <Link
            href="/"
            className="text-base font-bold tracking-[0.12em] uppercase transition-opacity hover:opacity-70 font-serif"
            style={{ color: 'var(--foreground)' }}
          >
            {t('logo')}
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs tracking-[0.18em] uppercase font-semibold transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--foreground)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={toggleLocale}
              className="text-xs tracking-[0.15em] uppercase font-semibold border px-3 py-1.5 transition-all"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-muted)',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--foreground)';
                e.currentTarget.style.color = 'var(--foreground)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              {locale === 'zh-TW' ? 'EN' : '中文'}
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center border transition-all"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-muted)',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--foreground)';
                e.currentTarget.style.color = 'var(--foreground)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
              title={isDark ? t('Theme.switchToBlueWhite') : t('Theme.switchToDarkOrange')}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(prev => !prev)}
              className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 border transition-all"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent' }}
              aria-label="Toggle menu"
            >
              <span
                className="block w-4 h-px transition-all duration-300 origin-center"
                style={{
                  backgroundColor: 'var(--foreground)',
                  transform: menuOpen ? 'translateY(3px) rotate(45deg)' : 'none',
                }}
              ></span>
              <span
                className="block h-px transition-all duration-200"
                style={{
                  backgroundColor: 'var(--foreground)',
                  width: menuOpen ? '0' : '1rem',
                  opacity: menuOpen ? 0 : 1,
                }}
              ></span>
              <span
                className="block w-4 h-px transition-all duration-300 origin-center"
                style={{
                  backgroundColor: 'var(--foreground)',
                  transform: menuOpen ? 'translateY(-3px) rotate(-45deg)' : 'none',
                }}
              ></span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t"
          style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
        >
          {navLinks.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between px-6 sm:px-10 py-4 text-xs tracking-[0.18em] uppercase font-semibold border-b transition-colors"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-muted)',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--foreground)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <span>{link.label}</span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--border)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
