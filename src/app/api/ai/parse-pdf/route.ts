import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { resumeDataSchema } from '@/lib/ai-schema';

export const maxDuration = 60; // Allow more time for AI processing

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const careerContext = formData.get('careerContext') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer for pdf-parse
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Require inside function to prevent Next.js build-time canvas/DOMMatrix errors
    const pdfParse = require('pdf-parse');

    // Parse the PDF
    const data = await pdfParse(buffer);
    const rawText = data.text;

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json({ error: 'Could not extract text from PDF' }, { status: 400 });
    }

    let systemPrompt = `You are an expert resume parser. Extract the following raw text from a PDF resume into the strictly typed JSON schema provided. 
      If a field is missing, leave it as an empty string. Do your best to extract bullet points, dates, and skills accurately. Ensure you generate a random unique ID for arrays that need 'id'.`;
      
    if (careerContext && careerContext.trim().length > 0) {
      systemPrompt += `\n\nCRITICAL CAREER CONTEXT: The user has provided the following specific career goals, target industry, or tone requirements. YOU MUST strictly adhere to this context when writing the summary and bullets: "${careerContext}"`;
    }

    // Call Gemini to structure the data
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: resumeDataSchema,
      prompt: `${systemPrompt}
      
      Raw Text:
      """
      ${rawText.substring(0, 50000)} // truncate to 50k chars just in case
      """`,
    });

    return NextResponse.json(object);
  } catch (error: any) {
    console.error('PDF Parse API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse resume' }, { status: 500 });
  }
}
