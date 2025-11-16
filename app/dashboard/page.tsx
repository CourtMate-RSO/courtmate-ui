'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import OnboardingModal from '@/components/onboarding-modal';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (session?.user?.id && session?.accessToken) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    setIsLoadingUser(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:8000';
      const url = baseUrl.endsWith('/') ? `${baseUrl}user/${session?.user?.id}` : `${baseUrl}/user/${session?.user?.id}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        
        // Show onboarding modal if first login
        if (data.first_login) {
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleOnboardingComplete = async (data: { full_name: string; phone: string; role: 'MANAGER' | 'PLAYER' }) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:8000';
      const url = baseUrl.endsWith('/') ? `${baseUrl}user/${session?.user?.id}` : `${baseUrl}/user/${session?.user?.id}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: data.full_name,
          phone: data.phone,
          role: data.role,
          first_login: false,
        }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setUserData(updatedData);
        setShowOnboarding(false);
      } else {
        throw new Error('Failed to update user data');
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        initialData={{
          full_name: userData?.full_name,
          phone: userData?.phone,
        }}
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              CourtMate Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {session?.user?.name || session?.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 col-span-full">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Welcome back! 👋
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              This is your protected dashboard. You can only see this page because you're authenticated.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              My Bookings
            </h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Active reservations
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Available Courts
            </h3>
            <p className="text-3xl font-bold text-green-600">12</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Ready to book
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Notifications
            </h3>
            <p className="text-3xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Unread messages
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition-colors shadow-md hover:shadow-lg">
            Browse Courts
          </button>
          <button className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-4 rounded-lg transition-colors shadow-sm hover:shadow-md">
            View My Bookings
          </button>
        </div>
      </main>
      </div>
    </>
  );
}
