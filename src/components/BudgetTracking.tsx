'use client';

import React, { useState, useMemo, useEffect } from 'react';

interface Subscription {
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  category: string;
  renewalDate?: string;
  nextBillingDate?: string;
}

interface BudgetTrackingProps {
  monthlyBudget: number;
  yearlyBudget: number;
  onBudgetUpdate: (budget: { monthlyBudget: number; yearlyBudget: number }) => void;
}

export default function BudgetTracking({ monthlyBudget, yearlyBudget, onBudgetUpdate }: BudgetTrackingProps) {
  const [editingMonthly, setEditingMonthly] = useState(false);
  const [editingYearly, setEditingYearly] = useState(false);
  const [tempMonthly, setTempMonthly] = useState<string>('');
  const [tempYearly, setTempYearly] = useState<string>('');

  useEffect(() => {
    setTempMonthly(monthlyBudget.toString());
    setTempYearly(yearlyBudget.toString());
  }, [monthlyBudget, yearlyBudget]);

  const calculateMonthlyTotal = useMemo(() => {
    return monthlyBudget;
  }, [monthlyBudget]);

  const calculateYearlyTotal = useMemo(() => {
    return yearlyBudget;
  }, [yearlyBudget]);

  const handleMonthlySave = () => {
    const newBudget = parseFloat(tempMonthly);
    if (!isNaN(newBudget) && newBudget >= 0) {
      onBudgetUpdate({ monthlyBudget: newBudget, yearlyBudget });
      localStorage.setItem('workspace_monthly_budget', newBudget.toString());
      setEditingMonthly(false);
    }
  };

  const handleYearlySave = () => {
    const newBudget = parseFloat(tempYearly);
    if (!isNaN(newBudget) && newBudget >= 0) {
      onBudgetUpdate({ monthlyBudget, yearlyBudget: newBudget });
      localStorage.setItem('workspace_yearly_budget', newBudget.toString());
      setEditingYearly(false);
    }
  };

  return (
    <div className="mt-8 bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Budget Tracking</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Budget */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-orange-900 mb-3">Monthly Budget</h3>
          {editingMonthly ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={tempMonthly}
                onChange={(e) => setTempMonthly(e.target.value)}
                className="flex-1 px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                step="0.01"
                min="0"
              />
              <button
                onClick={handleMonthlySave}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setTempMonthly(monthlyBudget.toString());
                  setEditingMonthly(false);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-orange-900">${monthlyBudget.toFixed(2)}</span>
              <button
                onClick={() => setEditingMonthly(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Edit
              </button>
            </div>
          )}
          <p className="text-sm text-orange-700 mt-2">Set your monthly spending limit for subscriptions</p>
        </div>

        {/* Yearly Budget */}
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-pink-900 mb-3">Yearly Budget</h3>
          {editingYearly ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={tempYearly}
                onChange={(e) => setTempYearly(e.target.value)}
                className="flex-1 px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                step="0.01"
                min="0"
              />
              <button
                onClick={handleYearlySave}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setTempYearly(yearlyBudget.toString());
                  setEditingYearly(false);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-pink-900">${yearlyBudget.toFixed(2)}</span>
              <button
                onClick={() => setEditingYearly(true)}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
              >
                Edit
              </button>
            </div>
          )}
          <p className="text-sm text-pink-700 mt-2">Set your yearly spending limit for subscriptions</p>
        </div>
      </div>

      {/* Budget Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Budget Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Monthly Budget:</span>
            <span className="ml-2 font-semibold">${monthlyBudget.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600">Yearly Budget:</span>
            <span className="ml-2 font-semibold">${yearlyBudget.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600">Yearly as Monthly:</span>
            <span className="ml-2 font-semibold">${(yearlyBudget / 12).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
