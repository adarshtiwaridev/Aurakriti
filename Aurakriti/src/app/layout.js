import { Inter, Playfair_Display } from 'next/font/google';
import ReduxProvider from '@/components/ReduxProvider';
import FloatingChatbot from '@/components/ecommerce/FloatingChatbot';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400','500','600','700','800'], display: 'swap' });

export const metadata = {
  title: 'Aurakriti | Bridal Jewellery Boutique',
  description: 'Aurakriti presents a premium bridal jewellery experience with exquisite designs, soft gold accents, and luxurious craftsmanship.',
  keywords: 'Aurakriti, bridal jewellery, luxury jewellery, premium jewellery, bridal necklace, premium collection',
  authors: [{ name: 'Aurakriti Studio' }],
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
      <body className={`${inter.className} ${playfair.className}`}>
        <ReduxProvider>
          {children}
          <FloatingChatbot />
        </ReduxProvider>
      </body>
    </html>
  );
}