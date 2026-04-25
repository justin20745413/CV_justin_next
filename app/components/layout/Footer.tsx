'use client';

import { Link } from '@/intl/routing';
import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';

export default function Footer() {
  const t = useTranslations('Footer');

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <footer className="border-t" style={{ backgroundColor: 'var(--secondary)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-3 w-16 animate-pulse rounded mb-5" style={{ backgroundColor: 'var(--border)' }}></div>
                <div className="space-y-2">
                  <div className="h-3 w-full animate-pulse rounded" style={{ backgroundColor: 'var(--border)' }}></div>
                  <div className="h-3 w-4/5 animate-pulse rounded" style={{ backgroundColor: 'var(--border)' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    );
  }

  const quickLinks = [
    { href: '/' as const, label: t('home') },
    { href: '/about' as const, label: t('about') },
    { href: '/#portfolio' as const, label: t('projects') },
  ];

  return (
    <footer
      className="border-t transition-colors"
      style={{ backgroundColor: 'var(--secondary)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-12 pb-8">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 pb-10 border-b" style={{ borderColor: 'var(--border)' }}>

          {/* Brand */}
          <div>
            <p className="text-xs tracking-[0.25em] uppercase font-semibold mb-4" style={{ color: 'var(--primary)' }}>
              Portfolio
            </p>
            <h3 className="text-xl font-bold font-serif mb-3" style={{ color: 'var(--foreground)' }}>
              Justin
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t('aboutText')}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-xs tracking-[0.25em] uppercase font-semibold mb-4" style={{ color: 'var(--primary)' }}>
              {t('linksTitle')}
            </p>
            <ul className="space-y-0">
              {quickLinks.map((link, i) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center justify-between py-2.5 border-b text-sm font-medium transition-colors group"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--foreground)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <span>{link.label}</span>
                    <span className="text-[10px] font-mono transition-colors" style={{ color: 'var(--border)' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs tracking-[0.25em] uppercase font-semibold mb-4" style={{ color: 'var(--primary)' }}>
              {t('contact.title')}
            </p>
            <div className="space-y-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-start gap-3 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs tracking-widest uppercase w-16 shrink-0 pt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                  Location
                </span>
                <span>{t('contact.location')}</span>
              </div>
              <div className="flex items-start gap-3 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs tracking-widest uppercase w-16 shrink-0 pt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                  Email
                </span>
                <span className="break-all">justin20745413@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
            {t('copyright')}
          </p>
          <p className="text-xs tracking-[0.15em] uppercase font-semibold font-serif" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
            Issue No. 01 — 2025
          </p>
        </div>
      </div>
    </footer>
  );
}
