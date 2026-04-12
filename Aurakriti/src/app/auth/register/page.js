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

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  role: z.enum(['user', 'seller'], { required_error: 'Please select an account type' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, loading } = useAuth();
  const router = useRouter();
  const googleOAuthUrl = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_URL || '';

  // Get initial role from URL params
  const getInitialRole = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('seller') === 'true' ? 'seller' : 'user';
    }
    return 'user';
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: getInitialRole(),
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...userData } = data;
      const response = await registerUser(userData);
      toast.success('Registration successful!', {
        description: 'Please check your email for OTP to verify your account.',
      });

      // Redirect to verify page
      router.push('/auth/verify');
    } catch (error) {
      toast.error('Registration failed', {
        description: error.error || 'Please try again.',
      });
    }
  };

  const handleGoogleSignup = () => {
    if (!googleOAuthUrl) {
      toast.info('Google SSO is not configured for this deployment.');
      return;
    }

    const callbackUrl = `${window.location.origin}/auth/register`;
    const target = new URL(googleOAuthUrl);
    target.searchParams.set('callbackUrl', callbackUrl);
    window.location.assign(target.toString());
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Already have an account?"
      linkText="Sign in"
      linkHref="/auth/login"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <InputField
          label="Full Name"
          type="text"
          placeholder="Enter your full name"
          icon="user"
          error={errors.name?.message}
          {...register('name')}
        />

        <InputField
          label="Email address"
          type="email"
          placeholder="Enter your email"
          icon="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <InputField
          label="Password"
          type="password"
          placeholder="Create a password (min 6 characters)"
          icon="password"
          showPasswordToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          error={errors.password?.message}
          {...register('password')}
        />

        <InputField
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          icon="shield"
          showPasswordToggle
          showPassword={showConfirmPassword}
          onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Account Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <motion.label
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex cursor-pointer rounded-xl border p-4 focus:outline-none ${
                selectedRole === 'user'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-300 bg-white'
              }`}
            >
              <input
                type="radio"
                value="user"
                {...register('role')}
                className="sr-only"
              />
              <div className="flex flex-col">
                <span className={`block text-sm font-medium ${
                  selectedRole === 'user' ? 'text-indigo-900' : 'text-gray-900'
                }`}>
                  Customer
                </span>
                <span className={`block text-sm ${
                  selectedRole === 'user' ? 'text-indigo-700' : 'text-gray-500'
                }`}>
                  Buy products
                </span>
              </div>
              {selectedRole === 'user' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2"
                >
                  <div className="h-4 w-4 bg-indigo-600 rounded-full flex items-center justify-center">
                    <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  </div>
                </motion.div>
              )}
            </motion.label>

            <motion.label
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex cursor-pointer rounded-xl border p-4 focus:outline-none ${
                selectedRole === 'seller'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-300 bg-white'
              }`}
            >
              <input
                type="radio"
                value="seller"
                {...register('role')}
                className="sr-only"
              />
              <div className="flex flex-col">
                <span className={`block text-sm font-medium ${
                  selectedRole === 'seller' ? 'text-indigo-900' : 'text-gray-900'
                }`}>
                  Seller
                </span>
                <span className={`block text-sm ${
                  selectedRole === 'seller' ? 'text-indigo-700' : 'text-gray-500'
                }`}>
                  Sell products
                </span>
              </div>
              {selectedRole === 'seller' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2"
                >
                  <div className="h-4 w-4 bg-indigo-600 rounded-full flex items-center justify-center">
                    <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  </div>
                </motion.div>
              )}
            </motion.label>
          </div>
          {errors.role && (
            <p className="text-sm text-red-600 mt-1">{errors.role.message}</p>
          )}
        </div>

        <ButtonLoader loading={loading} type="submit">
          Create account
        </ButtonLoader>

        {/* Social Login UI */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 ">
            <motion.button
              type="button"
              onClick={handleGoogleSignup}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="ml-2">Google</span>
            </motion.button>

          </div>
        </div>
      </form>
      <Toaster position="top-right" />
    </AuthLayout>
  );
}