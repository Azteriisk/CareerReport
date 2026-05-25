import React from 'react';
import { ResumeData } from '@/lib/resume-schema';
import { formatResumeDate } from '@/lib/date-utils';

interface Props {
  data: ResumeData;
}

export const TemplateModernSplit: React.FC<Props> = ({ data }) => {
  const themeColor = data.metadata?.themeColor || '#6366f1';
  const fontStyle = data.metadata?.fontFamily || 'Inter, sans-serif';
  const fontSize = data.metadata?.fontSize || 1;

  // Generate a light, tinted version of the theme color for the sidebar background
  const getLightBackground = (hex: string) => {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) cleanHex = cleanHex.split('').map(c => c + c).join('');
    if (cleanHex.length !== 6) return '#f8fafc';
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const bgR = Math.round(r * 0.08 + 248 * 0.92);
    const bgG = Math.round(g * 0.08 + 250 * 0.92);
    const bgB = Math.round(b * 0.08 + 252 * 0.92);
    return `rgb(${bgR}, ${bgG}, ${bgB})`;
  };

  const lightBg = getLightBackground(themeColor);
  const marginPxTB = (data.metadata?.pageMargin || 0.42) * 96;
  const marginPxLR = (data.metadata?.pageMarginLR ?? data.metadata?.pageMargin ?? 0.42) * 96;

  return (
    <div className="template-modern-split" style={{
      display: 'flex',
      background: 'transparent',
      color: '#333',
      fontFamily: fontStyle,
      fontSize: `${fontSize}rem`,
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Left Main Content */}
      <main style={{ width: '65%', padding: `0 40px 0 ${marginPxLR}px` }}>
        <header style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '3em', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginBottom: '5px', letterSpacing: '-0.5px' }}>{data.basics.name}</h1>
          <h2 style={{ fontSize: '1.4em', color: themeColor, fontWeight: 500, margin: 0 }}>{data.basics.label}</h2>
        </header>

        {data.basics.summary && (
          <section style={{ marginBottom: '35px' }}>
            <p style={{ fontSize: '1em', lineHeight: 1.6, color: '#475569', margin: 0 }}>{data.basics.summary}</p>
          </section>
        )}

        {data.work.length > 0 && (
          <section style={{ marginBottom: '35px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ width: '30px', height: '2px', background: themeColor, marginRight: '15px' }}></div>
              <h3 style={{ fontSize: '1.4em', color: '#0f172a', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Experience</h3>
            </div>
            <div style={{ display: 'block' }}>
              {data.work.map((job) => (
                <article key={job.id} style={{ marginBottom: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                    <h4 style={{ fontSize: '1.1em', color: '#0f172a', margin: 0, fontWeight: 600 }}>{job.position}</h4>
                    <span style={{ fontSize: '0.9em', color: themeColor, fontWeight: 500, whiteSpace: 'nowrap' }}>{formatResumeDate(job.startDate)} - {formatResumeDate(job.endDate)}</span>
                  </div>
                  <div style={{ fontSize: '1em', color: themeColor, fontWeight: 600, marginBottom: '10px' }}>{job.name}</div>
                  <p style={{ fontSize: '0.95em', color: '#475569', marginBottom: '8px', lineHeight: 1.5 }}>{job.summary}</p>
                  {job.highlights && job.highlights.length > 0 && (
                    <ul style={{ paddingLeft: '18px', fontSize: '0.9em', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                      {job.highlights.map((item, i) => (
                        <li key={i} style={{ marginBottom: '4px', listStyleType: item.trim() === '' ? 'none' : 'inherit' }}>
                          {item.trim() === '' ? '\u00A0' : item}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {data.education.length > 0 && (
          <section style={{ marginBottom: '35px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ width: '30px', height: '2px', background: themeColor, marginRight: '15px' }}></div>
              <h3 style={{ fontSize: '1.4em', color: '#0f172a', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Education</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {data.education.map((edu) => (
                <article key={edu.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '5px' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '1.05em', color: '#0f172a', margin: 0, fontWeight: 600 }}>{edu.studyType}</h4>
                      <div style={{ fontSize: '1em', color: themeColor, fontWeight: 600, marginTop: '2px' }}>{edu.area}</div>
                      <div style={{ fontSize: '1em', color: '#475569', marginTop: '2px' }}>{edu.institution}</div>
                    </div>
                    <span style={{ fontSize: '0.9em', color: themeColor, fontWeight: 500, whiteSpace: 'nowrap', paddingTop: '2px' }}>
                      {formatResumeDate(edu.startDate)} - {formatResumeDate(edu.endDate)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Right Sidebar */}
      <aside style={{ width: '35%', background: 'transparent', padding: `0 ${marginPxLR}px 0 40px`, borderLeft: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '35px' }}>
          {data.basics.image && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- native <img> used intentionally: Next/Image lazy loading and wrappers break print/PDF layout */}
              <img src={data.basics.image} alt="Headshot" style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover', border: `4px solid white`, boxShadow: `0 4px 15px rgba(0,0,0,0.1)`, marginBottom: '20px' }} />
            </>
          )}

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9em', color: '#475569' }}>
            {data.basics.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7em' }}>@</div>
                <span style={{ wordBreak: 'break-all' }}>{data.basics.email}</span>
              </div>
            )}
            {data.basics.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7em' }}>#</div>
                <span>{data.basics.phone}</span>
              </div>
            )}
            {data.basics.location?.city && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7em' }}>📍</div>
                <span>{data.basics.location.city}{data.basics.location.region ? `, ${data.basics.location.region}` : ''}</span>
              </div>
            )}
            {data.basics.url && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7em' }}>🔗</div>
                <a href={data.basics.url} style={{ color: '#475569', textDecoration: 'none' }}>{data.basics.url.replace(/^https?:\/\//, '')}</a>
              </div>
            )}
          </div>
        </div>

        {data.skills.length > 0 && (
          <section style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.1em', color: '#0f172a', margin: '0 0 15px 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Skills</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {data.skills.map(group => (
                <div key={group.id}>
                  <div style={{ fontSize: '0.95em', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>{group.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {group.keywords.map((skill, i) => (
                      <span key={i} style={{ background: 'white', border: `1px solid ${themeColor}`, color: themeColor, padding: '4px 10px', borderRadius: '20px', fontSize: '0.8em', fontWeight: 500 }}>{skill}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.projects && data.projects.length > 0 && (
          <section style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.1em', color: '#0f172a', margin: '0 0 15px 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Projects</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {data.projects.map(proj => (
                <article key={proj.id}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: '10px', rowGap: '4px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '0.95em', fontWeight: 600, color: '#334155' }}>{proj.name}</span>
                    {proj.url && <a href={proj.url} style={{ fontSize: '0.8em', color: themeColor, overflowWrap: 'anywhere' }}>{proj.url}</a>}
                  </div>
                  <p style={{ fontSize: '0.85em', color: '#64748b', margin: 0, lineHeight: 1.4 }}>{proj.description}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {data.certifications && data.certifications.length > 0 && (
          <section style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.1em', color: '#0f172a', margin: '0 0 15px 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Certifications</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {data.certifications.map(cert => (
                <article key={cert.id}>
                  <div style={{ fontSize: '0.95em', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>{cert.name}</div>
                  <div style={{ fontSize: '0.85em', color: themeColor, fontWeight: 500, marginBottom: '2px', whiteSpace: 'nowrap' }}>{cert.date}</div>
                  <div style={{ fontSize: '0.85em', color: '#64748b' }}>{cert.issuer}</div>
                </article>
              ))}
            </div>
          </section>
        )}

        {data.references && data.references.length > 0 && (
          <section style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.1em', color: '#0f172a', margin: '0 0 15px 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>References</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {data.references.map(ref => (
                <article key={ref.id}>
                  <div style={{ fontSize: '0.95em', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>{ref.name}</div>
                  <div style={{ fontSize: '0.85em', color: '#64748b' }}>{ref.reference}</div>
                </article>
              ))}
            </div>
          </section>
        )}
      </aside>
      <div style={{ clear: 'both' }} />
    </div>
  );
};
