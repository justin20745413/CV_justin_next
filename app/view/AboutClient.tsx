'use client';

import { useRef, useState, useEffect } from 'react';
import { useTheme } from '@/app/components/ThemeProvider';
import html2canvas from 'html2canvas-pro';
import { Abouttranslation } from '@/app/models/Abouttranslation';
import NetworkBackground from '../components/NetworkBackground';

export default function AboutClient({ about }: { about: Abouttranslation }) {
  const { theme } = useTheme();
  const cvRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const generatePdf = async (): Promise<void> => {
    const container = cvRef.current;
    if (!container) return;

    setIsGenerating(true);

    try {
      const { jsPDF } = await import('jspdf');

      const page1 = container.querySelector(
        '.cv-page:nth-child(1)'
      ) as HTMLElement;
      const page2 = container.querySelector(
        '.cv-page:nth-child(2)'
      ) as HTMLElement;

      if (!page1 || !page2) {
        console.error('找不到頁面元素');
        return;
      }

      // 👇 隱藏.no-print 元素
      const noPrintElements = container.querySelectorAll('.no-print');
      noPrintElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth: number = pdf.internal.pageSize.getWidth();
      const margin = 5;
      const contentWidth = pdfWidth - margin * 2;

      // 第一頁
      const canvas1: HTMLCanvasElement = await html2canvas(page1, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData1: string = canvas1.toDataURL('image/jpeg', 0.98);

      const scale = 0.91;
      const imgWidth1: number = contentWidth;
      const imgHeight1: number =
        ((canvas1.height * contentWidth) / canvas1.width) * scale;

      pdf.addImage(imgData1, 'JPEG', margin, margin, imgWidth1, imgHeight1);
      pdf.addPage();

      // 第二頁
      const canvas2: HTMLCanvasElement = await html2canvas(page2, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData2: string = canvas2.toDataURL('image/jpeg', 0.98);
      const imgHeight2: number =
        (canvas2.height * contentWidth) / canvas2.width;

      pdf.addImage(imgData2, 'JPEG', margin, margin, contentWidth, imgHeight2);

      const blobUrl = pdf.output('bloburl') as unknown as string;
      
      // 👇 恢復 .no-print 元素顯示
      noPrintElements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });

      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPdf = (): void => {
    generatePdf();
  };
  return (
    <div className="">
      <NetworkBackground />
      <div className="relative z-10">
        <div className="mb-6 my-5 no-print">
          <h1 className="text-3xl font-bold ml-4 mt-6">{about.title}</h1>
        </div>

        {/* Fixed download button */}
        <button
          className={`fixed top-21 right-5 z-50 inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium shadow-lg transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5 no-print ${
            mounted && theme === 'dark-orange'
              ? 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
          }`}
          onClick={downloadPdf}
          disabled={isGenerating}
        >
          <span>{isGenerating ? 'Generating...' : '📄'}</span>
          {about.actions.download}
        </button>

        {/* A4 頁面容器，包含兩頁 */}
        <div ref={cvRef} className="cv-pages-container">
          {/* 第一頁 */}
          <div className="cv-container cv-page shadow-2xl mx-auto border border-gray-200 rounded-lg overflow-hidden bg-white">
            {/* 頁首區塊 */}
            <div className="header-section border-b-2 border-blue-100 pb-6 mb-6 relative">
              <div className="flex flex-row items-center gap-4 p-4">
                {/* 照片區域 */}
                <div className="photo-container shrink-0">
                  <div className="w-24 h-24 rounded-full border-4 border-blue-200 overflow-hidden bg-gray-100 shadow-lg">
                    {about.profile.photo ? (
                      <img
                        src={about.profile.photo}
                        alt={about.profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-3xl">👤</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 個人資訊 */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-1 leading-tight">
                    {about.profile.name}
                  </h2>
                  <p className="text-base md:text-lg text-blue-600 font-medium mb-2">
                    {about.profile.role}
                  </p>

                  {/* 聯絡資訊 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-gray-600">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <span>📍</span>
                      <span>{about.profile.location}</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <span>✉️</span>
                      <span>{about.profile.email}</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <span>📞</span>
                      <span>{about.profile.phone}</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <span>📅</span>
                      <span>{about.profile.experience}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 簡介 */}
              <div className="px-4 pb-2">
                <h3 className="font-semibold text-gray-800 mt-2 mb-1 flex items-center gap-2">
                  <span>👤</span>
                  {about.sections.summary}
                </h3>
                <div className="p-2 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-gray-700 leading-relaxed text-xs">
                    {about.profile.summary}
                  </p>
                </div>
              </div>
            </div>

            {/* 主體內容：桌面版採用兩欄布局 */}
            <div className="cv-main-grid grid grid-cols-1 lg:grid-cols-5 gap-4 mt-1 px-4 pb-4">
              {/* 左欄 */}
              <div className="cv-left-col lg:col-span-2 space-y-3">
                {/* 技能區塊 */}
                <section>
                  <h3 className="section-title">
                    <span className="mr-2">⚙️</span>
                    {about.sections.skills}
                  </h3>
                  <div className="space-y-2">
                    {about.skills.map((skillGroup, groupIndex) => (
                      <div key={groupIndex}>
                        <h4 className="font-semibold text-gray-700 text-xs mb-1">
                          {skillGroup.category}
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {skillGroup.items.map((skill, skillIndex) => (
                            <span
                              key={skillIndex}
                              className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 語言能力區塊 */}
                <section>
                  <h3 className="section-title">
                    <span className="mr-2">🌐</span>
                    {about.sections.languages}
                  </h3>
                  <div className="space-y-1">
                    {about.languages.map((lang, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center"
                      >
                        <span className="font-medium text-gray-700 text-xs">
                          {lang.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 連結區塊 - 列印時隱藏 */}
                <section className="no-print">
                  <h3 className="section-title">
                    <span className="mr-2">🔗</span>
                    {about.sections.links}
                  </h3>
                  <div className="space-y-1">
                    <a
                      href="https://github.com/justin20745413"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-item"
                    >
                      <span className="pi pi-github"></span>
                      <span>{about.links.github}</span>
                    </a>
                    <a
                      href="https://www.linkedin.com/in/cheng-hung-huang-555718360/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-item"
                    >
                      <span className="pi pi-linkedin"></span>
                      <span>{about.links.linkedin}</span>
                    </a>
                  </div>
                </section>

                {/* 證照區塊 */}
                {about.certifications && about.certifications.length > 0 && (
                  <section>
                    <h3 className="section-title">
                      <span className="mr-2">📜</span>
                      {about.sections.certifications}
                    </h3>
                    <div className="space-y-1">
                      {about.certifications.map((cert, i) => (
                        <div key={i}>
                          <p className="font-medium text-gray-800 text-xs">
                            {cert.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {cert.issuer} · {cert.date}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 學歷區塊 */}
                <section>
                  <h3 className="section-title">
                    <span className="mr-2">🎓</span>
                    {about.sections.education}
                  </h3>
                  <div className="space-y-2">
                    {about.education.map((edu, i) => (
                      <div key={i} className="education-item">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-gray-800 text-sm">
                              {edu.school}
                            </h4>
                            <p className="text-gray-700 text-xs">
                              {edu.degree}
                            </p>
                            <p className="text-xs text-gray-600">
                              {edu.period}
                            </p>
                          </div>
                        </div>
                        {edu.relevant_courses && (
                          <div className="mt-1">
                            <p className="text-xs font-medium text-gray-700 mb-1">
                              {about.sections.relevant_courses}：
                            </p>
                            <p className="text-xs text-gray-600">
                              {edu.relevant_courses.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* 右欄 - 工作經歷 */}
              <div className="cv-right-col lg:col-span-3 space-y-3">
                <section>
                  <h3 className="section-title">
                    <span className="mr-2">💼</span>
                    {about.sections.experience}
                  </h3>
                  <div className="space-y-3">
                    {about.experience.map((job, i) => (
                      <div key={i} className="experience-item">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-1">
                          <div>
                            <h4 className="font-bold text-gray-800 text-sm">
                              {job.role}
                            </h4>
                            <p className="text-blue-600 font-medium text-xs">
                              {i === 0 ? (
                                <a
                                  href="https://www.sjis.com.tw/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {job.company}
                                </a>
                              ) : (
                                job.company
                              )}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full mt-1 md:mt-0">
                            {job.period}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-1 leading-relaxed text-xs">
                          {job.desc}
                        </p>
                        {job.achievements && (
                          <div className="space-y-0.5">
                            <p className="font-semibold text-gray-700 text-xs mb-1">
                              {about.sections.achievements}：
                            </p>
                            <ul className="list-none space-y-0.5">
                              {job.achievements.map((achievement, j) => (
                                <li
                                  key={j}
                                  className="text-xs text-gray-600 flex items-start"
                                >
                                  <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-2 shrink-0"></span>
                                  <span className="flex-1">{achievement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {job.technologies && (
                          <div className="mt-1">
                            <div className="flex flex-wrap gap-1">
                              {job.technologies.map((tech, k) => (
                                <span
                                  key={k}
                                  className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* 第二頁 - 專案作品 */}
          <div className="cv-container cv-page shadow-2xl mx-auto border border-gray-200 rounded-lg overflow-hidden page-2 bg-white mt-4 p-4">
            <section>
              <h3 className="section-title">
                <span className="mr-2">💻</span>
                {about.sections.projects}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {about.projects.map((project, i) => (
                  <div key={i} className="project-item">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-gray-800 text-xs flex items-center gap-1">
                        {project.name}
                        {project.url && (
                          <a 
                            href={project.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-500 hover:text-blue-700 inline-flex items-center no-print"
                            title="前往專案連結"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </h4>
                      {project.period && (
                        <span className="text-xs text-gray-500">
                          {project.period}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 text-xs mb-1 leading-relaxed">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.map((tech, j) => (
                        <span
                          key={j}
                          className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <style jsx global>{`
          .cv-pages-container {
            width: 100%;
          }

          .cv-container {
            max-width: 700px;
            background: #ffffff;
            color: #111827;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.3;
            font-size: 11px;
          }

          .header-section {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          }

          .header-section::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #3b82f6, #1d4ed8);
          }

          .section-title {
            font-size: 0.875rem;
            font-weight: 700;
            color: #1f2937;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 0.25rem;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            position: relative;
          }

          .section-title::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 25px;
            height: 2px;
            background: #3b82f6;
          }

          .link-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
            transition: all 0.2s;
            color: #374151;
            font-size: 0.75rem;
            text-decoration: none;
          }

          .link-item:hover {
            border-color: #93c5fd;
            background-color: #eff6ff;
            color: #1d4ed8;
          }

          .experience-item {
            padding: 0.5rem;
            border-radius: 0.5rem;
            border-left: 4px solid #bfdbfe;
            background-color: #f9fafb;
            position: relative;
            break-inside: avoid;
          }

          .experience-item::before {
            content: '';
            position: absolute;
            left: -5px;
            top: 12px;
            width: 6px;
            height: 6px;
            background: #3b82f6;
            border-radius: 50%;
            border: 2px solid white;
          }

          .education-item {
            padding: 0.5rem;
            border-radius: 0.5rem;
            background-color: #f0fdf4;
            border-left: 4px solid #bbf7d0;
            break-inside: avoid;
          }

          .project-item {
            padding: 0.5rem;
            border-radius: 0.5rem;
            background-color: #faf5ff;
            border-left: 4px solid #e9d5ff;
            margin-bottom: 0.5rem;
            break-inside: avoid;
          }

          @media print {
            @page {
              size: A4;
              margin: 1mm 0;
            }

            body {
              background: white;
            }

            nav,
            footer,
            .no-print {
              display: none !important;
            }

            .container {
              margin: 0 !important;
              padding: 0 !important;
            }

            .cv-container {
              min-width: 100% !important;
              max-width: none !important;
            }

            .cv-main-grid {
              display: grid !important;
              grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
            }

            .cv-left-col {
              grid-column: span 2 / span 2 !important;
            }

            .cv-right-col {
              grid-column: span 3 / span 3 !important;
            }

            .header-section .text-center {
              text-align: left !important;
            }

            .header-section .grid-cols-1 {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .header-section .justify-center {
              justify-content: flex-start !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
