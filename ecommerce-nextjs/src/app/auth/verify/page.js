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
import { CheckCircle, Mail, ArrowRight } from 'lucide-react';

// Validation schema
const verifySchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false);
  const { verifyEmail } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(verifySchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await verifyEmail(data.email, data.otp);
      toast.success('Email verified successfully!', {
        description: 'Welcome to EcoShop! Your account is now active.',
      });
      setTimeout(() => {
        router.push('/user/dashboard');
      }, 2000);
    } catch (error) {
      toast.error('Verification failed', {
        description: error.error || 'Invalid OTP or email. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle="Enter the OTP sent to your email"
      linkText="Back to login"
      linkHref="/auth/login"
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
          label="OTP"
          type="text"
          placeholder="Enter 6-digit OTP"
          icon="otp"
          error={errors.otp?.message}
          {...register('otp')}
        />

        <ButtonLoader loading={loading} type="submit">
          Verify Email
        </ButtonLoader>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Didn&apos;t receive OTP?{' '}
            <Link
              href="/auth/register"
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Register again
            </Link>
          </p>
        </div>
      </form>
      <Toaster position="top-right" />
    </AuthLayout>
  );
}