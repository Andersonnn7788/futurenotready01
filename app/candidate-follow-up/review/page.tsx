'use client';

import { useEffect, useMemo, useState } from 'react';

type GroupedLine = { speaker: string; text: string; ts: number };

export default function CandidateReviewPage() {
  const [grouped, setGrouped] = useState<GroupedLine[]>([]);

  // Load the latest conversation saved by the AI Interview page
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const rawGrouped = localStorage.getItem('latest_interview_conversation_v1');
      const rawTranscript = localStorage.getItem('latest_interview_transcript_v1');

      if (rawGrouped) {
        const parsed = JSON.parse(rawGrouped);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGrouped(parsed);
          return;
        }
      }

      // Fallback: derive grouped messages from raw transcript items
      if (rawTranscript) {
        const items: { speaker: string; text: string; ts?: number }[] = JSON.parse(rawTranscript) || [];
        const compact = items
          .filter(it => typeof it?.text === 'string' && it.text.trim().length > 0)
          .map(it => ({ speaker: it.speaker, text: it.text.trim(), ts: it.ts || Date.now() }));

        const groupedDerived: GroupedLine[] = [];
        for (const it of compact) {
          const last = groupedDerived[groupedDerived.length - 1];
          if (last && last.speaker === it.speaker) {
            last.text += (last.text.endsWith('\n') ? '' : ' ') + it.text;
            last.ts = it.ts;
          } else {
            groupedDerived.push({ speaker: it.speaker, text: it.text, ts: it.ts });
          }
        }
        if (groupedDerived.length > 0) setGrouped(groupedDerived);
      }
    } catch {}
  }, []);

  // Build Q/A pairs by pairing Interviewer lines with the next Candidate line
  const qaPairs = useMemo(() => {
    const pairs: { q: string; a: string; key: string }[] = [];
    let pendingQuestion: { text: string; ts: number } | null = null;

    const isAI = (sp: string) => sp === 'Interviewer' || sp === 'assistant' || sp === 'ai' || sp === 'system';
    const isUser = (sp: string) => sp === 'Candidate' || sp === 'user' || sp === 'human';

    for (const line of grouped) {
      if (!line?.text?.trim()) continue;
      if (isAI(line.speaker)) {
        // Flush any unanswered pending question to keep order
        if (pendingQuestion) {
          pairs.push({ q: pendingQuestion.text, a: '', key: `${pendingQuestion.ts}-na` });
        }
        pendingQuestion = { text: line.text.trim(), ts: line.ts };
      } else if (isUser(line.speaker)) {
        const answerText = line.text.trim();
        if (pendingQuestion) {
          pairs.push({ q: pendingQuestion.text, a: answerText, key: `${pendingQuestion.ts}` });
          pendingQuestion = null;
        } else {
          // No prior question, still capture candidate answer for completeness
          pairs.push({ q: '', a: answerText, key: `${line.ts}-solo` });
        }
      }
    }

    // If there is a trailing unanswered question, include it with empty answer
    if (pendingQuestion) {
      pairs.push({ q: pendingQuestion.text, a: '', key: `${pendingQuestion.ts}-tail` });
    }

    return pairs;
  }, [grouped]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">AI Interview Conversation</h1>
      <div className="overflow-x-auto bg-white shadow-sm rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Answer</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {qaPairs.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-6 text-center text-sm text-gray-500">No conversation found. Run an AI interview first.</td>
              </tr>
            ) : (
              qaPairs.map((row) => (
                <tr key={row.key}>
                  <td className="align-top px-6 py-4 whitespace-pre-wrap text-sm text-gray-900 w-1/2">{row.q}</td>
                  <td className="align-top px-6 py-4 whitespace-pre-wrap text-sm text-gray-700">{row.a || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}


