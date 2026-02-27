
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import { Loader2 } from 'lucide-react';

const PUBLIC_PATHS = ['/login', '/signup'];
const ADMIN_PATHS = ['/inventory', '/refills', '/orders', '/admin'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, role, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return;

    const isPublicPath = PUBLIC_PATHS.includes(pathname);
    const isAdminPath = ADMIN_PATHS.some(path => pathname.startsWith(path));

    if (!user && !isPublicPath) {
      router.replace('/login');
    } else if (user && isPublicPath) {
      router.replace('/chat');
    } else if (user && role === 'user' && isAdminPath) {
      router.replace('/chat');
    }
  }, [user, role, isUserLoading, pathname, router]);

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm font-medium text-slate-500">Verifying Security Credentials...</p>
      </div>
    );
  }

  // Prevent flicker before redirect
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const isAdminPath = ADMIN_PATHS.some(path => pathname.startsWith(path));

  if (!user && !isPublicPath) return null;
  if (user && isPublicPath) return null;
  if (user && role === 'user' && isAdminPath) return null;

  return <>{children}</>;
}
