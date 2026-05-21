import { defaultResume } from '../../../src/lib/default-resume';
import type { ResumeData } from '../../../src/lib/resume-schema';

const LONG_LINE =
  'Delivered measurable outcomes across platform reliability, developer experience, and cross-functional delivery. ';

/** Resume draft with enough content to overflow past one 1100px column (typically 2 pages). */
export function buildOverflowResumeData(): ResumeData {
  const paragraph = Array.from({ length: 6 }, () => LONG_LINE).join('');

  const work = Array.from({ length: 4 }, (_, i) => ({
    id: `overflow-job-${i}`,
    name: `Company ${i + 1}`,
    position: `Senior Engineer ${i + 1}`,
    url: '',
    startDate: '2020-01',
    endDate: 'Present',
    summary: paragraph,
    highlights: Array.from({ length: 5 }, (_, b) => `Bullet ${b + 1}: ${LONG_LINE}`),
  }));

  return {
    ...defaultResume,
    basics: {
      ...defaultResume.basics,
      summary: paragraph + paragraph,
      image: '',
    },
    work,
  };
}

export function overflowResumeDraftPayload() {
  return JSON.stringify({
    data: buildOverflowResumeData(),
    template: 'modern',
    updatedAt: new Date().toISOString(),
  });
}
