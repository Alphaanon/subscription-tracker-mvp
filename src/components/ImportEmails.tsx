'use client';

import { useState } from 'react';
import { emailParser } from '@/services/emailParser';
import { emailService } from '@/services/emailService';

interface ImportEmailsProps {
  onClose: () => void;
  onImport: () => void;
}

export function ImportEmails({ onClose, onImport }: ImportEmailsProps) {
  const [importing, setImporting] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'netflix', 'spotify', 'amazon', 'apple', 'microsoft', 'adobe', 'github'
  ]);
  const [dateRange, setDateRange] = useState('30');
  const [importResults, setImportResults] = useState<{
    found: number;
    imported: number;
    failed: number;
  } | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setImportResults(null);

    try {
      // Build search query
      const query = emailService.buildReceiptQuery({
        services: selectedServices,
        startDate: new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
      });

      // Search for receipts (mock for prototype)
      const results = await emailService.searchReceipts(query, 50);

      // Parse found emails
      const parsedSubscriptions: any[] = [];
      const failedCount = 0;

      for (const email of results.messages) {
        const headers = emailService.parseMessageHeaders(email);
        const body = emailService.extractBody(email);

        const receiptEmail = {
          from: headers.from,
          subject: headers.subject,
          body: body,
          date: headers.date,
          messageId: headers.messageId,
          threadId: email.threadId
        };

        const parsed = emailParser.parseReceipt(receiptEmail);
        if (parsed && parsed.confidence >= 0.5) {
          parsedSubscriptions.push({
            ...parsed,
            email_thread_id: email.threadId,
            email_message_id: email.id
          });
        }
      }

      setImportResults({
        found: results.messages.length,
        imported: parsedSubscriptions.length,
        failed: failedCount
      });

      // In production, save to database here
      console.log('Imported subscriptions:', parsedSubscriptions);

    } catch (error) {
      console.error('Import failed:', error);
      setImportResults({
        found: 0,
        imported: 0,
        failed: 1
      });
    }

    setImporting(false);
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const services = [
    { id: 'netflix', name: 'Netflix', icon: 'N' },
    { id: 'spotify', name: 'Spotify', icon: 'S' },
    { id: 'amazon', name: 'Amazon', icon: 'A' },
    { id: 'apple', name: 'Apple', icon: '' },
    { id: 'microsoft', name: 'Microsoft', icon: 'M' },
    { id: 'adobe', name: 'Adobe', icon: 'A' },
    { id: 'github', name: 'GitHub', icon: 'G' },
    { id: 'slack', name: 'Slack', icon: 'S' },
    { id: 'dropbox', name: 'Dropbox', icon: 'D' },
    { id: 'zoom', name: 'Zoom', icon: 'Z' },
    { id: 'canva', name: 'Canva', icon: 'C' },
    { id: 'notion', name: 'Notion', icon: 'N' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Import from Email</h2>
            <p className="text-sm text-purple-300">Find subscription receipts in your inbox</p>
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
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Email Provider (coming soon)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Gmail
              </button>
              <button className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 3h22v18H1V3zm6.5 13.5l6-4.5-6-4.5v9z"/>
                </svg>
                Outlook (coming soon)
              </button>
            </div>
          </div>

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Subscription Services
            </label>
            <div className="grid grid-cols-3 gap-3">
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    selectedServices.includes(service.id)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg">{service.icon}</span>
                  {service.name}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Date Range
            </label>
            <div className="grid grid-cols-4 gap-3">
              {['7', '30', '90', 'all'].map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {range === 'all' ? 'All time' : `Last ${range} days`}
                </button>
              ))}
            </div>
          </div>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={importing || selectedServices.length === 0}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-3"
          >
            {importing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Searching emails...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16h10a2 2 0 002-2V4a2 2 0 00-2-2H3a2 2 0 00-2 2v10a2 2 0 002 2zm0 0h2m2 0h6m4 0h2M9 20v-6m0 0L6 17m3-3l3 3" />
                </svg>
                Import {selectedServices.length} Services
              </>
            )}
          </button>

          {/* Results */}
          {importResults && (
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <h3 className="font-medium text-white mb-3">Import Results</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{importResults.found}</p>
                  <p className="text-sm text-purple-300">Emails found</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">{importResults.imported}</p>
                  <p className="text-sm text-purple-300">Subscriptions imported</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">{importResults.failed}</p>
                  <p className="text-sm text-purple-300">Failed</p>
                </div>
              </div>
              
              {importResults.imported > 0 && (
                <button
                  onClick={() => {
                    onImport();
                    onClose();
                  }}
                  className="mt-4 w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  View Dashboard
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
