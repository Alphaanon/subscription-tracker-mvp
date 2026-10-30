/**
 * Test script for email receipt parser
 * 
 * This script reads sample HTML email receipts and tests the parser
 * to verify it correctly extracts subscription details.
 */

import { parseSubscriptionEmail } from '../src/lib/email-parser';
import * as fs from 'fs';
import * as path from 'path';

// Sample email data (mock Gmail/Outlook receipts)
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

/**
 * Read HTML file content
 */
function readEmailFile(filename: string): string {
  const emailPath = path.join(__dirname, '..', 'src', 'data', 'sample-emails', filename);
  return fs.readFileSync(emailPath, 'utf-8');
}

/**
 * Run parser tests
 */
function runTests() {
  console.log('='.repeat(60));
  console.log('EMAIL PARSER TEST RESULTS');
  console.log('='.repeat(60));
  
  const results = [];
  
  for (const email of sampleEmails) {
    console.log(`\nTesting: ${email.subject}`);
    console.log('-'.repeat(40));
    
    try {
      const htmlContent = readEmailFile(email.file);
      const parsed = parseSubscriptionEmail(htmlContent, email.subject);
      
      if (!parsed) {
        console.log('❌ FAILED: Parser returned null');
        results.push({
          test: email.subject,
          passed: false,
          error: 'Parser returned null',
        });
        continue;
      }
      
      console.log('Parsed Result:');
      console.log(JSON.stringify(parsed, null, 2));
      
      // Validate expected fields
      const checks = [
        {
          field: 'Service Name',
          expected: email.expected.serviceName,
          actual: parsed.serviceName,
          passed: parsed.serviceName === email.expected.serviceName,
        },
        {
          field: 'Amount',
          expected: email.expected.amount,
          actual: parsed.amount,
          passed: Math.abs(parsed.amount - email.expected.amount) < 0.01,
        },
        {
          field: 'Billing Cycle',
          expected: email.expected.billingCycle,
          actual: parsed.billingCycle,
          passed: parsed.billingCycle === email.expected.billingCycle,
        },
        {
          field: 'Billing Date',
          expected: email.expected.billingDate,
          actual: parsed.billingDate,
          passed: parsed.billingDate === email.expected.billingDate,
        },
        {
          field: 'Next Billing Date',
          expected: email.expected.nextBillingDate,
          actual: parsed.nextBillingDate,
          passed: parsed.nextBillingDate === email.expected.nextBillingDate,
        },
      ];
      
      let allPassed = true;
      for (const check of checks) {
        const status = check.passed ? '✅' : '❌';
        console.log(`${status} ${check.field}: ${check.actual} ${check.passed ? '' : `(expected: ${check.expected})`}`);
        if (!check.passed) allPassed = false;
      }
      
      console.log(`Confidence: ${(parsed.confidence * 100).toFixed(0)}%`);
      
      results.push({
        test: email.subject,
        passed: allPassed,
        parsed,
        checks,
      });
      
    } catch (error) {
      console.log(`❌ ERROR: ${(error as Error).message}`);
      results.push({
        test: email.subject,
        passed: false,
        error: (error as Error).message,
      });
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
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.test}: ${r.error || 'Field mismatches'}`);
    });
  }
  
  // Output JSON for verification
  console.log('\n' + '='.repeat(60));
  console.log('PARSED JSON OUTPUT (for record_verification)');
  console.log('='.repeat(60));
  console.log(JSON.stringify(results.map(r => ({
    testName: r.test,
    passed: r.passed,
    parsedData: r.parsed,
  })), null, 2));
  
  return results;
}

// Run tests
const testResults = runTests();

// Exit with appropriate code
process.exit(testResults.every(r => r.passed) ? 0 : 1);
