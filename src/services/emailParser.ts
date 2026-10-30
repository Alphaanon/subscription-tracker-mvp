/**
 * Email Parser Service
 * Parses subscription receipts from Gmail/Outlook emails
 * Extracts: service name, amount, billing date, renewal date
 */

export interface ParsedSubscription {
  serviceName: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly' | 'weekly';
  billingDate: Date;
  renewalDate: Date;
  emailSnippet?: string;
  confidence: number; // 0-1 confidence score
}

export interface EmailReceipt {
  from: string;
  subject: string;
  body: string;
  date: Date;
  messageId?: string;
  threadId?: string;
}

class EmailParser {
  /**
   * Parse a single email receipt for subscription data
   */
  parseReceipt(email: EmailReceipt): ParsedSubscription | null {
    const { from, subject, body, date } = email;
    
    // Extract service name from sender or subject
    const serviceName = this.extractServiceName(from, subject);
    if (!serviceName) return null;

    // Extract amount and currency
    const amountMatch = this.extractAmount(body);
    if (!amountMatch) return null;

    const { amount, currency } = amountMatch;

    // Determine billing cycle
    const billingCycle = this.determineBillingCycle(subject, body, amount);

    // Calculate renewal date
    const renewalDate = this.calculateRenewalDate(date, billingCycle, body);

    // Calculate confidence score
    const confidence = this.calculateConfidence(subject, body, amountMatch, renewalDate);

    return {
      serviceName,
      amount,
      currency,
      billingCycle,
      billingDate: date,
      renewalDate: renewalDate || date,
      emailSnippet: body.substring(0, 500),
      confidence
    };
  }

  /**
   * Extract service name from sender email or subject
   */
  private extractServiceName(from: string, subject: string): string | null {
    // Common subscription services to recognize
    const servicePatterns = [
      { pattern: /netflix/i, name: 'Netflix' },
      { pattern: /spotify/i, name: 'Spotify' },
      { pattern: /amazon/i, name: 'Amazon' },
      { pattern: /apple/i, name: 'Apple' },
      { pattern: /microsoft/i, name: 'Microsoft' },
      { pattern: /adobe/i, name: 'Adobe' },
      { pattern: /linkedin/i, name: 'LinkedIn' },
      { pattern: /github/i, name: 'GitHub' },
      { pattern: /slack/i, name: 'Slack' },
      { pattern: /dropbox/i, name: 'Dropbox' },
      { pattern: /zoom/i, name: 'Zoom' },
      { pattern: /canva/i, name: 'Canva' },
      { pattern: /notion/i, name: 'Notion' },
      { pattern: /figma/i, name: 'Figma' },
      { pattern: /mailchimp/i, name: 'Mailchimp' },
      { pattern: /stripe/i, name: 'Stripe' },
      { pattern: /paypal/i, name: 'PayPal' },
      { pattern: /google/i, name: 'Google' },
      { pattern: /aws|amazon web/i, name: 'AWS' },
      { pattern: /cloudflare/i, name: 'Cloudflare' },
      { pattern: /medium/i, name: 'Medium' },
      { pattern: /new yorker/i, name: 'The New Yorker' },
      { pattern: /wired/i, name: 'Wired' },
      { pattern: /the verge/i, name: 'The Verge' },
    ];

    const textToSearch = `${from} ${subject}`.toLowerCase();

    for (const pattern of servicePatterns) {
      if (pattern.pattern.test(textToSearch)) {
        return pattern.name;
      }
    }

    // Try to extract from sender display name
    const fromMatch = from.match(/([^<@]+?)\s*</);
    if (fromMatch && fromMatch[1]) {
      return fromMatch[1].trim();
    }

    // Try to extract domain from email
    const domainMatch = from.match(/@([^@.]+\.[^.]+)/);
    if (domainMatch) {
      return domainMatch[1].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    return null;
  }

  /**
   * Extract amount and currency from email body
   */
  private extractAmount(body: string): { amount: number; currency: string } | null {
    // Common currency patterns
    const patterns = [
      // $19.99 or $19.99 USD
      /\$?(\d+(?:\.\d{2})?)\s*(?:USD|dollars|\$)/i,
      // £19.99 or GBP 19.99
      /£?(\d+(?:\.\d{2})?)\s*(?:GBP|pounds|£)/i,
      // €19.99 or EUR 19.99
      /€?(\d+(?:\.\d{2})?)\s*(?:EUR|euros|€)/i,
      // Generic amount with currency code
      /(\d+(?:\.\d{2})?)\s*(USD|EUR|GBP|CAD|AUD|JPY|CHF)/i,
      // Just a dollar amount
      /\$(\d+(?:\.\d{2})?)/,
    ];

    for (const pattern of patterns) {
      const match = body.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        let currency = 'USD';
        
        if (match[2]) {
          currency = match[2].toUpperCase();
        } else if (pattern.toString().includes('GBP') || pattern.toString().includes('£')) {
          currency = 'GBP';
        } else if (pattern.toString().includes('EUR') || pattern.toString().includes('€')) {
          currency = 'EUR';
        }

        return { amount, currency };
      }
    }

    return null;
  }

