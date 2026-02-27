
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Package, Bell, History, Pill, LogOut, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useLogout } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const pathname = usePathname();
  const { user, role, name } = useUser();
  const logout = useLogout();

  // If on login/signup, don't show the full navbar
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  if (isAuthPage) {
    return (
      <header className="border-b px-8 py-4 flex items-center justify-center bg-white">
        <div className="flex items-center gap-3">
          <div className="bg-[#4D67F6] p-2 rounded-lg text-white shadow-lg">
            <Pill className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#1E293B]">CuraCare AI</h1>
        </div>
      </header>
    );
  }

  const links = [
    { href: '/chat', label: 'AI Chat', icon: MessageSquare, roles: ['user', 'admin'] },
    { href: '/inventory', label: 'Inventory', icon: Package, roles: ['admin'] },
    { href: '/refills', label: 'Refills', icon: Bell, roles: ['admin'] },
    { href: '/orders', label: 'Orders', icon: History, roles: ['admin'] },
  ];

  return (
    <div className="flex flex-col w-full bg-white sticky top-0 z-50">
      {/* Top Brand Header */}
      <header className="border-b px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-[#4D67F6] p-2 rounded-lg text-white shadow-lg">
            <Pill className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1E293B]">Agentic AI Pharmacy</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {role === 'admin' ? 'Supervising Clinical Interface' : 'Patient Care Portal'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#1E293B]">{name || user?.email?.split('@')[0]}</p>
            <div className="flex items-center justify-end gap-1">
              {role === 'admin' && <ShieldAlert className="h-3 w-3 text-amber-500" />}
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                {role === 'admin' ? 'Administrator' : 'Patient'}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border shadow-sm overflow-hidden">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/40/40`} />
                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                    {user?.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Account Security</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs py-3">
                Logged in as <span className="font-bold ml-1">{user?.email}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive font-bold cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" /> Logout Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Secondary Navigation */}
      <nav className="bg-[#F8FAFC] border-b px-8 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 h-14">
          {links.filter(link => link.roles.includes(role || 'user')).map(({ href, label, icon: Icon }) => (
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
