'use client';

import Link from 'next/link';

export default function CandidateFollowUpPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Candidate Follow Up</h1>
      <div className="overflow-x-auto bg-white shadow-sm rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Adrian Tan Wei Ming</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">+60123456789</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <Link href="/candidate-follow-up/review" className="inline-flex items-center px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700">Review</Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}


