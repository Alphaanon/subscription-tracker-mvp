-- Supabase schema for Workspace Subscription Tracker
-- Create tables and enable RLS

-- Subscriptions table
create table subscriptions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  amount numeric(10,2) not null,
  currency text default 'USD' check (currency in ('USD', 'EUR', 'GBP')),
  billing_cycle text not null check (billing_cycle in ('daily', 'weekly', 'monthly', 'yearly')),
  next_billing_date date not null,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index idx_subscriptions_next_billing on subscriptions(next_billing_date);
create index idx_subscriptions_email on subscriptions(email);
create index idx_subscriptions_billing_cycle on subscriptions(billing_cycle);

-- Enable Row Level Security
alter table subscriptions enable row level security;

-- RLS Policies - allow all operations for now (simplified for demo)
create policy "Enable all operations for authenticated users" on subscriptions
  for all using (true);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at
create trigger update_subscriptions_updated_at_before_update
  before update on subscriptions
  for each row
  execute procedure update_updated_at_column();
