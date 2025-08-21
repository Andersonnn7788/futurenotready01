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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
              <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Interview Session</h1>
              <p className="text-gray-600 mt-1">Engage in a real-time voice interview with our AI interviewer</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                connected 
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
                {connected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[75vh]">
          {/* Chat column */}
          <div className="xl:col-span-3 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl flex flex-col overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur text-white grid place-items-center font-bold text-lg border border-white/30">
                    AI
                  </div>
                  {connected && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></div>
                  )}
                </div>
                <div className="text-white">
                  <div className="font-semibold text-lg">AI Interviewer</div>
                  <div className="text-sm text-white/80 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                    Voice Interview • {connected ? 'Live' : 'Offline'}
                  </div>
              </div>
            </div>
            <button
              onClick={summarize}
              disabled={grouped.length === 0 || isSummarizing}
                className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white text-sm font-medium transition-all duration-200 border border-white/30 backdrop-blur"
              >
                {isSummarizing ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Generate Summary
                  </div>
                )}
            </button>
          </div>

          {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
            {grouped.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Start Your Interview</h3>
                  <p className="text-gray-600 max-w-md">Click the Start button below to begin your voice interview with our AI interviewer. Make sure your microphone is enabled.</p>
                </div>
            )}
            {grouped.map((m, idx) => {
              const isAI = m.speaker === 'Interviewer' || m.speaker === 'assistant';
              return (
                  <div key={idx} className={`flex ${isAI ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[85%] ${isAI ? 'flex items-start gap-3' : ''}`}>
                      {isAI && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center mt-1 flex-shrink-0">
                          AI
                        </div>
                      )}
                      <div className={`rounded-2xl px-5 py-3 text-sm whitespace-pre-wrap shadow-sm ${
                        isAI 
                          ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-md' 
                          : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-tr-md'
                      }`}>
                        <div className={`text-xs font-medium mb-2 ${isAI ? 'text-indigo-600' : 'text-white/80'}`}>
                          {isAI ? 'AI Interviewer' : 'You'}
                        </div>
                        <div className="leading-relaxed">{m.text}</div>
                      </div>
                    </div>
                </div>
              );
            })}
          </div>

          {/* Controls */}
            <div className="border-t border-gray-100 bg-white/70 backdrop-blur p-6">
              <div className="flex items-center justify-center gap-4">
            <button
              onClick={startSession}
              disabled={connected}
                  className="group relative px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200 transform hover:scale-105 disabled:scale-100"
              aria-label="Start interview"
            >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Start Interview
                  </div>
                  {!connected && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                  )}
            </button>
            <button
              onClick={stopSession}
              disabled={!connected}
                  className="group relative px-8 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200 transform hover:scale-105 disabled:scale-100"
              aria-label="End interview"
            >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                    End Interview
                  </div>
                  {connected && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-400 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                  )}
            </button>
              </div>
            </div>
            {/* Hidden audio elements */}
            <audio ref={localAudioRef} autoPlay muted className="hidden" />
            <audio ref={remoteAudioRef} autoPlay className="hidden" />
        </div>

        {/* Analysis column */}
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg text-white">Summary & Analytics</h2>
                    <p className="text-white/80 text-sm">AI-powered interview analysis</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {!summary ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">No Analysis Yet</h3>
                    <p className="text-gray-600 text-sm">Complete your interview and click "Generate Summary" to see detailed insights and analytics.</p>
                  </div>
                ) : (
                  <div className="space-y-6 text-sm">
                    {summary.summary && (
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                        <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Summary
                        </h3>
                        <p className="text-indigo-800 leading-relaxed">{summary.summary}</p>
                      </div>
                    )}
                    
                    {Array.isArray(summary.key_strengths) && summary.key_strengths.length > 0 && (
                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
                        <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Key Strengths
                        </h3>
                        <ul className="space-y-2">
                          {summary.key_strengths.map((s: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-emerald-800">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                              {s}
                            </li>
                          ))}
                        </ul>
                  </div>
                )}
                    
                {Array.isArray(summary.concerns) && summary.concerns.length > 0 && (
                      <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                        <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          Areas for Improvement
                        </h3>
                        <ul className="space-y-2">
                          {summary.concerns.map((s: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-amber-800">
                              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                              {s}
                            </li>
                          ))}
                    </ul>
                  </div>
                )}
                    
                {Array.isArray(summary.skills_mentioned) && summary.skills_mentioned.length > 0 && (
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
                        <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          Skills Mentioned
                        </h3>
                        <div className="flex flex-wrap gap-2">
                      {summary.skills_mentioned.map((sk: string, idx: number) => (
                            <span key={idx} className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium border border-purple-200">
                              {sk}
                            </span>
                      ))}
                    </div>
                  </div>
                )}
                    
                {summary.overall_recommendation && (
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl">
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          Overall Recommendation
                        </h3>
                        <p className="text-gray-800 leading-relaxed">{summary.overall_recommendation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


