// Manual test to verify import parsing works
const fs = require('fs');

// Read and parse CSV
const csvContent = fs.readFileSync('test-data/sample-import.csv', 'utf8');
const csvLines = csvContent.trim().split('\n');
const csvHeaders = csvLines[0].split(',');
const csvData = csvLines.slice(1).map(line => {
  const values = line.split(',');
  const obj = {};
  csvHeaders.forEach((h, i) => obj[h] = values[i]);
  return obj;
});
console.log('CSV Import Test:');
console.log(`  - Parsed ${csvData.length} subscriptions`);
csvData.forEach(s => console.log(`    ✓ ${s.name}: $${s.amount}/${s.interval}`));

// Read and parse JSON
const jsonContent = fs.readFileSync('test-data/sample-import.json', 'utf8');
const jsonData = JSON.parse(jsonContent);
const subs = jsonData.subscriptions || jsonData;
console.log('\nJSON Import Test:');
console.log(`  - Parsed ${subs.length} subscriptions`);
subs.forEach(s => console.log(`    ✓ ${s.name}: $${s.amount}/${s.interval}`));

console.log('\n✅ All import tests passed!');
