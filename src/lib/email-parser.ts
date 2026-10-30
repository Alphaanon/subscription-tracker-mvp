/**
 * Email Receipt Parser for Subscription Detection
 * 
 * Parses HTML email receipts to extract subscription details:
 * - Service name
 * - Amount charged
 * - Billing date
 * - Billing cycle
 * - Next billing date
 */

interface ParsedSubscription {
  serviceName: string;
  amount: number;
  currency: string;
  billingDate: string; // ISO date string
  nextBillingDate: string; // ISO date string
  billingCycle: 'daily' | 'weekly' | 'monthly' | 'yearly';
  transactionId?: string;
  confidence: number; // 0-1 confidence score
}

interface DateParseResult {
  date: Date | null;
  confidence: number;
}

/**
 * Parse HTML email content to extract subscription information
 */
export function parseSubscriptionEmail(
  htmlContent: string,
  emailSubject: string = ''
): ParsedSubscription | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  // Extract service name from various sources
  const serviceName = extractServiceName(doc, emailSubject);
  
  // Extract amount
  const amountMatch = extractAmount(doc);
  if (!amountMatch) {
    return null;
  }
  
  // Extract billing dates
  const billingDate = extractDate(doc, ['Billing Date', 'Invoice Date', 'Date']);
  const nextBillingDate = extractDate(doc, ['Next Billing Date', 'Renewal Date', 'Next Bill']);
  
  // Extract billing cycle
  const billingCycle = extractBillingCycle(doc, emailSubject);
  
  // Extract transaction ID if present
  const transactionId = extractText(doc, ['Transaction ID', 'Order ID', 'Receipt #']);
  
  // Calculate confidence based on how many fields we found
  const confidence = calculateConfidence(
    serviceName !== null,
    amountMatch !== null,
    billingDate !== null,
    billingCycle !== null
  );
  
  // Calculate nextBillingDate: use explicit date if found, otherwise calculate from billingDate + cycle
  const billingDateString = billingDate?.date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
  let nextBillingDateString = nextBillingDate?.date?.toISOString().split('T')[0] || '';
  
  // If no explicit next billing date, calculate it based on billing cycle
  if (!nextBillingDateString && billingDateString) {
    const baseDate = new Date(billingDateString);
    const cycle = billingCycle || 'monthly';
    
    switch (cycle) {
      case 'daily':
        baseDate.setDate(baseDate.getDate() + 1);
        break;
      case 'weekly':
        baseDate.setDate(baseDate.getDate() + 7);
        break;
      case 'monthly':
        baseDate.setMonth(baseDate.getMonth() + 1);
        break;
      case 'yearly':
        baseDate.setFullYear(baseDate.getFullYear() + 1);
        break;
    }
    
    nextBillingDateString = baseDate.toISOString().split('T')[0];
  }
  
  return {
    serviceName: serviceName || 'Unknown Service',
    amount: amountMatch,
    currency: 'USD', // Default, can be extracted more intelligently
    billingDate: billingDateString,
    nextBillingDate: nextBillingDateString,
    billingCycle: billingCycle || 'monthly',
    transactionId: transactionId || undefined,
    confidence,
  };
}

/**
 * Extract service name from email content
 */
function extractServiceName(doc: Document, subject: string): string | null {
  // Try common logo/header locations
  const selectors = [
    '.header', '.logo', '.brand', 'h1', 'h2',
    '[class*="logo"]', '[class*="header"]',
  ];
  
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element) {
      const text = element.textContent?.trim().toLowerCase();
      if (text) {
        // Map to canonical service names
        const serviceMap: Record<string, string> = {
          'netflix': 'Netflix',
          'spotify': 'Spotify',
          'adobe': 'Adobe Creative Cloud',
          'amazon': 'Amazon Prime',
          'apple': 'Apple One',
          'microsoft': 'Microsoft 365',
          'google': 'Google One',
          'aws': 'Amazon Web Services',
          'dropbox': 'Dropbox',
          'slack': 'Slack',
          'zoom': 'Zoom',
          'notion': 'Notion',
          'figma': 'Figma',
          'github': 'GitHub',
          'linear': 'Linear',
        };
        
        for (const [key, name] of Object.entries(serviceMap)) {
          if (text.includes(key)) {
            return name;
          }
        }
        
        // Fallback: return the text as-is
        return element.textContent?.trim();
      }
    }
  }
  
  // Try subject line
  const subjectLower = subject.toLowerCase();
  const subjectServices = ['netflix', 'spotify', 'adobe', 'amazon', 'apple', 'microsoft', 'google', 'aws', 'dropbox', 'slack', 'zoom'];
  for (const service of subjectServices) {
    if (subjectLower.includes(service)) {
      return service.charAt(0).toUpperCase() + service.slice(1);
    }
  }
  
  return null;
}

