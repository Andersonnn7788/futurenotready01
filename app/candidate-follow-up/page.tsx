'use client';

import Link from 'next/link';

export default function CandidateFollowUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Candidate Follow Up</h1>
              <p className="text-gray-600 mt-2">Manage and review candidate information and interview summaries</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                1 Active Candidate
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-lg text-white">Candidate Database</h2>
                <p className="text-white/80 text-sm">Review and manage candidate profiles</p>
              </div>
            </div>
          </div>

          {/* Modern Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th scope="col" className="px-8 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Candidate Name</span>
                    </div>
                  </th>
                  <th scope="col" className="px-8 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Phone Number</span>
                    </div>
                  </th>
                  <th scope="col" className="px-8 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">AI Match Score</span>
                    </div>
                  </th>
                  <th scope="col" className="px-8 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Summary</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                <tr className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-200 group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        AT
                      </div>
                      <div>
                        <div className="text-base font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                          Adrian Tan Wei Ming
                        </div>
                        <div className="text-sm text-gray-500">Candidate</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <span className="text-base text-gray-700 font-medium">+60123456789</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-100 to-green-100 border border-emerald-200">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-lg font-bold text-emerald-800">96%</span>
                      </div>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full" style={{width: '96%'}}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        A good candidate for the data analyst role. He has the knowledge of Power BI, data visualization and machine learning basics.
                      </p>
                      <Link 
                        href="/candidate-follow-up/review" 
                        className="group/button relative inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-xs shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Review Interview Details
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-400 to-purple-500 opacity-0 group-hover/button:opacity-20 transition-opacity duration-200"></div>
                      </Link>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Empty State for when there are more candidates */}
          <div className="hidden px-8 py-12 text-center border-t border-gray-100 bg-gradient-to-b from-gray-50/50 to-white">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No More Candidates</h3>
            <p className="text-gray-600">All candidate reviews have been completed.</p>
          </div>
        </div>

        {/* Additional Stats Cards - Future Enhancement */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">1</div>
                <div className="text-sm text-gray-600">Active Candidates</div>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Pending Reviews</div>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">1</div>
                <div className="text-sm text-gray-600">Total Interviews</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


