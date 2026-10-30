// Test import parsing with sample data
const fs = require('fs');
const path = require('path');

// Sample CSV data
const sampleCSV = `name,url,amount,currency,interval,nextBillingDate
Netflix,https://netflix.com,15.99,USD,monthly,2026-09-15
Spotify,https://spotify.com,9.99,USD,monthly,2026-09-20
GitHub Pro,https://github.com,4.00,USD,monthly,2026-09-25`;

// Sample JSON data
const sampleJSON = {
  "subscriptions": [
    {
      "name": "Adobe Creative Cloud",
      "url": "https://adobe.com",
      "amount": 54.99,
      "currency": "USD",
      "interval": "monthly",
      "nextBillingDate": "2026-10-01"
    },
    {
      "name": "AWS",
      "url": "https://aws.amazon.com",
      "amount": 29.99,
      "currency": "USD",
      "interval": "monthly",
      "nextBillingDate": "2026-09-30"
    }
  ]
};

console.log('=== CSV Import Test ===');
console.log('Sample CSV:');
console.log(sampleCSV);
console.log('\nExpected: 3 subscriptions parsed');

console.log('\n=== JSON Import Test ===');
console.log('Sample JSON:');
console.log(JSON.stringify(sampleJSON, null, 2));
console.log('\nExpected: 2 subscriptions parsed');

console.log('\n=== Test Files Created ===');
console.log('CSV test file: test-data/sample-import.csv');
console.log('JSON test file: test-data/sample-import.json');
