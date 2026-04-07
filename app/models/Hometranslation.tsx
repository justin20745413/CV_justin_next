export interface HomeTranslations {
  hero: {
    greeting: string;
    title: string;
    subtitles: string[];
    description: string;
    viewPortfolio: string;
    contactMe: string;
  };
  stats: {
    experience: { value: string; label: string };
    projects: { value: string; label: string };
    skills: { value: string; label: string };
  };
  portfolio: {
    title: string;
    subtitle: string;
    viewPortfolio: string;
    projects: Array<{
      title: string;
      tech: string;
      description: string;
      url?: string;
      image?: string;
    }>;
  };
  skills: {
    title: string;
    subtitle: string;
  };
  experience: {
    title: string;
    jobs: Array<{
      company: string;
      role: string;
      period: string;
      description: string;
    }>;
  };
  contact: {
    title: string;
    subtitle: string;
    form: {
      name: string;
      namePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      message: string;
      messagePlaceholder: string;
      submit: string;
      successMessage: string;
    };
  };
}
