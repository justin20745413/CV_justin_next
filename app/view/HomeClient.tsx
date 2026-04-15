'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { HomeTranslations } from '@/app/models/Hometranslation';
import InteractiveBackground from '../components/InteractiveBackground';
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
      const { Navigation, Pagination, Autoplay } =
        await import('swiper/modules');

      if (swiperRef.current) {
        new Swiper(swiperRef.current, {
          modules: [Navigation, Pagination, Autoplay],
          slidesPerView: 3,
          spaceBetween: 30,
          loop: true,
          centeredSlides: false,

          breakpoints: {
            // 手機版:顯示 1 張
            320: {
              slidesPerView: 1,
              spaceBetween: 10,
            },
            // 平板版:顯示 2 張
            768: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            // 桌面版:顯示 3 張
            1024: {
              slidesPerView: 3,
              spaceBetween: 30,
            },
          },

          // 自動播放設定
          autoplay: {
            delay: 3000,
            disableOnInteraction: false,
          },

          // 分頁器
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

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
    { name: 'Vue.js', level: 3 },
    { name: 'TypeScript', level: 3 },
    { name: 'Nuxt.js', level: 2 },
    { name: 'Quasar', level: 2 },
    { name: 'Tailwind CSS', level: 3 },
    { name: 'JavaScript', level: 3 },
    { name: 'Git', level: 2 },
    { name: 'Docker', level: 1 },
  ];

  if (!mounted) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: 'var(--background)' }}
      >
        {/* Hero Section Skeleton */}
        <section className="relative min-h-screen flex items-center justify-center px-4">
          <div className="max-w-7xl mx-auto text-center">
            {/* ✅ 使用 CSS 變數取代 bg-gray-300 */}
            <div
              className="h-8 w-48 mx-auto mb-4 animate-pulse rounded"
              style={{ backgroundColor: 'var(--text-muted)' }}
            ></div>
            <div
              className="h-6 w-96 mx-auto mb-8 animate-pulse rounded"
              style={{ backgroundColor: 'var(--text-muted)' }}
            ></div>
            <div
              className="h-6 w-64 mx-auto mb-4 animate-pulse rounded"
              style={{ backgroundColor: 'var(--text-muted)' }}
            ></div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="rounded-2xl shadow-xl p-6"
                  style={{ backgroundColor: 'var(--secondary)' }}
                >
                  <div
                    className="h-10 w-20 mx-auto mb-4 animate-pulse rounded"
                    style={{ backgroundColor: 'var(--border)' }}
                  ></div>
                  <div
                    className="h-4 w-32 mx-auto animate-pulse rounded"
                    style={{ backgroundColor: 'var(--border)' }}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Portfolio Section Skeleton */}
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

            {/* Swiper Container - 三欄式布局 */}
            <div className="swiper-container-wrapper relative">
              <link
                rel="stylesheet"
                href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"
              />
              <div ref={swiperRef} className="swiper three-slides-swiper">
                <div className="swiper-wrapper">
                  {t.portfolio.projects.map((project, index) => (
                    <div key={index} className="swiper-slide">
                      <div
                        className="rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl h-full"
                        style={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div
                          className="h-48 flex items-center justify-center relative overflow-hidden group"
                          style={{
                            backgroundColor: project.image
                              ? 'transparent'
                              : 'var(--primary)',
                          }}
                        >
                          {project.image ? (
                            <img
                              src={project.image}
                              alt={project.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                          ) : (
                            <div
                              className="text-6xl font-bold opacity-20"
                              style={{ color: 'var(--background)' }}
                            >
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div className="p-6">
                          <h3
                            className="text-xl font-bold mb-3 transition-colors flex items-start justify-between gap-2"
                            style={{ color: 'var(--foreground)' }}
                          >
                            <span className="line-clamp-2 flex-1">
                              {project.title}
                            </span>
                            {project.url && (
                              <a
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700 flex-shrink-0 mt-1"
                                title="前往專案連結"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
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

                {/* 分頁器 */}
                <div className="swiper-pagination"></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden pt-16 sm:pt-0">
        <InteractiveBackground />
        <div className="relative z-10 max-w-7xl mx-auto text-center w-full">
          <p
            className="text-base sm:text-lg md:text-xl mb-4 animate-fade-in transition-colors select-none cursor-default"
            style={{ color: 'var(--text-muted)' }}
          >
            {t.hero.greeting}
          </p>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 animate-slide-up transition-colors select-none cursor-default px-2"
            style={{ color: 'var(--foreground)' }}
          >
            {t.hero.title}
          </h1>
          <h2
            className="text-xl sm:text-2xl font-semibold mb-6 animate-slide-up-delay transition-colors select-none cursor-default"
            style={{ color: 'var(--text-muted)' }}
          >
            <Typewriter words={t.hero.subtitles} />
          </h2>
          <p
            className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-8 animate-fade-in-delay transition-colors select-none cursor-default px-2"
            style={{ color: 'var(--foreground)' }}
          >
            {t.hero.description}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto mt-8 sm:mt-12 px-2">
            <div
              className="rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all"
              style={{ backgroundColor: 'var(--secondary)' }}
            >
              <div
                className="text-4xl font-bold mb-2 transition-colors"
                style={{ color: 'var(--primary)' }}
              >
                <Counter
                  className="select-none cursor-default"
                  value={t.stats.experience.value}
                />
              </div>
              <div
                className="transition-colors select-none cursor-default"
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
                <Counter
                  value={t.stats.projects.value}
                  className="select-none cursor-default"
                />
              </div>
              <div
                className="transition-colors select-none cursor-default"
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
                <Counter
                  value={t.stats.skills.value}
                  className="select-none cursor-default"
                />
              </div>
              <div
                className="transition-colors select-none cursor-default"
                style={{ color: 'var(--text-muted)' }}
              >
                {t.stats.skills.label}
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-8 sm:mt-12 px-4 mb-6">
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
              className="px-8 py-4  rounded-full font-semibold transition-all transform hover:scale-105 shadow-lg border-2"
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
        className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 transition-colors"
        style={{ backgroundColor: 'var(--secondary)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 transition-colors"
              style={{ color: 'var(--foreground)' }}
            >
              {t.portfolio.title}
            </h2>
            <p
              className="text-base sm:text-lg md:text-xl transition-colors"
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
              <div className="swiper-wrapper my-10 mx-10">
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
                        className="h-48 flex items-center justify-center relative overflow-hidden group"
                        style={{
                          backgroundColor: 'var(--primary)',
                        }}
                      >
                        {project.image ? (
                          <img
                            src={project.image}
                            alt={project.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <div
                            className="text-6xl font-bold opacity-20"
                            style={{ color: 'var(--background)' }}
                          >
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3
                          className="text-xl font-bold mb-3 transition-colors flex items-start justify-between gap-2"
                          style={{ color: 'var(--foreground)' }}
                        >
                          <span className="line-clamp-2 flex-1">
                            {project.title}
                          </span>
                          {project.url && (
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700 flex-shrink-0 mt-1"
                              title="前往專案連結"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
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

              <div className="swiper-pagination mt-6"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 transition-colors"
              style={{ color: 'var(--foreground)' }}
            >
              {t.skills.title}
            </h2>
            <p
              className="text-base sm:text-lg md:text-xl transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.skills.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="rounded-xl shadow-lg p-4 sm:p-5 md:p-6 text-center transform hover:scale-105 transition-all"
                style={{ backgroundColor: 'var(--secondary)' }}
              >
                <div
                  className="text-lg sm:text-xl md:text-2xl font-bold mb-2 transition-colors"
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
        className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 transition-colors border border-white"
        style={{ backgroundColor: 'var(--secondary)' }}
      >
        <div className="max-w-5xl mx-auto ">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 sm:mb-10 md:mb-12 text-center transition-colors"
            style={{ color: 'var(--foreground)' }}
          >
            {t.experience.title}
          </h2>

          <div className="space-y-8">
            {t.experience.jobs.map((job, index) => (
              <div
                key={index}
                className="rounded-2xl shadow-lg p-5 sm:p-6 md:p-8 border-l-4 transform hover:scale-102 transition-all border border-white"
                style={{
                  backgroundColor: 'var(--background)',
                  borderLeftColor: 'var(--primary)',
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <h3
                    className="text-xl sm:text-2xl font-bold transition-colors"
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
        className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 transition-colors"
        style={{
          backgroundColor: 'var(--primary)',
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6"
            style={{ color: 'var(--background)' }}
          >
            {t.contact.title}
          </h2>
          <p
            className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 md:mb-12 opacity-90"
            style={{ color: 'var(--background)' }}
          >
            {t.contact.subtitle}
          </p>

          <div
            className="rounded-2xl shadow-2xl p-5 sm:p-8 md:p-12 transition-colors"
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
                disabled={isSubmitting}
                className="w-full px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                style={{
                  backgroundColor: isSubmitting
                    ? 'var(--text-muted)'
                    : 'var(--primary)',
                  color: 'var(--background)',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => {
                  if (!isSubmitting)
                    e.currentTarget.style.backgroundColor =
                      'var(--primary-hover)';
                }}
                onMouseLeave={e => {
                  if (!isSubmitting)
                    e.currentTarget.style.backgroundColor = 'var(--primary)';
                }}
              >
                {isSubmitting ? '傳送中...' : t.contact.form.submit}
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
          --swiper-theme-color: var(--primary);
          --swiper-pagination-color: var(--primary);
          --swiper-pagination-bullet-inactive-color: var(--primary);
          --swiper-pagination-bullet-inactive-opacity: 0.5;
        }

        .swiper-slide {
          width: 320px;
          height: 400px;
        }

        .swiper-pagination-bullet {
          background: var(--primary) !important;
          opacity: 0.5 !important;
        }

        .swiper-pagination-bullet-active {
          background: var(--primary) !important;
          opacity: 1 !important;
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

        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }

        .animate-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </>
  );
}
