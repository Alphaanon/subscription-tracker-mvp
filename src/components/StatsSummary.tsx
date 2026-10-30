'use client';

interface StatsSummaryProps {
  totalSubscriptions: number;
  monthlyTotal: number;
  yearlyTotal: number;
  upcomingRenewals: number;
}

export function StatsSummary({
  totalSubscriptions,
  monthlyTotal,
  yearlyTotal,
  upcomingRenewals
}: StatsSummaryProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const yearlyAsMonthly = yearlyTotal / 12;
  const totalMonthly = monthlyTotal + yearlyAsMonthly;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Total Subscriptions */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-purple-300 text-sm mb-1">Total Subscriptions</p>
            <p className="text-3xl font-bold text-white">{totalSubscriptions}</p>
          </div>
          <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
      </div>

      {/* Monthly Total */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-purple-300 text-sm mb-1">Monthly Total</p>
            <p className="text-3xl font-bold text-white">{formatAmount(monthlyTotal)}</p>
            <p className="text-xs text-white/50 mt-1">per month</p>
          </div>
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Yearly Total */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-purple-300 text-sm mb-1">Yearly Total</p>
            <p className="text-3xl font-bold text-white">{formatAmount(yearlyTotal)}</p>
            <p className="text-xs text-white/50 mt-1">per year</p>
          </div>
          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Total Spend */}
      <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-indigo-500/30 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-indigo-300 text-sm mb-1">Total Monthly Spend</p>
            <p className="text-3xl font-bold text-white">{formatAmount(totalMonthly)}</p>
            <p className="text-xs text-white/50 mt-1">incl. yearly prorated</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
