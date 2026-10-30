import SubscriptionDashboard from '@/components/SubscriptionDashboard';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-4 px-4">
        <div className="flex flex-wrap gap-3">
          <Link 
            href="/payment" 
            className="inline-block px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md"
          >
            ❤️ Support This Project - Donate Bitcoin
          </Link>
          <a 
            href="https://my-oa22sukffl.brewpage.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md"
          >
            📝 Share Your Feedback (External)
          </a>
        </div>
      </div>
      <SubscriptionDashboard />
    </div>
  );
}
