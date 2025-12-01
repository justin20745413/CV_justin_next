import { getTranslations } from 'next-intl/server';
import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';
import HomeClient from '@/app/components/HomeClient';

export default async function Home() {
  const t = await getTranslations('Home');

  // 準備所有翻譯資料
  const translations = {
    hero: {
      greeting: t('hero.greeting'),
      title: t('hero.title'),
      subtitle: t('hero.subtitle'),
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
      projects: [
        {
          title: t('portfolio.projects.project1.title'),
          tech: t('portfolio.projects.project1.tech'),
          description: t('portfolio.projects.project1.description'),
        },
        {
          title: t('portfolio.projects.project2.title'),
          tech: t('portfolio.projects.project2.tech'),
          description: t('portfolio.projects.project2.description'),
        },
        {
          title: t('portfolio.projects.project3.title'),
          tech: t('portfolio.projects.project3.tech'),
          description: t('portfolio.projects.project3.description'),
        },
        {
          title: t('portfolio.projects.project4.title'),
          tech: t('portfolio.projects.project4.tech'),
          description: t('portfolio.projects.project4.description'),
        },
        {
          title: t('portfolio.projects.project5.title'),
          tech: t('portfolio.projects.project5.tech'),
          description: t('portfolio.projects.project5.description'),
        },
        {
          title: t('portfolio.projects.project6.title'),
          tech: t('portfolio.projects.project6.tech'),
          description: t('portfolio.projects.project6.description'),
        },
        {
          title: t('portfolio.projects.project7.title'),
          tech: t('portfolio.projects.project7.tech'),
          description: t('portfolio.projects.project7.description'),
        },
        {
          title: t('portfolio.projects.project8.title'),
          tech: t('portfolio.projects.project8.tech'),
          description: t('portfolio.projects.project8.description'),
        },
      ],
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
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-grow">
        <HomeClient translations={translations} />
      </main>
      <Footer />
    </div>
  );
}
