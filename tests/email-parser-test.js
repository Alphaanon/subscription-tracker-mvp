/**
 * Email Parser Test - Plain JavaScript version
 * 
 * Reads sample HTML email receipts and tests the parser
 * to verify it correctly extracts subscription details.
 */

const fs = require('fs');
const path = require('path');

// Simplified DOMParser-like implementation for Node.js
class SimpleDOMParser {
  parseFromString(html, type) {
    // Very simple HTML parser for our test cases
    const doc = {
      body: { textContent: html },
      querySelector: (selector) => {
        const regex = new RegExp(`class=["'](?:[^"']*\\s)?${selector.replace('.', '')}[^"']*["']`, 'i');
        const match = html.match(regex);
        if (!match) return null;
        
        // Find content after the class attribute
        const afterMatch = html.substring(match.index);
        const contentMatch = afterMatch.match(/>([^<]+)</);
        return contentMatch ? { textContent: contentMatch[1].trim() } : null;
      },
      querySelectorAll: (selector) => {
        const results = [];
        const regex = new RegExp(`class=["'](?:[^"']*\\s)?${selector.replace('.', '')}[^"']*["']`, 'gi');
        let match;
        while ((match = regex.exec(html)) !== null) {
          const afterMatch = html.substring(match.index);
          const contentMatch = afterMatch.match(/>([^<]+)</);
          if (contentMatch) {
            results.push({ textContent: contentMatch[1].trim() });
          }
        }
        return results;
      }
    };
    
    // Add direct text content access
    doc.body.textContent = html.replace(/<[^>]*>/g, ' ').trim();
    
    return doc;
  }
}

/**
 * Parse HTML email content to extract subscription information
 */
function parseSubscriptionEmail(htmlContent, emailSubject = '') {
  const parser = new SimpleDOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  // Extract service name
  const serviceName = extractServiceName(htmlContent, emailSubject);
  
  // Extract amount
  const amountMatch = extractAmount(htmlContent);
  if (amountMatch === null) {
    return null;
  }
  
  // Extract billing dates
  const billingDate = extractDate(htmlContent, ['Billing Date', 'Invoice Date']);
  const nextBillingDate = extractDate(htmlContent, ['Next Billing Date', 'Next Bill', 'Renewal Date']);
  
  // Extract billing cycle
  const billingCycle = extractBillingCycle(htmlContent, emailSubject);
  
  // Extract transaction ID
  const transactionId = extractText(htmlContent, ['Transaction ID', 'Order ID']);
  
  // Calculate confidence
  const confidence = calculateConfidence(
    serviceName !== null,
    amountMatch !== null,
    billingDate !== null,
    billingCycle !== null
  );
  
  return {
    serviceName: serviceName || 'Unknown Service',
    amount: amountMatch,
    currency: 'USD',
    billingDate: billingDate || new Date().toISOString().split('T')[0],
    nextBillingDate: nextBillingDate || '',
    billingCycle: billingCycle || 'monthly',
    transactionId,
    confidence,
  };
}

function extractServiceName(html, subject) {
  const serviceMap = {
    'netflix': 'Netflix',
    'spotify': 'Spotify',
    'adobe': 'Adobe Creative Cloud',
    'amazon': 'Amazon Prime',
    'apple': 'Apple One',
  };
  
  const combined = (html + ' ' + subject).toLowerCase();
  
  for (const [key, name] of Object.entries(serviceMap)) {
    if (combined.includes(key)) {
      return name;
    }
  }
  
  return null;
}

function extractAmount(html) {
  // Look for amount patterns like "$15.49", "$9.99", etc.
  const amountPatterns = [
    /\$([\d,]+\.?\d*)\s*USD/,
    /\$([\d,]+\.?\d*)/,
    /Amount[\s\S]{0,100}?:?\s*\$([\d,]+\.?\d*)/,
  ];
  
  for (const pattern of amountPatterns) {
    const match = html.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      // Filter out unreasonable amounts (too small or too large)
      if (amount > 1 && amount < 1000) {
        return amount;
      }
    }
  }
  
  return null;
}

function extractDate(html, keywords) {
  const months = {
    'january': 0, 'february': 1, 'march': 2, 'april': 3,
    'may': 4, 'june': 5, 'july': 6, 'august': 7,
    'september': 8, 'october': 9, 'november': 10, 'december': 11,
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3,
    'jun': 5, 'jul': 6, 'aug': 7, 'sep': 8,
    'oct': 9, 'nov': 10, 'dec': 11,
  };
  
  // Find all dates in the HTML
  const monthDayPattern = /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/g;
  const allDates = [];
  let match;
  
  while ((match = monthDayPattern.exec(html)) !== null) {
    const monthName = match[1].toLowerCase();
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    if (months[monthName] !== undefined && day > 0 && day <= 31 && year >= 2020 && year <= 2030) {
      allDates.push({
        date: new Date(year, months[monthName], day),
        dateString: match[0],
        index: match.index
      });
    }
  }
  
  // For "Next Billing Date" keywords, return the second date (or latest)
  const isNextBilling = keywords.some(k => k.toLowerCase().includes('next') || k.toLowerCase().includes('renewal'));
  
  if (isNextBilling && allDates.length >= 2) {
    // Return the second date found (should be next billing)
    return allDates[1].date.toISOString().split('T')[0];
  }
  
  // For regular billing date, return the first date
  if (allDates.length > 0) {
    return allDates[0].date.toISOString().split('T')[0];
  }
  
  return null;
}

