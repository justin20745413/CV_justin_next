import { getTranslations } from 'next-intl/server';
import Nav from '@/app/components/layout/Nav';
import Footer from '@/app/components/layout/Footer';
import HomeClient from '@/app/view/HomeClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('Home');

  return {
    title: locale === 'zh-TW' ? '首頁' : 'Home',
    description: t('hero.description'),
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('Home');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Justin',
    jobTitle: 'Frontend Engineer',
    url: 'https://justin-group.com',
    sameAs: [
      'https://github.com/justin20745413',
      'https://www.linkedin.com/in/cheng-hung-huang-555718360/',
    ],
    knowsAbout: [
      'Frontend Development',
      'React',
      'Vue 3',
      'Nuxt.js',
      'TypeScript',
      'Next.js',
      'Web Design',
    ],
    description: t('hero.description'),
  };

  const translations = {
    hero: {
      greeting: t('hero.greeting'),
      title: t('hero.title'),
      subtitles: t.raw('hero.subtitles') as string[],
      description: t('hero.description'),
      viewPortfolio: t('hero.viewPortfolio'),
      contactMe: t('hero.contactMe'),
    },
    stats: {
      experience: {
        value: t('stats.experience.value'),
        label: t('stats.experience.label'),
      },
      projects: {
        value: t('stats.projects.value'),
        label: t('stats.projects.label'),
      },
      skills: {
        value: t('stats.skills.value'),
        label: t('stats.skills.label'),
      },
    },
    portfolio: {
      title: t('portfolio.title'),
      subtitle: t('portfolio.subtitle'),
      viewPortfolio: t('portfolio.viewPortfolio'),
      projects: Object.values(
        t.raw('portfolio.projects') as Record<string, any>
      ).map((p: any) => ({
        title: p.title || '',
        tech: p.tech || '',
        description: p.description || '',
        url: p.url || undefined,
        image: p.image || undefined,
      })),
    },
    skills: {
      title: t('skills.title'),
      subtitle: t('skills.subtitle'),
    },
    experience: {
      title: t('experience.title'),
      jobs: [
        {
          company: t('experience.jobs.job1.company'),
          role: t('experience.jobs.job1.role'),
          period: t('experience.jobs.job1.period'),
          description: t('experience.jobs.job1.description'),
        },
        {
          company: t('experience.jobs.job2.company'),
          role: t('experience.jobs.job2.role'),
          period: t('experience.jobs.job2.period'),
          description: t('experience.jobs.job2.description'),
        },
        {
          company: t('experience.jobs.job3.company'),
          role: t('experience.jobs.job3.role'),
          period: t('experience.jobs.job3.period'),
          description: t('experience.jobs.job3.description'),
        },
      ],
    },
    contact: {
      title: t('contact.title'),
      subtitle: t('contact.subtitle'),
      form: {
        name: t('contact.form.name'),
        namePlaceholder: t('contact.form.namePlaceholder'),
        email: t('contact.form.email'),
        emailPlaceholder: t('contact.form.emailPlaceholder'),
        message: t('contact.form.message'),
        messagePlaceholder: t('contact.form.messagePlaceholder'),
        submit: t('contact.form.submit'),
        successMessage: t('contact.form.successMessage'),
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div>
        <div className="flex flex-col min-h-screen">
          <Nav />
          <main className="flex-grow">
            <HomeClient translations={translations} />
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
}
