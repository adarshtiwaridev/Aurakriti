'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Toaster, toast } from 'sonner';

export default function VerifyEmailForm({ token }) {
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  const { verifyEmail } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      setError('Invalid verification link');
      setVerifying(false);
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail(token);
        setVerified(true);
        toast.success('Email verified successfully!');
        setTimeout(() => {
          router.push('/user/dashboard');
        }, 2000);
      } catch (error) {
        setError(error.error || 'Verification failed');
        toast.error(error.error || 'Verification failed');
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [token, verifyEmail, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {verifying ? (
            <>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Verifying your email...
              </h2>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            </>
          ) : verified ? (
            <>
              <h2 className="mt-6 text-3xl font-extrabold text-green-600">
                Email verified successfully!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Your email has been verified. You can now access all features.
              </p>
              <div className="mt-6">
                <p className="text-sm text-gray-500">
                  Redirecting to dashboard...
                </p>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-6 text-3xl font-extrabold text-red-600">
                Verification failed
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {error}
              </p>
              <div className="mt-6 space-y-4">
                <Link
                  href="/auth/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go to sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create new account
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
}
