'use client';

import { useEffect, useRef, useState, useSyncExternalStore, useCallback } from 'react';
import { HomeTranslations } from '@/app/models/Hometranslation';
import Typewriter from '../components/effects/Typewriter';
import Counter from '../components/effects/Counter';

interface Project {
  title: string;
  tech: string;
  description: string;
  image?: string;
  url?: string;
}

export default function HomeClient({
  translations: t,
}: {
  translations: HomeTranslations;
}) {
  const swiperRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const modalRef = useRef<HTMLDivElement>(null);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  /* ── GSAP hero entrance ── */
  useEffect(() => {
    if (!mounted) return;
    let ctx: { revert: () => void } | null = null;

    const initGSAP = async () => {
      try {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        /* Hero stagger */
        gsap.fromTo(
          '.gsap-hero-item',
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', delay: 0.2 }
        );

        /* Section reveal on scroll — 雙向：進入播放，滾回去反向 */
        gsap.utils.toArray<Element>('.gsap-section').forEach(el => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                end: 'top 20%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        });

        /* Skill rows — 雙向 */
        gsap.utils.toArray<Element>('.gsap-skill-row').forEach((el, i) => {
          gsap.fromTo(
            el,
            { opacity: 0, x: -24 },
            {
              opacity: 1,
              x: 0,
              duration: 0.5,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 90%',
                end: 'top 20%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        });
      });
      } catch (e) {
        /* GSAP 初始化失敗時，讓所有元素直接顯示 */
        document.querySelectorAll('.gsap-hero-item, .gsap-section, .gsap-skill-row').forEach(el => {
          (el as HTMLElement).style.opacity = '1';
          (el as HTMLElement).style.transform = 'none';
        });
        console.error('GSAP init error:', e);
      }
    };

    initGSAP();
    return () => ctx?.revert();
  }, [mounted]);

  /* ── Modal GSAP open / close ── */
  const openModal = useCallback(async (project: Project, index: number) => {
    setActiveProject(project);
    setActiveIndex(index);
    document.body.style.overflow = 'hidden';

    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r));

    const { gsap } = await import('gsap');
    if (modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.94, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, []);

  const closeModal = useCallback(async () => {
    const { gsap } = await import('gsap');
    if (modalRef.current) {
      await gsap.to(modalRef.current, {
        opacity: 0,
        scale: 0.94,
        y: 20,
        duration: 0.25,
        ease: 'power2.in',
      });
    }
    setActiveProject(null);
    document.body.style.overflow = '';
  }, []);

  /* ── Swiper ── */
  useEffect(() => {
    if (!mounted) return;
    const loadSwiper = async () => {
      const Swiper = (await import('swiper')).default;
      const { Pagination, Autoplay } = await import('swiper/modules');

      if (swiperRef.current) {
        new Swiper(swiperRef.current, {
          modules: [Pagination, Autoplay],
          slidesPerView: 1,
          spaceBetween: 16,
          loop: true,
          centeredSlides: false,
          observer: true,
          observeParents: true,
          breakpoints: {
            640: { slidesPerView: 2, spaceBetween: 24 },
            1024: { slidesPerView: 3, spaceBetween: 32 },
          },
          autoplay: { delay: 4500, disableOnInteraction: false },
          pagination: { el: '.swiper-pagination', clickable: true, dynamicBullets: false },
        });
      }
    };
    loadSwiper();
  }, [mounted]);

  /* ── Form ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
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

  /* ── SSR skeleton ── */
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
              <div className="h-24 w-full mb-4 animate-pulse rounded" style={{ backgroundColor: 'var(--text-muted)' }}></div>
              <div className="h-24 w-3/4 mb-6 animate-pulse rounded" style={{ backgroundColor: 'var(--text-muted)' }}></div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      {/* ═══════════ HERO ═══════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col px-6 sm:px-10 lg:px-16 pt-24 pb-12 overflow-hidden"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div
          className="gsap-hero-item flex items-center justify-between border-b pb-4 mb-10 sm:mb-14"
          style={{ borderColor: 'var(--border)', opacity: 0 }}
        >
          <span className="text-xs tracking-[0.3em] uppercase font-semibold select-none" style={{ color: 'var(--text-muted)' }}>
            Portfolio
          </span>
          <span className="text-xs tracking-[0.3em] uppercase font-semibold select-none" style={{ color: 'var(--text-muted)' }}>
            Issue No. 01 &mdash; 2025
          </span>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <p className="gsap-hero-item text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold mb-5 select-none" style={{ color: 'var(--primary)', opacity: 0 }}>
              {t.hero.greeting}
            </p>
            <h1 className="gsap-hero-item text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.05] mb-6 font-serif select-none" style={{ color: 'var(--foreground)', opacity: 0 }}>
              {t.hero.title}
            </h1>
            <div className="gsap-hero-item w-16 h-[3px] mb-6" style={{ backgroundColor: 'var(--primary)', opacity: 0 }}></div>
            <h2 className="gsap-hero-item text-lg sm:text-xl lg:text-2xl font-light mb-6 select-none" style={{ color: 'var(--text-muted)', opacity: 0 }}>
              <Typewriter words={t.hero.subtitles} />
            </h2>
            <p className="gsap-hero-item text-sm sm:text-base leading-relaxed mb-10 max-w-md select-none" style={{ color: 'var(--text-muted)', opacity: 0 }}>
              {t.hero.description}
            </p>
            <div className="gsap-hero-item flex flex-col sm:flex-row gap-3" style={{ opacity: 0 }}>
              <a
                href="#portfolio"
                className="px-8 py-3 text-sm font-semibold tracking-[0.12em] uppercase text-center transition-all"
                style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--foreground)'; }}
              >
                {t.hero.viewPortfolio}
              </a>
              <a
                href="#contact"
                className="px-8 py-3 text-sm font-semibold tracking-[0.12em] uppercase text-center border-2 transition-all"
                style={{ borderColor: 'var(--foreground)', color: 'var(--foreground)', backgroundColor: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--foreground)'; e.currentTarget.style.color = 'var(--foreground)'; }}
              >
                {t.hero.contactMe}
              </a>
            </div>
          </div>

          <div className="gsap-hero-item relative hidden lg:flex items-center justify-center select-none" style={{ opacity: 0 }}>
            <div className="text-[clamp(160px,18vw,280px)] font-serif font-black leading-none pointer-events-none" style={{ color: 'var(--border)', opacity: 0.35 }}>
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

        {/* Stats bar */}
        <div className="gsap-hero-item border-t mt-10 pt-8 grid grid-cols-3 gap-4 sm:gap-8" style={{ borderColor: 'var(--border)', opacity: 0 }}>
          {[
            { stat: t.stats.experience },
            { stat: t.stats.projects },
            { stat: t.stats.skills },
          ].map(({ stat }, i) => (
            <div key={i} className={i > 0 ? 'border-l pl-4 sm:pl-8' : ''} style={{ borderColor: 'var(--border)' }}>
              <div className="text-3xl sm:text-4xl font-bold font-serif mb-1 select-none" style={{ color: 'var(--primary)' }}>
                <Counter value={stat.value} className="select-none cursor-default" />
              </div>
              <div className="text-xs tracking-widest uppercase select-none" style={{ color: 'var(--text-muted)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ PORTFOLIO ═══════════ */}
      <section
        id="portfolio"
        className="py-16 sm:py-24 overflow-x-hidden gsap-section"
        style={{ backgroundColor: 'var(--secondary)', opacity: 0 }}
      >
        <div className="px-6 sm:px-10 lg:px-16 mb-10 sm:mb-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="text-xs tracking-[0.3em] uppercase font-semibold block mb-3" style={{ color: 'var(--primary)' }}>
                Selected Works
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif" style={{ color: 'var(--foreground)' }}>
                {t.portfolio.title}
              </h2>
            </div>
            <p className="text-sm max-w-xs leading-relaxed sm:text-right" style={{ color: 'var(--text-muted)' }}>
              {t.portfolio.subtitle}
            </p>
          </div>
          <div className="w-full h-[1px] mt-8" style={{ backgroundColor: 'var(--border)' }}></div>
        </div>

        {/* Swiper */}
        <div className="px-6 sm:px-10 lg:px-16">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" />
          <div ref={swiperRef} className="swiper magazine-swiper">
            <div className="swiper-wrapper">
              {t.portfolio.projects.map((project, index) => (
                <div key={index} className="swiper-slide">
                  <div
                    className="magazine-card relative overflow-hidden cursor-pointer group"
                    style={{ border: '1px solid var(--border)' }}
                    onClick={() => openModal(project, index)}
                  >
                    {project.image ? (
                      <img
                        src={project.image}
                        alt={project.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                        <span className="text-[120px] font-serif font-black opacity-10 select-none" style={{ color: 'var(--background)' }}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 transition-opacity duration-300" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.90) 40%, rgba(0,0,0,0.15) 100%)' }}></div>

                    {/* Hover overlay hint */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
                      <span className="text-white text-xs tracking-[0.2em] uppercase font-semibold border border-white px-4 py-2">
                        View Details
                      </span>
                    </div>

                    {/* Top row */}
                    <div className="absolute top-5 left-5 right-5 flex items-start justify-between z-10">
                      <span className="text-3xl font-serif font-bold text-white select-none" style={{ opacity: 0.55 }}>
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      {/* Prominent link button */}
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wide uppercase transition-all"
                          style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(4px)' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Live
                        </a>
                      )}
                    </div>

                    {/* Bottom content */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 z-10">
                      <p className="text-xs tracking-[0.2em] uppercase text-white mb-2" style={{ opacity: 0.55 }}>
                        {project.tech}
                      </p>
                      <h3 className="text-xl sm:text-2xl font-bold text-white font-serif mb-1 line-clamp-2">
                        {project.title}
                      </h3>
                      <p className="text-sm text-white line-clamp-2 leading-relaxed" style={{ opacity: 0.65 }}>
                        {project.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="swiper-pagination"></div>
          </div>
        </div>
      </section>

      {/* ═══════════ SKILLS ═══════════ */}
      <section className="py-16 sm:py-24 px-6 sm:px-10 lg:px-16 gsap-section" style={{ opacity: 0 }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 sm:mb-14">
            <span className="text-xs tracking-[0.3em] uppercase font-semibold block mb-3" style={{ color: 'var(--primary)' }}>
              Expertise
            </span>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif" style={{ color: 'var(--foreground)' }}>
                {t.skills.title}
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.skills.subtitle}</p>
            </div>
            <div className="w-full h-[1px] mt-8" style={{ backgroundColor: 'var(--border)' }}></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="gsap-skill-row flex items-center justify-between py-5 border-b transition-all group cursor-default"
                style={{ borderColor: 'var(--border)', opacity: 0 }}
              >
                <div className="flex items-center gap-4 sm:gap-8">
                  <span className="text-xs font-mono w-6 select-none" style={{ color: 'var(--text-muted)' }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-xs tracking-widest uppercase w-20 select-none" style={{ color: 'var(--text-muted)' }}>
                    {skill.category}
                  </span>
                  <span className="text-base sm:text-lg font-semibold font-serif group-hover:translate-x-1 transition-transform select-none" style={{ color: 'var(--foreground)' }}>
                    {skill.name}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: i < skill.level ? 'var(--primary)' : 'var(--border)' }}></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ EXPERIENCE ═══════════ */}
      <section className="py-16 sm:py-24 px-6 sm:px-10 lg:px-16 gsap-section" style={{ backgroundColor: 'var(--secondary)', opacity: 0 }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 sm:mb-14">
            <span className="text-xs tracking-[0.3em] uppercase font-semibold block mb-3" style={{ color: 'var(--primary)' }}>
              Career
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif" style={{ color: 'var(--foreground)' }}>
              {t.experience.title}
            </h2>
            <div className="w-full h-[1px] mt-8" style={{ backgroundColor: 'var(--border)' }}></div>
          </div>

          <div className="space-y-12">
            {t.experience.jobs.map((job, index) => (
              <div key={index} className="relative">
                <div
                  className="absolute -left-2 sm:-left-6 top-0 text-[80px] sm:text-[110px] font-serif font-black leading-none pointer-events-none select-none"
                  style={{ color: 'var(--foreground)', opacity: 0.04 }}
                >
                  {job.period.substring(0, 4)}
                </div>
                <div className="relative border-l-2 pl-6 sm:pl-10" style={{ borderColor: 'var(--primary)' }}>
                  <span className="text-xs tracking-[0.2em] uppercase font-semibold block mb-3 select-none" style={{ color: 'var(--primary)' }}>
                    {job.period}
                  </span>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif mb-1 select-none" style={{ color: 'var(--foreground)' }}>
                    {job.company}
                  </h3>
                  <div className="text-base sm:text-lg font-light mb-4 select-none" style={{ color: 'var(--text-muted)' }}>
                    {job.role}
                  </div>
                  <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {job.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CONTACT ═══════════ */}
      <section id="contact" className="py-16 sm:py-24 px-6 sm:px-10 lg:px-16 gsap-section" style={{ opacity: 0 }}>
        <div className="max-w-7xl mx-auto">
          <div className="w-full h-[1px] mb-10 sm:mb-14" style={{ backgroundColor: 'var(--border)' }}></div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <span className="text-xs tracking-[0.3em] uppercase font-semibold block mb-4" style={{ color: 'var(--primary)' }}>
                Get In Touch
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif mb-6" style={{ color: 'var(--foreground)' }}>
                {t.contact.title}
              </h2>
              <p className="text-base sm:text-lg leading-relaxed mb-10" style={{ color: 'var(--text-muted)' }}>
                {t.contact.subtitle}
              </p>
              <div className="space-y-0">
                {[
                  { label: 'Email', value: 'justin20745413@gmail.com' },
                  { label: 'Location', value: 'Taiwan' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-xs tracking-widest uppercase w-20 select-none shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {[
                { field: 'name' as const, label: t.contact.form.name, placeholder: t.contact.form.namePlaceholder, type: 'text' },
                { field: 'email' as const, label: t.contact.form.email, placeholder: t.contact.form.emailPlaceholder, type: 'email' },
              ].map(({ field, label, placeholder, type }) => (
                <div key={field}>
                  <label className="block text-xs tracking-widest uppercase font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                    {label}
                  </label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={formData[field]}
                    onChange={e => handleInputChange(field, e.target.value)}
                    className="w-full px-0 py-3 border-b-2 border-t-0 border-x-0 bg-transparent focus:outline-none transition-colors"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs tracking-widest uppercase font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  {t.contact.form.message}
                </label>
                <textarea
                  rows={5}
                  placeholder={t.contact.form.messagePlaceholder}
                  value={formData.message}
                  onChange={e => handleInputChange('message', e.target.value)}
                  className="w-full px-0 py-3 border-b-2 border-t-0 border-x-0 bg-transparent focus:outline-none transition-colors resize-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
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
                onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.backgroundColor = 'var(--primary)'; }}
                onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.backgroundColor = 'var(--foreground)'; }}
              >
                {isSubmitting ? '傳送中...' : t.contact.form.submit}
              </button>
            </div>
          </div>

          <div className="w-full h-[1px] mt-16" style={{ backgroundColor: 'var(--border)' }}></div>
        </div>
      </section>

      {/* ═══════════ PROJECT MODAL ═══════════ */}
      {activeProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={closeModal}
        >
          <div
            ref={modalRef}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal image */}
            <div className="relative h-56 sm:h-72 overflow-hidden">
              {activeProject.image ? (
                <img src={activeProject.image} alt={activeProject.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                  <span className="text-[90px] font-serif font-black opacity-10 select-none" style={{ color: 'var(--background)' }}>
                    {String(activeIndex + 1).padStart(2, '0')}
                  </span>
                </div>
              )}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }}></div>

              {/* Modal index */}
              <span className="absolute top-5 left-6 text-4xl font-serif font-bold text-white select-none" style={{ opacity: 0.5 }}>
                {String(activeIndex + 1).padStart(2, '0')}
              </span>

              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center transition-all"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'; }}
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 sm:p-8">
              <p className="text-xs tracking-[0.2em] uppercase font-semibold mb-3" style={{ color: 'var(--primary)' }}>
                {activeProject.tech}
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold font-serif mb-4" style={{ color: 'var(--foreground)' }}>
                {activeProject.title}
              </h3>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
                {activeProject.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                {activeProject.url && (
                  <a
                    href={activeProject.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold tracking-wide uppercase transition-all"
                    style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--foreground)'; }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Visit Live Site
                  </a>
                )}
                <button
                  onClick={closeModal}
                  className="px-6 py-3 text-sm font-semibold tracking-wide uppercase transition-all border-2"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', backgroundColor: 'transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--foreground)'; e.currentTarget.style.color = 'var(--foreground)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');

        * { font-family: 'Noto Sans TC', sans-serif; }

        .font-serif { font-family: 'Playfair Display', 'Noto Sans TC', serif !important; }

        /* 統一 placeholder 顏色 */
        input::placeholder,
        textarea::placeholder {
          color: var(--text-muted);
          opacity: 0.6;
        }

        /* 覆蓋瀏覽器 autofill 黃色背景 */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        textarea:-webkit-autofill,
        textarea:-webkit-autofill:hover,
        textarea:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px var(--background) inset !important;
          -webkit-text-fill-color: var(--foreground) !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .magazine-swiper {
          width: 100%;
          padding-bottom: 52px !important;
          --swiper-theme-color: var(--primary);
          overflow: visible !important;
        }

        .magazine-swiper .swiper-wrapper {
          align-items: stretch;
        }

        .magazine-swiper .swiper-slide {
          height: auto;
        }

        .magazine-card {
          height: 480px;
          display: block;
          background-color: var(--secondary);
        }

        @media (min-width: 640px) { .magazine-card { height: 520px; } }

        .swiper-pagination {
          position: relative !important;
          bottom: auto !important;
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 12px;
        }

        .swiper-pagination-bullet {
          background: var(--border) !important;
          opacity: 1 !important;
          width: 6px !important;
          height: 6px !important;
          border-radius: 3px !important;
          display: inline-block;
          flex-shrink: 0;
          transition: width 0.3s ease, background 0.3s ease !important;
          margin: 0 !important;
        }

        .swiper-pagination-bullet-active {
          background: var(--primary) !important;
          width: 22px !important;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink { animation: blink 1s step-end infinite; }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
