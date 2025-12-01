'use client';

import { useEffect, useRef, useState } from 'react';

interface Translations {
  hero: {
    greeting: string;
    title: string;
    subtitle: string;
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
    projects: Array<{
      title: string;
      tech: string;
      description: string;
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

export default function HomeClient({
  translations: t,
}: {
  translations: Translations;
}) {
  const swiperRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  useEffect(() => {
    const loadSwiper = async () => {
      const Swiper = (await import('swiper')).default;
      const { Navigation, Pagination, Autoplay, EffectCoverflow } =
        await import('swiper/modules');

      if (swiperRef.current) {
        new Swiper(swiperRef.current, {
          modules: [Navigation, Pagination, Autoplay, EffectCoverflow],
          effect: 'coverflow',
          grabCursor: true,
          centeredSlides: true,
          loop: true,
          slidesPerView: 'auto',
          coverflowEffect: {
            rotate: 0,
            stretch: 0,
            depth: 100,
            modifier: 2.5,
          },
          autoplay: {
            delay: 3000,
            disableOnInteraction: false,
          },
          pagination: {
            el: '.swiper-pagination',
            clickable: true,
          },
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
        });
      }
    };

    loadSwiper();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('表單提交:', formData);
    alert(t.contact.form.successMessage);
    setFormData({ name: '', email: '', message: '' });
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const skills = [
    { name: 'Vue.js', level: 3 },
    { name: 'TypeScript', level: 3 },
    { name: 'Nuxt.js', level: 2 },
    { name: 'Quasar', level: 2 },
    { name: 'Tailwind CSS', level: 3 },
    { name: 'JavaScript', level: 3 },
    { name: 'Git', level: 2 },
    { name: 'Docker', level: 1 },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p
            className="text-lg md:text-xl mb-4 animate-fade-in transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {t.hero.greeting}
          </p>
          <h1
            className="text-2xl md:text-5xl font-bold mb-4 animate-slide-up transition-colors"
            style={{ color: 'var(--foreground)' }}
          >
            {t.hero.title}
          </h1>
          <h2
            className="text-2xl md:text-2xl font-semibold mb-6 animate-slide-up-delay transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {t.hero.subtitle}
          </h2>
          <p
            className="text-xl md:text-xl max-w-3xl mx-auto mb-8 animate-fade-in-delay transition-colors"
            style={{ color: 'var(--foreground)' }}
          >
            {t.hero.description}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12">
            <div
              className="rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all"
              style={{ backgroundColor: 'var(--secondary)' }}
            >
              <div
                className="text-4xl font-bold mb-2 transition-colors"
                style={{ color: 'var(--primary)' }}
              >
                {t.stats.experience.value}
              </div>
              <div
                className="transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                {t.stats.experience.label}
              </div>
            </div>
            <div
              className="rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all"
              style={{ backgroundColor: 'var(--secondary)' }}
            >
              <div
                className="text-4xl font-bold mb-2 transition-colors"
                style={{ color: 'var(--primary)' }}
              >
                {t.stats.projects.value}
              </div>
              <div
                className="transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                {t.stats.projects.label}
              </div>
            </div>
            <div
              className="rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all"
              style={{ backgroundColor: 'var(--secondary)' }}
            >
              <div
                className="text-4xl font-bold mb-2 transition-colors"
                style={{ color: 'var(--primary)' }}
              >
                {t.stats.skills.value}
              </div>
              <div
                className="transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                {t.stats.skills.label}
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <a
              href="#portfolio"
              className="px-8 py-4 rounded-full font-semibold transition-all transform hover:scale-105 shadow-lg"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--background)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'var(--primary)';
              }}
            >
              {t.hero.viewPortfolio}
            </a>
            <a
              href="#contact"
              className="px-8 py-4 rounded-full font-semibold transition-all transform hover:scale-105 shadow-lg border-2"
              style={{
                backgroundColor: 'var(--background)',
                color: 'var(--primary)',
                borderColor: 'var(--primary)',
              }}
            >
              {t.hero.contactMe}
            </a>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section
        id="portfolio"
        className="py-20 px-4 transition-colors"
        style={{ backgroundColor: 'var(--secondary)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold mb-4 transition-colors"
              style={{ color: 'var(--foreground)' }}
            >
              {t.portfolio.title}
            </h2>
            <p
              className="text-xl transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.portfolio.subtitle}
            </p>
          </div>

          {/* Swiper Container */}
          <div className="swiper-container-wrapper relative">
            <link
              rel="stylesheet"
              href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"
            />
            <div ref={swiperRef} className="swiper">
              <div className="swiper-wrapper">
                {t.portfolio.projects.map((project, index) => (
                  <div key={index} className="swiper-slide">
                    <div
                      className="rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl"
                      style={{
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div
                        className="h-48 flex items-center justify-center"
                        style={{
                          backgroundColor: 'var(--primary)',
                        }}
                      >
                        <div
                          className="text-6xl font-bold opacity-20"
                          style={{ color: 'var(--background)' }}
                        >
                          {index + 1}
                        </div>
                      </div>
                      <div className="p-6">
                        <h3
                          className="text-xl font-bold mb-3 line-clamp-2 transition-colors"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {project.title}
                        </h3>
                        <p
                          className="text-sm font-semibold mb-3 transition-colors"
                          style={{ color: 'var(--primary)' }}
                        >
                          {project.tech}
                        </p>
                        <p
                          className="line-clamp-3 transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {project.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="swiper-button-next"
                style={{ color: 'var(--primary)' }}
              ></div>
              <div
                className="swiper-button-prev"
                style={{ color: 'var(--primary)' }}
              ></div>
              <div className="swiper-pagination"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-20 px-4 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold mb-4 transition-colors"
              style={{ color: 'var(--foreground)' }}
            >
              {t.skills.title}
            </h2>
            <p
              className="text-xl transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.skills.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all"
                style={{ backgroundColor: 'var(--secondary)' }}
              >
                <div
                  className="text-2xl font-bold mb-2 transition-colors"
                  style={{ color: 'var(--foreground)' }}
                >
                  {skill.name}
                </div>
                <div className="flex justify-center gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full transition-colors"
                      style={{
                        backgroundColor:
                          i < skill.level ? 'var(--primary)' : 'var(--border)',
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section
        className="py-20 px-4 transition-colors"
        style={{ backgroundColor: 'var(--secondary)' }}
      >
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-bold mb-12 text-center transition-colors"
            style={{ color: 'var(--foreground)' }}
          >
            {t.experience.title}
          </h2>

          <div className="space-y-8">
            {t.experience.jobs.map((job, index) => (
              <div
                key={index}
                className="rounded-2xl shadow-lg p-8 border-l-4 transform hover:scale-102 transition-all"
                style={{
                  backgroundColor: 'var(--background)',
                  borderLeftColor: 'var(--primary)',
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <h3
                    className="text-2xl font-bold transition-colors"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {job.company}
                  </h3>
                  <span
                    className="font-semibold mt-2 md:mt-0 transition-colors"
                    style={{ color: 'var(--primary)' }}
                  >
                    {job.period}
                  </span>
                </div>
                <div
                  className="text-xl font-semibold mb-3 transition-colors"
                  style={{ color: 'var(--foreground)' }}
                >
                  {job.role}
                </div>
                <p
                  className="transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {job.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-20 px-4 transition-colors"
        style={{
          backgroundColor: 'var(--primary)',
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ color: 'var(--background)' }}
          >
            {t.contact.title}
          </h2>
          <p
            className="text-xl mb-12 opacity-90"
            style={{ color: 'var(--background)' }}
          >
            {t.contact.subtitle}
          </p>

          <div
            className="rounded-2xl shadow-2xl p-8 md:p-12 transition-colors"
            style={{ backgroundColor: 'var(--secondary)' }}
          >
            <div className="space-y-6">
              <div className="text-left">
                <label
                  className="block font-semibold mb-2 transition-colors"
                  style={{ color: 'var(--foreground)' }}
                >
                  {t.contact.form.name}
                </label>
                <input
                  type="text"
                  placeholder={t.contact.form.namePlaceholder}
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                />
              </div>

              <div className="text-left">
                <label
                  className="block font-semibold mb-2 transition-colors"
                  style={{ color: 'var(--foreground)' }}
                >
                  {t.contact.form.email}
                </label>
                <input
                  type="email"
                  placeholder={t.contact.form.emailPlaceholder}
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                />
              </div>

              <div className="text-left">
                <label
                  className="block font-semibold mb-2 transition-colors"
                  style={{ color: 'var(--foreground)' }}
                >
                  {t.contact.form.message}
                </label>
                <textarea
                  rows={5}
                  placeholder={t.contact.form.messagePlaceholder}
                  value={formData.message}
                  onChange={e => handleInputChange('message', e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors resize-none"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                ></textarea>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--background)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor =
                    'var(--primary-hover)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                }}
              >
                {t.contact.form.submit}
              </button>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap');

        * {
          font-family: 'Noto Sans TC', sans-serif;
        }

        .swiper {
          width: 100%;
          padding: 50px 0 80px 0;
        }

        .swiper-slide {
          width: 320px;
          height: 400px;
        }

        .swiper-pagination-bullet {
          background: var(--primary);
          opacity: 0.5;
        }

        .swiper-pagination-bullet-active {
          opacity: 1;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 1s ease-out 0.3s backwards;
        }

        .animate-slide-up {
          animation: fade-in 1s ease-out 0.1s backwards;
        }

        .animate-slide-up-delay {
          animation: fade-in 1s ease-out 0.2s backwards;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
