'use client';

import { useState } from 'react';

export default function FeedbackForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    usagePattern: '',
    featureRequest: '',
    feedback: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.feedback && !formData.featureRequest && !formData.usagePattern) {
      setError('Please provide at least some feedback or a feature request');
      return;
    }

    // Store feedback in localStorage for collection (no backend needed)
    const feedbackEntry = {
      ...formData,
      timestamp: new Date().toISOString(),
    };

    const existingFeedback = JSON.parse(localStorage.getItem('subscriptionTrackerFeedback') || '[]');
    existingFeedback.push(feedbackEntry);
    localStorage.setItem('subscriptionTrackerFeedback', JSON.stringify(existingFeedback));

    // Also log to console for visibility
    console.log('Feedback submitted:', feedbackEntry);

    setSubmitted(true);
    setFormData({
      name: '',
      email: '',
      usagePattern: '',
      featureRequest: '',
      feedback: '',
    });

    // Simulate sending feedback (could integrate with email service later)
    setTimeout(() => setSubmitted(false), 5000);
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-2">🎉</div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">Thank you for your feedback!</h3>
        <p className="text-green-700">Your input helps us improve Subscription Tracker.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Submit Another Feedback
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">📝 We Want Your Feedback!</h2>
      <p className="text-gray-600 mb-6">
        Help us improve Subscription Tracker by sharing how you use it and what features you'd like to see.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Name (optional)
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email (optional - for follow-up)
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How do you use Subscription Tracker?
          </label>
          <select
            name="usagePattern"
            value={formData.usagePattern}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Select an option</option>
            <option value="personal">Personal subscription management</option>
            <option value="small-business">Small business expense tracking</option>
            <option value="freelance">Freelancer managing client subscriptions</option>
            <option value="family">Family shared subscriptions</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feature Requests
          </label>
          <textarea
            name="featureRequest"
            value={formData.featureRequest}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="What features would you like to see? (e.g., export to CSV, email reminders, mobile app)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            General Feedback
          </label>
          <textarea
            name="feedback"
            value={formData.feedback}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Share your experience, bugs, suggestions, or anything else..."
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition shadow-md"
        >
          Submit Feedback
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>🔒 Your feedback is stored locally in your browser.</p>
        <p className="mt-1">We&apos;re building the best subscription tracking experience!</p>
      </div>
    </div>
  );
}
