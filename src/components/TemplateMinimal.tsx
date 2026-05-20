import React from 'react';
import { ResumeData } from '@/lib/resume-schema';
import { formatResumeDate } from '@/lib/date-utils';

interface Props {
  data: ResumeData;
}

export const TemplateMinimal: React.FC<Props> = ({ data }) => {
  const fontStyle = data.metadata?.fontFamily || 'Lato, sans-serif';
  const sidebarBg = data.metadata?.minimalSidebarColor || '#fafafa';
  const fontSize = data.metadata?.fontSize || 1;

  return (
    <div className="template-minimal" style={{
      padding: '0 40px',
      background: 'white',
      color: '#111',
      display: 'flex',
      minHeight: '1056px',
      fontFamily: fontStyle,
      fontSize: `${fontSize}rem`,
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <aside style={{ width: '30%', paddingRight: '20px', borderRight: '1px solid #eaeaea', background: sidebarBg, margin: '0 0 0 -40px', padding: '0 20px 0 40px' }}>
        {data.basics.image && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- native <img> used intentionally: Next/Image lazy loading and wrappers break print/PDF layout */}
            <img src={data.basics.image} alt="Headshot" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', marginBottom: '20px' }} />
          </>
        )}
        <h1 className="fn" style={{ fontSize: '2rem', fontWeight: 300, lineHeight: 1.1, marginBottom: '20px' }}>
          {data.basics.name.split(' ').map((n, i, arr) => (
            <span key={i} style={{ display: 'block' }}>{n}{i < arr.length - 1 ? ' ' : ''}</span>
          ))}
        </h1>

        <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '30px' }}>
          {data.basics.email && <div style={{ marginBottom: '5px' }}>{data.basics.email}</div>}
          {data.basics.phone && <div style={{ marginBottom: '5px' }}>{data.basics.phone}</div>}
          {data.basics.location?.city && <div style={{ marginBottom: '5px' }}>{data.basics.location.city}{data.basics.location.region ? `, ${data.basics.location.region}` : ''}</div>}
          {data.basics.url && <div style={{ marginBottom: '5px' }}><a href={data.basics.url} style={{ color: '#111' }}>Website</a></div>}
        </div>

        {data.skills.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Skills</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.skills.map(group => (
                <div key={group.id}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{group.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>{group.keywords.join(', ')}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      <main style={{ width: '70%', paddingLeft: '30px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 400, color: '#666', marginBottom: '20px' }}>{data.basics.label}</h2>

        {data.basics.summary && (
          <p style={{ fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '30px' }}>{data.basics.summary}</p>
        )}

        {data.work.length > 0 && (
          <section style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', color: '#999' }}>Experience</h3>
            <div style={{ display: (data.metadata?.layout?.work || 1) > 1 ? 'grid' : 'block', gridTemplateColumns: `repeat(${data.metadata?.layout?.work || 1}, 1fr)`, gap: '20px' }}>
              {data.work.map(job => (
                <article key={job.id} style={{ marginBottom: '35px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{job.name}</h4>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{formatResumeDate(job.startDate)} - {formatResumeDate(job.endDate)}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px' }}>{job.position}</div>
                  <p style={{ fontSize: '0.9rem', color: '#444', marginBottom: '8px' }}>{job.summary}</p>
                  <ul style={{ paddingLeft: '15px', fontSize: '0.85rem', color: '#555', margin: 0 }}>
                    {job.highlights.map((h, i) => (
                      <li key={i} style={{ marginBottom: '4px', listStyleType: h.trim() === '' ? 'none' : 'inherit' }}>
                        {h.trim() === '' ? '\u00A0' : h}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}

        {data.education.length > 0 && (
          <section style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', color: '#999' }}>Education</h3>
            {data.education.map(edu => (
              <article key={edu.id} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{edu.institution}</h4>
                    <div style={{ fontSize: '0.95rem', color: '#444', fontWeight: 600, marginTop: '2px' }}>{edu.studyType}</div>
                    <div style={{ fontSize: '0.95rem', color: '#666', fontStyle: 'italic', fontWeight: 600 }}>{edu.area}</div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#888', whiteSpace: 'nowrap' }}>
                    {formatResumeDate(edu.startDate)} - {formatResumeDate(edu.endDate)}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {data.projects && data.projects.length > 0 && (
          <section style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', color: '#999' }}>Projects</h3>
            {data.projects.map(proj => (
              <article key={proj.id} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: '12px', rowGap: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{proj.name}</h4>
                  {proj.url && <a href={proj.url} style={{ fontSize: '0.8rem', color: '#666', overflowWrap: 'anywhere' }}>{proj.url}</a>}
                </div>
                <p style={{ fontSize: '0.9rem', color: '#444', margin: '5px 0 0 0' }}>{proj.description}</p>
              </article>
            ))}
          </section>
        )}

        {data.references && data.references.length > 0 && (
          <section className="references-section" style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#666', marginBottom: '15px' }}>References</h3>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.metadata?.layout?.references || 2}, 1fr)`, gap: '20px' }}>
              {data.references.map(ref => (
                <article key={ref.id}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{ref.name}</div>
                  <div style={{ fontSize: '0.9rem', color: '#555' }}>{ref.reference}</div>
                </article>
              ))}
            </div>
          </section>
        )}

        {data.certifications && data.certifications.length > 0 && (
          <section className="certifications-section">
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#666', marginBottom: '15px' }}>Certifications</h3>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.metadata?.layout?.certifications || 1}, 1fr)`, gap: '20px' }}>
              {data.certifications.map(cert => (
                <article key={cert.id} style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{cert.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#888' }}>{cert.date}</div>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#555' }}>
                    {cert.issuer}
                    {cert.url && <span style={{ marginLeft: '8px' }}>• <a href={cert.url} style={{ color: '#111' }}>View Credential</a></span>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
