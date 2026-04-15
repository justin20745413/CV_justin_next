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

      // 強制進入電腦版排版模式進行截圖
      container.classList.add('force-desktop');

      const page1 = container.querySelector(
        '.cv-page:nth-child(1)'
      ) as HTMLElement;
      const page2 = container.querySelector(
        '.cv-page:nth-child(2)'
      ) as HTMLElement;
      if (!page1 || !page2) {
        container.classList.remove('force-desktop');
        return;
      }

      const noPrintElements = container.querySelectorAll('.no-print');
      noPrintElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 5;
      const contentWidth = pdfWidth - margin * 2;

      const canvas1 = await html2canvas(page1, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1024, // 確保渲染寬度
      });
      pdf.addImage(
        canvas1.toDataURL('image/jpeg', 0.98),
        'JPEG',
        margin,
        margin,
        contentWidth,
        ((canvas1.height * contentWidth) / canvas1.width) * 0.91
      );
      pdf.addPage();

      const canvas2 = await html2canvas(page2, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1024,
      });
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const maxH2 = pdfPageHeight - margin * 2;
      const naturalH2 = (canvas2.height * contentWidth) / canvas2.width;
      const scale2 = naturalH2 > maxH2 ? maxH2 / naturalH2 : 1;
      pdf.addImage(
        canvas2.toDataURL('image/jpeg', 0.98),
        'JPEG',
        margin,
        margin,
        contentWidth * scale2,
        Math.min(naturalH2, maxH2)
      );

      noPrintElements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });

      container.classList.remove('force-desktop');
      pdf.save('justin_cv.pdf');
    } catch (e) {
      container.classList.remove('force-desktop');
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <NetworkBackground />
      {/* Page title */}
      <div className="mb-6 my-5 no-print px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold ml-0 sm:ml-4 mt-6">
          {about.title}
        </h1>
      </div>

      {/* Download button */}
      <button
        className={`fixed top-20 sm:top-21 right-3 sm:right-5 z-40 inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg text-white text-sm sm:text-base font-medium shadow-lg transition-all no-print ${
          mounted && theme === 'dark-orange'
            ? 'bg-slate-700 hover:bg-slate-800'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        onClick={generatePdf}
        disabled={isGenerating}
      >
        <span>{isGenerating ? '⏳' : '📄'}</span>
        <span className="hidden sm:inline">{about.actions.download}</span>
        <span className="sm:hidden">PDF</span>
      </button>

      <div ref={cvRef} className="cv-pages-container px-2 sm:px-0">
        {/* ══ PAGE 1 ══ */}
        <div className="cv-page cv-a4">
          {/* ── Header ── */}
          <div className="r-header">
            {/* Avatar */}
            {/* <div className="r-avatar">
                {about.profile.photo ? (
                  <img
                    src={about.profile.photo}
                    alt={about.profile.name}
                    className="r-avatar-img"
                  />
                ) : (
                  <svg viewBox="0 0 24 24" fill="#bbb" className="r-avatar-svg">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                )}
              </div> */}
            {/* Name block */}
            <div className="r-header-info">
              <h2 className="r-name">{about.profile.name}</h2>
              <p className="r-role">{about.profile.role}</p>
              <div className="r-contacts">
                <span>{about.profile.location}</span>
                <span className="r-sep">·</span>
                <span>{about.profile.email}</span>
                <span className="r-sep">·</span>
                <span>{about.profile.phone}</span>
                <span className="r-sep">·</span>
                <span>{about.profile.experience}</span>
              </div>
              <div className="r-contacts no-print">
                <a
                  href="https://github.com/justin20745413"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {about.links.github}
                </a>
                <span className="r-sep">·</span>
                <a
                  href="https://www.linkedin.com/in/cheng-hung-huang-555718360/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {about.links.linkedin}
                </a>
              </div>
            </div>
          </div>

          {/* ── Summary ── */}
          <div className="r-section">
            <h3 className="r-sec-title">{about.sections.summary}</h3>
            <p className="r-summary">{about.profile.summary}</p>
          </div>

          {/* ── Experience ── */}
          <div className="r-section">
            <h3 className="r-sec-title">{about.sections.experience}</h3>
            {about.experience.map((job, i) => (
              <div key={i} className="r-exp-item">
                <div className="r-exp-row">
                  <div>
                    <span className="r-exp-company">
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
                    </span>
                    <span className="r-exp-role"> — {job.role}</span>
                  </div>
                  <span className="r-exp-period">{job.period}</span>
                </div>
                <p className="r-exp-desc">{job.desc}</p>
                {job.achievements && (
                  <ul className="r-bullets">
                    {job.achievements.map((a, j) => (
                      <li key={j}>{a}</li>
                    ))}
                  </ul>
                )}
                {job.technologies && (
                  <div className="r-tags">
                    {job.technologies.map((t, k) => (
                      <span key={k} className="r-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Education ── */}
          <div className="r-section">
            <h3 className="r-sec-title">{about.sections.education}</h3>
            {about.education.map((edu, i) => (
              <div key={i} className="r-exp-item">
                <div className="r-exp-row">
                  <div>
                    <span className="r-exp-company">{edu.school}</span>
                    <span className="r-exp-role"> — {edu.degree}</span>
                  </div>
                  <span className="r-exp-period">{edu.period}</span>
                </div>
                {edu.relevant_courses && (
                  <p className="r-exp-desc">
                    <strong>{about.sections.relevant_courses}：</strong>
                    {edu.relevant_courses.join('、')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

          {/* ══ PAGE 2 ══ */}
          <div className="cv-page cv-a4 cv-page-2 mt-4">
            {/* Mini header */}
            <div className="r-page2-header">
              <span className="r-name" style={{ fontSize: '14px' }}>
                {about.profile.name}
              </span>
              <span className="r-role" style={{ fontStyle: 'normal' }}>
                {about.profile.role}
              </span>
            </div>

          {/* ── Skills ── */}
          <div className="r-section">
            <h3 className="r-sec-title">{about.sections.skills}</h3>
            <div className="r-skills-grid">
              {about.skills.map((g, i) => (
                <div key={i} className="r-skill-row">
                  <span className="r-skill-cat">{g.category}：</span>
                  <div className="r-tags">
                    {g.items.map((s, j) => (
                      <span key={j} className="r-tag">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Languages & Certifications ── */}
          <div className="r-two-col-bottom">
            <div className="r-section" style={{ flex: 1 }}>
              <h3 className="r-sec-title">{about.sections.languages}</h3>
              <div className="r-tags">
                {about.languages.map((l, i) => (
                  <span key={i} className="r-tag">
                    {l.name}
                  </span>
                ))}
              </div>
            </div>
            {about.certifications && about.certifications.length > 0 && (
              <div className="r-section" style={{ flex: 2 }}>
                <h3 className="r-sec-title">{about.sections.certifications}</h3>
                {about.certifications.map((c, i) => (
                  <div key={i} className="r-exp-item">
                    <div className="r-exp-row">
                      <span className="r-exp-company">{c.name}</span>
                      <span className="r-exp-period">{c.date}</span>
                    </div>
                    <p className="r-exp-desc">{c.issuer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Projects ── */}
          <div className="r-section">
            <h3 className="r-sec-title">{about.sections.projects}</h3>
            <div className="r-proj-grid">
              {about.projects.map((p, i) => (
                <div key={i} className="r-proj-item">
                  <div className="r-exp-row">
                    <span className="r-exp-company">
                      {p.name}
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="r-proj-link no-print"
                          title="前往專案"
                        >
                          <svg
                            className="r-link-icon"
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
                    </span>
                    {p.period && (
                      <span className="r-exp-period">{p.period}</span>
                    )}
                  </div>
                  <p className="r-exp-desc">{p.description}</p>
                  <div className="r-tags">
                    {p.technologies.map((t, j) => (
                      <span key={j} className="r-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* ── Container ── */
        .cv-pages-container {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .cv-a4 {
          max-width: 794px;
          min-height: 1123px;
          background: #fff;
          color: #111;
          box-sizing: border-box;
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          padding: 36px 40px;
          margin: 0 auto;
        }

        /* ── RWD: mobile & tablet ── */
        /* 當沒有 .force-desktop class 時才執行 RWD 樣式 */
        @media (max-width: 860px) {
          .cv-pages-container:not(.force-desktop) .cv-a4 {
            min-width: 700px;
            font-size: 13px;
            padding: 24px 28px;
          }
        }

        @media (max-width: 600px) {
          .cv-pages-container:not(.force-desktop) .cv-a4 {
            min-width: 600px;
            font-size: 12px;
            padding: 20px 22px;
          }
          .cv-pages-container:not(.force-desktop) .r-name {
            font-size: 20px !important;
          }
          .cv-pages-container:not(.force-desktop) .r-role {
            font-size: 13px !important;
          }
          .cv-pages-container:not(.force-desktop) .r-proj-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* ── Header ── */
        .r-header {
          display: flex;
          align-items: center;
          gap: 18px;
          padding-bottom: 14px;
          margin-bottom: 14px;
          border-bottom: 2px solid #111;
        }
        .r-avatar {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          border: 1.5px solid #ccc;
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
        }
        .r-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .r-avatar-svg {
          width: 48px;
          height: 48px;
        }

        .r-header-info {
          flex: 1;
        }
        .r-name {
          font-size: 24px;
          font-weight: 700;
          color: #111;
          margin-bottom: 2px;
        }
        .r-role {
          font-size: 14px;
          color: #444;
          font-style: italic;
          margin-bottom: 5px;
        }
        .r-contacts {
          font-size: 13px;
          color: #444;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          align-items: center;
          margin-top: 3px;
        }
        .r-contacts a {
          color: #1a56db;
          text-decoration: none;
        }
        .r-contacts a:hover {
          text-decoration: underline;
        }
        .r-sep {
          color: #aaa;
        }

        /* ── Section ── */
        .r-section {
          margin-bottom: 14px;
        }
        .r-sec-title {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #111;
          border-bottom: 1.5px solid #111;
          padding-bottom: 3px;
          margin-bottom: 8px;
        }

        /* ── Summary ── */
        .r-summary {
          font-size: 14px;
          color: #333;
          line-height: 1.6;
        }

        /* ── Experience ── */
        .r-exp-item {
          margin-bottom: 9px;
          padding-bottom: 9px;
          border-bottom: 1px solid #eee;
        }
        .r-exp-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        .r-exp-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 3px;
          flex-wrap: wrap;
          gap: 4px;
        }
        .r-exp-company {
          font-weight: 700;
          font-size: 14px;
          color: #111;
        }
        .r-exp-company a {
          color: #111;
          text-decoration: none;
        }
        .r-exp-company a:hover {
          text-decoration: underline;
        }
        .r-exp-role {
          font-size: 14px;
          color: #444;
          font-style: italic;
        }
        .r-exp-period {
          font-size: 13px;
          color: #666;
          white-space: nowrap;
        }
        .r-exp-desc {
          font-size: 14px;
          color: #333;
          margin-top: 2px;
          margin-bottom: 3px;
          line-height: 1.6;
        }

        /* ── Bullet list ── */
        .r-bullets {
          list-style: disc;
          padding-left: 16px;
          margin: 3px 0 4px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .r-bullets li {
          font-size: 14px;
          color: #333;
        }

        /* ── Tags (outline only, no fill) ── */
        .r-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 4px;
        }
        .r-tag {
          padding: 2px 8px;
          border: 1px solid #999;
          border-radius: 12px;
          font-size: 13px;
          color: #333;
          background: transparent;
        }

        /* ── Skills ── */
        .r-skills-grid {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .r-skill-row {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          flex-wrap: wrap;
        }
        .r-skill-cat {
          font-size: 14px;
          font-weight: 600;
          color: #111;
          white-space: nowrap;
          min-width: 90px;
          padding-top: 2px;
        }

        /* ── Two col bottom ── */
        .r-two-col-bottom {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        /* ── Page 2 header ── */
        .r-page2-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding-bottom: 10px;
          margin-bottom: 12px;
          border-bottom: 2px solid #111;
        }

          /* ── Projects grid ── */
          .r-proj-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .r-proj-item {
            padding: 8px 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          .r-proj-link {
            display: inline-flex;
            align-items: center;
            margin-left: 4px;
            color: #1a56db;
          }
          .r-link-icon {
            width: 10px;
            height: 10px;
          }

          /* ── Page 2 compact layout (prevent A4 overflow) ── */
          .cv-page-2 {
            padding: 24px 36px;
          }
          .cv-page-2 .r-section {
            margin-bottom: 10px;
          }
          .cv-page-2 .r-sec-title {
            margin-bottom: 6px;
            padding-bottom: 2px;
          }
          .cv-page-2 .r-skills-grid {
            gap: 3px;
          }
          .cv-page-2 .r-skill-row {
            gap: 4px;
          }
          .cv-page-2 .r-exp-item {
            margin-bottom: 6px;
            padding-bottom: 6px;
          }
          .cv-page-2 .r-exp-desc {
            font-size: 13px;
            line-height: 1.5;
            margin-top: 1px;
            margin-bottom: 2px;
          }
          .cv-page-2 .r-tags {
            margin-top: 3px;
            gap: 3px;
          }
          .cv-page-2 .r-tag {
            font-size: 12px;
            padding: 1px 7px;
          }
          .cv-page-2 .r-proj-grid {
            gap: 7px;
          }
          .cv-page-2 .r-proj-item {
            padding: 6px 8px;
          }
          .cv-page-2 .r-two-col-bottom {
            gap: 16px;
          }
          .cv-page-2 .r-page2-header {
            padding-bottom: 8px;
            margin-bottom: 10px;
          }

        /* ── Print ── */
        @media print {
          @page {
            size: A4;
            margin: 5mm;
          }
          body {
            background: white;
          }
          nav,
          footer,
          .no-print {
            display: none !important;
          }
          .cv-a4 {
            border: none;
            min-height: unset;
          }
        }
      `}</style>
    </div>
  );
}
