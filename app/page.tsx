'use client';

import ResumeUploader from '@/components/ResumeUploader';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Resume Screening
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your resume in PDF format and extract text content instantly. 
            Perfect for parsing resumes, analyzing content, or converting to other formats.
          </p>
        </div>
        
        <ResumeUploader />
      </div>
    </div>
  );
}
