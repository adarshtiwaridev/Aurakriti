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
import { Check } from 'lucide-react';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, loading, demoLogin } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await login(data);
      toast.success('Login successful!', {
        description: 'Welcome back to EcoShop!',
      });

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      router.replace(response.redirectPath || '/user/dashboard');
    } catch (error) {
      toast.error('Login failed', {
        description: error.error || 'Please check your credentials and try again.',
      });
    }
  };

  const handleDemoLogin = async () => {
    try {
      const response = await demoLogin();
      toast.success('Demo login successful!', {
        description: `Signed in as ${response.user.name}`,
      });
      router.push('/user/dashboard');
    } catch (error) {
      toast.error('Demo login failed', {
        description: error.error || 'Unable to sign in with the demo account.',
      });
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Don't have an account?"
      linkText="Sign up"
      linkHref="/auth/register"
    >
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
          label="Password"
          type="password"
          placeholder="Enter your password"
          icon="password"
          showPasswordToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <ButtonLoader loading={loading} type="submit">
          Log in
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

          <div className="mt-6 grid grid-cols-1 gap-3">
            <motion.button
              type="button"
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

        {/* Guest Access */}
        <div className="mt-6 space-y-3 text-center">
          <button
            type="button"
            onClick={handleDemoLogin}
            className="inline-flex items-center justify-center w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Login with demo account: cyber / 1234
          </button>
          <Link
            href="/products"
            className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center"
          >
            <Check className="h-4 w-4 mr-1" />
            Continue as guest
          </Link>
        </div>
      </form>
      <Toaster position="top-right" />
    </AuthLayout>
  );
}