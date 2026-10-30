/**
 * OAuth Service for Gmail and Outlook Email Integration
 * 
 * Provides OAuth 2.0 authentication flows for Gmail and Outlook APIs
 * to fetch user emails for subscription tracking.
 * 
 * Mock mode enabled for standalone demo/development without OAuth credentials.
 * Real OAuth credentials can be configured via environment variables.
 */

export interface OAuthProvider {
  provider: 'gmail' | 'outlook';
  authUrl: string;
  scopes: string[];
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  htmlBody?: string;
  labels?: string[];
}

class OAuthService {
  private mockMode: boolean;
  private gmailConfig: OAuthProvider | null = null;
  private outlookConfig: OAuthProvider | null = null;

  constructor() {
    // Auto-detect mock mode when credentials are missing
    const hasGmailCredentials = 
      process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID && 
      process.env.NEXT_PUBLIC_GMAIL_CLIENT_SECRET;
    
    const hasOutlookCredentials = 
      process.env.NEXT_PUBLIC_OUTLOOK_CLIENT_ID && 
      process.env.NEXT_PUBLIC_OUTLOOK_CLIENT_SECRET;
    
    this.mockMode = !(hasGmailCredentials || hasOutlookCredentials);
    
    if (this.mockMode) {
      console.log('OAuth Service: Running in MOCK MODE - no credentials configured');
    }
    
    this.initializeConfig();
  }

  private initializeConfig(): void {
    // Initialize Gmail OAuth config if credentials exist
    if (process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID) {
      this.gmailConfig = {
        provider: 'gmail',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
        ],
        clientId: process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
        clientSecret: process.env.NEXT_PUBLIC_GMAIL_CLIENT_SECRET || '',
        redirectUri: process.env.NEXT_PUBLIC_GMAIL_REDIRECT_URI || 
          'http://localhost:3000/api/auth/gmail/callback',
      };
    }

