'use client';

import { useState } from 'react';
import { AiOutlineUser, AiOutlinePhone, AiOutlineClose } from 'react-icons/ai';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (data: { full_name: string; phone: string; role: 'MANAGER' | 'PLAYER' }) => void;
  initialData?: {
    full_name?: string;
    phone?: string;
  };
}

export default function OnboardingModal({ isOpen, onComplete, initialData }: OnboardingModalProps) {
  const [fullName, setFullName] = useState(initialData?.full_name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [role, setRole] = useState<'MANAGER' | 'PLAYER'>('PLAYER');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete({ full_name: fullName, phone, role });
    } catch (err) {
      setError('Failed to complete onboarding');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 relative">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to CourtMate! 🎾
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Let's set up your profile to get started
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Full Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AiOutlineUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="Enter your full name"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Phone Number *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AiOutlinePhone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="Enter your phone number"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              I am a *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('PLAYER')}
                disabled={isSubmitting}
                className={`p-4 border-2 rounded-lg transition-all ${
                  role === 'PLAYER'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                } disabled:opacity-50`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🎾</div>
                  <div className="font-semibold text-gray-900 dark:text-white">Player</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Book and play
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('MANAGER')}
                disabled={isSubmitting}
                className={`p-4 border-2 rounded-lg transition-all ${
                  role === 'MANAGER'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                } disabled:opacity-50`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">⚙️</div>
                  <div className="font-semibold text-gray-900 dark:text-white">Manager</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Manage courts
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg mt-6"
          >
            {isSubmitting ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
