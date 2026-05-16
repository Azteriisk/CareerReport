import React from 'react';
import { ResumeData } from '@/lib/resume-schema';

export const AtsMetadata: React.FC<{ data: ResumeData }> = ({ data }) => {
  // Create a structured, machine-readable block of text optimized for ATS and AI parsers.
  // We also include the raw JSON data so advanced agents can parse it directly.
  
  const atsText = `
=== MACHINE READABLE RESUME DATA ===
Name: ${data.basics.name}
Title: ${data.basics.label}
Email: ${data.basics.email}
Phone: ${data.basics.phone}
Location: ${data.basics.location?.city || ''}, ${data.basics.location?.region || ''}
URL: ${data.basics.url}

SUMMARY:
${data.basics.summary}

EXPERIENCE:
${data.work.map(job => `- ${job.position} at ${job.name} (${job.startDate} - ${job.endDate})\n  ${job.summary}\n  Highlights: ${(job.highlights || []).join(' | ')}`).join('\n')}

EDUCATION:
${data.education.map(edu => `- ${edu.studyType} in ${edu.area} from ${edu.institution} (${edu.startDate} - ${edu.endDate})`).join('\n')}

SKILLS:
${(data.skills || []).map(skill => `- ${skill.name}: ${skill.keywords.join(', ')}`).join('\n')}

PROJECTS:
${(data.projects || []).map(proj => `- ${proj.name}: ${proj.description}`).join('\n')}

REFERENCES:
${(data.references || []).map(ref => `- ${ref.name} (${ref.reference})`).join('\n')}

CERTIFICATIONS:
${(data.certifications || []).map(cert => `- ${cert.name} by ${cert.issuer} (${cert.date})`).join('\n')}

=== END MACHINE READABLE DATA ===

=== RAW JSON PAYLOAD FOR AI EXTRACTORS ===
${JSON.stringify({ ...data, basics: { ...data.basics, image: undefined } })}
=== END JSON PAYLOAD ===
  `;

  return (
    <div 
      aria-hidden="true"
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        opacity: 0.001,
        whiteSpace: 'nowrap',
        color: 'transparent',
        fontSize: '1px',
        pointerEvents: 'none',
        zIndex: -1,
        display: 'block'
      }}
    >
      {atsText}
    </div>
  );
};
