
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Package, Bell, History, Pill } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home', icon: LayoutDashboard },
    { href: '/chat', label: 'Conversational Chat', icon: MessageSquare },
    { href: '/inventory', label: 'Admin Inventory Dashboard', icon: Package },
    { href: '/refills', label: 'Proactive Refill Alerts', icon: Bell },
    { href: '/orders', label: 'Order Confirmation / Details', icon: History },
  ];

  return (
    <div className="flex flex-col w-full bg-white">
      {/* Top Brand Header */}
      <header className="border-b px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-[#4D67F6] p-2 rounded-lg text-white shadow-lg">
            <Pill className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1E293B]">Agentic AI Pharmacy</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Intelligent Healthcare Management System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#1E293B]">Dr. Michael Roberts</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Supervising Pharmacist</p>
          </div>
          <Avatar className="h-10 w-10 border-2 border-primary/10 shadow-sm">
            <AvatarImage src="https://picsum.photos/seed/mr-roberts/40/40" />
            <AvatarFallback>MR</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Secondary Navigation */}
      <nav className="bg-[#F8FAFC] border-b px-8 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 h-14">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                pathname === href 
                  ? "bg-white text-[#1E293B] shadow-sm ring-1 ring-slate-200" 
                  : "text-slate-500 hover:text-[#1E293B] hover:bg-slate-100/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