    // Initialize Outlook OAuth config if credentials exist
    if (process.env.NEXT_PUBLIC_OUTLOOK_CLIENT_ID) {
      this.outlookConfig = {
        provider: 'outlook',
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        scopes: [
          'Mail.Read',
        ],
        clientId: process.env.NEXT_PUBLIC_OUTLOOK_CLIENT_ID,
        clientSecret: process.env.NEXT_PUBLIC_OUTLOOK_CLIENT_SECRET || '',
        redirectUri: process.env.NEXT_PUBLIC_OUTLOOK_REDIRECT_URI || 
          'http://localhost:3000/api/auth/outlook/callback',
      };
    }
  }

  /**
   * Check if service is running in mock mode
   */
  isMockMode(): boolean {
    return this.mockMode;
  }

  /**
   * Get OAuth authorization URL for provider
   */
  async getAuthUrl(provider: 'gmail' | 'outlook'): Promise<string> {
    if (this.mockMode) {
      // Return mock auth URL that redirects to demo flow
      return this.getMockAuthUrl(provider);
    }

    const config = provider === 'gmail' ? this.gmailConfig : this.outlookConfig;
    if (!config) {
      throw new Error(`OAuth configuration not found for ${provider}`);
    }

    const state = this.generateState();
    const codeVerifier = this.generateCodeVerifier();
    
    // Store code verifier in sessionStorage for PKCE flow
    sessionStorage.setItem(`${provider}_code_verifier`, codeVerifier);

    const providerParams = await this.getProviderSpecificParams(provider, codeVerifier);
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent',
      ...providerParams,
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  private getMockAuthUrl(provider: 'gmail' | 'outlook'): string {
    // In mock mode, return a URL that triggers demo flow
    const state = this.generateState();
    const params = new URLSearchParams({
      provider,
      mode: 'mock',
      state,
    });
    return `/api/auth/${provider}/mock?${params.toString()}`;
  }

  private async getProviderSpecificParams(
    provider: 'gmail' | 'outlook', 
    codeVerifier: string
  ): Promise<Record<string, string>> {
    if (provider === 'gmail') {
      // Gmail uses PKCE for public clients
      return {
        code_challenge: await this.sha256(codeVerifier),
        code_challenge_method: 'S256',
      };
    } else {
      // Outlook/Microsoft uses PKCE
      return {
        code_challenge: await this.sha256(codeVerifier),
        code_challenge_method: 'S256',
      };
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(provider: 'gmail' | 'outlook', code: string): Promise<OAuthTokens> {
    if (this.mockMode) {
      // Return mock tokens for demo
      return this.getMockTokens(provider);
    }

    const config = provider === 'gmail' ? this.gmailConfig : this.outlookConfig;
    if (!config) {
      throw new Error(`OAuth configuration not found for ${provider}`);
    }

    const codeVerifier = sessionStorage.getItem(`${provider}_code_verifier`);
    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }

    const tokenUrl = provider === 'gmail' 
      ? 'https://oauth2.googleapis.com/token'
      : 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const tokens: OAuthTokens = await response.json();
    
    // Store tokens securely
    this.storeTokens(provider, tokens);
    
    return tokens;
  }

  /**
   * Get emails from authenticated account
   */
  async getEmails(
    provider: 'gmail' | 'outlook',
    maxResults: number = 50,
    query: string = ''
  ): Promise<EmailMessage[]> {
    if (this.mockMode) {
      // Return mock emails for demo/development
      return this.getMockEmails(provider);
    }

    const tokens = this.getTokens(provider);
    if (!tokens?.accessToken) {
      throw new Error('No valid access token found');
    }

    if (provider === 'gmail') {
      return this.fetchGmailEmails(tokens.accessToken, maxResults, query);
    } else {
      return this.fetchOutlookEmails(tokens.accessToken, maxResults, query);
    }
  }

  private async fetchGmailEmails(
    accessToken: string,
    maxResults: number,
    query: string
  ): Promise<EmailMessage[]> {
    const url = `https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${query ? `&q=${encodeURIComponent(query)}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`);
    }

    const data = await response.json();
    const messages = data.messages || [];

    // Fetch full message details
    const emails: EmailMessage[] = await Promise.all(
      messages.map(async (msg: any) => {
        const detailResponse = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );
        
        if (!detailResponse.ok) return null;
        
        const detail = await detailResponse.json();
        return this.parseGmailMessage(detail);
      })
    );

    return emails.filter((email): email is EmailMessage => email !== null);
  }

  private async fetchOutlookEmails(
    accessToken: string,
    maxResults: number,
    query: string
  ): Promise<EmailMessage[]> {
    const url = `https://graph.microsoft.com/v1.0/me/messages?$top=${maxResults}${query ? `&$search="${query}"` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }

    const data = await response.json();
    const value = data.value || [];

    return value.map((msg: any) => this.parseOutlookMessage(msg));
  }

  private parseGmailMessage(message: any): EmailMessage {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) => 
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    // Get raw body for parsing
    let body = '';
    if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString();
    }

    return {
      id: message.id,
      subject: getHeader('Subject'),
      from: getHeader('From'),
      to: getHeader('To'),
      date: getHeader('Date'),
      body,
      htmlBody: message.payload?.parts?.find((p: any) => p.mimeType === 'text/html')?.body?.data 
        ? Buffer.from(message.payload.parts.find((p: any) => p.mimeType === 'text/html').body.data, 'base64').toString()
        : undefined,
      labels: message.labelIds,
    };
  }

  private parseOutlookMessage(message: any): EmailMessage {
    return {
      id: message.id,
      subject: message.subject || '',
      from: message.from?.emailAddress?.address || '',
      to: message.toRecipients?.[0]?.emailAddress?.address || '',
      date: message.receivedDateTime || '',
      body: message.body?.content || '',
      htmlBody: message.bodyPreview || undefined,
    };
  }

  /**
   * Helper methods
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async sha256(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  private storeTokens(provider: 'gmail' | 'outlook', tokens: OAuthTokens): void {
    const key = `${provider}_oauth_tokens`;
    sessionStorage.setItem(key, JSON.stringify(tokens));
  }

  private getTokens(provider: 'gmail' | 'outlook'): OAuthTokens | null {
    const key = `${provider}_oauth_tokens`;
    const stored = sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Mock mode methods for demo/development
   */
  private getMockTokens(provider: 'gmail' | 'outlook'): OAuthTokens {
    return {
      accessToken: `mock_${provider}_token_${Date.now()}`,
      tokenType: 'Bearer',
      expiresIn: 3600,
    };
  }

  private async getMockEmails(provider: 'gmail' | 'outlook'): Promise<EmailMessage[]> {
    // Return realistic mock emails for subscription tracking demo
    return [
      {
        id: 'mock_1',
        subject: 'Your Netflix subscription',
        from: 'info@paypal.com',
        to: 'user@example.com',
        date: new Date().toISOString(),
        body: 'Payment of $15.99 for Netflix Subscription received',
        htmlBody: '<html><body><h1>Netflix</h1><p>Payment received: $15.99</p><p>Billing date: October 9, 2026</p><p>Next billing: November 9, 2026</p></body></html>',
      },
      {
        id: 'mock_2',
        subject: 'Spotify Premium Individual',
        from: 'no-reply@spotify.com',
        to: 'user@example.com',
        date: new Date(Date.now() - 86400000).toISOString(),
        body: 'Thank you for your payment of $9.99',
        htmlBody: '<html><body><h1>Spotify</h1><p>Premium Individual - $9.99</p><p>Billing cycle: Monthly</p></body></html>',
      },
      {
        id: 'mock_3',
        subject: 'Adobe Creative Cloud',
        from: 'notifications@adobe.com',
        to: 'user@example.com',
        date: new Date(Date.now() - 172800000).toISOString(),
        body: 'Your Adobe Creative Cloud payment of $52.99',
        htmlBody: '<html><body><h1>Adobe</h1><p>Creative Cloud - $52.99/month</p><p>Next payment: November 8, 2026</p></body></html>',
      },
    ];
  }
}

// Singleton instance
export const oauthService = new OAuthService();
