
import { Navbar } from '@/components/Navbar';
import { ChatInterface } from '@/components/ChatInterface';
import { Pill, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Meet Your <span className="text-primary">Autonomous Pharmacist</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Order prescriptions, check refill status, and manage your health with our intelligent AI pharmacist agent.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2">
            <ChatInterface />
          </div>
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-xl border shadow-sm flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Prescription Verification</h3>
                <p className="text-sm text-muted-foreground">Our AI strictly enforces prescription requirements for controlled medications.</p>
              </div>
            </div>
            <div className="bg-card p-6 rounded-xl border shadow-sm flex items-start gap-4">
              <div className="bg-accent/10 p-3 rounded-lg text-accent-foreground">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Predictive Refills</h3>
                <p className="text-sm text-muted-foreground">We calculate when your meds run out and notify you 48 hours in advance.</p>
              </div>
            </div>
            <div className="bg-card p-6 rounded-xl border shadow-sm flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg text-primary">
                <Pill className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Real-time Inventory</h3>
                <p className="text-sm text-muted-foreground">Live connection to our warehouse ensures what you order is in stock.</p>
              </div>
            </div>
            
            <div className="bg-primary text-primary-foreground p-8 rounded-2xl shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2">Observability built-in</h2>
                <p className="opacity-80 mb-4">Every AI decision is traceable. Look for the Langfuse links in your chat history.</p>
                <div className="h-1 w-24 bg-accent rounded-full" />
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-10">
                <Zap className="h-32 w-32" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t bg-card py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            <span className="font-bold">CuraCare AI</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 CuraCare Pharmacy Solutions. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Safety</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
