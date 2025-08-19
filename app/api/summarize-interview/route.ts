import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

// Accepts a transcript (array of {speaker, text, ts?}) and returns structured summary & analytics
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured.' }, { status: 500 });
    }

    const body = await req.json();
    const transcript = body?.transcript;
    const role = body?.role || 'Candidate';
    if (!Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey });
    const prompt = `You are an expert interviewer assistant.
You will receive a full interview transcript as JSON array of messages.
Produce a strict JSON object with fields:
{
  "summary": string,                     // concise narrative summary (120-200 words)
  "key_strengths": string[],             // 3-7 items
  "concerns": string[],                  // 2-6 items, constructive
  "skills_mentioned": string[],          // deduplicated
  "notable_quotes": string[],            // 2-5 short quotes
  "overall_recommendation": "Strong Hire" | "Hire" | "Leaning Hire" | "Neutral" | "Leaning No" | "No Hire"
}
Guidelines: be specific and grounded in the transcript. Refer to the candidate as ${role}. Output valid JSON only.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: JSON.stringify(transcript) }
      ]
    });

    const content = completion.choices[0]?.message?.content || '{}';
    let data: any;
    try { data = JSON.parse(content); } catch (e) {
      data = { summary: content, error: 'Parser failed: non-JSON output' };
    }
    return NextResponse.json({ analysis: data, usage: completion.usage });
  } catch (err) {
    console.error('summarize-interview error', err);
    return NextResponse.json({ error: 'Failed to summarize interview' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST with a transcript to summarize.' }, { status: 405 });
}


