import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { ResumeData } from '@/lib/resume-schema';

interface Props {
  data: ResumeData;
}

export const PdfAtsMetadata: React.FC<Props> = ({ data }) => {
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

  // We render the text completely invisibly so it doesn't disrupt the visual layout,
  // but PDF parsers and ATS systems will still extract it from the text stream.
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: 1, height: 1, overflow: 'hidden' }}>
      <Text style={{ fontSize: 1, color: '#ffffff' }}>
        {atsText}
      </Text>
    </View>
  );
};
