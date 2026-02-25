
import { getDashboardData } from '@/app/actions/pharmacy';
import { Activity, Bell, ClipboardList, Package, ShieldCheck, Zap, Pill } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ChatInterface } from '@/components/ChatInterface';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await getDashboardData();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto px-8 py-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1E293B] mb-4">
            Meet Your <span className="text-[#4D67F6]">Autonomous Pharmacist</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
            Order prescriptions, check refill status, and manage your health with our intelligent AI pharmacist agent.
          </p>
        </div>

        {/* Dynamic Features Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-8">
            <ChatInterface />
          </div>
          
          <div className="lg:col-span-4 space-y-6">
            {/* System Stats Section */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Card className="border-none shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <Package className="h-4 w-4 text-[#4D67F6]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.medicines.length}</div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Inventory</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <Activity className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.lowStock.length}</div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Low Stock</p>
                </CardContent>
              </Card>
            </div>

            {/* Feature Highlights */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-start gap-4">
              <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#1E293B] mb-1">Prescription Verification</h3>
                <p className="text-sm text-slate-500 font-medium">Our AI strictly enforces requirements for controlled medications.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-start gap-4">
              <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#1E293B] mb-1">Predictive Refills</h3>
                <p className="text-sm text-slate-500 font-medium">We calculate when your meds run out and notify you 48h in advance.</p>
              </div>
            </div>

            <div className="bg-[#4D67F6] text-white p-8 rounded-3xl shadow-xl relative overflow-hidden group">
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2">Observability built-in</h2>
                <p className="opacity-80 mb-6 text-sm">Every AI decision is traceable. Look for the reasoning panel in chat.</p>
                <div className="h-1 w-24 bg-white/30 rounded-full group-hover:w-full transition-all duration-500" />
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-10">
                <Pill className="h-32 w-32" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-[#4D67F6]" />
            <span className="font-bold text-[#1E293B]">CuraCare AI</span>
          </div>
          <p className="text-sm text-slate-400 font-medium">© 2024 CuraCare Pharmacy Solutions. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="#" className="text-sm text-slate-500 font-bold hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="text-sm text-slate-500 font-bold hover:text-primary transition-colors">Terms</Link>
            <Link href="#" className="text-sm text-slate-500 font-bold hover:text-primary transition-colors">Safety</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
