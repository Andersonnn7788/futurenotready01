'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface ExtractedData {
  text: string;
  filename: string;
  error?: string;
}

interface AnalysisData {
  analysis: {
    summary: string;
    skills: string[];
    strengths: string[];
    weaknesses: string[];
  };
  error?: string;
}

interface ResumeAnalysis {
  summary?: string;
  skills?: string[];
  strengths?: string[];
  weaknesses?: string[];
  raw_analysis?: string;
  error?: string;
}

export default function ResumeUploader() {
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setExtractedData(null);
    setAnalysis(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        const text: string = result.text ?? '';
        setExtractedData({
          text,
          filename: file.name,
        });
        // Immediately analyze extracted content with AI
        setIsAnalyzing(true);
        setAnalysisData(null);
        try {
          const analyzeResponse = await fetch('/api/analyze-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
          });
          const analyzeResult = await analyzeResponse.json();
          if (analyzeResponse.ok) {
            setAnalysisData(analyzeResult);
          } else {
            setAnalysisData({
              analysis: { summary: '', skills: [], strengths: [], weaknesses: [] },
              error: analyzeResult.error || 'Failed to analyze resume',
            });
          }
        } catch (err) {
          setAnalysisData({
            analysis: { summary: '', skills: [], strengths: [], weaknesses: [] },
            error: 'Network error occurred while analyzing resume',
          });
        } finally {
          setIsAnalyzing(false);
        }
      } else {
        setExtractedData({
          text: '',
          filename: file.name,
          error: result.error || 'Failed to extract text',
        });
      }
    } catch (error) {
      setExtractedData({
        text: '',
        filename: file.name,
        error: 'Network error occurred',
      });
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const copyToClipboard = () => {
    if (extractedData?.text) {
      navigator.clipboard.writeText(extractedData.text);
    }
  };

  const downloadText = () => {
    if (extractedData?.text) {
      const blob = new Blob([extractedData.text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${extractedData.filename.replace('.pdf', '')}_extracted.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // analysis happens automatically after upload now

  return (
    <div className="space-y-8">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 bg-white'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive
                ? 'Drop your resume here'
                : 'Drag & drop your resume here, or click to select'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              PDF files only, up to 10MB
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isUploading && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Extracting text from resume...</span>
          </div>
        </div>
      )}

      {/* Results */}
      {extractedData && !isUploading && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Extracted Text from: {extractedData.filename}
              </h3>
              {!extractedData.error && (
                <div className="flex space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={downloadText}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    Download as TXT
                  </button>
                  <button
                    disabled
                    className="px-4 py-2 bg-purple-400 text-white rounded-md cursor-not-allowed transition-colors text-sm"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Auto-analyzing'}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {extractedData.error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error extracting text
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      {extractedData.error}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Extracted {extractedData.text.length} characters of text
                  </p>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 p-4 rounded-md border max-h-96 overflow-y-auto">
                  {extractedData.text}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Analysis Results */}
      {analysisData && !isAnalyzing && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <svg
                className="h-5 w-5 mr-2 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              AI Resume Analysis
            </h3>
          </div>
          
          <div className="p-6 space-y-6">
            {analysisData.error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error analyzing resume
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      {analysisData.error}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Summary
                  </h4>
                  <p className="text-blue-800">{analysisData.analysis.summary}</p>
                </div>

                {/* Key Skills */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Key Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(analysisData.analysis.skills ?? []).map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Weaknesses */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.832-.833-2.602 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Weaknesses
                  </h4>
                  <ul className="space-y-2">
                    {(analysisData.analysis.weaknesses ?? []).map((item: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <svg className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.832-.833-2.602 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Removed Recommendations section per requirement */}

                {/* Strengths */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {(analysisData.analysis.strengths ?? []).map((strength: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Removed Areas for Improvement per requirement */}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
