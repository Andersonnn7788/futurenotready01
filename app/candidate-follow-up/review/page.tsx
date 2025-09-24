'use client';

import { useEffect, useMemo, useState } from 'react';

type GroupedLine = { speaker: string; text: string; ts: number };
type ConversationStats = {
  totalQuestions: number;
  totalAnswers: number;
  averageResponseLength: number;
  conversationDuration: string;
};

export default function CandidateReviewPage() {
  const [grouped, setGrouped] = useState<GroupedLine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'questions' | 'answers'>('all');

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

  // Calculate conversation statistics
  const stats = useMemo((): ConversationStats => {
    const totalQuestions = qaPairs.filter(p => p.q.trim()).length;
    const totalAnswers = qaPairs.filter(p => p.a.trim()).length;
    const totalResponseLength = qaPairs.reduce((sum, p) => sum + p.a.length, 0);
    const averageResponseLength = totalAnswers > 0 ? Math.round(totalResponseLength / totalAnswers) : 0;
    
    // Calculate duration from first to last message timestamp
    const timestamps = grouped.map(g => g.ts).filter(Boolean);
    const duration = timestamps.length > 1 
      ? Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 1000 / 60)
      : 0;
    
    return {
      totalQuestions,
      totalAnswers,
      averageResponseLength,
      conversationDuration: duration > 0 ? `${duration} min` : 'N/A'
    };
  }, [qaPairs, grouped]);

  // Filter conversations based on search and filter
  const filteredPairs = useMemo(() => {
    let filtered = qaPairs;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(pair => 
        pair.q.toLowerCase().includes(term) || 
        pair.a.toLowerCase().includes(term)
      );
    }
    
    if (selectedFilter === 'questions') {
      filtered = filtered.filter(pair => pair.q.trim());
    } else if (selectedFilter === 'answers') {
      filtered = filtered.filter(pair => pair.a.trim());
    }
    
    return filtered;
  }, [qaPairs, searchTerm, selectedFilter]);

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interview Conversation Review</h1>
              <p className="text-gray-600 mt-1">Comprehensive analysis of the AI-conducted interview session</p>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Questions Asked</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Answers Given</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAnswers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Response</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageResponseLength}</p>
                  <p className="text-xs text-gray-500">characters</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.conversationDuration}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
              />
            </div>
            
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm min-w-[140px]"
            >
              <option value="all">All Messages</option>
              <option value="questions">Questions Only</option>
              <option value="answers">Answers Only</option>
            </select>
          </div>
        </div>

        {/* Conversation Display */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden">
          {filteredPairs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {qaPairs.length === 0 ? 'No Interview Data Available' : 'No Results Found'}
              </h3>
              <p className="text-gray-600 text-center max-w-md">
                {qaPairs.length === 0 
                  ? 'Please conduct an AI interview first to see the conversation analysis here.'
                  : 'Try adjusting your search term or filter criteria to find what you\'re looking for.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredPairs.map((pair, index) => {
                // Find the original timestamp for this Q&A pair
                const questionTimestamp = grouped.find(g => g.text.trim() === pair.q.trim())?.ts;
                const answerTimestamp = grouped.find(g => g.text.trim() === pair.a.trim())?.ts;
                
                return (
                  <div key={pair.key} className="p-6 hover:bg-white/30 transition-colors duration-200">
                    <div className="flex items-start gap-2 mb-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold">
                        {index + 1}
                      </span>
                      {questionTimestamp && (
                        <span className="text-xs text-gray-500 mt-2">
                          {formatTimestamp(questionTimestamp)}
                        </span>
                      )}
                    </div>
                    
                    {/* Question */}
                    {pair.q && (
                      <div className="mb-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                            <span className="text-white text-xs font-bold">AI</span>
                          </div>
                          <div className="flex-1">
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-5 py-4 shadow-sm">
                              <div className="text-xs font-medium text-indigo-600 mb-2">AI Interviewer</div>
                              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">{pair.q}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Answer */}
                    {pair.a ? (
                      <div className="flex justify-end">
                        <div className="flex items-start gap-4 max-w-[85%]">
                          <div className="flex-1">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl rounded-tr-md px-5 py-4 shadow-lg">
                              <div className="text-xs font-medium text-white/80 mb-2">Candidate</div>
                              <div className="leading-relaxed whitespace-pre-wrap">{pair.a}</div>
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] bg-gray-100 border border-gray-200 rounded-2xl rounded-tr-md px-5 py-4">
                          <div className="text-xs font-medium text-gray-500 mb-2">Candidate</div>
                          <div className="text-gray-500 italic">No response provided</div>
                        </div>
                      </div>
                    )}
                    
                    {answerTimestamp && (
                      <div className="flex justify-end mt-2">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(answerTimestamp)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <button 
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Report
          </button>
          
          <button 
            onClick={() => {
              const data = JSON.stringify(filteredPairs, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `interview-conversation-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Data
          </button>
        </div>
      </main>
    </div>
  );
}