import { NextRequest, NextResponse } from 'next/server';

// Ensure Node.js runtime
export const runtime = 'nodejs';

// Creates an ephemeral session token for the browser to connect to OpenAI Realtime via WebRTC
export async function POST(_req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured.' },
        { status: 500 }
      );
    }

    const model = process.env.REALTIME_MODEL?.trim() || 'gpt-4o-realtime-preview-2024-12-17';

    // Call OpenAI to mint an ephemeral client token
    const resp = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        voice: 'verse',
        // Enable both audio and text modalities
        modalities: ['audio', 'text'],
        // System prompt to steer behavior as an interviewer
        instructions: `You are a professional technical interviewer. Conduct a structured interview with concise, natural speech. 
Ask one question at a time and wait for the candidate to finish before proceeding. Probe for depth, reasoning, and examples. 
Track key points, skills, concerns, and notable quotes during the conversation for later summarization.`
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: 'Failed to create realtime session', details: text }, { status: 500 });
    }

    const data = await resp.json();
    // Forward the entire session payload (contains client_secret.value)
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error creating realtime session:', err);
    return NextResponse.json({ error: 'Unable to create realtime session' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to create an ephemeral session' }, { status: 405 });
}


