import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Set OPENAI_API_KEY in .env.local and restart the dev server.' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided for analysis' },
        { status: 400 }
      );
    }

    const prompt = `
Analyze the following resume text and return ONLY a strict JSON object with exactly these fields and no others:

{
  "summary": "Brief professional summary of the candidate",
  "skills": ["top", "skills", "from", "the", "resume"],
  "strengths": ["clear, specific strengths grounded in the resume"],
  "weaknesses": ["constructive weaknesses or gaps grounded in the resume"]
}

Rules:
- Output valid JSON only (no markdown fences or extra prose).
- Each array should contain 3-8 concise items.
- If information is insufficient, return an empty array for that field.

Resume Text:
${text}`;

    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: "input_text",
              text: 'You are an expert in helping the employer to analyze the resume of the candidate. Analyze resumes thoroughly and provide constructive feedback.'
            }
          ]
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: prompt }]
        }
      ],
      temperature: 0.3,
      max_output_tokens: 2000
    });

    let analysisText = (response.output_text ?? '').trim();

    if (!analysisText && Array.isArray(response.output)) {
      analysisText = response.output
        .map((item: any) => {
          if (!Array.isArray(item?.content)) return '';
          return item.content
            .map((part: any) =>
              typeof part?.text === 'string'
                ? part.text
                : typeof part?.output_text === 'string'
                ? part.output_text
                : ''
            )
            .join('');
        })
        .join('')
        .trim();
    }

    if (!analysisText) {
      throw new Error('No response from OpenAI');
    }

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      analysis = {
        summary: 'Analysis completed',
        raw_analysis: analysisText,
        error: 'Failed to parse structured response'
      };
    }

    return NextResponse.json({
      analysis,
      usage: response.usage ?? null
    });
  } catch (error) {
    console.error('Error analyzing resume:', error);
    const message =
      (typeof error === 'object' && error && 'code' in error && (error as any).code === 'invalid_api_key') ||
      (typeof error === 'object' && error && 'status' in error && (error as any).status === 401)
        ? 'Invalid OpenAI API key. Update OPENAI_API_KEY in .env.local and restart the dev server.'
        : 'Failed to analyze resume with AI';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Use POST method to analyze resume text' },
    { status: 405 }
  );
}
