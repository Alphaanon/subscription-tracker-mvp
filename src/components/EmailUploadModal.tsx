'use client';

import { useState, useCallback } from 'react';
import { emailParser, EmailReceipt } from '@/services/emailParser';

interface Subscription {
  name: string;
  amount: number;
  currency: string;
  nextBillingDate: string;
  billingCycle: string;
  sourceEmail: string;
  rawEmail?: string;
}

interface EmailUploadModalProps {
  onClose: () => void;
  onImport: (subscriptions: Subscription[]) => void;
}

export function EmailUploadModal({ onClose, onImport }: EmailUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [parsingStatus, setParsingStatus] = useState<'idle' | 'parsing' | 'complete' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Subscription[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processEmailFiles = async (files: FileList | File[]) => {
    setParsingStatus('parsing');
    setError(null);
    setPreviewData([]);
    setUploadProgress(0);

    try {
      const allSubscriptions: Subscription[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Skip non-email files
        if (!file.name.endsWith('.eml') && !file.name.endsWith('.msg')) {
          console.warn(`Skipping non-email file: ${file.name}`);
          continue;
        }

        // Read file as text
        const text = await file.text();
        
        // Parse email using existing email parser
        // Create a mock EmailReceipt object from the raw text
        const emailReceipt: EmailReceipt = {
          from: 'unknown@unknown.com',
          subject: file.name,
          body: text,
          date: new Date()
        };
        const parsedEmail = emailParser.parseReceipt(emailReceipt);
        
        // Extract subscription from parsed email (only if parsing was successful)
        if (parsedEmail && parsedEmail.confidence >= 0.5) {
          // Convert parsed email to subscription format
          const subscription: Subscription = {
            name: parsedEmail.serviceName || 'Unknown',
            amount: parsedEmail.amount || 0,
            currency: parsedEmail.currency || 'USD',
            nextBillingDate: parsedEmail.renewalDate.toISOString().split('T')[0],
            billingCycle: parsedEmail.billingCycle || 'monthly',
            sourceEmail: file.name,
            rawEmail: text
          };
          
          allSubscriptions.push(subscription);
        }

        // Update progress
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setPreviewData(allSubscriptions);
      setParsingStatus('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse emails');
      setParsingStatus('error');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processEmailFiles(files);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processEmailFiles(files);
    }
  };

  const handleConfirmImport = () => {
    onImport(previewData);
    onClose();
  };

  const handleReset = () => {
    setParsingStatus('idle');
    setError(null);
    setPreviewData([]);
    setUploadProgress(0);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Import Subscriptions from Email</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {parsingStatus === 'idle' && (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Drag and drop your email files here
              </h3>
              <p className="text-gray-500 mb-4">
                Support for .eml and .msg files
              </p>
              <label className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                <span>Or select files</span>
                <input
                  type="file"
                  accept=".eml,.msg"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {parsingStatus === 'parsing' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 mb-4">Parsing emails...</p>
              <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{uploadProgress}% complete</p>
            </div>
          )}

          {parsingStatus === 'error' && error && (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Parsing Failed</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {parsingStatus === 'complete' && (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-800 font-medium">
                    Successfully parsed {previewData.length} subscription{previewData.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Preview Table */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Preview</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Billing</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cycle</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.slice(0, 10).map((sub, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{sub.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {sub.currency} {sub.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{sub.nextBillingDate}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{sub.billingCycle}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 10 && (
                    <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500">
                      + {previewData.length - 10} more subscriptions
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Import {previewData.length} Subscriptions
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
