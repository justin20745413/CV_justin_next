import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/intl/routing';
import { ThemeProvider } from '@/app/components/ThemeProvider';
import '../globals.css';
import { Analytics } from '@vercel/analytics/next';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const baseUrl = 'https://justin-group.com';

  return {
    title: {
      template: '%s | Justin - Frontend Engineer',
      default: 'Justin | Frontend Engineer & Web Developer',
    },
    description:
      locale === 'zh-TW'
        ? 'Justin - 專業前端開發工程師，專注於 Vue 3, Nuxt.js, React 與 TypeScript。提供高品質的網頁解決方案與企業級 ERP 系統開發。'
        : 'Justin - Professional Frontend Engineer specializing in Vue 3, Nuxt.js, React, and TypeScript. Delivering high-performance web solutions and enterprise ERP systems.',
    keywords: [
      'Justin',
      'Frontend Engineer',
      'Web Developer',
      'Vue 3',
      'Nuxt.js',
      'React',
      'TypeScript',
      'Portfolio',
      '前端工程師',
      '網頁開發',
    ],
    authors: [{ name: 'Justin' }],
    creator: 'Justin',
    publisher: 'Justin',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'en-US': '/en-US',
        'zh-TW': '/zh-TW',
      },
    },
    openGraph: {
      title: 'Justin | Frontend Engineer',
      description:
        'Explore the portfolio of Justin, a frontend engineer dedicated to modern web technologies.',
      url: baseUrl,
      siteName: 'Justin Portfolio',
      locale: locale === 'zh-TW' ? 'zh_TW' : 'en_US',
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/icon.svg',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
            <Analytics />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
