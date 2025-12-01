import { getRequestConfig } from 'next-intl/server';
import { routing } from '@/intl/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (
    !locale ||
    !routing.locales.includes(locale as (typeof routing.locales)[number])
  ) {
    locale = routing.defaultLocale;
  }

  const messages = {
    ...(await import(`../messages/${locale}/home.json`)).default,
    ...(await import(`../messages/${locale}/banner.json`)).default,
  };

  return {
    locale: locale as typeof routing.defaultLocale,
    messages,
  };
});
