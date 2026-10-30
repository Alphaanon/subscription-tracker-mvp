"use client";

import React, { useState, useEffect } from 'react';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay, addDays, isWithinInterval } from 'date-fns';

interface Subscription {
  id: string;
  name: string;
  amount: string;
  billing_cycle: 'monthly' | 'yearly' | 'weekly';
  next_billing_date: string;
}

interface Notification {
  id: string;
  type: 'renewal' | 'budget_warning' | 'budget_exceeded';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
  read: boolean;
}

interface NotificationCenterProps {
  subscriptions: Subscription[];
}

export default function NotificationCenter({ subscriptions }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const today = new Date();
    const upcomingRenewals: Notification[] = [];

    subscriptions.forEach(sub => {
      const billingDate = parseISO(sub.next_billing_date);
      const daysUntil = Math.ceil((billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil >= 0 && daysUntil <= 7) {
        const daysText = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
        upcomingRenewals.push({
          id: `renewal-${sub.id}-${Date.now()}`,
          type: 'renewal',
          message: `${sub.name} renews ${daysText} ($${parseFloat(sub.amount).toFixed(2)}/${sub.billing_cycle})`,
          severity: daysUntil <= 2 ? 'critical' : daysUntil <= 5 ? 'warning' : 'info',
          timestamp: new Date(),
          read: false,
        });
      }
    });

    setNotifications(upcomingRenewals);
    setUnreadCount(upcomingRenewals.length);
  }, [subscriptions]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="mt-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">🔔 Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No notifications at this time</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-3 h-3 mt-2 rounded-full ${getBadgeColor(notification.severity)}`} />
                    <div className="flex-1">
                      <p className="text-gray-900">{notification.message}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(notification.timestamp, 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
