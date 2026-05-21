import { randomUUID } from 'crypto';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { PDF_IMPORT_MAX_PAGES, sanitizeCareerContext } from '@/lib/ai-guard';
import { resumeDataSchema } from '@/lib/ai-schema';
import type { z } from 'zod';

export type ParsedResume = z.infer<typeof resumeDataSchema>;

const MIN_TEXT_CHARS_FOR_TEXT_PARSE = 120;

const JSON_BLOCK_RE =
  /=== RAW JSON PAYLOAD FOR AI EXTRACTORS ===([\s\S]*?)=== END JSON PAYLOAD ===/;

export async function extractPdfText(buffer: Buffer): Promise<{
  text: string;
  pageCount: number;
  pdfParseError?: string;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const parsed = await pdfParse(buffer);
    return {
      text: (parsed.text as string) || '',
      pageCount: parsed.numpages ?? 0,
    };
  } catch (err: unknown) {
    return {
      text: '',
      pageCount: 0,
      pdfParseError: err instanceof Error ? err.message : 'PDF text extraction failed',
    };
  }
}

/** CareerReport PDFs embed machine-readable JSON in the export. */
export function extractEmbeddedResumeJson(rawText: string): ParsedResume | null {
  const match = rawText.match(JSON_BLOCK_RE);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1].trim());
    const result = resumeDataSchema.safeParse(parsed);
    if (result.success) {
      return normalizeParsedResume(result.data);
    }
  } catch {
    // fall through
  }
  return null;
}

export function normalizeParsedResume(data: ParsedResume): ParsedResume {
  return {
    ...data,
    work: (data.work || []).map((job) => ({
      ...job,
      id: job.id || randomUUID(),
      highlights: job.highlights || [],
    })),
    education: (data.education || []).map((edu) => ({
      ...edu,
      id: edu.id || randomUUID(),
      courses: edu.courses || [],
    })),
    skills: (data.skills || []).map((skill) => ({
      ...skill,
      id: skill.id || randomUUID(),
      keywords: skill.keywords || [],
    })),
    references: (data.references || []).map((ref) => ({
      ...ref,
      id: ref.id || randomUUID(),
    })),
    certifications: (data.certifications || []).map((cert) => ({
      ...cert,
      id: cert.id || randomUUID(),
    })),
    projects: (data.projects || []).map((proj) => ({
      ...proj,
      id: proj.id || randomUUID(),
    })),
  };
}

export function buildResumeParserPrompt(careerContext?: string | null): string {
  let prompt = `You are an expert resume parser. Extract resume content into the strictly typed JSON schema provided.
If a field is missing, use an empty string or empty array. Extract bullet points, dates, and skills accurately.
Generate a unique id string for every item in work, education, skills, references, certifications, and projects arrays.
Preserve the original language of the resume (including Chinese, Japanese, Korean, etc.) — do not translate unless the source is mixed and unclear.`;

  const safeContext = sanitizeCareerContext(careerContext);
  if (safeContext) {
    prompt += `\n\nCRITICAL CAREER CONTEXT: When writing or refining the professional summary and role descriptions, adhere to: "${safeContext}"`;
  }

  return prompt;
}

async function structureResumeWithAi(options: {
  systemPrompt: string;
  text?: string;
  pdfBuffer?: Buffer;
}): Promise<ParsedResume> {
  const { systemPrompt, text, pdfBuffer } = options;

  if (pdfBuffer) {
    const base64 = pdfBuffer.toString('base64');
    const fileDataUrl = `data:application/pdf;base64,${base64}`;

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: resumeDataSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${systemPrompt}\n\nRead this PDF resume and extract all sections.`,
            },
            {
              type: 'file',
              data: fileDataUrl,
              mediaType: 'application/pdf',
            },
          ],
        },
      ],
    });

    return normalizeParsedResume(object);
  }

  if (!text?.trim()) {
    throw new Error('No text or PDF available for AI parsing');
  }

  const { object } = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: resumeDataSchema,
    prompt: `${systemPrompt}

Raw Text:
"""
${text.substring(0, 50000)}
"""`,
  });

  return normalizeParsedResume(object);
}

export type ImportMethod = 'embedded-json' | 'text-ai' | 'pdf-vision-ai';

export async function importResumeFromPdfBuffer(
  buffer: Buffer,
  careerContext?: string | null,
): Promise<{ data: ParsedResume; method: ImportMethod }> {
  const systemPrompt = buildResumeParserPrompt(careerContext);
  const { text, pdfParseError, pageCount } = await extractPdfText(buffer);

  if (pageCount > PDF_IMPORT_MAX_PAGES) {
    throw new Error(
      `PDF has too many pages (${pageCount}). Maximum is ${PDF_IMPORT_MAX_PAGES} pages.`,
    );
  }

  const embedded = text ? extractEmbeddedResumeJson(text) : null;
  if (embedded) {
    return { data: embedded, method: 'embedded-json' };
  }

  const trimmedText = text.trim();
  const hasUsableText = trimmedText.length >= MIN_TEXT_CHARS_FOR_TEXT_PARSE;

  if (hasUsableText) {
    try {
      const data = await structureResumeWithAi({ systemPrompt, text: trimmedText });
      return { data, method: 'text-ai' };
    } catch (textErr) {
      console.warn('Text-based resume parse failed, trying PDF vision:', textErr);
    }
  }

  try {
    const data = await structureResumeWithAi({ systemPrompt, pdfBuffer: buffer });
    return { data, method: 'pdf-vision-ai' };
  } catch (visionErr) {
    console.error('PDF vision resume parse failed:', visionErr);
    const hint = pdfParseError
      ? `Text extraction failed (${pdfParseError}). `
      : !hasUsableText
        ? 'This PDF has little or no selectable text (often a scan or image export). '
        : '';
    throw new Error(
      `${hint}AI could not read the document. Try a PDF exported from Word/Google Docs, or re-export with text selectable.`,
    );
  }
}
