
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from '@/components/Navbar';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthGuard } from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'CuraCare AI - Agentic AI Pharmacy',
  description: 'Intelligent healthcare management system powered by AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <FirebaseClientProvider>
          <AuthGuard>
            <Navbar />
            <main className="flex-1 bg-slate-50/30">
              {children}
            </main>
          </AuthGuard>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
