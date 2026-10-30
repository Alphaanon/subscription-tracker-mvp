// Mock data service for development/testing without live Supabase credentials
// Use this when Supabase is not configured or as a fallback

export interface Subscription {
  id: string;
  name: string;
  amount: string;
  currency: string;
  billing_cycle: 'weekly' | 'monthly' | 'yearly';
  next_billing_date: string;
  email: string;
  created_at?: string;
  updated_at?: string;
  billingCycle?: 'monthly' | 'yearly';
  nextBillingDate?: string;
  category?: string;
}

export interface DashboardSubscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  category: string;
}

export const mockSubscriptions: Subscription[] = [
  {
    id: '1',
    name: 'Netflix',
    amount: '15.49',
    currency: 'USD',
    billing_cycle: 'monthly',
    next_billing_date: '2026-09-15',
    email: 'netflix@billing.com',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  } as Subscription,
  {
    id: '2',
    name: 'Spotify',
    amount: '9.99',
    currency: 'USD',
    billing_cycle: 'monthly',
    next_billing_date: '2026-09-10',
    email: 'spotify@billing.com',
    created_at: '2026-02-20T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  } as Subscription,
  {
    id: '3',
    name: 'Adobe Creative Cloud',
    amount: '54.99',
    currency: 'USD',
    billing_cycle: 'monthly',
    next_billing_date: '2026-09-20',
    email: 'adobe@billing.com',
    created_at: '2026-03-10T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  } as Subscription,
  {
    id: '4',
    name: 'GitHub Pro',
    amount: '4.00',
    currency: 'USD',
    billing_cycle: 'monthly',
    next_billing_date: '2026-09-25',
    email: 'github@billing.com',
    created_at: '2026-04-05T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  } as Subscription,
  {
    id: '5',
    name: 'Amazon Prime',
    amount: '14.99',
    currency: 'USD',
    billing_cycle: 'monthly',
    next_billing_date: '2026-09-08',
    email: 'amazon@billing.com',
    created_at: '2026-05-12T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  } as Subscription,
];

// Transform mock subscriptions to dashboard format
export function transformToDashboardFormat(subscriptions: Subscription[]): DashboardSubscription[] {
  return subscriptions.map(sub => ({
    id: sub.id,
    name: sub.name,
    amount: parseFloat(sub.amount),
    billingCycle: sub.billing_cycle as 'monthly' | 'yearly',
    nextBillingDate: sub.next_billing_date,
    category: 'Entertainment', // Default category
  }));
}

export function getMockSubscriptions(): Subscription[] {
  return mockSubscriptions;
}

export function getSubscriptionById(id: string): Subscription | undefined {
  return mockSubscriptions.find(sub => sub.id === id);
}

export function addSubscription(subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Subscription {
  const newId = (mockSubscriptions.length + 1).toString();
  const now = new Date().toISOString();
  const newSubscription: Subscription = {
    id: newId,
    ...subscription,
    created_at: now,
    updated_at: now,
  };
  mockSubscriptions.push(newSubscription);
  return newSubscription;
}

export function deleteSubscription(id: string): Subscription | null {
  const index = mockSubscriptions.findIndex(sub => sub.id === id);
  if (index === -1) return null;
  const deleted = mockSubscriptions[index];
  mockSubscriptions.splice(index, 1);
  return deleted;
}

export function updateSubscription(id: string, updates: Partial<Subscription>): Subscription | null {
  const index = mockSubscriptions.findIndex(sub => sub.id === id);
  if (index === -1) return null;
  mockSubscriptions[index] = {
    ...mockSubscriptions[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  return mockSubscriptions[index];
}