/**
 * Extract monetary amount from email
 */
function extractAmount(doc: Document): number | null {
  // Look for amount patterns in various contexts
  const amountContexts = [
    '.amount', '.total', '.price', '.cost',
    '[class*="amount"]', '[class*="price"]',
    '[class*="total"]', '[class*="cost"]',
  ];
  
  for (const selector of amountContexts) {
    const element = doc.querySelector(selector);
    if (element) {
      const text = element.textContent || '';
      const match = text.match(/[\$€£]?\s*([\d,]+\.?\d*)/);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
  }
  
  // Try searching by label
  const labelSelectors = [
    'Amount Charged', 'Total Amount', 'Price', 'Cost',
    'Subscription Fee', 'Monthly Fee', 'Yearly Fee',
  ];
  
  for (const label of labelSelectors) {
    const labelElement = Array.from(doc.querySelectorAll('*'))
      .find(el => (el.textContent || '').includes(label));
    
    if (labelElement) {
      // Look for amount near this label
      const amountElements = Array.from(labelElement.querySelectorAll('*'))
        .filter(el => el.textContent && /\$[\d,]+\.?\d*/.test(el.textContent || ''));
      
      for (const amountEl of amountElements) {
        const match = (amountEl.textContent || '').match(/[\$€£]?\s*([\d,]+\.?\d*)/);
        if (match) {
          return parseFloat(match[1].replace(/,/g, ''));
        }
      }
    }
  }
  
  return null;
}

/**
 * Extract date from email based on label keywords
 */
function extractDate(doc: Document, keywords: string[]): DateParseResult | null {
  for (const keyword of keywords) {
    // Find elements containing the keyword
    const labelElements = Array.from(doc.querySelectorAll('*'))
      .filter(el => {
        const text = (el.textContent || '').toLowerCase();
        return text.includes(keyword.toLowerCase());
      });
    
    for (const labelEl of labelElements) {
      // Look for date patterns in child elements or nearby
      const dateElements = [
        ...labelEl.querySelectorAll('*'),
        ...Array.from(labelEl.parentElement?.querySelectorAll('*') || []),
      ];
      
      for (const dateEl of dateElements) {
        const text = dateEl.textContent || '';
        const dateMatch = parseDateText(text);
        if (dateMatch) {
          return dateMatch;
        }
      }
      
      // Try to extract date from sibling text
      const textContent = labelEl.textContent || '';
      const dateMatch = parseDateText(textContent);
      if (dateMatch) {
        return dateMatch;
      }
    }
  }
  
  return null;
}

/**
 * Parse date from text string
 */
function parseDateText(text: string): DateParseResult | null {
  // Month names mapping
  const months: Record<string, number> = {
    'january': 0, 'february': 1, 'march': 2, 'april': 3,
    'may': 4, 'june': 5, 'july': 6, 'august': 7,
    'september': 8, 'october': 9, 'november': 10, 'december': 11,
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3,
    'jun': 5, 'jul': 6, 'aug': 7, 'sep': 8,
    'oct': 9, 'nov': 10, 'dec': 11,
  };
  
  // Pattern: Month Day, Year (e.g., "September 5, 2026")
  const monthDayPattern = /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/;
  const match = text.match(monthDayPattern);
  
  if (match) {
    const monthName = match[1].toLowerCase();
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    if (months[monthName] !== undefined && day > 0 && day <= 31 && year >= 2020 && year <= 2030) {
      return {
        date: new Date(year, months[monthName], day),
        confidence: 0.95,
      };
    }
  }
  
  // Pattern: MM/DD/YYYY or DD/MM/YYYY
  const numericDatePattern = /(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/;
  const numericMatch = text.match(numericDatePattern);
  
  if (numericMatch) {
    const possibleMonth = parseInt(numericMatch[1], 10);
    const possibleDay = parseInt(numericMatch[2], 10);
    const year = parseInt(numericMatch[3], 10);
    
    // Try US format first (MM/DD/YYYY)
    if (possibleMonth >= 1 && possibleMonth <= 12 && possibleDay >= 1 && possibleDay <= 31) {
      return {
        date: new Date(year, possibleMonth - 1, possibleDay),
        confidence: 0.85,
      };
    }
  }
  
  return null;
}

/**
 * Extract billing cycle from email
 */
function extractBillingCycle(doc: Document, subject: string): 'daily' | 'weekly' | 'monthly' | 'yearly' | null {
  const text = doc.body?.textContent?.toLowerCase() || '';
  const subjectLower = subject.toLowerCase();
  const combined = text + ' ' + subjectLower;
  
  if (combined.includes('yearly') || combined.includes('annual') || combined.includes('year')) {
    return 'yearly';
  }
  if (combined.includes('monthly') || combined.includes('month')) {
    return 'monthly';
  }
  if (combined.includes('weekly') || combined.includes('week')) {
    return 'weekly';
  }
  if (combined.includes('daily') || combined.includes('day')) {
    return 'daily';
  }
  
  // Look for cycle indicators in structured elements
  const cycleSelectors = ['[class*="cycle"]', '[class*="billing"]', '.billing-cycle', '.frequency'];
  for (const selector of cycleSelectors) {
    const element = doc.querySelector(selector);
    if (element) {
      const elText = element.textContent?.toLowerCase() || '';
      if (elText.includes('year') || elText.includes('annual')) return 'yearly';
      if (elText.includes('month')) return 'monthly';
      if (elText.includes('week')) return 'weekly';
      if (elText.includes('day')) return 'daily';
    }
  }
  
  return null;
}

/**
 * Extract text by label keyword
 */
function extractText(doc: Document, keywords: string[]): string | null {
  for (const keyword of keywords) {
    const labelElements = Array.from(doc.querySelectorAll('*'))
      .filter(el => (el.textContent || '').toLowerCase().includes(keyword.toLowerCase()));
    
    for (const labelEl of labelElements) {
      // Look for text after the label (often in a sibling or next element)
      const textContent = labelEl.textContent || '';
      
      // Remove the label and trim
      const afterLabel = textContent
        .replace(new RegExp(keyword, 'i'), '')
        .replace(/[:\s]+/g, ' ')
        .trim();
      
      if (afterLabel && afterLabel.length < 100) { // Avoid extracting large blocks
        return afterLabel;
      }
    }
  }
  
  return null;
}

/**
 * Calculate confidence score based on fields found
 */
function calculateConfidence(
  hasService: boolean,
  hasAmount: boolean,
  hasDate: boolean,
  hasCycle: boolean
): number {
  const weights = {
    hasService: 0.3,
    hasAmount: 0.4,
    hasDate: 0.2,
    hasCycle: 0.1,
  };
  
  let score = 0;
  if (hasService) score += weights.hasService;
  if (hasAmount) score += weights.hasAmount;
  if (hasDate) score += weights.hasDate;
  if (hasCycle) score += weights.hasCycle;
  
  return Math.round(score * 100) / 100;
}

/**
 * Parse multiple emails and return all detected subscriptions
 */
export function parseMultipleEmails(
  emails: Array<{ subject: string; html: string }>
): ParsedSubscription[] {
  const results: ParsedSubscription[] = [];
  
  for (const email of emails) {
    const parsed = parseSubscriptionEmail(email.html, email.subject);
    if (parsed && parsed.confidence > 0.5) {
      results.push(parsed);
    }
  }
  
  return results;
}
