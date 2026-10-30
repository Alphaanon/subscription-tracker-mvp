// Import utilities for CSV/JSON subscription data
import type { Subscription as MockSubscription } from './mock-data';

// Export a type alias for the subscription interface
export type Subscription = MockSubscription;

export interface ImportResult {
  success: boolean;
  imported: Subscription[];
  errors: string[];
  warnings: string[];
}

export interface RawSubscription {
  name: string;
  amount: string | number;
  currency?: string;
  billing_cycle: string;
  next_billing_date: string;
  email?: string;
}

// Validate billing cycle value
function isValidBillingCycle(cycle: string): cycle is 'weekly' | 'monthly' | 'yearly' {
  return ['weekly', 'monthly', 'yearly'].includes(cycle.toLowerCase());
}

// Parse and validate a single subscription record
export function parseSubscription(raw: RawSubscription, index: number): Subscription | null {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate name
  if (!raw.name || typeof raw.name !== 'string' || raw.name.trim().length === 0) {
    errors.push(`Row ${index + 1}: Missing or invalid subscription name`);
  }

  // Validate amount
  const amount = typeof raw.amount === 'string' ? raw.amount.trim() : raw.amount.toString();
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    errors.push(`Row ${index + 1}: Invalid amount '${raw.amount}'`);
  }

  // Validate billing cycle
  const billingCycle = raw.billing_cycle?.toLowerCase();
  if (!billingCycle || !isValidBillingCycle(billingCycle)) {
    errors.push(`Row ${index + 1}: Invalid billing cycle '${raw.billing_cycle}'. Must be weekly, monthly, or yearly`);
  }

  // Validate date
  if (!raw.next_billing_date) {
    errors.push(`Row ${index + 1}: Missing next billing date`);
  }

  if (errors.length > 0) {
    return null;
  }

  // Build validated subscription
  const now = new Date().toISOString();
  const subscription: Subscription = {
    id: crypto.randomUUID(),
    name: raw.name.trim(),
    amount: amountNum.toFixed(2),
    currency: raw.currency?.toUpperCase() || 'USD',
    billing_cycle: billingCycle as 'weekly' | 'monthly' | 'yearly',
    next_billing_date: raw.next_billing_date,
    email: raw.email?.trim() || 'imported@subscriptions.com',
    created_at: now,
    updated_at: now,
  };

  return subscription;
}

// Parse CSV content
export function parseCSV(content: string): ImportResult {
  const result: ImportResult = {
    success: false,
    imported: [],
    errors: [],
    warnings: [],
  };

  try {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      result.errors.push('CSV file must have a header row and at least one data row');
      return result;
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredFields = ['name', 'amount', 'billing_cycle', 'next_billing_date'];
    
    // Check for required fields
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    if (missingFields.length > 0) {
      result.errors.push(`Missing required columns: ${missingFields.join(', ')}`);
      return result;
    }

    // Get column indices
    const getIndex = (field: string) => headers.indexOf(field);

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      
      const rawSubscription: RawSubscription = {
        name: values[getIndex('name')] || '',
        amount: values[getIndex('amount')] || '',
        currency: values[headers.indexOf('currency')] || undefined,
        billing_cycle: values[getIndex('billing_cycle')] || '',
        next_billing_date: values[getIndex('next_billing_date')] || '',
        email: values[headers.indexOf('email')] || undefined,
      };

      const subscription = parseSubscription(rawSubscription, i);
      if (subscription) {
        result.imported.push(subscription);
      }
    }

    result.success = result.imported.length > 0;
    if (!result.success) {
      result.errors.push('No valid subscriptions could be imported');
    }

  } catch (err) {
    result.errors.push(`Error parsing CSV: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  return result;
}

// Parse JSON content
export function parseJSON(content: string): ImportResult {
  const result: ImportResult = {
    success: false,
    imported: [],
    errors: [],
    warnings: [],
  };

  try {
    const data = JSON.parse(content);
    
    // Handle both array format and object with subscriptions array
    let subscriptionsArray: RawSubscription[] = [];
    if (Array.isArray(data)) {
      subscriptionsArray = data;
    } else if (data && typeof data === 'object' && Array.isArray(data.subscriptions)) {
      subscriptionsArray = data.subscriptions;
    } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
      subscriptionsArray = data.data;
    } else {
      result.errors.push('JSON must be an array of subscriptions or an object with a "subscriptions" or "data" array');
      return result;
    }

    if (subscriptionsArray.length === 0) {
      result.errors.push('No subscriptions found in JSON file');
      return result;
    }

    // Parse each subscription
    subscriptionsArray.forEach((raw, index) => {
      if (!raw || typeof raw !== 'object') {
        result.errors.push(`Item ${index + 1}: Invalid subscription object`);
        return;
      }

      const subscription = parseSubscription(raw as RawSubscription, index);
      if (subscription) {
        result.imported.push(subscription);
      }
    });

    result.success = result.imported.length > 0;
    if (!result.success) {
      result.errors.push('No valid subscriptions could be imported');
    }

  } catch (err) {
    if (err instanceof SyntaxError) {
      result.errors.push(`Invalid JSON format: ${err.message}`);
    } else {
      result.errors.push(`Error parsing JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return result;
}

// Export sample CSV template
export function getCSVTemplate(): string {
  return `name,amount,billing_cycle,next_billing_date,currency,email
Netflix,15.49,monthly,2026-10-15,USD,netflix@billing.com
Spotify,9.99,monthly,2026-10-10,USD,spotify@billing.com
Adobe Creative Cloud,54.99,monthly,2026-10-20,USD,adobe@billing.com
GitHub Pro,4.00,monthly,2026-10-25,USD,github@billing.com`;
}

// Export sample JSON template
export function getJSONTemplate(): string {
  return JSON.stringify({
    subscriptions: [
      {
        name: 'Netflix',
        amount: 15.49,
        billing_cycle: 'monthly',
        next_billing_date: '2026-10-15',
        currency: 'USD',
        email: 'netflix@billing.com'
      },
      {
        name: 'Spotify',
        amount: 9.99,
        billing_cycle: 'monthly',
        next_billing_date: '2026-10-10',
        currency: 'USD',
        email: 'spotify@billing.com'
      },
      {
        name: 'Adobe Creative Cloud',
        amount: 54.99,
        billing_cycle: 'monthly',
        next_billing_date: '2026-10-20',
        currency: 'USD',
        email: 'adobe@billing.com'
      }
    ]
  }, null, 2);
}