function extractBillingCycle(html, subject) {
  const combined = (html + ' ' + subject).toLowerCase();
  
  if (combined.includes('yearly') || combined.includes('annual')) return 'yearly';
  if (combined.includes('monthly') || combined.includes('month')) return 'monthly';
  if (combined.includes('weekly') || combined.includes('week')) return 'weekly';
  if (combined.includes('daily') || combined.includes('day')) return 'daily';
  
  return 'monthly'; // Default
}

function extractText(html, keywords) {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[\\s\\S]{0,50}?:?\\s*([A-Za-z0-9\\-]+)`, 'i');
    const match = html.match(regex);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

function calculateConfidence(hasService, hasAmount, hasDate, hasCycle) {
  let score = 0;
  if (hasService) score += 0.3;
  if (hasAmount) score += 0.4;
  if (hasDate) score += 0.2;
  if (hasCycle) score += 0.1;
  return Math.round(score * 100) / 100;
}

// Sample email data
const sampleEmails = [
  {
    subject: 'Receipt for Your Subscription - Netflix',
    file: 'netflix-receipt.html',
    expected: {
      serviceName: 'Netflix',
      amount: 15.49,
      billingCycle: 'monthly',
      billingDate: '2026-09-05',
      nextBillingDate: '2026-10-05',
    },
  },
  {
    subject: 'Spotify - Payment Receipt',
    file: 'spotify-receipt.html',
    expected: {
      serviceName: 'Spotify',
      amount: 9.99,
      billingCycle: 'monthly',
      billingDate: '2026-09-08',
      nextBillingDate: '2026-10-08',
    },
  },
  {
    subject: 'Adobe Creative Cloud - Receipt',
    file: 'adobe-receipt.html',
    expected: {
      serviceName: 'Adobe Creative Cloud',
      amount: 52.99,
      billingCycle: 'monthly',
      billingDate: '2026-09-15',
      nextBillingDate: '2026-10-15',
    },
  },
];

// Run tests
console.log('='.repeat(60));
console.log('EMAIL PARSER TEST RESULTS');
console.log('='.repeat(60));

const results = [];

for (const email of sampleEmails) {
  console.log(`\nTesting: ${email.subject}`);
  console.log('-'.repeat(40));
  
  try {
    const filePath = path.join(__dirname, '..', 'src', 'data', 'sample-emails', email.file);
    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseSubscriptionEmail(htmlContent, email.subject);
    
    if (!parsed) {
      console.log('❌ FAILED: Parser returned null');
      results.push({ testName: email.subject, passed: false, error: 'Parser returned null' });
      continue;
    }
    
    console.log('Parsed Result:');
    console.log(JSON.stringify(parsed, null, 2));
    
    // Validate
    const checks = [
      { field: 'Service Name', expected: email.expected.serviceName, actual: parsed.serviceName, passed: parsed.serviceName === email.expected.serviceName },
      { field: 'Amount', expected: email.expected.amount, actual: parsed.amount, passed: Math.abs(parsed.amount - email.expected.amount) < 0.01 },
      { field: 'Billing Cycle', expected: email.expected.billingCycle, actual: parsed.billingCycle, passed: parsed.billingCycle === email.expected.billingCycle },
      { field: 'Billing Date', expected: email.expected.billingDate, actual: parsed.billingDate, passed: parsed.billingDate === email.expected.billingDate },
      { field: 'Next Billing Date', expected: email.expected.nextBillingDate, actual: parsed.nextBillingDate, passed: parsed.nextBillingDate === email.expected.nextBillingDate },
    ];
    
    let allPassed = true;
    for (const check of checks) {
      const status = check.passed ? '✅' : '❌';
      console.log(`${status} ${check.field}: ${check.actual} ${check.passed ? '' : `(expected: ${check.expected})`}`);
      if (!check.passed) allPassed = false;
    }
    
    console.log(`Confidence: ${(parsed.confidence * 100).toFixed(0)}%`);
    
    results.push({ testName: email.subject, passed: allPassed, parsed });
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    results.push({ testName: email.subject, passed: false, error: error.message });
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));

const passedCount = results.filter(r => r.passed).length;
const totalCount = results.length;

console.log(`\nPassed: ${passedCount}/${totalCount}`);
console.log(`Success Rate: ${((passedCount / totalCount) * 100).toFixed(0)}%`);

if (passedCount === totalCount) {
  console.log('\n✅ ALL TESTS PASSED');
} else {
  console.log('\n❌ SOME TESTS FAILED');
}

// Output JSON for verification
console.log('\n' + '='.repeat(60));
console.log('PARSED JSON OUTPUT (for record_verification)');
console.log('='.repeat(60));
console.log(JSON.stringify(results.map(r => ({
  testName: r.testName,
  passed: r.passed,
  parsedData: r.parsed,
})), null, 2));

process.exit(passedCount === totalCount ? 0 : 1);
