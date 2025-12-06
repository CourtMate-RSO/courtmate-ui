'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import OnboardingModal from '@/components/onboarding-modal';
import AddFacilityModal from '@/components/add-facility-modal';
import FacilityManager from '@/components/facility-manager';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Manager specific states
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [myFacilities, setMyFacilities] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user?.id && session?.accessToken) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    setIsLoadingUser(true);
    setError(null);
    try {
      const url = `/api/proxy/user/user/${session?.user?.id}`;

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

        // If manager, fetch their facilities
        if (data.role === 'MANAGER') {
          fetchMyFacilities(session?.accessToken);
        }
      } else {
        setError(`Failed to load user profile: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setError('Failed to connect to User Service. Please verify the service is running and configured correctly.');
    } finally {
      setIsLoadingUser(false);
    }
  };

  const fetchMyFacilities = async (token?: string) => {
    try {
      const url = `/api/proxy/court/api/v1/facilities/user/${session?.user?.id}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token || session?.accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMyFacilities(data);
      }
    } catch (error) {
      console.error('Failed to fetch user facilities', error);
    }
  }

  const handleOnboardingComplete = async (data: { full_name: string; phone: string; role: 'MANAGER' | 'PLAYER' }) => {
    try {
      const url = `/api/proxy/user/user/${session?.user?.id}`;

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
        // If they just became a manager, fetch facilities
        if (updatedData.role === 'MANAGER') {
          fetchMyFacilities(session?.accessToken);
        }
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

      <AddFacilityModal
        isOpen={showAddFacility}
        onClose={() => setShowAddFacility(false)}
        onSuccess={() => fetchMyFacilities(session?.accessToken)}
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
                  {userData?.role && <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">{userData.role}</span>}
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

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
              <div className="flex-shrink-0 text-red-600 dark:text-red-400">⚠️</div>
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Welcome Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 col-span-full">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome back, {userData?.full_name || 'User'}! 👋
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {userData?.role === 'MANAGER'
                  ? 'Manage your facilities and courts from here.'
                  : 'Find and book your next game.'}
              </p>
            </div>

            {/* Stats - Only appropriate ones based on role could be shown here eventually */}

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
          </div>

          {/* Manager Section */}
          {userData?.role === 'MANAGER' && (
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Facilities</h2>
                <button
                  onClick={() => setShowAddFacility(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow transition-colors flex items-center gap-2"
                >
                  <span>+</span> Add Facility
                </button>
              </div>

              {myFacilities.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <p className="text-gray-500 mb-4">You haven't added any facilities yet.</p>
                  <button
                    onClick={() => setShowAddFacility(true)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Create your first facility
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {myFacilities.map(facility => (
                    <FacilityManager key={facility.id} facility={facility} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons (General) */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/nearby-courts" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition-colors shadow-md hover:shadow-lg text-center">
              Browse Courts
            </Link>
            <Link href="/bookings" className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-4 rounded-lg transition-colors shadow-sm hover:shadow-md text-center">
              View My Bookings
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
