import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'DRISHTI-X | Defence AI Vision Integrity & Assurance Platform',
  description: 'Trustworthy Computer Vision Integrity Assurance for Data, Models and Inference Outputs in Multi-Contributor Pipelines (Ministry of Defence / Indian Army / DGIS)',
  icons: {
    icon: '/drishti_logo.png',
    apple: '/drishti_logo.png',
  },
};

import AppLayoutClient from '@/components/AppLayoutClient';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#060911] text-slate-100 min-h-screen font-sans antialiased selection:bg-amber-500/30 selection:text-amber-200">
        <AppLayoutClient>{children}</AppLayoutClient>
      </body>
    </html>
  );
}
