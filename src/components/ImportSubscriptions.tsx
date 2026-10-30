'use client';

import { useState, useRef } from 'react';
import { parseCSV, parseJSON, getCSVTemplate, getJSONTemplate } from '@/lib/import-utils';
import type { ImportResult } from '@/lib/import-utils';

import type { Subscription as ImportedSubscription } from '@/lib/import-utils';

interface ImportSubscriptionsProps {
  onImportSuccess: (subscriptions: ImportedSubscription[]) => void;
}

export default function ImportSubscriptions({ onImportSuccess }: ImportSubscriptionsProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [showTemplate, setShowTemplate] = useState<'csv' | 'json' | null>(null);
  const [pasteContent, setPasteContent] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processContent = (content: string, filename?: string) => {
    let result: ImportResult;

    if (filename && filename.endsWith('.csv')) {
      result = parseCSV(content);
    } else if (filename && filename.endsWith('.json')) {
      result = parseJSON(content);
    } else {
      // Try to auto-detect
      try {
        JSON.parse(content);
        result = parseJSON(content);
      } catch {
        result = parseCSV(content);
      }
    }

    return result;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const content = await file.text();
      const result = processContent(content, file.name);

      if (!result.success) {
        setImportError(result.errors.join('\n'));
        return;
      }

      // Call the success callback with imported subscriptions
      onImportSuccess(result.imported);
      setImportSuccess(`Successfully imported ${result.imported.length} subscription(s)`);

      // Log any warnings
      if (result.warnings.length > 0) {
        console.warn('Import warnings:', result.warnings);
      }

    } catch (err) {
      setImportError(`Error reading file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePasteImport = () => {
    if (!pasteContent.trim()) {
      setImportError('Please paste content into the text area above');
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const result = processContent(pasteContent);

      if (!result.success) {
        setImportError(result.errors.join('\n'));
        return;
      }

      // Call the success callback with imported subscriptions
      onImportSuccess(result.imported);
      setImportSuccess(`Successfully imported ${result.imported.length} subscription(s)`);

      // Log any warnings
      if (result.warnings.length > 0) {
        console.warn('Import warnings:', result.warnings);
      }

      setPasteContent('');
      setShowPasteArea(false);

    } catch (err) {
      setImportError(`Error parsing content: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = (type: 'csv' | 'json') => {
    const template = type === 'csv' ? getCSVTemplate() : getJSONTemplate();
    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscription_template.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowTemplate(null);
  };

  const copyTemplate = (type: 'csv' | 'json') => {
    const template = type === 'csv' ? getCSVTemplate() : getJSONTemplate();
    navigator.clipboard.writeText(template);
    setShowTemplate(null);
    setImportSuccess('Template copied to clipboard!');
    setTimeout(() => setImportSuccess(null), 3000);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Import Subscriptions</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplate('csv')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            CSV Template
          </button>
          <button
            onClick={() => setShowTemplate('json')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            JSON Template
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Import your subscriptions from a CSV or JSON file. Download a template to get started.
      </p>

      {/* Template Modal */}
      {showTemplate && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-900">
              {showTemplate === 'csv' ? 'CSV Template' : 'JSON Template'}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => copyTemplate(showTemplate)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Copy
              </button>
              <button
                onClick={() => handleDownloadTemplate(showTemplate)}
                className="text-xs text-green-600 hover:text-green-800"
              >
                Download
              </button>
            </div>
          </div>
          <pre className="text-xs bg-white p-3 rounded overflow-x-auto">
            {showTemplate === 'csv' ? getCSVTemplate() : getJSONTemplate()}
          </pre>
          <button
            onClick={() => setShowTemplate(null)}
            className="mt-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      )}

      {/* File Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isImporting}
        />
        
        {isImporting ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-sm text-gray-600">Importing...</p>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer"
          >
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">CSV or JSON files only</p>
          </button>
        )}
      </div>

      {/* Paste Alternative */}
      <div className="mt-4">
        <button
          onClick={() => setShowPasteArea(!showPasteArea)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showPasteArea ? 'Hide paste area' : 'Or paste content directly'}
        </button>
        
        {showPasteArea && (
          <div className="mt-2">
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder='Paste CSV or JSON content here...

Example CSV:
name,amount,billing_cycle,next_billing_date
Netflix,15.49,monthly,2026-10-01

Example JSON:
[
  {
    "name": "Netflix",
    "amount": 15.49,
    "billing_cycle": "monthly",
    "next_billing_date": "2026-10-01"
  }
]'
              className="w-full h-48 p-3 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handlePasteImport}
              disabled={isImporting || !pasteContent.trim()}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Importing...' : 'Import Pasted Content'}
            </button>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {importError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 whitespace-pre-line">{importError}</p>
        </div>
      )}

      {importSuccess && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{importSuccess}</p>
        </div>
      )}

      {/* Format Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Required Fields:</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>- <code>name</code> - Subscription name (e.g., "Netflix")</li>
          <li>- <code>amount</code> - Cost (e.g., 15.49)</li>
          <li>- <code>billing_cycle</code> - daily, weekly, monthly, or yearly</li>
          <li>- <code>next_billing_date</code> - Date in YYYY-MM-DD format</li>
        </ul>
        <h3 className="font-medium text-blue-900 mt-3 mb-2">Optional Fields:</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>- <code>currency</code> - Currency code (default: USD)</li>
          <li>- <code>email</code> - Billing email address</li>
        </ul>
      </div>
    </div>
  );
}
