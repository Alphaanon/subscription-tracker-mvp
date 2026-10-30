'use client';

import { useState, useCallback } from 'react';
import { parseSubscriptionEmail } from '@/lib/email-parser';

interface EmlUploadProps {
  onParsed: (subscriptions: any[]) => void;
  onClose: () => void;
}

export function EmlUpload({ onParsed, onClose }: EmlUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedResults, setParsedResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const parseEmlFile = async (file: File) => {
    if (!file.name.endsWith('.eml')) {
      setError('Please upload a valid .eml file');
      return;
    }

    setParsing(true);
    setError(null);

    try {
      // Read the .eml file as text
      const text = await file.text();
      
      // Parse using the existing email parser
      // .eml files contain headers followed by body content
      const headerEnd = text.indexOf('\r\n\r\n');
      const headers = text.substring(0, headerEnd);
      const body = text.substring(headerEnd + 4);

      // Extract subject from headers
      const subjectMatch = headers.match(/Subject:\s*(.+)$/im);
      const subject = subjectMatch ? subjectMatch[1] : '';

      // Parse the subscription data from the email body
      const parsed = parseSubscriptionEmail(body, subject);

      if (parsed && parsed.confidence >= 0.5) {
        setParsedResults([parsed]);
        onParsed([parsed]);
      } else {
        setError('Could not parse subscription data from this email. Confidence too low.');
      }
    } catch (err) {
      setError(`Error parsing file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      parseEmlFile(file);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      parseEmlFile(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Import .eml File</h2>
            <p className="text-sm text-purple-300">Drag and drop or select an email file</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Drag and Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              dragActive
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-white/20 hover:border-white/40'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".eml"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={parsing}
            />
            
            {parsing ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-white font-medium">Parsing email...</p>
              </>
            ) : (
              <>
                <svg className="w-16 h-16 text-purple-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-white font-medium mb-1">Drop your .eml file here</p>
                <p className="text-sm text-white/60">or click to browse</p>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Results */}
          {parsedResults.length > 0 && (
            <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-xl">
              <h3 className="font-medium text-white mb-3">Successfully Parsed</h3>
              <div className="space-y-3">
                {parsedResults.map((result, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white">{result.serviceName}</span>
                      <span className="text-green-400 font-bold">${result.amount}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/60">Billing Date:</span>
                        <span className="text-white ml-2">{result.billingDate}</span>
                      </div>
                      <div>
                        <span className="text-white/60">Cycle:</span>
                        <span className="text-white ml-2 capitalize">{result.billingCycle}</span>
                      </div>
                      {result.nextBillingDate && (
                        <div>
                          <span className="text-white/60">Next Bill:</span>
                          <span className="text-white ml-2">{result.nextBillingDate}</span>
                        </div>
                      )}
                      {result.transactionId && (
                        <div>
                          <span className="text-white/60">Transaction:</span>
                          <span className="text-white ml-2">{result.transactionId}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <span className="text-xs text-white/60">Confidence: {(result.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={parsing}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            {parsedResults.length > 0 && (
              <button
                onClick={() => {
                  onParsed(parsedResults);
                  onClose();
                }}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Add to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
