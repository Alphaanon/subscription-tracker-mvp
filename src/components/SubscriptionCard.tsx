'use client';

import { useState } from 'react';

interface Subscription {
  id: string;
  service_name: string;
  amount: number;
  currency: string;
  billing_cycle: string;
  renewal_date: string;
  status: string;
}

interface SubscriptionCardProps {
  subscription: Subscription;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const daysUntilRenewal = Math.ceil(
    (new Date(subscription.renewal_date).getTime() - new Date().getTime()) /
    (1000 * 60 * 60 * 24)
  );

  const getRenewalStatus = () => {
    if (daysUntilRenewal < 0) return { text: 'Overdue', color: 'text-red-400', bg: 'bg-red-500/20' };
    if (daysUntilRenewal === 0) return { text: 'Today', color: 'text-amber-400', bg: 'bg-amber-500/20' };
    if (daysUntilRenewal <= 3) return { text: `${daysUntilRenewal}d left`, color: 'text-amber-400', bg: 'bg-amber-500/20' };
    if (daysUntilRenewal <= 7) return { text: `${daysUntilRenewal}d left`, color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { text: `${daysUntilRenewal}d left`, color: 'text-green-400', bg: 'bg-green-500/20' };
  };

  const status = getRenewalStatus();

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const formatRenewalDate = () => {
    return new Date(subscription.renewal_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBillingCycleLabel = () => {
    return subscription.billing_cycle.charAt(0).toUpperCase() + subscription.billing_cycle.slice(1);
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden transition-all hover:border-white/20">
      <div className="p-4" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Service Icon */}
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {subscription.service_name.charAt(0).toUpperCase()}
            </div>

            {/* Service Info */}
            <div>
              <h3 className="font-semibold text-white">{subscription.service_name}</h3>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-purple-300">{getBillingCycleLabel()}</span>
                <span className="text-white/40">•</span>
                <span className={`${status.color} font-medium`}>{status.text}</span>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="text-right">
            <div className="text-xl font-bold text-white">
              {formatAmount(subscription.amount, subscription.currency)}
            </div>
            <div className="text-sm text-purple-300">
              {formatRenewalDate()}
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-purple-300">Status:</span>
                <span className="ml-2 text-white capitalize">{subscription.status}</span>
              </div>
              <div>
                <span className="text-purple-300">Billing Cycle:</span>
                <span className="ml-2 text-white">{getBillingCycleLabel()}</span>
              </div>
              <div>
                <span className="text-purple-300">Renewal Date:</span>
                <span className="ml-2 text-white">{formatRenewalDate()}</span>
              </div>
              <div>
                <span className="text-purple-300">Days Until:</span>
                <span className={`ml-2 font-medium ${status.color}`}>{daysUntilRenewal} days</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="px-4 py-2 bg-white/5 border-t border-white/5 flex items-center justify-end gap-2">
        <button className="px-3 py-1.5 text-sm text-purple-300 hover:text-white transition-colors">
          Edit
        </button>
        <button className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
