'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import { subscriptionService, HAS_SUPABASE_CREDENTIALS, type Subscription } from '@/lib/supabase-client';
import ImportSubscriptions from './ImportSubscriptions';
import NotificationCenter from './NotificationCenter';
import BudgetTracking from './BudgetTracking';
import PaymentSection from './PaymentSection';
import type { Subscription as ImportedSubscription } from '@/lib/import-utils';

export default function SubscriptionDashboard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [yearlyBudget, setYearlyBudget] = useState<number>(0);

  useEffect(() => {
    const savedMonthly = localStorage.getItem('workspace_monthly_budget');
    const savedYearly = localStorage.getItem('workspace_yearly_budget');
    if (savedMonthly) setMonthlyBudget(parseFloat(savedMonthly));
    if (savedYearly) setYearlyBudget(parseFloat(savedYearly));
  }, []);

  const handleBudgetUpdate = (budget: { monthlyBudget: number; yearlyBudget: number }) => {
    setMonthlyBudget(budget.monthlyBudget);
    setYearlyBudget(budget.yearlyBudget);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getAll();
      setSubscriptions(data || []);
    } catch (err: any) {
      console.error('Error fetching subscriptions:', err);
      setError('Failed to load subscriptions. ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubscription = async (name: string, amount: number, cycle: Subscription['billing_cycle'], email: string) => {
    const nextBillingDate = addDays(new Date(), cycle === 'monthly' ? 30 : cycle === 'yearly' ? 365 : 1).toISOString().split('T')[0];
    
    const newSubscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'> = {
      name,
      amount: amount.toString(),
      currency: 'USD',
      billing_cycle: cycle,
      next_billing_date: nextBillingDate,
      email,
    };

    const result = await subscriptionService.create(newSubscription);
    if (result) {
      await fetchSubscriptions();
    } else {
      setError('Failed to add subscription');
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    const success = await subscriptionService.delete(id);
    if (success) {
      await fetchSubscriptions();
    } else {
      setError('Failed to delete subscription');
    }
  };

  const handleImportSuccess = async (importedSubscriptions: ImportedSubscription[]) => {
    let successCount = 0;
    for (const sub of importedSubscriptions) {
      const result = await subscriptionService.create({
        name: sub.name,
        amount: sub.amount,
        currency: sub.currency,
        billing_cycle: sub.billing_cycle,
        next_billing_date: sub.next_billing_date,
        email: sub.email,
      });
      if (result) {
        successCount++;
      }
    }
    await fetchSubscriptions();
    setShowImport(false);
    if (successCount > 0) {
      setError(null);
    }
  };

  const monthlyTotal = subscriptions
    .filter(s => s.billing_cycle === 'monthly')
    .reduce((sum, s) => sum + parseFloat(s.amount), 0);

  const yearlyTotal = subscriptions
    .filter(s => s.billing_cycle === 'yearly')
    .reduce((sum, s) => sum + parseFloat(s.amount), 0);

  const yearlyAsMonthly = yearlyTotal / 12;
  const totalMonthlyEquivalent = monthlyTotal + yearlyAsMonthly;
  const remainingMonthly = monthlyBudget - totalMonthlyEquivalent;
  const remainingYearly = yearlyBudget - yearlyTotal;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading subscriptions...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <h3 className="text-sm font-medium opacity-90">Monthly Total</h3>
          <p className="text-3xl font-bold mt-2">${monthlyTotal.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <h3 className="text-sm font-medium opacity-90">Yearly Total</h3>
          <p className="text-3xl font-bold mt-2">${yearlyTotal.toFixed(2)}</p>
          <p className="text-sm opacity-90 mt-1">(${yearlyAsMonthly.toFixed(2)}/mo)</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <h3 className="text-sm font-medium opacity-90">Total/Month</h3>
          <p className="text-3xl font-bold mt-2">${totalMonthlyEquivalent.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <h3 className="text-sm font-medium opacity-90">Monthly Budget</h3>
          <p className="text-3xl font-bold mt-2">${monthlyBudget.toFixed(2)}</p>
          <p className={`text-sm mt-1 ${remainingMonthly >= 0 ? 'opacity-90' : 'text-red-200 font-semibold'}`}>
            {remainingMonthly >= 0 ? `${remainingMonthly.toFixed(2)} left` : `${Math.abs(remainingMonthly).toFixed(2)} over`}
          </p>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-6 text-white shadow-lg">
          <h3 className="text-sm font-medium opacity-90">Yearly Budget</h3>
          <p className="text-3xl font-bold mt-2">${yearlyBudget.toFixed(2)}</p>
          <p className={`text-sm mt-1 ${remainingYearly >= 0 ? 'opacity-90' : 'text-red-200 font-semibold'}`}>
            {remainingYearly >= 0 ? `${remainingYearly.toFixed(2)} left` : `${Math.abs(remainingYearly).toFixed(2)} over`}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {!HAS_SUPABASE_CREDENTIALS && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            Running in <strong>mock mode</strong> (localStorage). Data persists in your browser.
            Configure Supabase credentials to .env.local for live database.
          </p>
        </div>
      )}

      {/* Import Section */}
      {showImport && (
        <div className="mb-8">
          <ImportSubscriptions onImportSuccess={handleImportSuccess} />
        </div>
      )}

      {/* Add Subscription Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">Add Subscription</h2>
          <button
            onClick={() => setShowImport(!showImport)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showImport ? '✕ Close Import' : '📥 Import Subscriptions'}
          </button>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${remainingMonthly >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Monthly: ${remainingMonthly.toFixed(2)} remaining
          </div>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          handleAddSubscription(
            fd.get('name') as string,
            parseFloat(fd.get('amount') as string),
            fd.get('cycle') as Subscription['billing_cycle'],
            fd.get('email') as string
          );
          e.currentTarget.reset();
        }} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Netflix"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
            <input
              type="number"
              name="amount"
              required
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="15.99"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
            <select
              name="cycle"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (for receipts)</label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Subscription
          </button>
        </form>
      </div>

      {/* Subscriptions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">All Subscriptions</h2>
        </div>
        {subscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No subscriptions found</p>
            <p className="text-sm">Add a subscription above or import from CSV/JSON</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cycle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Billing</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sub.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${parseFloat(sub.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{sub.billing_cycle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{format(parseISO(sub.next_billing_date), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{sub.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteSubscription(sub.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Section */}
      <PaymentSection />

      {/* Notification Center */}
      <NotificationCenter subscriptions={subscriptions} />

      {/* Budget Tracking */}
      <BudgetTracking 
        monthlyBudget={monthlyBudget}
        yearlyBudget={yearlyBudget}
        onBudgetUpdate={handleBudgetUpdate}
      />
    </div>
  );
}
