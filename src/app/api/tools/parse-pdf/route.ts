import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-error';
import { auth } from '@clerk/nextjs/server';

// Must use 'nodejs' runtime since pdf-parse requires Node.js Buffer/fs APIs
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('pdf') as File | null;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Please upload a valid PDF file.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use require() since pdf-parse's ESM build has no .default export
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const parsed = await pdfParse(buffer);
    const rawText: string = parsed.text;

    // --- Extract the human-readable ATS block ---
    const atsBlockMatch = rawText.match(
      /=== MACHINE READABLE RESUME DATA ===([\s\S]*?)=== END MACHINE READABLE DATA ===/
    );
    const atsBlock = atsBlockMatch ? atsBlockMatch[1].trim() : null;

    // --- Extract and parse the raw JSON payload ---
    const jsonBlockMatch = rawText.match(
      /=== RAW JSON PAYLOAD FOR AI EXTRACTORS ===([\s\S]*?)=== END JSON PAYLOAD ===/
    );
    let parsedJson: object | null = null;
    let jsonError: string | null = null;

    if (jsonBlockMatch) {
      try {
        parsedJson = JSON.parse(jsonBlockMatch[1].trim());
      } catch (parseErr: unknown) {
        jsonError = `JSON found but failed to parse: ${getErrorMessage(parseErr)}`;
      }
    }

    return NextResponse.json({
      success: true,
      pageCount: parsed.numpages,
      totalTextLength: rawText.length,
      atsBlockFound: !!atsBlock,
      atsBlock: atsBlock,
      jsonPayloadFound: !!jsonBlockMatch,
      jsonPayloadValid: !!parsedJson,
      jsonError,
      parsedResume: parsedJson,
    });
  } catch (err: unknown) {
    console.error('PDF parse error:', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
