
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, ExternalLink, Loader2, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { chatAction } from '@/app/actions/pharmacy';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  traceUrl?: string;
  entities?: {
    medicineName?: string;
    dosage?: string;
    qty?: string;
    duration?: string;
  };
};

type ReasoningStep = {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed';
  details?: string;
};

export function ChatInterface() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Perfect! I\'ve extracted the following details for your **30 days** plan:\n\n• Medicine: Acetaminophen\n• Dosage: 500mg\n• Quantity: 120 tablets\n• Supply Duration: 30 days\n• Daily Dosage: 2 tablets every 6 hours\n\n✅ **Quick Actions are now available** in the left panel!\n\n🔔 **Note:** A refill alert will be automatically set for 28 days from now (2 days before your supply runs out).',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      entities: { medicineName: 'Acetaminophen', dosage: '500mg', qty: '120 tablets', duration: '30 days' }
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([
    { id: 'extraction', label: 'Initial Entity Extraction', status: 'completed' },
    { id: 'prescription', label: 'Prescription Verification', status: 'pending' },
    { id: 'inventory', label: 'Inventory Validation', status: 'pending' },
    { id: 'dispatch', label: 'Warehouse Sync', status: 'pending' },
  ]);
  const [activeEntities, setActiveEntities] = useState<Message['entities']>({
    medicineName: 'Acetaminophen',
    dosage: '500mg',
    qty: '120 tablets',
    duration: '30 days'
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const simulateReasoning = async () => {
    const steps = [...reasoningSteps].map(s => ({ ...s, status: 'pending' as const }));
    setReasoningSteps(steps);
    
    for (let i = 0; i < steps.length; i++) {
      steps[i].status = 'loading';
      setReasoningSteps([...steps]);
      await new Promise(r => setTimeout(r, 600));
      steps[i].status = 'completed';
      setReasoningSteps([...steps]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp }]);
    setIsLoading(true);

    try {
      simulateReasoning();

      const result = await chatAction('patient123', userMsg);
      const assistantTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const lowerInput = userMsg.toLowerCase();
      let mockEntities = undefined;
      if (lowerInput.includes('paracetamol') || lowerInput.includes('acetaminophen')) {
        mockEntities = { medicineName: 'Acetaminophen', dosage: '500mg', qty: '120 tablets', duration: '30 days' };
      } else if (lowerInput.includes('ibuprofen')) {
        mockEntities = { medicineName: 'Ibuprofen', dosage: '200mg', qty: '60 capsules', duration: '30 days' };
      }

      if (mockEntities) setActiveEntities(mockEntities);

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result.response,
        timestamp: assistantTimestamp,
        traceUrl: result.trace_url || undefined,
        entities: mockEntities
      }]);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Pharmacy service offline.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[75vh]">
      {/* 1. Extracted Entities Panel */}
      <Card className="lg:col-span-3 border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-[#1E293B]">Extracted Entities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medicine Name</p>
            <div className="px-4 py-2 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] font-bold text-sm">
              {activeEntities?.medicineName || <span className="opacity-40 italic">Not detected</span>}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dosage</p>
            <div className="px-4 py-2 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] font-bold text-sm">
              {activeEntities?.dosage || <span className="opacity-40 italic">Not detected</span>}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity</p>
            <div className="px-4 py-2 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] text-[#166534] font-bold text-sm">
              {activeEntities?.qty || <span className="opacity-40 italic">Not detected</span>}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supply Duration</p>
            <div className="px-4 py-2 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] text-[#9A3412] font-bold text-sm">
              {activeEntities?.duration || <span className="opacity-40 italic">Not detected</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Main AI Pharmacist Chat */}
      <Card className="lg:col-span-6 flex flex-col border-none shadow-lg overflow-hidden bg-white">
        <div className="p-6 border-b bg-white flex flex-col">
          <h2 className="text-xl font-bold text-[#1E293B]">AI Pharmacist Chat</h2>
          <p className="text-sm text-muted-foreground font-medium">Intelligent prescription management</p>
        </div>

        <ScrollArea className="flex-1 p-6 bg-slate-50/20">
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={cn(
                  "px-5 py-3 max-w-[90%] text-sm rounded-2xl shadow-sm",
                  msg.role === 'user' 
                    ? 'bg-[#4D67F6] text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-[#334155] rounded-tl-none'
                )}>
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  <div className={cn(
                    "mt-3 text-[10px] flex items-center justify-between gap-4 font-bold uppercase tracking-wider",
                    msg.role === 'user' ? "text-white/60" : "text-slate-400"
                  )}>
                    <span>{msg.timestamp}</span>
                    {msg.traceUrl && (
                      <a href={msg.traceUrl} target="_blank" className="flex items-center gap-1 hover:text-primary transition-colors">
                        <ExternalLink className="h-3 w-3" /> View Reasoning
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex flex-col items-start animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="bg-white border rounded-2xl rounded-tl-none px-5 py-3 shadow-sm flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">Pharmacist Thinking...</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-6 border-t bg-white">
          <div className="flex gap-3 items-center bg-slate-50 px-4 py-2 rounded-2xl border">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message or describe your symptoms..."
              className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 px-0 h-10"
            />
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-primary">
                <Mic className="h-5 w-5" />
              </Button>
              <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon" className="rounded-full h-10 w-10 bg-[#4D67F6] hover:bg-[#3B54D9]">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Agent Reasoning Panel */}
      <Card className="lg:col-span-3 border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-[#1E293B]">Agent Reasoning</CardTitle>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Transparent decision workflow</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {reasoningSteps.map((step) => (
            <div key={step.id} className={cn(
              "p-4 rounded-2xl border transition-all duration-300",
              step.status === 'completed' ? "bg-white border-slate-100 shadow-sm" : 
              step.status === 'loading' ? "bg-primary/5 border-primary/10 animate-pulse" : 
              "bg-slate-50/50 opacity-40"
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-[#334155]">{step.label}</span>
                {step.status === 'completed' && (
                  <Badge className="bg-[#DCFCE7] text-[#166534] border-none hover:bg-[#DCFCE7] text-[10px] font-bold">Approved</Badge>
                )}
                {step.status === 'loading' && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                {step.status === 'completed' ? (
                  `Verified at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                ) : step.status === 'loading' ? (
                  'Decision chain active...'
                ) : (
                  'Awaiting context...'
                )}
              </div>
            </div>
          ))}

          <div className="mt-8 p-6 bg-[#F8FAFC] rounded-2xl border border-dashed text-center">
            <Info className="h-5 w-5 mx-auto mb-3 text-slate-400" />
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Observability Active</p>
            <p className="text-[10px] text-slate-400 mt-2 font-mono">Trace: tr-{Date.now().toString().slice(-8)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
