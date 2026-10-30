/**
 * Reminder Service
 * Sends email reminders before subscription renewals
 * Supports configurable reminder schedule (default: 3 days before)
 */

export interface ReminderConfig {
  daysBeforeRenewal: number;
  sendTime: string; // ISO time format, e.g., "09:00"
  enabled: boolean;
  frequency: 'daily' | 'once';
}

export interface Reminder {
  subscriptionId: string;
  serviceName: string;
  renewalDate: Date;
  amount: number;
  currency: string;
  daysUntilRenewal: number;
  reminderType: 'renewal' | 'overdue' | 'upcoming';
}

export interface EmailReminder {
  to: string;
  subject: string;
  body: string;
  htmlBody?: string;
}

class ReminderService {
  private config: ReminderConfig = {
    daysBeforeRenewal: 3,
    sendTime: '09:00',
    enabled: true,
    frequency: 'once'
  };

  private resendApiKey: string | null = null;

  /**
   * Configure reminder settings
   */
  configure(config: Partial<ReminderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set Resend API key for sending emails
   */
  configureResend(apiKey: string): void {
    this.resendApiKey = apiKey;
  }

  /**
   * Find subscriptions that need reminders
   */
  findDueReminders(subscriptions: Array<{
    id: string;
    serviceName: string;
    renewalDate: Date;
    amount: number;
    currency: string;
    status: string;
  }>): Reminder[] {
    const now = new Date();
    const reminders: Reminder[] = [];

    for (const subscription of subscriptions) {
      if (subscription.status !== 'active') continue;

      const daysUntilRenewal = this.daysBetween(now, subscription.renewalDate);
      
      // Send reminder if within configured window
      if (daysUntilRenewal >= 0 && daysUntilRenewal <= this.config.daysBeforeRenewal) {
        let reminderType: Reminder['reminderType'] = 'renewal';
        
        if (daysUntilRenewal === 0) {
          reminderType = 'overdue';
        } else if (daysUntilRenewal > this.config.daysBeforeRenewal - 2) {
          reminderType = 'upcoming';
        }

        reminders.push({
          subscriptionId: subscription.id,
          serviceName: subscription.serviceName,
          renewalDate: subscription.renewalDate,
          amount: subscription.amount,
          currency: subscription.currency,
          daysUntilRenewal,
          reminderType
        });
      }
    }

    return reminders;
  }

  /**
   * Calculate days between two dates
   */
  private daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    const d1 = new Date(date1).setHours(0, 0, 0, 0);
    const d2 = new Date(date2).setHours(0, 0, 0, 0);
    return Math.round((d2 - d1) / oneDay);
  }

  /**
   * Generate reminder email
   */
  generateEmail(reminder: Reminder, userEmail: string): EmailReminder {
    const { serviceName, renewalDate, amount, currency, daysUntilRenewal, reminderType } = reminder;

    let subject = '';
    let body = '';
    let htmlBody = '';

    if (reminderType === 'overdue') {
      subject = `⚠️ ${serviceName} subscription renewed today!`;
      body = `
Your ${serviceName} subscription has been renewed today.

Amount: ${currency}${amount.toFixed(2)}
Renewal date: ${this.formatDate(renewalDate)}

View your subscriptions: https://workspace.app/dashboard
      `;
    } else if (daysUntilRenewal === 1) {
      subject = `🔔 ${serviceName} subscription renews tomorrow!`;
      body = `
Your ${serviceName} subscription will renew in 1 day.

Amount: ${currency}${amount.toFixed(2)}
Renewal date: ${this.formatDate(renewalDate)}

View your subscriptions: https://workspace.app/dashboard
      `;
    } else {
      subject = `📅 ${serviceName} subscription renews in ${daysUntilRenewal} days`;
      body = `
Your ${serviceName} subscription will renew in ${daysUntilRenewal} days.

Amount: ${currency}${amount.toFixed(2)}
Renewal date: ${this.formatDate(renewalDate)}

View your subscriptions: https://workspace.app/dashboard
      `;
    }

    // HTML version
    htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6366f1; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; }
    .subscription-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .amount { font-size: 24px; font-weight: bold; color: #6366f1; }
    .cta-button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px; }
    .footer { padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${reminderType === 'overdue' ? '⚠️ Subscription Renewed' : reminderType === 'upcoming' ? '🔔 Renewal Reminder' : '📅 Upcoming Renewal'}</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p>${daysUntilRenewal === 0 ? 'Your subscription has been renewed today.' : `Your subscription will renew in ${daysUntilRenewal} day${daysUntilRenewal > 1 ? 's' : ''}.`}</p>
      
      <div class="subscription-card">
        <h2>${serviceName}</h2>
        <p class="amount">${currency}${amount.toFixed(2)}</p>
        <p>Renewal date: ${this.formatDate(renewalDate)}</p>
      </div>
      
      <a href="https://workspace.app/dashboard" class="cta-button">View All Subscriptions</a>
    </div>
    <div class="footer">
      <p>You're receiving this email because you have subscriptions tracked in Workspace.</p>
      <p><a href="https://workspace.app/settings">Manage your reminder settings</a></p>
    </div>
  </div>
</body>
</html>
    `;

    return {
      to: userEmail,
      subject,
      body,
      htmlBody
    };
  }

  /**
   * Send reminder email via Resend API
   */
  async sendEmail(reminder: EmailReminder): Promise<boolean> {
    if (!this.resendApiKey) {
      console.warn('Resend API key not configured. Email not sent.');
      return false;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Workspace <notifications@workspace.app>',
          to: reminder.to,
          subject: reminder.subject,
          html: reminder.htmlBody || `<pre>${reminder.body}</pre>`,
          text: reminder.body
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to send email:', error);
        return false;
      }

      console.log('Reminder email sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Process all due reminders
   */
  async processReminders(
    subscriptions: Array<{
      id: string;
      serviceName: string;
      renewalDate: Date;
      amount: number;
      currency: string;
      status: string;
    }>,
    userEmail: string,
    onLog?: (reminder: Reminder, success: boolean) => void
  ): Promise<{ sent: number; failed: number }> {
    const dueReminders = this.findDueReminders(subscriptions);
    let sent = 0;
    let failed = 0;

    for (const reminder of dueReminders) {
      const email = this.generateEmail(reminder, userEmail);
      const success = await this.sendEmail(email);

      if (onLog) {
        onLog(reminder, success);
      }

      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { sent, failed };
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Schedule reminder check (for background worker)
   */
  scheduleDailyCheck(
    getSubscriptions: () => Promise<Array<{
      id: string;
      serviceName: string;
      renewalDate: Date;
      amount: number;
      currency: string;
      status: string;
    }>>,
    getUserEmail: () => Promise<string>
  ): void {
    // Schedule daily check at configured time
    const checkTime = this.config.sendTime || '09:00';
    const [hours, minutes] = checkTime.split(':').map(Number);

    // Set up daily interval
    setInterval(async () => {
      if (!this.config.enabled) return;

      console.log('Running daily reminder check...');
      
      const subscriptions = await getSubscriptions();
      const userEmail = await getUserEmail();
      
      await this.processReminders(subscriptions, userEmail);
    }, 24 * 60 * 60 * 1000); // 24 hours

    console.log(`Reminder scheduler started. Daily check at ${checkTime}`);
  }
}

export const reminderService = new ReminderService();
export default reminderService;
