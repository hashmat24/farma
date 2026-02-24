
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Pill, LayoutDashboard, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Chat', icon: MessageSquare },
    { href: '/admin', label: 'Admin', icon: LayoutDashboard },
  ];

  return (
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary p-2 rounded-lg text-white group-hover:scale-110 transition-transform">
            <Pill className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">CuraCare <span className="text-accent">AI</span></span>
        </Link>
        <div className="flex gap-4">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === href 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
