import React from 'react';
import { ResumeData } from '@/lib/resume-schema';
import { formatResumeDate } from '@/lib/date-utils';

interface Props {
  data: ResumeData;
}

export const TemplateClassic: React.FC<Props> = ({ data }) => {
  const fontStyle = data.metadata?.fontFamily || 'serif';

  return (
    <div className="template-classic" style={{ padding: '40px', background: 'white', color: '#000', lineHeight: 1.6, fontFamily: fontStyle }}>
      <header className="vcard" style={{ textAlign: 'center', marginBottom: '30px' }}>
        {data.basics.image && (
          <div style={{ marginBottom: '15px' }}>
            <img src={data.basics.image} alt="Headshot" style={{ width: '120px', height: '120px', objectFit: 'cover', border: '1px solid #000', padding: '4px', filter: 'grayscale(100%)' }} />
          </div>
        )}
        <h1 className="fn" style={{ fontSize: '2.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}>{data.basics.name}</h1>
        
        <div style={{ fontSize: '1rem', color: '#444' }}>
          {data.basics.location?.city && <span className="adr">{data.basics.location.city}, {data.basics.location.region}</span>}
          <span style={{ margin: '0 8px' }}>|</span>
          {data.basics.phone && <span className="tel">{data.basics.phone}</span>}
          <span style={{ margin: '0 8px' }}>|</span>
          {data.basics.email && <span className="email">{data.basics.email}</span>}
        </div>
      </header>

      {data.basics.summary && (
        <section style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '10px' }}>Professional Summary</h3>
          <p className="summary" style={{ fontSize: '1rem' }}>{data.basics.summary}</p>
        </section>
      )}

      {data.work.length > 0 && (
        <section className="vcalendar" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '10px' }}>Professional Experience</h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.metadata?.layout?.work || 1}, 1fr)`, gap: '15px' }}>
            {data.work.map((job) => (
              <article key={job.id} className="experience vevent">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span className="location">{job.name}</span>
                  <span className="dtstart">{formatResumeDate(job.startDate)} - {formatResumeDate(job.endDate)}</span>
                </div>
                <div style={{ fontStyle: 'italic', marginBottom: '5px' }}>{job.position}</div>
                <p className="description" style={{ fontSize: '0.95rem', marginBottom: '5px' }}>{job.summary}</p>
                {job.highlights && job.highlights.length > 0 && (
                  <ul style={{ paddingLeft: '20px', fontSize: '0.95rem', margin: 0 }}>
                    {job.highlights.map((item, i) => (
                      <li key={i}>{item}</li>
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
          <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '10px' }}>Education</h3>
          {data.education.map((edu) => (
            <article key={edu.id} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontWeight: 'bold' }}>{edu.institution}</div>
                <div style={{ fontSize: '0.9rem', color: '#333' }}>{formatResumeDate(edu.startDate)} - {formatResumeDate(edu.endDate)}</div>
              </div>
              <div>{edu.studyType} in {edu.area}</div>
            </article>
          ))}
        </section>
      )}

      {data.skills.length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '10px' }}>Skills & Expertise</h3>
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
          <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '10px' }}>Selected Projects</h3>
          {data.projects.map((proj) => (
            <article key={proj.id} style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 'bold' }}>{proj.name} {proj.url && <span style={{ fontWeight: 'normal', fontStyle: 'italic', marginLeft: '10px' }}>{proj.url}</span>}</div>
              <p style={{ fontSize: '0.95rem', margin: '3px 0' }}>{proj.description}</p>
            </article>
          ))}
        </section>
      )}

        {data.references && data.references.length > 0 && (
          <section style={{ marginBottom: '25px' }}>
            <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '15px' }}>References</h3>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.metadata?.layout?.references || 2}, 1fr)`, gap: '15px' }}>
              {data.references.map(ref => (
                <article key={ref.id}>
                  <strong style={{ display: 'block', fontSize: '1rem', color: '#000' }}>{ref.name}</strong>
                  <span style={{ fontSize: '0.95rem', color: '#444' }}>{ref.reference}</span>
                </article>
              ))}
            </div>
          </section>
        )}

        {data.certifications && data.certifications.length > 0 && (
          <section>
            <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '15px' }}>Certifications</h3>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.metadata?.layout?.certifications || 1}, 1fr)`, gap: '15px' }}>
              {data.certifications.map(cert => (
                <article key={cert.id} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ fontSize: '1rem', color: '#000' }}>{cert.name}</strong>
                    <span style={{ fontSize: '0.9rem', color: '#444' }}>{cert.date}</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#444' }}>
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
