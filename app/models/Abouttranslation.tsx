export interface Abouttranslation {
  title: string;
  actions: { download: string };
  profile: {
    name: string;
    role: string;
    location: string;
    email: string;
    phone: string;
    experience: string;
    photo: string;
    summary: string;
  };
  sections: {
    summary: string;
    skills: string;
    experience: string;
    education: string;
    projects: string;
    links: string;
    languages: string;
    certifications: string;
    achievements: string;
    relevant_courses: string;
  };
  links: { github: string; linkedin: string };
  skills: Array<{ category: string; items: string[] }>;
  languages: Array<{ name: string }>;
  experience: Array<{
    company: string;
    role: string;
    period: string;
    desc: string;
    achievements?: string[];
    technologies?: string[];
  }>;
  projects: Array<{
    name: string;
    period?: string;
    description: string;
    technologies: string[];
    url?: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    period: string;
    relevant_courses?: string[];
  }>;
  certifications: Array<{ name: string; issuer: string; date: string }>;
}
