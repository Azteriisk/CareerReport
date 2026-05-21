import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-error';
import {
  isUserPro,
  sanitizeCareerContext,
  validatePdfUpload,
} from '@/lib/ai-guard';
import { aiRateLimiter, pdfImportRateLimiter } from '@/lib/rate-limit';
import { importResumeFromPdfBuffer } from '@/lib/pdf-resume-import';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isUserPro(userId))) {
      return NextResponse.json(
        { error: 'PDF import requires CareerReport Pro.' },
        { status: 403 },
      );
    }

    const globalRate = aiRateLimiter.check(userId);
    if (!globalRate.allowed) {
      return NextResponse.json(
        { error: 'Too many AI requests. Please wait before trying again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(globalRate.resetInMs / 1000)) },
        },
      );
    }

    const pdfRate = pdfImportRateLimiter.check(userId);
    if (!pdfRate.allowed) {
      return NextResponse.json(
        { error: 'Too many PDF imports. Please wait before uploading again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(pdfRate.resetInMs / 1000)) },
        },
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const careerContext = sanitizeCareerContext(
      formData.get('careerContext') as string | null,
    );

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const validationError = validatePdfUpload(file, buffer);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { data, method } = await importResumeFromPdfBuffer(
      buffer,
      careerContext || null,
    );

    return NextResponse.json({ ...data, _importMethod: method });
  } catch (err: unknown) {
    console.error('PDF Parse API Error:', err);
    const message = getErrorMessage(err);
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
