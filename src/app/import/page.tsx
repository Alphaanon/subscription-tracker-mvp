'use client';

import { useState } from 'react';
import ImportSubscriptions from '@/components/ImportSubscriptions';
import { Subscription } from '@/lib/import-utils';

export default function ImportPage() {
  const [importedData, setImportedData] = useState<Subscription[] | null>(null);

  const handleImportSuccess = (subscriptions: Subscription[]) => {
    setImportedData(subscriptions);
    console.log('Successfully imported subscriptions:', subscriptions);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Import Subscriptions</h1>
        
        <ImportSubscriptions onImportSuccess={handleImportSuccess} />
        
        {importedData && importedData.length > 0 && (
          <div className="mt-8 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <h2 className="text-xl font-semibold mb-2">✅ Import Successful!</h2>
            <p>Imported {importedData.length} subscription(s):</p>
            <ul className="mt-2 list-disc list-inside">
              {importedData.map((sub, index) => (
                <li key={index}>
                  {sub.name} - ${sub.amount} ({sub.billing_cycle})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
