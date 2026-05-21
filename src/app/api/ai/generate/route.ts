import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { getErrorMessage } from '@/lib/api-error';
import { sanitizeCareerContext } from '@/lib/ai-guard';
import { aiRateLimiter } from '@/lib/rate-limit';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'edge';

export function compressContext(obj: any): any {
  if (Array.isArray(obj)) {
    const arr = obj.map(compressContext).filter(v => v !== null && v !== undefined && v !== '');
    return arr.length > 0 ? arr : undefined;
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj: any = {};
    for (const key in obj) {
      if (key === 'image' || key === 'id' || key === 'url') continue;
      const val = compressContext(obj[key]);
      if (val !== undefined) {
        newObj[key] = val;
      }
    }
    return Object.keys(newObj).length > 0 ? newObj : undefined;
  }
  
  if (typeof obj === 'string') {
    if (obj.trim() === '') return undefined;
    if (obj.length > 30) {
      // Remove common filler words to save tokens drastically
      return obj.replace(/\b(the|a|an|and|or|but|is|are|was|were|in|on|at|to|for|of|with|by|as)\b/gi, '').replace(/\s+/g, ' ').trim();
    }
  }
  return obj;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const rateCheck = aiRateLimiter.check(userId);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait before generating again.' }),
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateCheck.resetInMs / 1000)) },
        }
      );
    }

    const { context, type, careerContext } = await req.json();

    let systemPrompt = '';
    
    if (type === 'summary') {
      systemPrompt = `You are an expert executive resume writer. 
      Write a powerful, professional description (2-3 sentences) for the specific job role provided in the context. 
      If the user has provided existing text or bullet points, enhance and rewrite them. If they provided no text, generate a highly realistic, ATS-friendly placeholder description based on the job title and company.
      Focus on measurable achievements. Do NOT output any conversational filler. Output ONLY the summary text.`;
    } else if (type === 'bullets') {
      systemPrompt = `You are an expert executive resume writer. 
      Write 3 highly impactful, ATS-friendly bullet points for the specific job role provided in the context.
      If the user provided existing responsibilities, rewrite them using the "Accomplished X by doing Y" format. If they provided nothing, generate 3 highly realistic placeholder bullet points based on the job title, company, and their global skills.
      Do NOT output any conversational filler. Separate each bullet point with a newline character. Do not use asterisks or dash prefixes, just the raw text.`;
    } else if (type === 'skills') {
      systemPrompt = `You are an expert executive resume writer.
      Generate a comma-separated list of 8-12 highly relevant, industry-standard professional skills for the specified skill category.
      Use the provided resume context (work history, other skills, category name) to tailor the skills precisely to the user's career trajectory.
      If the user provided existing skills in this category, refine, standardize, and expand upon them.
      Output ONLY a single comma-separated line of skills (e.g., "React, TypeScript, Node.js"). Do NOT output conversational filler, prefixes, or bullet points.`;
    } else if (type === 'cover-letter') {
      systemPrompt = `You are an expert executive resume and career coach.
      Write a highly personalized, compelling, and professional Cover Letter based on:
      1. The user's entire resume profile data (basics, work history, skills).
      2. The Target Company Name, Target Job Title, and any Job Description/Role details provided in the context.
      Make the letter stand out by connecting the user's career achievements directly to the company and role. Use a professional, confident tone.
      Ensure the output is formatted as a beautiful, standard business cover letter, including placeholders for date, addresses, and formal salutations.
      Output ONLY the cover letter text. Do NOT include any introductions or conversational filler outside the letter itself.`;
    } else {
      systemPrompt = `You are an expert executive resume writer. 
      Write a highly professional "Professional Summary" (3-4 sentences) for the top of the user's resume.
      Use their entire provided work history, skills, and education as context to synthesize a cohesive narrative about their career trajectory and expertise.
      If they have no work history provided, write a powerful entry-level objective statement.
      Output ONLY the summary text. Do NOT include any introductions or filler.`;
    }

    const safeCareerContext = sanitizeCareerContext(careerContext);
    if (safeCareerContext) {
      systemPrompt += `\n\nCRITICAL CAREER CONTEXT: The user has provided the following specific career goals, target industry, or tone requirements. YOU MUST strictly adhere to this context: "${safeCareerContext}"`;
    }

    const compressedContext = compressContext(context);

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: `Context/Input to process:\n${JSON.stringify(compressedContext)}`,
      temperature: 0.7,
    });

    return new Response(result.text);
  } catch (err: unknown) {
    console.error('AI Generate Error:', err);
    return new Response(JSON.stringify({ error: getErrorMessage(err) }), { status: 500 });
  }
}
