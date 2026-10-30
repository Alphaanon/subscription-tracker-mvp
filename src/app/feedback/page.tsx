import { Metadata } from 'next';
import FeedbackForm from '@/components/FeedbackForm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Feedback - Subscription Tracker',
  description: 'Share your feedback and help us improve Subscription Tracker',
};

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-block mb-6 text-purple-600 hover:text-purple-800 font-medium"
        >
          ← Back to Dashboard
        </Link>
        <FeedbackForm />
      </div>
    </div>
  );
}
