'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { CheckCircle, ArrowRight, Key } from 'lucide-react';

// Validation schema
const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { resetPassword, loading } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    try {
      await resetPassword(data.email, data.otp, data.password);
      setSubmitted(true);
      toast.success('Password reset successful!', {
        description: 'You can now sign in with your new password.',
      });
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error) {
      toast.error('Password reset failed', {
        description: error.error || 'Please try again.',
      });
    }
  };

  if (submitted) {
    return (
      <AuthLayout
        title="Password Reset Complete"
        subtitle="Ready to sign in?"
        linkText="Go to login"
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
            <h3 className="text-xl font-semibold text-green-600 mb-2">
              Password reset successful!
            </h3>
            <p className="text-gray-600 mb-4">
              Your password has been reset. You can now sign in with your new password.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to sign in page...
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link
              href="/auth/login"
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Sign In Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
        <Toaster position="top-right" />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
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
          <Key className="h-6 w-6 text-white" />
        </div>
        <p className="text-gray-600">
          Enter your new password below. Make sure it&apos;s secure and easy to remember.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <InputField
          label="Email address"
          type="email"
          placeholder="Enter your email"
          icon="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <InputField
          label="OTP"
          type="text"
          placeholder="Enter 6-digit OTP"
          icon="otp"
          error={errors.otp?.message}
          {...register('otp')}
        />

        <InputField
          label="New Password"
          type="password"
          placeholder="Enter new password (min 6 characters)"
          icon="password"
          showPasswordToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          error={errors.password?.message}
          {...register('password')}
        />

        <InputField
          label="Confirm New Password"
          type="password"
          placeholder="Confirm your new password"
          icon="shield"
          showPasswordToggle
          showPassword={showConfirmPassword}
          onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <ButtonLoader loading={loading} type="submit">
          Reset password
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
