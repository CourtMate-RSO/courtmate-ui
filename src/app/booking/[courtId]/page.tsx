'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

interface Court {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
}

export default function BookingPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const courtId = params.courtId as string;

    const [court, setCourt] = useState<Court | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');

    // Redirect to login if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push(`/login?callbackUrl=/booking/${courtId}`);
        }
    }, [status, router, courtId]);

    // Set default date/time values
    useEffect(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Set default to tomorrow at 10:00 AM
        const defaultDate = tomorrow.toISOString().split('T')[0];
        setStartDate(defaultDate);
        setEndDate(defaultDate);
        setStartTime('10:00');
        setEndTime('11:00');
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setLoading(true);

        try {
            // Combine date and time
            const startsAt = new Date(`${startDate}T${startTime}`);
            const endsAt = new Date(`${endDate}T${endTime}`);

            // Validate
            if (endsAt <= startsAt) {
                setError('End time must be after start time');
                setLoading(false);
                return;
            }

            if (startsAt < new Date()) {
                setError('Cannot book in the past');
                setLoading(false);
                return;
            }

            const response = await fetch('/api/booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    court_id: courtId,
                    starts_at: startsAt.toISOString(),
                    ends_at: endsAt.toISOString(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create reservation');
            }

            setSuccess(true);

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create reservation');
        } finally {
            setLoading(false);
        }
    };

    // Calculate duration in hours
    const calculateDuration = () => {
        if (!startDate || !startTime || !endDate || !endTime) return 0;
        const start = new Date(`${startDate}T${startTime}`);
        const end = new Date(`${endDate}T${endTime}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return hours > 0 ? hours : 0;
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
                            href="/nearby-courts"
                            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                        >
                            <FiArrowLeft />
                            <span>Back to Courts</span>
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Book Court
                        </h1>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Success Message */}
                {success && (
                    <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3">
                            <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                            <div>
                                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                                    Reservation Confirmed!
                                </h3>
                                <p className="text-green-700 dark:text-green-300 mt-1">
                                    Your court has been successfully booked. Redirecting to dashboard...
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3">
                            <FiAlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            <div>
                                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                                    Booking Failed
                                </h3>
                                <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Booking Form */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                    {/* Court Info Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <FiMapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Court Reservation</h2>
                                <p className="text-blue-100">
                                    Court ID: {courtId}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Start Date & Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <FiCalendar className="inline w-4 h-4 mr-2" />
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <FiClock className="inline w-4 h-4 mr-2" />
                                    Start Time
                                </label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* End Date & Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <FiCalendar className="inline w-4 h-4 mr-2" />
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    required
                                    min={startDate || new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    <FiClock className="inline w-4 h-4 mr-2" />
                                    End Time
                                </label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Duration Display */}
                        {calculateDuration() > 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        Duration
                                    </span>
                                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                        {calculateDuration().toFixed(1)} hour{calculateDuration() !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex gap-4 pt-4">
                            <Link
                                href="/nearby-courts"
                                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading || success}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <FiLoader className="w-5 h-5 animate-spin" />
                                        Creating Reservation...
                                    </span>
                                ) : success ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <FiCheckCircle className="w-5 h-5" />
                                        Confirmed!
                                    </span>
                                ) : (
                                    'Confirm Booking'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Info Footer */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            You will receive a confirmation email once your booking is processed.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
