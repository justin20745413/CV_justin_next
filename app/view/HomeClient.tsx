'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { HomeTranslations } from '@/app/models/Hometranslation';
import Typewriter from '../components/effects/Typewriter';
import Counter from '../components/effects/Counter';

export default function HomeClient({
  translations: t,
}: {
  translations: HomeTranslations;
}) {
  const swiperRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    if (!mounted) return;
    const loadSwiper = async () => {
      const Swiper = (await import('swiper')).default;
      const { Navigation, Pagination, Autoplay } = await import('swiper/modules');

      if (swiperRef.current) {
        new Swiper(swiperRef.current, {
          modules: [Navigation, Pagination, Autoplay],
          slidesPerView: 1.15,
          spaceBetween: 24,
          loop: true,
          centeredSlides: true,
          breakpoints: {
            768: {
              slidesPerView: 1.8,
              spaceBetween: 32,
            },
            1024: {
              slidesPerView: 2.4,
              spaceBetween: 40,
            },
          },
          autoplay: {
            delay: 4000,
            disableOnInteraction: false,
          },
          pagination: {
            el: '.swiper-pagination',
            clickable: true,
          },
        });
      }
    };

    loadSwiper();
  }, [mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.message.trim()
    ) {
      alert('請填寫所有欄位');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to send message');

      alert(t.contact.form.successMessage);
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Error:', error);
      alert('發送失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const skills = [
    { name: 'Vue.js', level: 3, category: 'Framework' },
    { name: 'TypeScript', level: 3, category: 'Language' },
    { name: 'Nuxt.js', level: 2, category: 'Framework' },
    { name: 'Quasar', level: 2, category: 'Framework' },
    { name: 'Tailwind CSS', level: 3, category: 'Styling' },
    { name: 'JavaScript', level: 3, category: 'Language' },
    { name: 'Git', level: 2, category: 'Tool' },
    { name: 'Docker', level: 1, category: 'Tool' },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <section className="min-h-screen flex flex-col px-6 sm:px-10 lg:px-16 pt-24">
          <div className="border-b pb-4 mb-12 flex justify-between" style={{ borderColor: 'var(--border)' }}>
            <div className="h-3 w-24 animate-pulse rounded" style={{ backgroundColor: 'var(--text-muted)' }}></div>
            <div className="h-3 w-24 animate-pulse rounded" style={{ backgroundColor: 'var(--text-muted)' }}></div>
          </div>
          <div className="flex-1 flex items-center">
            <div className="max-w-xl">
              <div className="h-4 w-32 mb-6 animate-pulse rounded" style={{ backgroundColor: 'var(--text-muted)' }}></div>
              <div className="h-20 w-full mb-4 animate-pulse rounded" style={{ backgroundColor: 'var(--text-muted)' }}></div>
              <div className="h-20 w-3/4 mb-6 animate-pulse rounded" style={{ backgroundColor: 'var(--text-muted)' }}></div>
              <div className="w-24 h-1 mb-6" style={{ backgroundColor: 'var(--border)' }}></div>
              <div className="h-6 w-64 animate-pulse rounded" style={{ backgroundColor: 'var(--text-muted)' }}></div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section — Magazine Cover */}
      <section
        className="relative min-h-screen flex flex-col px-6 sm:px-10 lg:px-16 pt-24 pb-12 overflow-hidden"
        style={{ backgroundColor: 'var(--background)' }}
      >
        {/* Top editorial bar */}
        <div
          className="flex items-center justify-between border-b pb-4 mb-10 sm:mb-14"
          style={{ borderColor: 'var(--border)' }}
        >
          <span
            className="text-xs tracking-[0.3em] uppercase font-semibold select-none"
            style={{ color: 'var(--text-muted)' }}
          >
            Portfolio
          </span>
          <span
            className="text-xs tracking-[0.3em] uppercase font-semibold select-none"
            style={{ color: 'var(--text-muted)' }}
          >
            Issue No. 01 &mdash; 2025
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left — typography */}
          <div>
            <p
              className="text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold mb-5 select-none animate-fade-in"
              style={{ color: 'var(--primary)' }}
            >
              {t.hero.greeting}
            </p>
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.05] mb-6 font-serif animate-slide-up select-none"
              style={{ color: 'var(--foreground)' }}
            >
              {t.hero.title}
            </h1>
            <div
              className="w-16 h-[3px] mb-6 animate-fade-in"
              style={{ backgroundColor: 'var(--primary)' }}
            ></div>
            <h2
              className="text-lg sm:text-xl lg:text-2xl font-light mb-6 animate-slide-up-delay select-none"
              style={{ color: 'var(--text-muted)' }}
            >
              <Typewriter words={t.hero.subtitles} />
            </h2>
            <p
              className="text-sm sm:text-base leading-relaxed mb-10 max-w-md animate-fade-in-delay select-none"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.hero.description}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-delay">
              <a
                href="#portfolio"
                className="px-8 py-3 text-sm font-semibold tracking-[0.12em] uppercase text-center transition-all"
                style={{
                  backgroundColor: 'var(--foreground)',
                  color: 'var(--background)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'var(--foreground)';
                }}
              >
                {t.hero.viewPortfolio}
              </a>
              <a
                href="#contact"
                className="px-8 py-3 text-sm font-semibold tracking-[0.12em] uppercase text-center border-2 transition-all"
                style={{
                  borderColor: 'var(--foreground)',
                  color: 'var(--foreground)',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.color = 'var(--primary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--foreground)';
                  e.currentTarget.style.color = 'var(--foreground)';
                }}
              >
                {t.hero.contactMe}
              </a>
            </div>
          </div>

          {/* Right — decorative */}
          <div className="relative hidden lg:flex items-center justify-center select-none">
            <div
              className="text-[clamp(160px,18vw,280px)] font-serif font-black leading-none pointer-events-none"
              style={{ color: 'var(--border)', opacity: 0.35 }}
            >
              JUSTIN
            </div>
            <div
              className="absolute bottom-8 right-8 text-right"
            >
              <div
                className="text-xs tracking-[0.2em] uppercase mb-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Frontend Developer
              </div>
              <div
                className="w-12 h-[1px] ml-auto"
                style={{ backgroundColor: 'var(--border)' }}
              ></div>
            </div>
          </div>
        </div>

        {/* Bottom stats bar */}
        <div
          className="border-t mt-10 pt-8 grid grid-cols-3 gap-4 sm:gap-8"
          style={{ borderColor: 'var(--border)' }}
        >
          {[
            { stat: t.stats.experience, key: 'exp' },
            { stat: t.stats.projects, key: 'proj' },
            { stat: t.stats.skills, key: 'sk' },
          ].map(({ stat, key }, i) => (
            <div key={key} className={i > 0 ? 'border-l pl-4 sm:pl-8' : ''} style={{ borderColor: 'var(--border)' }}>
              <div
                className="text-3xl sm:text-4xl font-bold font-serif mb-1 select-none"
                style={{ color: 'var(--primary)' }}
              >
                <Counter value={stat.value} className="select-none cursor-default" />
              </div>
              <div
                className="text-xs tracking-widest uppercase select-none"
                style={{ color: 'var(--text-muted)' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Portfolio Section */}
      <section
        id="portfolio"
        className="py-16 sm:py-24 overflow-hidden"
        style={{ backgroundColor: 'var(--secondary)' }}
      >
        <div className="px-6 sm:px-10 lg:px-16 mb-10 sm:mb-14">
          <div className="flex items-end justify-between">
            <div>
              <span
                className="text-xs tracking-[0.3em] uppercase font-semibold block mb-3"
                style={{ color: 'var(--primary)' }}
              >
                Selected Works
              </span>
              <h2
                className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif"
                style={{ color: 'var(--foreground)' }}
              >
                {t.portfolio.title}
              </h2>
            </div>
            <p
              className="hidden sm:block text-sm max-w-xs text-right leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.portfolio.subtitle}
            </p>
          </div>
          <div
            className="w-full h-[1px] mt-8"
            style={{ backgroundColor: 'var(--border)' }}
          ></div>
        </div>

        {/* Swiper */}
        <div className="swiper-container-wrapper">
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"
          />
          <div ref={swiperRef} className="swiper magazine-swiper">
            <div className="swiper-wrapper">
              {t.portfolio.projects.map((project, index) => (
                <div key={index} className="swiper-slide">
                  <div className="magazine-card relative overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {/* Background image or color */}
                    {project.image ? (
                      <img
                        src={project.image}
                        alt={project.title}
                        className="magazine-card-img w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--primary)' }}
                      >
                        <span
                          className="text-[120px] font-serif font-black opacity-10 select-none"
                          style={{ color: 'var(--background)' }}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(to top, rgba(0,0,0,0.88) 40%, rgba(0,0,0,0.1) 100%)',
                      }}
                    ></div>

                    {/* Top: index + link */}
                    <div className="absolute top-5 left-5 right-5 flex items-start justify-between">
                      <span className="text-3xl font-serif font-bold text-white opacity-60 select-none">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white opacity-70 hover:opacity-100 transition-opacity"
                          title="前往專案連結"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      )}
                    </div>

                    {/* Bottom: content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-xs tracking-[0.2em] uppercase text-white opacity-50 mb-2">
                        {project.tech}
                      </p>
                      <h3 className="text-xl sm:text-2xl font-bold text-white font-serif mb-2 line-clamp-2">
                        {project.title}
                      </h3>
                      <p className="text-sm text-white opacity-60 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="swiper-pagination mt-6"></div>
          </div>
        </div>
      </section>

      {/* Skills Section — Magazine Directory */}
      <section className="py-16 sm:py-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 sm:mb-14">
            <span
              className="text-xs tracking-[0.3em] uppercase font-semibold block mb-3"
              style={{ color: 'var(--primary)' }}
            >
              Expertise
            </span>
            <div className="flex items-end justify-between">
              <h2
                className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif"
                style={{ color: 'var(--foreground)' }}
              >
                {t.skills.title}
              </h2>
              <p
                className="hidden sm:block text-sm text-right"
                style={{ color: 'var(--text-muted)' }}
              >
                {t.skills.subtitle}
              </p>
            </div>
            <div
              className="w-full h-[1px] mt-8"
              style={{ backgroundColor: 'var(--border)' }}
            ></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-5 border-b transition-all group cursor-default"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-5 sm:gap-8">
                  <span
                    className="text-xs font-mono w-6 select-none"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className="text-xs tracking-widest uppercase w-20 select-none"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {skill.category}
                  </span>
                  <span
                    className="text-base sm:text-lg font-semibold font-serif group-hover:translate-x-1 transition-transform select-none"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {skill.name}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full"
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
        className="py-16 sm:py-24 px-6 sm:px-10 lg:px-16"
        style={{ backgroundColor: 'var(--secondary)' }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 sm:mb-14">
            <span
              className="text-xs tracking-[0.3em] uppercase font-semibold block mb-3"
              style={{ color: 'var(--primary)' }}
            >
              Career
            </span>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif"
              style={{ color: 'var(--foreground)' }}
            >
              {t.experience.title}
            </h2>
            <div
              className="w-full h-[1px] mt-8"
              style={{ backgroundColor: 'var(--border)' }}
            ></div>
          </div>

          <div className="space-y-12">
            {t.experience.jobs.map((job, index) => (
              <div key={index} className="relative">
                {/* Large decorative year */}
                <div
                  className="absolute -left-2 sm:-left-6 top-0 text-[80px] sm:text-[110px] font-serif font-black leading-none pointer-events-none select-none"
                  style={{ color: 'var(--foreground)', opacity: 0.04 }}
                >
                  {job.period.substring(0, 4)}
                </div>

                <div
                  className="relative border-l-2 pl-6 sm:pl-10"
                  style={{ borderColor: 'var(--primary)' }}
                >
                  <span
                    className="text-xs tracking-[0.2em] uppercase font-semibold block mb-3 select-none"
                    style={{ color: 'var(--primary)' }}
                  >
                    {job.period}
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif mb-1 select-none"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {job.company}
                  </h3>
                  <div
                    className="text-base sm:text-lg font-light mb-4 select-none"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {job.role}
                  </div>
                  <p
                    className="leading-relaxed"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {job.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section — Two Columns */}
      <section
        id="contact"
        className="py-16 sm:py-24 px-6 sm:px-10 lg:px-16"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div
            className="w-full h-[1px] mb-10 sm:mb-14"
            style={{ backgroundColor: 'var(--border)' }}
          ></div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Left — info */}
            <div>
              <span
                className="text-xs tracking-[0.3em] uppercase font-semibold block mb-4"
                style={{ color: 'var(--primary)' }}
              >
                Get In Touch
              </span>
              <h2
                className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif mb-6"
                style={{ color: 'var(--foreground)' }}
              >
                {t.contact.title}
              </h2>
              <p
                className="text-base sm:text-lg leading-relaxed mb-10"
                style={{ color: 'var(--text-muted)' }}
              >
                {t.contact.subtitle}
              </p>

              <div className="space-y-4">
                <div
                  className="flex items-center gap-4 py-4 border-b"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span
                    className="text-xs tracking-widest uppercase w-16 select-none"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Email
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    justin20745413@gmail.com
                  </span>
                </div>
                <div
                  className="flex items-center gap-4 py-4 border-b"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span
                    className="text-xs tracking-widest uppercase w-16 select-none"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Location
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Taiwan
                  </span>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div>
              <div className="space-y-6">
                <div>
                  <label
                    className="block text-xs tracking-widest uppercase font-semibold mb-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {t.contact.form.name}
                  </label>
                  <input
                    type="text"
                    placeholder={t.contact.form.namePlaceholder}
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    className="w-full px-0 py-3 border-b-2 border-t-0 border-x-0 bg-transparent focus:outline-none transition-colors"
                    style={{
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

                <div>
                  <label
                    className="block text-xs tracking-widest uppercase font-semibold mb-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {t.contact.form.email}
                  </label>
                  <input
                    type="email"
                    placeholder={t.contact.form.emailPlaceholder}
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    className="w-full px-0 py-3 border-b-2 border-t-0 border-x-0 bg-transparent focus:outline-none transition-colors"
                    style={{
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

                <div>
                  <label
                    className="block text-xs tracking-widest uppercase font-semibold mb-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {t.contact.form.message}
                  </label>
                  <textarea
                    rows={5}
                    placeholder={t.contact.form.messagePlaceholder}
                    value={formData.message}
                    onChange={e => handleInputChange('message', e.target.value)}
                    className="w-full px-0 py-3 border-b-2 border-t-0 border-x-0 bg-transparent focus:outline-none transition-colors resize-none"
                    style={{
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
                  disabled={isSubmitting}
                  className="w-full px-8 py-4 text-sm font-semibold tracking-[0.12em] uppercase transition-all"
                  style={{
                    backgroundColor: isSubmitting ? 'var(--text-muted)' : 'var(--foreground)',
                    color: 'var(--background)',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => {
                    if (!isSubmitting)
                      e.currentTarget.style.backgroundColor = 'var(--primary)';
                  }}
                  onMouseLeave={e => {
                    if (!isSubmitting)
                      e.currentTarget.style.backgroundColor = 'var(--foreground)';
                  }}
                >
                  {isSubmitting ? '傳送中...' : t.contact.form.submit}
                </button>
              </div>
            </div>
          </div>

          <div
            className="w-full h-[1px] mt-16"
            style={{ backgroundColor: 'var(--border)' }}
          ></div>
        </div>
      </section>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');

        * {
          font-family: 'Noto Sans TC', sans-serif;
        }

        .font-serif {
          font-family: 'Playfair Display', 'Noto Sans TC', serif !important;
        }

        /* Swiper magazine style */
        .magazine-swiper {
          width: 100%;
          padding: 0 0 60px 0;
          --swiper-theme-color: var(--primary);
          --swiper-pagination-color: var(--primary);
          --swiper-pagination-bullet-inactive-color: var(--border);
          --swiper-pagination-bullet-inactive-opacity: 1;
        }

        .magazine-card {
          height: 520px;
          display: block;
          background-color: var(--secondary);
        }

        .magazine-card-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .swiper-slide {
          height: auto;
        }

        .swiper-pagination-bullet {
          background: var(--border) !important;
          opacity: 1 !important;
          width: 6px;
          height: 6px;
        }

        .swiper-pagination-bullet-active {
          background: var(--primary) !important;
          opacity: 1 !important;
          width: 24px;
          border-radius: 3px;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in { animation: fade-in 0.9s ease-out; }
        .animate-fade-in-delay { animation: fade-in 0.9s ease-out 0.35s backwards; }
        .animate-slide-up { animation: fade-in 0.9s ease-out 0.1s backwards; }
        .animate-slide-up-delay { animation: fade-in 0.9s ease-out 0.22s backwards; }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink { animation: blink 1s step-end infinite; }
      `}</style>
    </>
  );
}
