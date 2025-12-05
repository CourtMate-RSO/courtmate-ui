'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiCalendar, FiMapPin, FiClock, FiDollarSign, FiLoader, FiAlertCircle, FiCheckCircle, FiXCircle } from 'react-icons/fi';

interface Booking {
    id: string;
    court_id: string;
    user_id: string;
    starts_at: string;
    ends_at: string;
    total_price: number;
    created_at: string;
    cancelled_at: string | null;
    cancel_reason: string | null;
    court: {
        name: string;
        address: string;
        city: string;
    };
}

export default function BookingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/bookings');
        }
    }, [status, router]);

    // Fetch bookings
    useEffect(() => {
        if (status === 'authenticated') {
            fetchBookings();
        }
    }, [status]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/bookings');

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to fetch bookings' }));
                throw new Error(errorData.error || 'Failed to fetch bookings');
            }

            const data = await response.json();
            setBookings(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const calculateDuration = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        return hours.toFixed(1);
    };

    const isUpcoming = (start: string) => {
        return new Date(start) > new Date();
    };

    const isPast = (end: string) => {
        return new Date(end) < new Date();
    };

    // Show loading while checking authentication
    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <FiLoader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                        >
                            <FiArrowLeft />
                            <span>Back to Dashboard</span>
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            My Bookings
                        </h1>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <FiAlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            <div>
                                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                                    Error Loading Bookings
                                </h3>
                                <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <FiLoader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">Loading your bookings...</p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && bookings.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                        <FiCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            No Bookings Yet
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            You haven't made any court reservations yet. Start by finding a court near you!
                        </p>
                        <Link
                            href="/nearby-courts"
                            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            Find Courts
                        </Link>
                    </div>
                )}

                {/* Bookings List */}
                {!loading && !error && bookings.length > 0 && (
                    <div className="space-y-4">
                        {bookings.map((booking) => (
                            <div
                                key={booking.id}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {booking.court.name}
                                                </h3>
                                                {booking.cancelled_at ? (
                                                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-semibold rounded-full flex items-center gap-1">
                                                        <FiXCircle className="w-3 h-3" />
                                                        Cancelled
                                                    </span>
                                                ) : isUpcoming(booking.starts_at) ? (
                                                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-semibold rounded-full flex items-center gap-1">
                                                        <FiCheckCircle className="w-3 h-3" />
                                                        Upcoming
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs font-semibold rounded-full">
                                                        Completed
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                                                <FiMapPin className="w-4 h-4" />
                                                <span>{booking.court.address}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                ${booking.total_price.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-500">
                                                {calculateDuration(booking.starts_at, booking.ends_at)} hours
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <FiCalendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 dark:text-gray-500">Date</div>
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    {formatDate(booking.starts_at)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                                <FiClock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 dark:text-gray-500">Time</div>
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    {formatTime(booking.starts_at)} - {formatTime(booking.ends_at)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {booking.cancelled_at && booking.cancel_reason && (
                                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                            <div className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1">
                                                Cancellation Reason:
                                            </div>
                                            <div className="text-sm text-red-800 dark:text-red-300">
                                                {booking.cancel_reason}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