  /**
   * Determine billing cycle from email content
   */
  private determineBillingCycle(subject: string, body: string, amount: number): 'monthly' | 'yearly' | 'weekly' {
    const text = `${subject} ${body}`.toLowerCase();

    if (/yearly|annual|year/.test(text)) {
      return 'yearly';
    }
    if (/weekly|week/.test(text)) {
      return 'weekly';
    }
    if (/monthly|month|recurring/.test(text)) {
      return 'monthly';
    }

    // Infer from amount (heuristic)
    if (amount > 50) {
      return 'yearly';
    }
    if (amount < 10) {
      return 'monthly';
    }

    return 'monthly'; // Default
  }

  /**
   * Calculate renewal date based on billing date and cycle
   */
  private calculateRenewalDate(
    billingDate: Date,
    cycle: 'monthly' | 'yearly' | 'weekly',
    body: string
  ): Date | null {
    // Try to find explicit renewal date in email
    const renewalPatterns = [
      /renew(?:al)?\s*(?:on)?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /next\s*bill(?:ing)?\s*(?:on)?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*(?:renew|bill)/i,
    ];

    for (const pattern of renewalPatterns) {
      const match = body.match(pattern);
      if (match) {
        return this.parseDate(match[1]);
      }
    }

    // Calculate based on billing cycle
    const renewal = new Date(billingDate);

    switch (cycle) {
      case 'monthly':
        renewal.setMonth(renewal.getMonth() + 1);
        break;
      case 'yearly':
        renewal.setFullYear(renewal.getFullYear() + 1);
        break;
      case 'weekly':
        renewal.setDate(renewal.getDate() + 7);
        break;
    }

    return renewal;
  }

  /**
   * Parse date string to Date object
   */
  private parseDate(dateStr: string): Date {
    // Handle various date formats
    const parts = dateStr.split(/[\/\-]/).map(n => parseInt(n, 10));
    
    if (parts.length === 3) {
      const [month, day, year] = parts;
      // Assume MM/DD/YYYY format
      return new Date(year, month - 1, day);
    }

    return new Date(dateStr);
  }

  /**
   * Calculate confidence score (0-1)
   */
  private calculateConfidence(
    subject: string,
    body: string,
    amountMatch: { amount: number; currency: string },
    renewalDate: Date | null
  ): number {
    let score = 0;

    // Has amount
    score += 0.3;

    // Has renewal-related keywords
    if (/renew|bill|payment|receipt|subscription/i.test(subject + body)) {
      score += 0.2;
    }

    // Has explicit renewal date
    if (renewalDate) {
      score += 0.2;
    }

    // Has currency symbol
    if (body.match(/\$|£|€|USD|EUR|GBP/i)) {
      score += 0.1;
    }

    // Subject has payment/billing keywords
    if (/receipt|invoice|payment|subscription|billing/i.test(subject)) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Batch parse multiple emails
   */
  parseReceipts(emails: EmailReceipt[]): ParsedSubscription[] {
    const results: ParsedSubscription[] = [];

    for (const email of emails) {
      const parsed = this.parseReceipt(email);
      if (parsed && parsed.confidence >= 0.5) {
        results.push(parsed);
      }
    }

    return results;
  }
}

export const emailParser = new EmailParser();
export default emailParser;
