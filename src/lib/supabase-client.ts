// Supabase client with mock fallback for development
// Automatically falls back to mock data when Supabase credentials are missing

import { createClient } from '@supabase/supabase-js';
import { 
  getMockSubscriptions, 
  getSubscriptionById, 
  addSubscription, 
  deleteSubscription, 
  updateSubscription 
} from './mock-data';

// Subscription type definition matching component expectations
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

// Export Subscription type for use in components
export type { Subscription as MockSubscription } from './mock-data';

// Check if we have valid Supabase credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const HAS_SUPABASE_CREDENTIALS = !!(SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  SUPABASE_URL !== '' && 
  SUPABASE_ANON_KEY !== '' && 
  SUPABASE_ANON_KEY !== 'placeholder' &&
  SUPABASE_ANON_KEY !== 'eyJplaceholder' &&
  !SUPABASE_ANON_KEY.includes('...') &&
  !SUPABASE_URL.includes('placeholder'));

// Create Supabase client if credentials exist
const supabase = HAS_SUPABASE_CREDENTIALS 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Subscription service interface - works with both live and mock data
export const subscriptionService = {
  // Fetch all subscriptions
  async getAll(): Promise<Subscription[]> {
    if (HAS_SUPABASE_CREDENTIALS && supabase) {
      const { data, error } = await supabase.from('subscriptions').select('*').order('next_billing_date', { ascending: true });
      if (error) {
        console.error('Error fetching subscriptions:', error);
        return getMockSubscriptions() as Subscription[];
      }
      return (data || []) as Subscription[];
    }
    return getMockSubscriptions() as Subscription[];
  },

  // Get subscription by ID
  async getById(id: string): Promise<Subscription | null> {
    if (HAS_SUPABASE_CREDENTIALS && supabase) {
      const { data, error } = await supabase.from('subscriptions').select('*').eq('id', id).single();
      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }
      return data as Subscription || null;
    }
    const result = getSubscriptionById(id);
    return result as Subscription || null;
  },

  // Add new subscription
  async create(subscription: Omit<Subscription, 'id' | 'created_at'>): Promise<Subscription> {
    if (HAS_SUPABASE_CREDENTIALS && supabase) {
      const { data, error } = await supabase.from('subscriptions').insert([subscription]).select('*').single();
      if (error) {
        console.error('Error creating subscription:', error);
        return addSubscription(subscription) as Subscription;
      }
      return data as Subscription;
    }
    return addSubscription(subscription) as Subscription;
  },

  // Update existing subscription
  async update(id: string, updates: Partial<Subscription>): Promise<Subscription | null> {
    if (HAS_SUPABASE_CREDENTIALS && supabase) {
      const { data, error } = await supabase.from('subscriptions').update(updates).eq('id', id).select('*').single();
      if (error) {
        console.error('Error updating subscription:', error);
        return null;
      }
      return data as Subscription || null;
    }
    return updateSubscription(id, updates) as Subscription | null;
  },

  // Delete subscription
  async delete(id: string): Promise<Subscription | null> {
    if (HAS_SUPABASE_CREDENTIALS && supabase) {
      const { error } = await supabase.from('subscriptions').delete().eq('id', id);
      if (error) {
        console.error('Error deleting subscription:', error);
        return { id } as Subscription;
      }
      return { id } as Subscription;
    }
    return deleteSubscription(id) as Subscription || null;
  },
};

export { supabase };
