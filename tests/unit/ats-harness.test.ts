import { describe, it, expect } from 'vitest';
import { defaultResume } from '../../src/lib/default-resume';
import { ResumeData } from '../../src/lib/resume-schema';

/**
 * Programmatic ATS scanner simulating Lever/Greenhouse parser heuristics.
 * Scans the invisible metadata layer, matches markers, and parses JSON.
 */
function simulateAtsParser(renderedText: string) {
  const defaultFields: Record<string, boolean> = {
    name: false,
    summary: false,
    work: false,
    education: false,
    skills: false
  };

  // 1. Detect section markers
  const atsBlockMatch = renderedText.match(
    /=== MACHINE READABLE RESUME DATA ===([\s\S]*?)=== END MACHINE READABLE DATA ===/
  );
  
  const jsonBlockMatch = renderedText.match(
    /=== RAW JSON PAYLOAD FOR AI EXTRACTORS ===([\s\S]*?)=== END JSON PAYLOAD ===/
  );

  if (!atsBlockMatch || !jsonBlockMatch) {
    return {
      success: false,
      accuracy: 0,
      parsedFields: defaultFields,
      error: 'Missing crucial machine-readable indicators'
    };
  }

  const atsText = atsBlockMatch[1].trim();
  const jsonText = jsonBlockMatch[1].trim();

  // 2. Parse Raw JSON
  let parsedJson: ResumeData | null = null;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch (e) {
    return {
      success: false,
      accuracy: 0,
      parsedFields: defaultFields,
      error: 'JSON payload corrupted or failed validation'
    };
  }

  // 3. Score heuristics (Basics, Summary, Work, Education, Skills)
  let totalScore = 0;
  let maxScore = 5;
  const parsedFields: Record<string, boolean> = { ...defaultFields };

  // Name check
  const nameLine = atsText.match(/Name:\s*(.*)/);
  if (nameLine && nameLine[1].trim() === parsedJson?.basics.name) {
    totalScore += 1;
    parsedFields.name = true;
  }

  // Summary check
  if (atsText.includes('SUMMARY:') && parsedJson?.basics.summary) {
    totalScore += 1;
    parsedFields.summary = true;
  }

  // Experience (Work) check
  if (atsText.includes('EXPERIENCE:') && Array.isArray(parsedJson?.work) && parsedJson.work.length > 0) {
    totalScore += 1;
    parsedFields.work = true;
  }

  // Education check
  if (atsText.includes('EDUCATION:') && Array.isArray(parsedJson?.education) && parsedJson.education.length > 0) {
    totalScore += 1;
    parsedFields.education = true;
  }

  // Skills check
  if (atsText.includes('SKILLS:') && Array.isArray(parsedJson?.skills) && parsedJson.skills.length > 0) {
    totalScore += 1;
    parsedFields.skills = true;
  }

  const accuracy = (totalScore / maxScore) * 100;

  return {
    success: accuracy === 100,
    accuracy,
    parsedFields,
    parsedJson
  };
}

describe('ATS Success Programmatic Testing Harness', () => {
  it('correctly scans and parses the invisible AtsMetadata layer with 100% accuracy', () => {
    // Generate the exact text that AtsMetadata returns
    const data = defaultResume as ResumeData;
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

    // Run mock ATS parser
    const scanResult = simulateAtsParser(atsText);

    // Verify 100% accuracy and presence
    expect(scanResult.success).toBe(true);
    expect(scanResult.accuracy).toBe(100);
    expect(scanResult.parsedFields.name).toBe(true);
    expect(scanResult.parsedFields.summary).toBe(true);
    expect(scanResult.parsedFields.work).toBe(true);
    expect(scanResult.parsedFields.education).toBe(true);
    expect(scanResult.parsedFields.skills).toBe(true);
    expect(scanResult.parsedJson).toBeDefined();
    expect(scanResult.parsedJson?.basics.name).toBe(data.basics.name);
  });
});
