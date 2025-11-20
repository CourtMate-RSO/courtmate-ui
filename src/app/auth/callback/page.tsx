'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract tokens from URL hash
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (!accessToken) {
          setStatus('error');
          setMessage('Invalid verification link');
          return;
        }

        // If it's a signup verification, exchange tokens with backend
        if (type === 'signup' || type === 'recovery') {
          const baseUrl = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:8000';
          const url = baseUrl.endsWith('/') ? `${baseUrl}auth/me` : `${baseUrl}/auth/me`;
          
          // Verify the token with backend
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            
            setStatus('success');
            setMessage('Email verified successfully! Redirecting to login...');
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
              router.push('/login');
            }, 2000);
          } else {
            setStatus('error');
            setMessage('Failed to verify email. Please try again.');
          }
        } else {
          setStatus('success');
          setMessage('Email verified! Redirecting to login...');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center">
            {status === 'processing' && (
              <div className="mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              </div>
            )}
            
            {status === 'success' && (
              <div className="mb-4">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4 inline-block mb-4">
                  <svg className="h-12 w-12 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
            
            {status === 'error' && (
              <div className="mb-4">
                <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4 inline-block mb-4">
                  <svg className="h-12 w-12 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            )}

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {status === 'processing' && 'Processing...'}
              {status === 'success' && 'Success!'}
              {status === 'error' && 'Verification Failed'}
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>

            {status === 'error' && (
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Go to Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
