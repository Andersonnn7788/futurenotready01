'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

// Minimal client for OpenAI Realtime (WebRTC). We request an ephemeral token
// from our backend and then establish a peer connection with bi-directional
// audio. The agent speaks and listens in real time.

interface TranscriptItem {
  speaker: 'Interviewer' | 'Candidate' | string;
  text: string;
  ts?: number;
}

export default function AIInterviewerPage() {
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const recognitionRef = useRef<any>(null);
  const [connected, setConnected] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  // Buffer AI streaming text to avoid duplicate/delta spam
  const aiBufferRef = useRef<string>('');
  const aiStreamingRef = useRef<boolean>(false);

  // Append a line to transcript
  const addLine = useCallback((item: TranscriptItem) => {
    setTranscript(prev => [...prev, { ...item, ts: Date.now() }]);
  }, []);

  const startSession = useCallback(async () => {
    try {
      // Ask backend for ephemeral session
      const tokenResp = await fetch('/api/realtime-session', { method: 'POST' });
      const session = await tokenResp.json();
      if (!tokenResp.ok) throw new Error(session?.error || 'Failed to create session');

      // Prepare peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]
      });
      pcRef.current = pc;

      // Remote audio track
      const remoteStream = new MediaStream();
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
      pc.ontrack = (event) => {
        for (const track of event.streams[0].getTracks()) {
          remoteStream.addTrack(track);
        }
      };

      pc.onconnectionstatechange = () => {
        setConnected(pc.connectionState === 'connected');
      };

      // Get mic
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = localStream;
      }
      for (const track of localStream.getTracks()) {
        pc.addTrack(track, localStream);
      }

      // Create data channel for transcript text messages
      const dc = pc.createDataChannel('oai-events');
      dc.onopen = () => {
        try {
          // Enforce strict turn-taking so the interviewer pauses for the candidate
          const sessionUpdate = {
            type: 'session.update',
            session: {
              // Ask exactly one question at a time, then wait silently for the candidate.
              instructions:
                'You are an AI interviewer. Always ask exactly ONE concise question, then stop speaking and wait in silence for the candidate to answer. Do not chain multiple questions together. Only speak again after the candidate has spoken. If there is no candidate speech for ~20 seconds, give a short gentle nudge like "Whenever you are ready, please share your answer," then wait again. Keep a calm pace and natural pauses.',
              // Keep server-side VAD enabled to detect when the candidate starts/stops speaking.
              // These values are conservative to avoid talking over the candidate.
              turn_detection: { type: 'server_vad', threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 800 }
            }
          } as any;
          dc.send(JSON.stringify(sessionUpdate));

          const initialPrompt = {
            type: 'response.create',
            response: {
              modalities: ['text', 'audio'],
              instructions:
                'Start with a brief greeting, then ask the first concise question about how the candidate solved a tough technical problem. After asking, pause and wait for their response.'
            }
          } as any;
          dc.send(JSON.stringify(initialPrompt));
        } catch {}
      };
      dc.onmessage = (e) => {
        try {
          const dataStr = typeof e.data === 'string' ? e.data : '' + e.data;
          const msg = JSON.parse(dataStr);

          // Normalize helper
          const pushAI = (text: string) => text && addLine({ speaker: 'Interviewer', text });
          const pushUser = (text: string) => text && addLine({ speaker: 'Candidate', text });
          const extractText = (m: any) =>
            (m?.text || m?.delta || m?.output_text || m?.transcript || m?.audio_transcript || m?.response?.output_text || '');

          if (!msg || !msg.type) return;

          // 1) Explicit user-side transcription events
          if (
            msg.type === 'conversation.item.input_audio_transcription.completed' ||
            (typeof msg.type === 'string' && msg.type.startsWith('input_audio_transcription.'))
          ) {
            const text = msg.text || msg.delta || msg?.transcript || msg?.content || '';
            pushUser(text);
            return;
          }

          // 2) Assistant streaming text - buffer deltas and flush on completion
          if (typeof msg.type === 'string' && msg.type.startsWith('response.')) {
            const t = msg.type as string;
            // Accumulate only output_text deltas
            if (t.endsWith('.delta')) {
              const delta = (typeof msg.delta === 'string' ? msg.delta : '') || '';
              if (delta) {
                aiStreamingRef.current = true;
                aiBufferRef.current += delta;
              }
              return;
            }
            // Flush when response is completed/done
            if (t.endsWith('.done') || t.endsWith('completed')) {
              const out = aiBufferRef.current.trim();
              if (out) pushAI(out);
              aiBufferRef.current = '';
              aiStreamingRef.current = false;
              return;
            }
            // Ignore other response.* events to avoid duplicate text
            return;
          }

          // 3) Conversation item created events with text content
          if (msg.type === 'conversation.item.created' || msg.type === 'conversation.item.input_audio_transcription.completed') {
            const item = msg.item || {};
            const role = item.role || item?.content?.[0]?.role;
            // Extract any text-like content
            let text = '';
            const content = item.content || [];
            for (const c of content) {
              if (typeof c?.text === 'string') text += (text ? ' ' : '') + c.text;
              if (typeof c?.transcript === 'string') text += (text ? ' ' : '') + c.transcript;
            }
            // Only push user items. Assistant items are already handled via response.* buffer.
            if (role === 'user') pushUser(text);
            return;
          }
        } catch (err) {
          // ignore parse errors
        }
      };

      // Create SDP offer
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
      await pc.setLocalDescription(offer);

      // Send SDP to OpenAI Realtime API
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = session?.model || 'gpt-4o-realtime-preview-2024-12-17';
      const sdpResp = await fetch(`${baseUrl}?model=${encodeURIComponent(model)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.client_secret?.value}`,
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp || ''
      });
      const answerSdp = await sdpResp.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      // Start local speech recognition to capture user's spoken words as text
      try {
        const SR = (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) || null;
        if (SR) {
          const rec = new SR();
          recognitionRef.current = rec;
          rec.lang = 'en-US';
          rec.interimResults = true;
          rec.continuous = true;
          let interim = '';
          rec.onresult = (event: any) => {
            let finalChunk = '';
            interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const res = event.results[i];
              if (res.isFinal) finalChunk += res[0].transcript;
              else interim += res[0].transcript;
            }
            if (finalChunk) addLine({ speaker: 'Candidate', text: finalChunk.trim() });
          };
          rec.onerror = () => {};
          rec.onend = () => {
            // Keep it running while connected
            if (pcRef.current) {
              try { rec.start(); } catch {}
            }
          };
          try { rec.start(); } catch {}
        }
      } catch {}
    } catch (e) {
      console.error(e);
      alert('Failed to start the interview. Check console and API key.');
    }
  }, [addLine]);

  const stopSession = useCallback(() => {
    const pc = pcRef.current;
    if (pc) {
      pc.getSenders().forEach(s => s.track?.stop());
      pc.close();
    }
    pcRef.current = null;
    try {
      const rec = recognitionRef.current;
      if (rec) {
        rec.onend = null;
        rec.stop();
      }
    } catch {}
    setConnected(false);
  }, []);

  const summarize = useCallback(async () => {
    try {
      setIsSummarizing(true);
      const resp = await fetch('/api/summarize-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });
      const data = await resp.json();
      setSummary(data.analysis || data);
    } catch (e) {
      console.error(e);
      alert('Failed to summarize interview');
    } finally {
      setIsSummarizing(false);
    }
  }, [transcript]);

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  // Group consecutive messages by speaker to make bubbles cleaner
  const grouped = useMemo(() => {
    const out: { speaker: string; text: string; ts: number }[] = [];
    for (const item of transcript) {
      const last = out[out.length - 1];
      if (last && last.speaker === item.speaker) {
        last.text += (last.text.endsWith('\n') ? '' : ' ') + item.text;
        last.ts = item.ts || last.ts;
      } else {
        out.push({ speaker: item.speaker, text: item.text, ts: item.ts || Date.now() });
      }
    }
    return out;
  }, [transcript]);

  // Persist latest conversation so the review page can retrieve it
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('latest_interview_conversation_v1', JSON.stringify(grouped));
        localStorage.setItem('latest_interview_transcript_v1', JSON.stringify(transcript));
      }
    } catch {}
  }, [grouped, transcript]);

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
        {/* Chat column */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur rounded-xl border shadow-sm flex flex-col overflow-hidden h-full">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-purple-600 text-white grid place-items-center">AI</div>
              <div>
                <div className="font-medium">AI Interviewer</div>
                <div className="text-xs text-gray-500">{connected ? 'Live' : 'Offline'} · Voice</div>
              </div>
            </div>
            <button
              onClick={summarize}
              disabled={grouped.length === 0 || isSummarizing}
              className="px-3 py-1.5 rounded-md bg-purple-600 disabled:bg-purple-300 text-white text-sm"
            >
              {isSummarizing ? 'Summarizing…' : 'Summarize'}
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-br from-gray-50 to-gray-100">
            {grouped.length === 0 && (
              <div className="text-center text-gray-500 text-sm mt-10">Press Start to begin your interview.</div>
            )}
            {grouped.map((m, idx) => {
              const isAI = m.speaker === 'Interviewer' || m.speaker === 'assistant';
              return (
                <div key={idx} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${isAI ? 'bg-white border text-gray-800' : 'bg-blue-600 text-white'} `}>
                    <div className="text-[11px] opacity-70 mb-1">{isAI ? 'AI Interviewer' : 'You'}</div>
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="relative border-t p-6 flex items-center justify-center gap-4">
            <button
              onClick={startSession}
              disabled={connected}
              className="px-5 py-2 rounded-md bg-green-600 disabled:bg-green-300 text-white shadow hover:bg-green-700"
              aria-label="Start interview"
            >
              Start
            </button>
            <button
              onClick={stopSession}
              disabled={!connected}
              className="px-5 py-2 rounded-md bg-red-600 disabled:bg-red-300 text-white shadow hover:bg-red-700"
              aria-label="End interview"
            >
              End
            </button>
            {/* Hidden audio elements */}
            <audio ref={localAudioRef} autoPlay muted className="hidden" />
            <audio ref={remoteAudioRef} autoPlay className="hidden" />
          </div>
        </div>

        {/* Analysis column */}
        <div className="space-y-4">
          <div className="bg-white/70 backdrop-blur border rounded-xl shadow-sm p-4">
            <h2 className="font-medium mb-2">Summary & Analytics</h2>
            {!summary ? (
              <p className="text-gray-600 text-sm">Run an interview, then summarize to generate insights.</p>
            ) : (
              <div className="space-y-3 text-sm">
                {summary.summary && <p>{summary.summary}</p>}
                {Array.isArray(summary.key_strengths) && summary.key_strengths.length > 0 && (
                  <div>
                    <h3 className="font-semibold">Strengths</h3>
                    <ul className="list-disc pl-5">
                      {summary.key_strengths.map((s: string, idx: number) => (<li key={idx}>{s}</li>))}
                    </ul>
                  </div>
                )}
                {Array.isArray(summary.concerns) && summary.concerns.length > 0 && (
                  <div>
                    <h3 className="font-semibold">Concerns</h3>
                    <ul className="list-disc pl-5">
                      {summary.concerns.map((s: string, idx: number) => (<li key={idx}>{s}</li>))}
                    </ul>
                  </div>
                )}
                {Array.isArray(summary.skills_mentioned) && summary.skills_mentioned.length > 0 && (
                  <div>
                    <h3 className="font-semibold">Skills Mentioned</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {summary.skills_mentioned.map((sk: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{sk}</span>
                      ))}
                    </div>
                  </div>
                )}
                {summary.overall_recommendation && (
                  <div>
                    <h3 className="font-semibold">Overall Recommendation</h3>
                    <p>{summary.overall_recommendation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


