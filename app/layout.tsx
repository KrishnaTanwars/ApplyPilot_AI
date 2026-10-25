import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'ApplyPilot AI - AI-Powered Personal Job Application Agent',
  description: 'Automate job requirement parsing, eligibility checks, resume matching, and browser-based application filling for Krishna Tanwar.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} dark`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-zinc-950 text-zinc-100 min-h-screen selection:bg-indigo-500 selection:text-white antialiased">
        {children}
      </body>
    </html>
  );
}
