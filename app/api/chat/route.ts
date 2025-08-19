import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured.' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const question: string | undefined = body?.question;
    const guidelines: string | undefined = body?.guidelines;
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey });

    const system = `You are the Onboarding Assistant. Answer questions clearly and concisely.
If provided, use the following organization-specific onboarding guidelines as primary context. When relevant, quote or paraphrase them faithfully. If guidelines do not cover the question, answer from general best practices and note that the policy may vary.

Guidelines (may be empty):
${guidelines ?? ''}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 800,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: question }
      ]
    });

    const reply = completion.choices[0]?.message?.content?.trim() || '';
    return NextResponse.json({ reply, usage: completion.usage });
  } catch (err) {
    console.error('chat route error', err);
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST { question } to chat.' });
}


