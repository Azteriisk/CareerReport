import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { getErrorMessage } from '@/lib/api-error';
import { auth } from '@clerk/nextjs/server';
import { aiRateLimiter } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Output Schema for Structured Outputs via Gemini
const candidateRankSchema = z.object({
  id: z.string().describe("The candidate's unique identifier matching their input ID"),
  aiScore: z.number().min(1).max(10).describe("Objective compatibility score between 1.0 and 10.0"),
  aiLabel: z.enum([
    'AI: Outstanding',
    'AI: Highly Qualified',
    'AI: Good Match',
    'AI: Unaligned',
  ]).describe("Categorical match label"),
  aiExplanation: z.string().describe("1-2 sentence recruiter-grade assessment highlighting strengths and experience gaps relative to the job requirements"),
});

const stackRankResultSchema = z.object({
  results: z.array(candidateRankSchema).describe("List of evaluated candidate rankings"),
});

function sanitizeInput(raw: string, maxLen: number): string {
  if (!raw) return '';
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // strip control chars
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function cleanResumePayload(payload: any): string {
  if (!payload) return '';
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return str
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, 8000); // enforce safe 8000 char limit per resume payload
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Rate Limiting Protection (enforce same policy as general generator: max 10 requests / min)
    const rateCheck = aiRateLimiter.check(userId);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait before ranking again.' }),
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateCheck.resetInMs / 1000)) },
        }
      );
    }

    const body = await req.json();
    const rawJobTitle = body.jobTitle;
    const rawJobDescription = body.jobDescription;
    const rawCandidates = body.candidates;

    if (!rawJobTitle || !rawCandidates || !Array.isArray(rawCandidates) || rawCandidates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload. jobTitle and a non-empty candidates array are required.' }),
        { status: 400 }
      );
    }

    // Sanitize and protect input parameters
    const jobTitle = sanitizeInput(rawJobTitle, 150);
    const jobDescription = sanitizeInput(rawJobDescription, 2500);

    if (rawCandidates.length > 15) {
      return new Response(
        JSON.stringify({ error: 'Payload too large. You can only stack rank a maximum of 15 candidates at once.' }),
        { status: 413 }
      );
    }

    const candidatesToRank = rawCandidates;

    const sanitizedCandidates = candidatesToRank.map(c => {
      return {
        id: sanitizeInput(c.id, 80),
        name: sanitizeInput(c.name, 100),
        resumeText: cleanResumePayload(c.resumeText),
      };
    });

    const systemPrompt = `You are a world-class executive recruiter and AI talent sourcer.
Your task is to review a Job Opening and a list of Candidate Portfolios, and evaluate each candidate's suitability compared to the role requirements and to each other.

ROLE DETAILS:
Job Title: ${jobTitle}
Description/Requirements: ${jobDescription || 'Standard requirements for a ' + jobTitle}

CANDIDATES TO SCORE:
${sanitizedCandidates.map((c, i) => `
Candidate #${i + 1}
ID: ${c.id}
Name: ${c.name}
Resume/Portfolio Details:
${c.resumeText}
`).join('\n---\n')}

Scoring Rubric:
- 9.0 - 10.0: 'AI: Outstanding' (exceeds all core criteria with directly proven accomplishments)
- 7.5 - 8.9: 'AI: Highly Qualified' (meets all requirements with solid demonstrated background)
- 5.0 - 7.4: 'AI: Good Match' (possesses transferrable skills but minor domain or stack gaps)
- 1.0 - 4.9: 'AI: Unaligned' (lacks primary prerequisites or relevant technical background)

For each candidate, assign the objective compatibility score (aiScore), the matching category (aiLabel), and a precise 1-2 sentence assessment (aiExplanation).`;

    let object;
    try {
      const res = await generateObject({
        model: google('gemini-2.5-flash'),
        schema: stackRankResultSchema,
        system: systemPrompt,
        prompt: 'Evaluate the candidates against the role requirements and return the structured ranking results.',
        temperature: 0.2,
      });
      object = res.object;
    } catch (primaryErr) {
      console.warn('Primary model gemini-2.5-flash failed, falling back to gemini-2.5-flash-lite:', primaryErr);
      const res = await generateObject({
        model: google('gemini-2.5-flash-lite'),
        schema: stackRankResultSchema,
        system: systemPrompt,
        prompt: 'Evaluate the candidates against the role requirements and return the structured ranking results.',
        temperature: 0.2,
      });
      object = res.object;
    }

    return new Response(JSON.stringify(object), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    console.error('AI Stack Ranker Error:', err);
    return new Response(JSON.stringify({ error: getErrorMessage(err) }), { status: 500 });
  }
}
