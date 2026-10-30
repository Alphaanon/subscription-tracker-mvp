# Workspace - Email-Based Subscription Tracker

A privacy-first subscription tracking dashboard that lets you monitor recurring payments without requiring bank credentials.

## Features

- **Email-Based Tracking**: Add subscriptions with just your email - no bank account integration required
- **Renewal Reminders**: Visual alerts for upcoming renewals (within 7 days)
- **Dashboard Overview**: See total subscriptions, monthly spend, and upcoming renewals at a glance
- **Privacy-First**: Your financial data stays with you, no third-party bank access

## Tech Stack

- **Frontend**: Next.js 14 + React + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase project (free tier works)

### Setup

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Go to SQL Editor and run the migration file:
     ```
     supabase/migrations/001_initial_schema.sql
     ```
   - Copy your project URL and anon key

3. **Configure environment variables**:
   ```bash
   # Create .env.local with your Supabase credentials:
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Usage

1. Click "+ Add Subscription" to add a new subscription
2. Fill in the details:
   - Name (e.g., "Netflix", "Spotify")
   - Amount and currency
   - Billing cycle (daily, weekly, monthly, yearly)
   - Next billing date
   - Email address associated with the subscription
3. View your dashboard with:
   - Total subscription count
   - Monthly spending summary
   - Upcoming renewals alert
   - Full list with status badges

## Why Workspace?

Subscription fatigue is real:
- 41% of consumers suffer from subscription fatigue
- Average person spends $273/month on subscriptions
- Existing solutions require bank credentials (privacy concern)

Workspace solves this by tracking subscriptions through email receipts only - no bank account integration needed.

## License

MIT
