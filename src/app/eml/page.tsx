'use client';

import { useState } from 'react';
import { ImportEmails } from '@/components/ImportEmails';

export default function EmlImportPage() {
  const [showImport, setShowImport] = useState(false);

  const handleImport = () => {
    setShowImport(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Import .eml Files</h1>
        <p className="text-gray-600 mb-8">
          Upload .eml email files to extract subscription information automatically.
        </p>

        <button
          onClick={() => setShowImport(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Import .eml File
        </button>

        {showImport && (
          <ImportEmails onClose={() => setShowImport(false)} onImport={handleImport} />
        )}
      </div>
    </div>
  );
}
