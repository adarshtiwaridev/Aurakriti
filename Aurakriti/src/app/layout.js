import { Inter, Playfair_Display } from 'next/font/google';
import ReduxProvider from '@/components/ReduxProvider';
import FloatingChatbot from '@/components/ecommerce/FloatingChatbot';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400','500','600','700','800'], display: 'swap' });

export const metadata = {
  title: 'Aurakriti | Golden Bridal Jewellery Boutique',
  description: 'Aurakriti presents a premium bridal jewellery experience with luxurious golden notes, elegant craftsmanship, and a warm heritage aesthetic.',
  keywords: 'Aurakriti, bridal jewellery, gold jewellery, luxury jewellery, bridal necklace, premium collection',
  authors: [{ name: 'Aurakriti Studio' }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  metadataBase: new URL('http://localhost:3000'),
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
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