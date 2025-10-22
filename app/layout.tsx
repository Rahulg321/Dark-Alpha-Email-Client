import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import { RightSidebar } from './components/right-sidebar';
import { WelcomeToast } from './components/welcome-toast';
import { BackHeader } from './components/BackHeader';
import { ToasterClient } from '@/components/ui/ToasterClient'; // ✅ NEW
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Next.js Mail',
  description: 'An email client template using the Next.js App Router.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`bg-white text-gray-800 ${inter.className}`}>
      <body className="flex mini-h-screen flex-col">

        <BackHeader />

        <main className="grow overflow-auto">{children}</main>

        <Suspense fallback={<RightSidebarSkeleton />}>
          {/* Uncomment when ready: <RightSidebar userId={1} /> */}
        </Suspense>

        <ToasterClient /> {/* ✅ Client-side Toaster */}
        <WelcomeToast />
      </body>
    </html>
  );
}

function RightSidebarSkeleton() {
  return (
    <div className="hidden w-[350px] shrink-0 overflow-auto bg-neutral-50 p-6 sm:flex" />
  );
}
