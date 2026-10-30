-- Workspace Subscription Tracker - Supabase Schema
-- Privacy-first email-based subscription tracking

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly, weekly
    billing_date DATE NOT NULL,
    renewal_date DATE NOT NULL,
    last_billed_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- active, cancelled, paused
    email_thread_id TEXT, -- Reference to Gmail thread ID
    email_message_id TEXT, -- Reference to Gmail message ID
    email_snippet TEXT, -- First 500 chars of the receipt email
    metadata JSONB DEFAULT '{}', -- Additional parsed data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminder logs table
CREATE TABLE IF NOT EXISTS reminder_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) NOT NULL, -- renewal, overdue
    days_before_renewal INTEGER,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent', -- sent, failed, skipped
    error_message TEXT
);

-- Email import logs
CREATE TABLE IF NOT EXISTS email_import_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_provider VARCHAR(50) NOT NULL, -- gmail, outlook
    email_id TEXT NOT NULL,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_created BOOLEAN DEFAULT false,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    parse_result JSONB,
    error_message TEXT
);

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal_date ON subscriptions(renewal_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_service_name ON subscriptions(service_name);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_subscription_id ON reminder_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_email_import_logs_email_id ON email_import_logs(email_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for subscriptions table
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default user settings
INSERT INTO user_settings (key, value) VALUES
    ('reminder_days_before', '{"days": 3}'),
    ('email_notifications', '{"enabled": true, "frequency": "daily"}'),
    ('import_sources', '{"providers": ["gmail"], "last_sync": null}');
