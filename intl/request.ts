import { getRequestConfig } from 'next-intl/server';
import { routing } from '@/intl/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (
    !locale ||
    !routing.locales.includes(locale as (typeof routing.locales)[number])
  ) {
    locale = routing.defaultLocale;
  }

  return {
    locale: locale as typeof routing.defaultLocale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
