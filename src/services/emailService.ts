/**
 * Email Service
 * Handles Gmail integration for importing subscription receipts
 * Uses Gmail API with OAuth 2.0 authentication
 */

export interface GmailEmail {
  id: string;
  threadId: string;
  labels: string[];
  snippet: string;
  internalDate: string;
  payload: GmailMessagePart;
}

export interface GmailMessagePart {
  headers: GmailMessageHeader[];
  body?: {
    data: string;
    size: number;
  };
  parts?: GmailMessagePart[];
}

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailListResponse {
  messages: GmailEmail[];
  nextPageToken?: string;
}

export interface GmailQuery {
  query: string;
  maxResults?: number;
  pageToken?: string;
}

class EmailService {
  private oauthToken: string | null = null;
  private refreshToken: string | null = null;
  private clientId: string | null = null;
  private clientSecret: string | null = null;

  /**
   * Configure Gmail OAuth credentials
   */
  configure(credentials: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  }): void {
    this.clientId = credentials.clientId;
    this.clientSecret = credentials.clientSecret;
    this.refreshToken = credentials.refreshToken;
  }

  /**
   * Search for subscription receipt emails
   * Query: from:(service domains) subject:(receipt|payment|subscription|billing) after:(date)
   */
  async searchReceipts(
    query: string,
    maxResults: number = 100,
    pageToken?: string
  ): Promise<GmailListResponse> {
    // This would use the Gmail API in production
    // For prototype, we'll use a mock that demonstrates the flow
    return this._mockSearchReceipts(query, maxResults, pageToken);
  }

  /**
   * Get full email message by ID
   */
  async getMessage(messageId: string): Promise<GmailEmail | null> {
    // This would fetch from Gmail API in production
    return this._mockGetMessage(messageId);
  }

  /**
   * Parse Gmail message headers
   */
  parseMessageHeaders(message: GmailEmail): {
    from: string;
    to: string;
    subject: string;
    date: Date;
    messageId: string;
  } {
    const headers = message.payload.headers;
    
    const fromHeader = headers.find(h => h.name === 'From')?.value || '';
    const toHeader = headers.find(h => h.name === 'To')?.value || '';
    const subjectHeader = headers.find(h => h.name === 'Subject')?.value || '';
    const dateHeader = headers.find(h => h.name === 'Date')?.value || '';
    const messageIdHeader = headers.find(h => h.name === 'Message-ID')?.value || '';

    return {
      from: fromHeader,
      to: toHeader,
      subject: subjectHeader,
      date: new Date(dateHeader),
      messageId: messageIdHeader
    };
  }

  /**
   * Extract email body from Gmail message
   */
  extractBody(message: GmailEmail): string {
    return this._extractBodyRecursive(message.payload);
  }

  private _extractBodyRecursive(part: GmailMessagePart): string {
    // Check if this part has body content
    if (part.body && part.body.data) {
      // Decode base64 URL-encoded data
      const encoded = part.body.data;
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
      return decoded;
    }

    // Recursively check parts (for multipart messages)
    if (part.parts) {
      for (const childPart of part.parts) {
        const content = this._extractBodyRecursive(childPart);
        if (content) {
          return content;
        }
      }
    }

    return '';
  }

  /**
   * Build search query for subscription receipts
   */
  buildReceiptQuery(options: {
    services?: string[];
    startDate?: Date;
    endDate?: Date;
  } = {}): string {
    const { services, startDate, endDate } = options;

    const parts = ['(receipt OR payment OR subscription OR billing OR invoice OR charged)'];

    // Filter by service domains if specified
    if (services && services.length > 0) {
      const serviceDomains = services.map(s => `from:(${s.toLowerCase()})`).join(' OR ');
      parts.push(`(${serviceDomains})`);
    }

    // Date range filter
    if (startDate) {
      const dateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
      parts.push(`after:${dateStr}`);
    }

    if (endDate) {
      const dateStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
      parts.push(`before:${dateStr}`);
    }

    return parts.join(' AND ');
  }

  // ============================================
  // MOCK METHODS FOR PROTOTYPE DEMO
  // In production, replace with actual Gmail API calls
  // ============================================

  private async _mockSearchReceipts(
    query: string,
    maxResults: number = 100,
    pageToken?: string
  ): Promise<GmailListResponse> {
    // Simulated receipt emails for demo purposes
    const mockMessages: GmailEmail[] = [
      {
        id: '18c5a1b2e3f4g5h6',
        threadId: 'thread_netflix_001',
        labels: ['INBOX', 'IMPORTANT'],
        snippet: 'Your Netflix subscription - $15.49 - Receipt for your payment',
        internalDate: '1725148800000',
        payload: {
          headers: [
            { name: 'From', value: 'Netflix <info@netflix.com>' },
            { name: 'To', value: 'user@example.com' },
            { name: 'Subject', value: 'Receipt for your payment' },
            { name: 'Date', value: 'Mon, 02 Sep 2024 10:00:00 +0000' },
            { name: 'Message-ID', value: '<netflix-receipt-001@netflix.com>' },
          ],
          body: {
            data: Buffer.from(`
              Receipt for your payment
              
              Amount charged: $15.49 USD
              Next billing date: October 2, 2024
              
              Thank you for your subscription!
            `).toString('base64'),
            size: 150
          }
        }
      },
      {
        id: '28d6b2c3d4e5f6g7',
        threadId: 'thread_spotify_001',
        labels: ['INBOX'],
        snippet: 'Your Spotify subscription payment - Receipt',
        internalDate: '1725062400000',
        payload: {
          headers: [
            { name: 'From', value: 'Spotify AB <no-reply@spotify.com>' },
            { name: 'To', value: 'user@example.com' },
            { name: 'Subject', value: 'Receipt - Your Spotify Premium subscription' },
            { name: 'Date', value: 'Sun, 01 Sep 2024 14:30:00 +0000' },
            { name: 'Message-ID', value: '<spotify-receipt-001@spotify.com>' },
          ],
          body: {
            data: Buffer.from(`
              Payment Receipt
              
              Service: Spotify Premium Individual
              Amount: $10.99 USD
              Billing cycle: Monthly
              Next payment: October 1, 2024
            `).toString('base64'),
            size: 180
          }
        }
      },
      {
        id: '38e7c3d4e5f6g7h8',
        threadId: 'thread_amazon_001',
        labels: ['INBOX'],
        snippet: 'Amazon Prime renewal confirmation',
        internalDate: '1724976000000',
        payload: {
          headers: [
            { name: 'From', value: 'Amazon <auto-noreply@amazon.com>' },
            { name: 'To', value: 'user@example.com' },
            { name: 'Subject', value: 'Your Amazon Prime membership has been renewed' },
            { name: 'Date', value: 'Sat, 31 Aug 2024 09:15:00 +0000' },
            { name: 'Message-ID', value: '<amazon-prime-001@amazon.com>' },
          ],
          body: {
            data: Buffer.from(`
              Amazon Prime Renewal
              
              Your annual membership has been renewed.
              Amount: $139.00 USD
              Next renewal: August 31, 2025
              
              Thank you for being a member!
            `).toString('base64'),
            size: 200
          }
        }
      },
      {
        id: '48f8d4e5f6g7h8i9',
        threadId: 'thread_github_001',
        labels: ['INBOX'],
        snippet: 'GitHub Pro - Payment receipt',
        internalDate: '1724889600000',
        payload: {
          headers: [
            { name: 'From', value: 'GitHub <noreply@github.com>' },
            { name: 'To', value: 'user@example.com' },
            { name: 'Subject', value: 'Receipt for your GitHub Pro subscription' },
            { name: 'Date', value: 'Fri, 30 Aug 2024 16:45:00 +0000' },
            { name: 'Message-ID', value: '<github-pro-001@github.com>' },
          ],
          body: {
            data: Buffer.from(`
              GitHub Pro Subscription Receipt
              
              Plan: GitHub Pro
              Amount: $4.00 USD
              Billing period: Monthly
              Next billing: September 30, 2024
            `).toString('base64'),
            size: 160
          }
        }
      },
    ];

    // Filter by query (simple mock filtering)
    const filtered = mockMessages.filter(msg => {
      const queryLower = query.toLowerCase();
      const snippetLower = msg.snippet.toLowerCase();
      return snippetLower.includes(queryLower) || mockMessages.length === mockMessages.length;
    });

    return {
      messages: filtered.slice(0, maxResults),
      nextPageToken: filtered.length >= maxResults ? 'next_page_token' : undefined
    };
  }

  private async _mockGetMessage(messageId: string): Promise<GmailEmail | null> {
    // Return mock message based on ID
    const mockMessages = this._mockSearchReceipts('').then(r => r.messages);
    return null; // Simplified for prototype
  }
}

export const emailService = new EmailService();
export default emailService;
