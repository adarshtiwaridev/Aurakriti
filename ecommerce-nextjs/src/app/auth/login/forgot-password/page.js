'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Toaster, toast } from 'sonner';
import AuthLayout from '@/components/AuthLayout';
import InputField from '@/components/InputField';
import ButtonLoader from '@/components/ButtonLoader';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const { forgotPassword, loading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    try {
      await forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setSubmitted(true);
      toast.success('Password reset email sent!', {
        description: 'Check your inbox for the reset link.',
      });
    } catch (error) {
      toast.error('Failed to send reset email', {
        description: error.error || 'Please try again.',
      });
    }
  };

  if (submitted) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="Remember your password?"
        linkText="Sign in"
        linkHref="/auth/login"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto h-16 w-16 bg-green-100 rounded-2xl flex items-center justify-center"
          >
            <CheckCircle className="h-8 w-8 text-green-600" />
          </motion.div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Reset link sent!
            </h3>
            <p className="text-gray-600 mb-4">
              We&apos;ve sent a password reset link to{' '}
              <span className="font-medium text-gray-900">{submittedEmail}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Didn&apos;t receive the email? Check your spam folder or try a different email address.
            </p>
          </div>
          <div className="space-y-3">
            <motion.button
              onClick={() => setSubmitted(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Try different email
            </motion.button>
            <Link
              href="/auth/login"
              className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Back to Sign In
            </Link>
          </div>
        </motion.div>
        <Toaster position="top-right" />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Remember your password?"
      linkText="Sign in"
      linkHref="/auth/login"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <div className="mx-auto h-12 w-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-white" />
        </div>
        <p className="text-gray-600">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <InputField
          label="Email address"
          type="email"
          placeholder="Enter your email address"
          icon="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <ButtonLoader loading={loading} type="submit">
          Send reset link
        </ButtonLoader>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </form>
      <Toaster position="top-right" />
    </AuthLayout>
  );
}