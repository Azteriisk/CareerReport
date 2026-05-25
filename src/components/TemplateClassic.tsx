import React from 'react';
import { ResumeData } from '@/lib/resume-schema';
import { formatResumeDate } from '@/lib/date-utils';

interface Props {
  data: ResumeData;
}

export const TemplateClassic: React.FC<Props> = ({ data }) => {
  const fontStyle = data.metadata?.fontFamily || 'Georgia, serif';
  const fontSize = data.metadata?.fontSize || 1;
  const marginPxTB = (data.metadata?.pageMargin || 0.42) * 96;
  const marginPxLR = (data.metadata?.pageMarginLR ?? data.metadata?.pageMargin ?? 0.42) * 96;

  return (
    <div className="template-classic" style={{
      padding: `0 ${marginPxLR}px`,
      background: 'transparent',
      color: '#000',
      lineHeight: 1.6,
      fontFamily: fontStyle,
      fontSize: `${fontSize}rem`,
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <header className="vcard" style={{ textAlign: 'center', marginBottom: '30px' }}>
        {data.basics.image && (
          <div style={{ marginBottom: '15px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- native <img> used intentionally: Next/Image lazy loading and wrappers break print/PDF layout */}
            <img src={data.basics.image} alt="Headshot" style={{ width: '120px', height: '120px', objectFit: 'cover', border: '1px solid #000', padding: '4px', filter: 'grayscale(100%)' }} />
          </div>
        )}
        <h1 className="fn" style={{ fontSize: '2.8em', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}>{data.basics.name}</h1>
        {data.basics.label && (
          <p className="title" style={{ fontSize: '1.1em', fontStyle: 'italic', color: '#444', marginBottom: '8px', marginTop: 0 }}>{data.basics.label}</p>
        )}
        <div style={{ fontSize: '1em', color: '#444' }}>
          {data.basics.location?.city && <span className="adr">{data.basics.location.city}, {data.basics.location.region}</span>}
          <span style={{ margin: '0 8px' }}>|</span>
          {data.basics.phone && <span className="tel">{data.basics.phone}</span>}
          {data.basics.email && data.basics.phone && <span style={{ margin: '0 8px' }}>|</span>}
          {data.basics.email && <span className="email">{data.basics.email}</span>}
          {data.basics.url && (
            <>
              {(data.basics.location?.city || data.basics.phone || data.basics.email) && <span style={{ margin: '0 8px' }}>|</span>}
              <a href={data.basics.url} className="url" style={{ color: '#444', textDecoration: 'none' }}>{data.basics.url.replace(/^https?:\/\//, '')}</a>
            </>
          )}
        </div>
      </header>

      {data.basics.summary && (
        <section style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1em', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '10px' }}>Professional Summary</h3>
          <p className="summary" style={{ fontSize: '1em' }}>{data.basics.summary}</p>
        </section>
      )}

      {data.work.length > 0 && (
        <section className="vcalendar" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1em', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '10px' }}>Professional Experience</h3>
          <div style={{ display: (data.metadata?.layout?.work || 1) > 1 ? 'grid' : 'block', gridTemplateColumns: `repeat(${data.metadata?.layout?.work || 1}, 1fr)`, gap: '15px' }}>
            {data.work.map((job) => (
              <article key={job.id} className="experience vevent" style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span className="location">{job.name}</span>
                  <span className="dtstart">{formatResumeDate(job.startDate)} - {formatResumeDate(job.endDate)}</span>
                </div>
                <div style={{ fontStyle: 'italic', marginBottom: '5px' }}>{job.position}</div>
                <p className="description" style={{ fontSize: '0.95em', marginBottom: '5px' }}>{job.summary}</p>
                {job.highlights && job.highlights.length > 0 && (
                  <ul style={{ paddingLeft: '20px', fontSize: '0.95em', margin: 0 }}>
                    {job.highlights.map((item, i) => (
                      <li key={i} style={{ listStyleType: item.trim() === '' ? 'none' : 'inherit' }}>
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
        <section className="vcalendar" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1em', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '10px' }}>Education</h3>
          {data.education.map((edu) => (
            <article key={edu.id} style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{edu.institution}</div>
                  <div style={{ fontSize: '0.95em', fontWeight: 600 }}>{edu.studyType}</div>
                  <div style={{ fontSize: '0.95em', fontWeight: 600, fontStyle: 'italic' }}>{edu.area}</div>
                </div>
                <div style={{ fontSize: '0.9em', color: '#333', whiteSpace: 'nowrap' }}>
                  {formatResumeDate(edu.startDate)} - {formatResumeDate(edu.endDate)}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {data.skills.length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1em', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '10px' }}>Skills & Expertise</h3>
          <ul style={{ listStyleType: 'none', padding: 0, display: 'grid', gridTemplateColumns: `repeat(${data.metadata?.layout?.skills || 3}, 1fr)`, gap: '10px' }}>
            {data.skills.map((skillGroup) => (
              <li key={skillGroup.id}>
                <strong>{skillGroup.name}: </strong>
                {skillGroup.keywords.join(', ')}
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.projects && data.projects.length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1em', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '10px' }}>Selected Projects</h3>
          {data.projects.map((proj) => (
            <article key={proj.id} style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: '12px', rowGap: '4px' }}>
                <span>{proj.name}</span>
                {proj.url && <a href={proj.url} style={{ fontWeight: 'normal', fontStyle: 'italic', fontSize: '0.9em', color: '#333', overflowWrap: 'anywhere' }}>{proj.url}</a>}
              </div>
              <p style={{ fontSize: '0.95em', margin: '3px 0' }}>{proj.description}</p>
            </article>
          ))}
        </section>
      )}

      {data.references && data.references.length > 0 && (
        <section style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '1.1em', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '15px' }}>References</h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.metadata?.layout?.references || 2}, 1fr)`, gap: '15px' }}>
            {data.references.map(ref => (
              <article key={ref.id}>
                <strong style={{ display: 'block', fontSize: '1em', color: '#000' }}>{ref.name}</strong>
                <span style={{ fontSize: '0.95em', color: '#444' }}>{ref.reference}</span>
              </article>
            ))}
          </div>
        </section>
      )}

      {data.certifications && data.certifications.length > 0 && (
        <section>
          <h3 style={{ fontSize: '1.1em', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '15px' }}>Certifications</h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.metadata?.layout?.certifications || 1}, 1fr)`, gap: '15px' }}>
            {data.certifications.map(cert => (
              <article key={cert.id} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: '1em', color: '#000' }}>{cert.name}</strong>
                  <span style={{ fontSize: '0.9em', color: '#444' }}>{cert.date}</span>
                </div>
                <div style={{ fontSize: '0.95em', color: '#444' }}>
                  {cert.issuer}
                  {cert.url && <span style={{ marginLeft: '10px' }}>• <a href={cert.url} style={{ color: '#000' }}>View Credential</a></span>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
