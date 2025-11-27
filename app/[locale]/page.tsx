import { getTranslations } from 'next-intl/server';
import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';

export default async function Home() {
  const t = await getTranslations('Home');

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p
              className="text-lg mb-2 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              {t('subtitle')}
            </p>
            <h1
              className="text-4xl md:text-6xl font-bold mb-6 transition-colors"
              style={{ color: 'var(--foreground)' }}
            >
              {t('title')}
            </h1>
            <p
              className="text-xl max-w-2xl mx-auto transition-colors"
              style={{ color: 'var(--foreground)' }}
            >
              {t('intro')}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
