import { MetadataRoute } from 'next';

const baseUrl = 'https://justin-group.com';
const locales = ['en-US', 'zh-TW'];
const pages = ['', '/about'];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.flatMap(page =>
    locales.map(locale => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: page === '' ? 1 : 0.8,
    }))
  );
}
