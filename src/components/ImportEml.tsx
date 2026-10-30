'use client';

import { useState, useRef } from 'react';
import { parseSubscriptionEmail } from '@/lib/email-parser';

interface Subscription {
  serviceName: string;
  amount: number;
  currency: string;
  billingDate: string;
  nextBillingDate: string;
  billingCycle: 'daily' | 'weekly' | 'monthly' | 'yearly';
  transactionId?: string;
  confidence: number;
}

interface ImportEmlProps {
  onImportSuccess: (subscriptions: Subscription[]) => void;
}

export default function ImportEml({ onImportSuccess }: ImportEmlProps) {
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [results, setResults] = useState<Subscription[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const parseEmlFile = async (file: File) => {
    if (!file.name.endsWith('.eml') && !file.name.endsWith('.html')) {
      setError('Please upload a valid .eml or .html file');
      return;
    }

    setParsing(true);
    setError(null);

    try {
      const text = await file.text();
      const parsed = parseSubscriptionEmail(text, file.name);

      if (parsed) {
        setResults([parsed]);
        onImportSuccess([parsed]);
      } else {
        setError('Could not parse subscription data from this email. The email may not be a subscription receipt.');
      }
    } catch (err) {
      setError(`Error parsing file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    setParsing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseEmlFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      parseEmlFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : error
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".eml,.html"
          className="hidden"
          onChange={handleChange}
        />

        <div className="space-y-4">
          <div className="text-4xl">📧</div>
          <div>
            <p className="text-lg font-semibold text-gray-700">Upload Subscription Email</p>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop your .eml or .html email receipt here,
            </p>
            <p className="text-sm text-gray-500">
              or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                browse files
              </button>
            </p>
          </div>

          {parsing && (
            <div className="text-sm text-blue-600">
              ⏳ Parsing email...
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600">
              ❌ {error}
            </div>
          )}
        </div>
      </div>

      {/* Parsed Results */}
      {results.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">
            ✅ Successfully Parsed!
          </h3>

          <div className="space-y-4">
            {results.map((sub, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-bold text-gray-800">{sub.serviceName}</h4>
                  <span className="text-2xl font-bold text-green-600">
                    ${sub.amount.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Billing Cycle:</span>
                    <p className="font-medium capitalize">{sub.billingCycle}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Billing Date:</span>
                    <p className="font-medium">{sub.billingDate}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Next Billing:</span>
                    <p className="font-medium">{sub.nextBillingDate || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Confidence:</span>
                    <p className="font-medium">{Math.round(sub.confidence * 100)}%</p>
                  </div>
                </div>

                {sub.transactionId && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-gray-500 text-sm">Transaction ID:</span>
                    <p className="font-mono text-sm">{sub.transactionId}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-green-700">
              Subscription data has been added to your dashboard!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
