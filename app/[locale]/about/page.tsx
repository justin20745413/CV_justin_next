import { getTranslations } from 'next-intl/server';
import Nav from '@/app/components/layout/Nav';
import AboutClient from '@/app/view/AboutClient';
import { Abouttranslation } from '@/app/models/Abouttranslation';

export default async function AboutPage() {
  const t = await getTranslations('about');

  const aboutData: Abouttranslation = {
    title: t('title'),
    actions: {
      download: t('actions.download'),
    },
    profile: {
      name: t('profile.name'),
      role: t('profile.role'),
      location: t('profile.location'),
      email: t('profile.email'),
      phone: t('profile.phone'),
      experience: t('profile.experience'),
      photo: t('profile.photo'),
      summary: t('profile.summary'),
    },
    sections: {
      summary: t('sections.summary'),
      skills: t('sections.skills'),
      experience: t('sections.experience'),
      education: t('sections.education'),
      projects: t('sections.projects'),
      links: t('sections.links'),
      languages: t('sections.languages'),
      certifications: t('sections.certifications'),
      achievements: t('sections.achievements'),
      relevant_courses: t('sections.relevant_courses'),
    },
    links: {
      github: t('links.github'),
      linkedin: t('links.linkedin'),
    },
    skills: t.raw('skills') as Abouttranslation['skills'],
    languages: t.raw('languages') as Abouttranslation['languages'],
    experience: t.raw('experience') as Abouttranslation['experience'],
    projects: t.raw('projects') as Abouttranslation['projects'],
    education: t.raw('education') as Abouttranslation['education'],
    certifications: t.raw(
      'certifications'
    ) as Abouttranslation['certifications'],
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="grow mb-20">
        <AboutClient about={aboutData} />
      </main>
    </div>
  );
}
