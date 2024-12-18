import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import MagicProvider from '@/context/MagicProvider';
import { UserProvider } from '@/context/UserContext';
import { Toaster } from '@/components/ui/toaster';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Geo.delivery',
  description: 'Track your deliveries',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MagicProvider>
          <UserProvider>{children}</UserProvider>
        </MagicProvider>
        <Toaster />
      </body>
    </html>
  );
}
