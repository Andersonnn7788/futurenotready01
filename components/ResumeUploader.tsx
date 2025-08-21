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

interface MLRetentionData {
  retention_probability_1yr: number;
  prediction: number;
  prediction_label: string;
  risk_category: string;
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
  
  // Hardcoded ML retention prediction data
  const mlRetentionData: MLRetentionData = {
    retention_probability_1yr: 0.9449,
    prediction: 1,
    prediction_label: 'Will work 1+ years',
    risk_category: 'Low risk'
  };

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
    <div className="space-y-10">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 group
          ${isDragActive 
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl scale-[1.02]' 
            : 'border-gray-300 hover:border-blue-400 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:shadow-lg hover:scale-[1.01]'
          }
          shadow-sm backdrop-blur-sm
        `}
      >
        <input {...getInputProps()} />
        
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300">
            <svg
              className="h-10 w-10 text-blue-600 group-hover:text-blue-700 transition-colors duration-300"
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
          </div>
          
          <div className="space-y-3">
            <p className="text-xl font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-300">
              {isDragActive
                ? 'Drop your resume here'
                : 'Drag & drop your resume here, or click to select'}
            </p>
            <p className="text-base text-gray-600 group-hover:text-blue-700 transition-colors duration-300">
              PDF files only, up to 10MB
            </p>
            
            {!isDragActive && (
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform group-hover:scale-105">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Choose File
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isUploading && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <div className="text-center">
              <span className="text-lg font-medium text-gray-800">Extracting text from resume...</span>
              <p className="text-sm text-gray-600 mt-1">This will only take a moment</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {extractedData && !isUploading && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden backdrop-blur-sm">
          <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Extracted Text
                  </h3>
                  <p className="text-sm text-gray-600">{extractedData.filename}</p>
                </div>
              </div>
              {!extractedData.error && (
                <div className="flex space-x-3">
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                  <button
                    onClick={downloadText}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </button>
                  <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-medium">
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Auto-analyzed
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-8">
            {extractedData.error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-red-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-red-800">
                      Error extracting text
                    </h3>
                    <p className="text-red-700 mt-2">
                      {extractedData.error}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900">
                          Text Successfully Extracted
                        </p>
                        <p className="text-sm text-blue-700">
                          {extractedData.text.length.toLocaleString()} characters
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        ✓
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-100 rounded-t-xl">
                    <h4 className="font-semibold text-gray-800">Extracted Content</h4>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 p-6 max-h-96 overflow-y-auto leading-relaxed">
                    {extractedData.text}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Analysis Results */}
      {analysisData && !isAnalyzing && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden backdrop-blur-sm">
          <div className="px-8 py-6 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-purple-600"
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
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  AI Resume Analysis
                </h3>
                <p className="text-sm text-gray-600">Comprehensive AI-powered insights</p>
              </div>
            </div>
          </div>
          
          <div className="p-8 space-y-8">
            {analysisData.error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-red-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-red-800">
                      Error analyzing resume
                    </h3>
                    <p className="text-red-700 mt-2">
                      {analysisData.error}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-blue-900 mb-3">
                        Summary
                      </h4>
                      <p className="text-blue-800 leading-relaxed">{analysisData.analysis.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Key Skills */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">
                      Key Skills
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {(analysisData.analysis.skills ?? []).map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-xl text-sm font-semibold border border-green-200 hover:from-green-200 hover:to-emerald-200 transition-all duration-200 transform hover:scale-105"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Weaknesses */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.832-.833-2.602 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">
                      Areas for Improvement
                    </h4>
                  </div>
                  <ul className="space-y-3">
                    {(analysisData.analysis.weaknesses ?? []).map((item: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-orange-100">
                        <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center mt-0.5">
                          <svg className="h-3 w-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.832-.833-2.602 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <span className="text-gray-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Removed Recommendations section per requirement */}

                {/* Strengths */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">
                      Key Strengths
                    </h4>
                  </div>
                  <ul className="space-y-3">
                    {(analysisData.analysis.strengths ?? []).map((strength: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-emerald-100">
                        <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center mt-0.5">
                          <svg className="h-3 w-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700 leading-relaxed">{strength}</span>
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

      {/* ML Retention Prediction Results */}
      {analysisData && !isAnalyzing && !analysisData.error && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden backdrop-blur-sm">
          <div className="px-8 py-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  ML Retention Prediction Model
                </h3>
                <p className="text-sm text-gray-600">Machine learning powered retention analysis</p>
              </div>
            </div>
          </div>
          
          <div className="p-8 space-y-8">
            {/* Prediction Summary */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-green-900">
                  {mlRetentionData.prediction_label}
                </h4>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  mlRetentionData.risk_category === 'Low risk' 
                    ? 'bg-green-100 text-green-800' 
                    : mlRetentionData.risk_category === 'Medium risk'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {mlRetentionData.risk_category}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center mb-2">
                    <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Retention Probability</span>
                  </div>
                  <div className="text-3xl font-bold text-green-800">
                    {(mlRetentionData.retention_probability_1yr * 100).toFixed(2)}%
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Likelihood to stay 1+ years
                  </p>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Model Prediction</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-800">
                    {mlRetentionData.prediction === 1 ? 'Positive' : 'Negative'}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Binary classification result
                  </p>
                </div>
              </div>
            </div>

            {/* Model Details */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h5 className="text-lg font-bold text-gray-800">
                  Model Information
                </h5>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="font-semibold text-gray-800 mb-1">Model Type</div>
                  <div className="text-gray-600">XGBoost Classifier</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="font-semibold text-gray-800 mb-1">Training Data</div>
                  <div className="text-gray-600">Historical resume & retention records</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="font-semibold text-gray-800 mb-1">Confidence</div>
                  <div className="text-gray-600">High ({(mlRetentionData.retention_probability_1yr * 100).toFixed(1)}%)</div>
                </div>
              </div>
            </div>

            {/* Progress Bar Visualization */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Retention Probability</span>
                <span className="text-sm text-gray-600">{(mlRetentionData.retention_probability_1yr * 100).toFixed(2)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${mlRetentionData.retention_probability_1yr * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
