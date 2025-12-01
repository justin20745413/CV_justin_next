import createMiddleware from 'next-intl/middleware';
import { routing } from './intl/routing';

export default createMiddleware({
  ...routing,
  localeDetection: true, // 自動語言檢測
});
export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(zh-TW|en-US)/:path*'],
};
