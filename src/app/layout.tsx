import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import MagicProvider from '@/context/MagicProvider';
import { UserProvider } from '@/context/UserContext';

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
  title: 'ChatHashGraph',
  description: 'Chat with hashgraph agent',
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
      </body>
    </html>
  );
}
