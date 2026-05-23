import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { getErrorMessage } from '@/lib/api-error';
import { auth } from '@clerk/nextjs/server';
import { aiRateLimiter } from '@/lib/rate-limit';

export const runtime = 'edge';

// Strict input sanitization to avoid prompt injection and control character abuse
function sanitizeInput(raw: string, maxLen: number): string {
  if (!raw) return '';
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // strip control chars
    .replace(/[\{\}]/g, '') // remove curly braces to avoid structural prompt manipulation
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function cleanResumePayload(payload: any): string {
  if (!payload) return '';
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return sanitizeInput(str, 4000); // enforce strict 4000 char limit per resume payload
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

    // Limit maximum candidates ranked in a single call to 15 to prevent token/timing denial of service
    const candidatesToRank = rawCandidates.slice(0, 15);

    const sanitizedCandidates = candidatesToRank.map(c => {
      return {
        id: sanitizeInput(c.id, 80),
        name: sanitizeInput(c.name, 100),
        resumeText: cleanResumePayload(c.resumeText)
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
Resume/Portfolio JSON payload:
${c.resumeText}
`).join('\n---\n')}

For each candidate, assign:
1. An objective compatibility score (aiScore) between 1.0 and 10.0 based strictly on experience, tech stack match, and skills.
2. A short matching category (aiLabel), which MUST be exactly one of: 'AI: Outstanding', 'AI: Highly Qualified', 'AI: Good Match', or 'AI: Unaligned'.
3. A highly precise, recruiter-grade 1-2 sentence assessment reasoning (aiExplanation) highlighting their key alignment strengths and any experience gaps relative to the job description.

CRITICAL INSTRUCTIONS:
- You must return a valid, parsable JSON array of objects.
- Each object in the array MUST contain the fields: "id", "aiScore", "aiLabel", and "aiExplanation".
- Do NOT wrap your output in markdown code blocks like \`\`\`json. Return ONLY the raw JSON array string.
- Do NOT output any conversational text, introductions, explanations outside the JSON array, or trailing commas.`;

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: `Analyze the candidates and return the JSON array immediately.`,
      temperature: 0.2, // low temperature for highly reliable, objective JSON output
    });

    let rawText = result.text.trim();
    
    // Clean potential markdown fencing if the model ignored instructions
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    // Verify it parses as JSON to ensure response integrity
    const parsed = JSON.parse(rawText);

    return new Response(JSON.stringify({ results: parsed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: unknown) {
    console.error('AI Stack Ranker Error:', err);
    return new Response(JSON.stringify({ error: getErrorMessage(err) }), { status: 500 });
  }
}
