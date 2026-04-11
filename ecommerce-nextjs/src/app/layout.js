import { Inter } from 'next/font/google';
import ReduxProvider from '@/components/ReduxProvider';
import FloatingChatbot from '@/components/ecommerce/FloatingChatbot';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'EcoCommerce - Sustainable Shopping Made Simple',
  description: 'Discover eco-friendly products from trusted sellers. Join our community committed to sustainable living and conscious consumption.',
  keywords: 'eco-friendly, sustainable, shopping, green products, environment',
  authors: [{ name: 'EcoCommerce Team' }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

// ✅ NEW (correct way)
export const viewport = {
  width: 'device-width',
 
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          {children}
          <FloatingChatbot />
        </ReduxProvider>
      </body>
    </html>
  );
}