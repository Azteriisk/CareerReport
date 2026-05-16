import React from 'react';
import { ResumeData } from '@/lib/resume-schema';
import { formatResumeDate } from '@/lib/date-utils';

interface Props {
  data: ResumeData;
}

export const TemplateModern: React.FC<Props> = ({ data }) => {
  const themeColor = data.metadata?.themeColor || '#3b82f6';
  const fontStyle = data.metadata?.fontFamily || 'Inter, sans-serif';
  const fontSize = data.metadata?.fontSize || 1;

  return (
    <div className="template-modern" style={{
      padding: '0 40px',
      background: 'white',
      color: '#333',
      fontFamily: fontStyle,
      fontSize: `${fontSize}rem`,
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <header className="vcard" style={{ borderBottom: `2px solid ${themeColor}`, paddingBottom: '20px', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        {data.basics.image && (
          <img src={data.basics.image} alt="Headshot" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${themeColor}` }} />
        )}
        <div style={{ flex: 1 }}>
          <h1 className="fn" style={{ fontSize: '2.5rem', color: '#1e293b', marginBottom: '5px' }}>{data.basics.name}</h1>
          <h2 className="title" style={{ fontSize: '1.2rem', color: themeColor, fontWeight: 500 }}>{data.basics.label}</h2>

          <div style={{ display: 'flex', gap: '15px', marginTop: '10px', fontSize: '0.9rem', color: '#64748b', flexWrap: 'wrap' }}>
            {data.basics.email && <span className="email">{data.basics.email}</span>}
            {data.basics.phone && <span className="tel">{data.basics.phone}</span>}
            {data.basics.location?.city && <span className="adr">{data.basics.location.city}{data.basics.location.region ? `, ${data.basics.location.region}` : ''}</span>}
            {data.basics.url && <a href={data.basics.url} className="url" style={{ color: themeColor }}>{data.basics.url}</a>}
          </div>
        </div>
      </header>

      {data.basics.summary && (
        <section style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px', marginBottom: '10px' }}>Summary</h3>
          <p className="summary" style={{ lineHeight: 1.6, fontSize: '0.95rem' }}>{data.basics.summary}</p>
        </section>
      )}

      {data.work.length > 0 && (
        <section className="vcalendar" style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px', marginBottom: '15px' }}>Experience</h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.metadata?.layout?.work || 1}, 1fr)`, gap: '20px' }}>
            {data.work.map((job) => (
              <article key={job.id} className="experience vevent">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h4 className="summary" style={{ fontSize: '1.05rem', color: '#1e293b', margin: 0 }}>{job.position}</h4>
                  <span className="dtstart" style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>{formatResumeDate(job.startDate)} - {formatResumeDate(job.endDate)}</span>
                </div>
                <div className="location" style={{ fontSize: '1rem', color: themeColor, fontWeight: 600, marginBottom: '8px' }}>{job.name}</div>
                <p className="description" style={{ fontSize: '0.95rem', marginBottom: '5px' }}>{job.summary}</p>
                {job.highlights && job.highlights.length > 0 && (
                  <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', margin: 0 }}>
                    {job.highlights.map((item, i) => (
                      <li key={i} style={{ marginBottom: '3px', listStyleType: item.trim() === '' ? 'none' : 'inherit' }}>
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
        <section className="vcalendar" style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px', marginBottom: '15px' }}>Education</h3>
          {data.education.map((edu) => (
            <article key={edu.id} className="education vevent" style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <h4 className="summary" style={{ fontSize: '1.05rem', color: '#1e293b', margin: 0, fontWeight: 600 }}>{edu.studyType}</h4>
                  <div style={{ fontSize: '1rem', color: themeColor, fontWeight: 600, marginTop: '2px' }}>{edu.area}</div>
                  <div className="location" style={{ fontSize: '0.95rem', color: '#475569', marginTop: '2px' }}>{edu.institution}</div>
                </div>
                <span className="dtstart" style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap', paddingTop: '4px' }}>
                  {formatResumeDate(edu.startDate)} - {formatResumeDate(edu.endDate)}
                </span>
              </div>
            </article>
          ))}
        </section>
      )}

      {data.skills.length > 0 && (
        <section style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px', marginBottom: '15px' }}>Skills</h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.metadata?.layout?.skills || 3}, 1fr)`, gap: '15px' }}>
            {data.skills.map((skillGroup) => (
              <div key={skillGroup.id}>
                <h4 style={{ fontSize: '0.95rem', color: '#1e293b', marginBottom: '5px', margin: 0 }}>{skillGroup.name}</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                  {skillGroup.keywords.map((skill, i) => (
                    <span key={i} style={{ background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{skill}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.projects && data.projects.length > 0 && (
        <section style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px', marginBottom: '15px' }}>Portfolio Projects</h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.metadata?.layout?.projects || 1}, 1fr)`, gap: '15px' }}>
            {data.projects.map((proj) => (
              <article key={proj.id}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: '12px', rowGap: '4px' }}>
                  <h4 style={{ fontSize: '1.05rem', color: '#1e293b', margin: 0 }}>{proj.name}</h4>
                  {proj.url && <a href={proj.url} style={{ fontSize: '0.85rem', color: themeColor, overflowWrap: 'anywhere' }}>{proj.url}</a>}
                </div>
                <p style={{ fontSize: '0.95rem', marginTop: '5px', marginBottom: 0 }}>{proj.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {data.references && data.references.length > 0 && (
        <section className="references-section" style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.2rem', color: themeColor, borderBottom: '1px solid #e2e8f0', paddingBottom: '5px', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>References</h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.metadata?.layout?.references || 2}, 1fr)`, gap: '15px' }}>
            {data.references.map(ref => (
              <article key={ref.id}>
                <h4 style={{ fontSize: '1.05rem', color: '#1e293b', margin: 0 }}>{ref.name}</h4>
                <p style={{ fontSize: '0.95rem', marginTop: '5px', marginBottom: 0, color: '#475569' }}>{ref.reference}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {data.certifications && data.certifications.length > 0 && (
        <section className="certifications-section">
          <h3 style={{ fontSize: '1.2rem', color: themeColor, borderBottom: '1px solid #e2e8f0', paddingBottom: '5px', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>Certifications</h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.metadata?.layout?.certifications || 1}, 1fr)`, gap: '15px' }}>
            {data.certifications.map(cert => (
              <article key={cert.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h4 style={{ fontSize: '1.05rem', color: '#1e293b', margin: 0 }}>{cert.name}</h4>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>{cert.date}</span>
                </div>
                <div style={{ fontSize: '0.95rem', color: '#475569', marginTop: '2px' }}>
                  {cert.issuer}
                  {cert.url && <span style={{ marginLeft: '10px' }}>• <a href={cert.url} style={{ color: themeColor, textDecoration: 'none' }}>View Credential</a></span>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
