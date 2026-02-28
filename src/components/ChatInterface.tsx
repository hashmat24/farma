'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, ExternalLink, Loader2, Info, User, ClipboardList, Activity, CheckCircle2, Package, Truck, Calendar, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { chatAction, getPatientInfo } from '@/app/actions/pharmacy';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/firebase/provider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  traceUrl?: string;
  orderId?: string;
  photoDataUri?: string;
  orderDetails?: {
    medicineName: string;
    qty: number;
    totalPrice: number;
    deliveryDate: string;
  };
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

const INITIAL_STEPS: ReasoningStep[] = [
  { id: 'history', label: 'Retrieving User History', status: 'pending' },
  { id: 'extraction', label: 'Initial Entity Extraction', status: 'pending' },
  { id: 'prescription', label: 'Prescription Verification', status: 'pending' },
  { id: 'inventory', label: 'Inventory Validation', status: 'pending' },
  { id: 'dispatch', label: 'Order Processing', status: 'pending' },
];

function OrderCard({ details, orderId }: { details: Message['orderDetails'], orderId: string }) {
  if (!details) return null;
  return (
    <div className="mt-4 p-4 rounded-xl border-2 border-green-100 bg-green-50/30 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
          <CheckCircle2 className="h-4 w-4" /> Order Confirmed
        </div>
        <Badge variant="outline" className="text-[10px] font-mono border-green-200 text-green-700 bg-white">
          {orderId}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4 py-2 border-y border-green-100/50">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Medicine</p>
          <p className="text-xs font-bold text-slate-700">{details.medicineName}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Quantity</p>
          <p className="text-xs font-bold text-slate-700">{details.qty} Units</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Truck className="h-3.5 w-3.5" />
          <span>Arriving: {new Date(details.deliveryDate).toLocaleDateString()}</span>
        </div>
        <div className="font-extrabold text-slate-900">
          Total: ${details.totalPrice.toFixed(2)}
        </div>
      </div>
      
      <p className="text-[9px] text-slate-400 italic text-center pt-1">
        Inventory has been updated and your order is being prepared.
      </p>
    </div>
  );
}

export function ChatInterface() {
  const { user, name: userName, age: userAge } = useUser();
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>(INITIAL_STEPS);
  const [activeEntities, setActiveEntities] = useState<Message['entities']>(undefined);
  const [displayTraceId, setDisplayTraceId] = useState<string>('');

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    
    setMessages([
      { 
        role: 'assistant', 
        content: 'Hello! I am your AI Pharmacist. How can I help you with your medications today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setDisplayTraceId(`tr-${Date.now().toString().slice(-6)}`);

    const effectiveId = user?.uid || 'patient123';
    
    getPatientInfo(effectiveId).then(info => {
      if (info) {
        setPatientInfo(info);
      } else if (user) {
        setPatientInfo({ 
          name: userName || user?.email?.split('@')[0], 
          history: ['No clinical history on file'], 
          age: userAge || 'Unknown', 
          member_id: user.uid.slice(-8).toUpperCase()
        });
      }
    });
  }, [user, userName, userAge]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({
        variant: 'destructive',
        title: 'Camera Error',
        description: 'Could not access the camera. Please check your permissions.',
      });
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUri = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUri);
        stopCamera();
      }
    }
  };

  const runReasoningAnimation = async () => {
    const steps = INITIAL_STEPS.map(s => ({ ...s, status: 'pending' as const }));
    setReasoningSteps(steps);
    
    for (let i = 0; i < 3; i++) {
      steps[i].status = 'loading';
      setReasoningSteps([...steps]);
      await new Promise(r => setTimeout(r, 600));
      steps[i].status = 'completed';
      setReasoningSteps([...steps]);
    }
    
    steps[3].status = 'loading';
    setReasoningSteps([...steps]);
  };

  const finishReasoningAnimation = async () => {
    const steps = [...reasoningSteps];
    steps[3].status = 'completed';
    steps[4].status = 'loading';
    setReasoningSteps([...steps]);
    await new Promise(r => setTimeout(r, 400));
    steps[4].status = 'completed';
    setReasoningSteps([...steps]);
  };

  const handleSend = async () => {
    if ((!input.trim() && !capturedImage) || isLoading) return;

    const userMsg = input;
    const photo = capturedImage;
    setInput('');
    setCapturedImage(null);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const history = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      content: m.content
    }));

    setMessages(prev => [...prev, { role: 'user', content: userMsg || 'Prescription Image Sent', timestamp, photoDataUri: photo || undefined }]);
    setIsLoading(true);

    try {
      runReasoningAnimation();

      const result = await chatAction(user?.uid || 'patient123', userMsg || 'Prescription attached', history, photo || undefined);
      
      await finishReasoningAnimation();

      const assistantTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (result.entities) {
        setActiveEntities(prev => ({
          ...prev,
          ...result.entities
        }));
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result.response,
        timestamp: assistantTimestamp,
        traceUrl: result.trace_url || undefined,
        orderId: result.order_id,
        orderDetails: result.order_details,
        entities: result.entities
      }]);

      if (result.order_id) {
        toast({ title: 'Order Placed', description: `Order ${result.order_id} has been recorded successfully.` });
      }
    } catch (error) {
      console.error('Chat Error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Pharmacy service offline. Please check connectivity.' });
      setReasoningSteps(INITIAL_STEPS);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full lg:h-[calc(100vh-200px)] min-h-0 overflow-hidden lg:overflow-visible">
      {/* 1. Patient Context Panel */}
      <Card className="order-2 lg:order-1 lg:col-span-3 border-none shadow-sm bg-white overflow-hidden flex flex-col min-h-[300px] lg:min-h-0">
        <CardHeader className="pb-4 bg-slate-50/50 shrink-0 border-b">
          <CardTitle className="text-lg font-bold text-[#1E293B] flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Patient Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 flex-1 overflow-y-auto min-h-0 scrollbar-none">
          {patientInfo ? (
            <>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">{patientInfo.name}</p>
                <p className="text-xs text-slate-500">ID: {patientInfo.member_id} • Age: {patientInfo.age}</p>
              </div>
              
              <Separator />

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <ClipboardList className="h-3 w-3" /> Medical History
                </p>
                <div className="flex flex-wrap gap-2">
                  {patientInfo.history?.map((h: string, i: number) => (
                    <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-600 border-none font-medium text-[10px]">
                      {h}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Extracted from Chat</p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Medicine</p>
                    <div className="px-3 py-1.5 rounded-lg bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] font-bold text-xs truncate">
                      {activeEntities?.medicineName || <span className="opacity-40 italic">Waiting...</span>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Dosage</p>
                    <div className="px-3 py-1.5 rounded-lg bg-[#F0FDF4] border border-[#DCFCE7] text-[#166534] font-bold text-xs truncate">
                      {activeEntities?.dosage || <span className="opacity-40 italic">Waiting...</span>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Quantity</p>
                    <div className="px-3 py-1.5 rounded-lg bg-[#FFF7ED] border border-[#FFEDD5] text-[#9A3412] font-bold text-xs truncate">
                      {activeEntities?.qty || <span className="opacity-40 italic">Waiting...</span>}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-slate-200" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Main Chat Window */}
      <Card className="order-1 lg:order-2 lg:col-span-6 flex flex-col border-none shadow-lg overflow-hidden bg-white h-[60vh] lg:h-full min-h-0">
        <div className="p-4 border-b bg-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#1E293B]">AI Pharmacist</h2>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Live Healthcare Sync</p>
            </div>
          </div>
          <Badge variant="outline" className="text-primary border-primary/20 h-6 text-[10px]">Active Session</Badge>
        </div>

        <ScrollArea className="flex-1 min-h-0 bg-slate-50/30">
          <div className="p-4 lg:p-6 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={cn(
                  "px-4 py-3 max-w-[90%] lg:max-w-[85%] text-sm rounded-2xl shadow-sm",
                  msg.role === 'user' 
                    ? 'bg-[#4D67F6] text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-[#334155] rounded-tl-none'
                )}>
                  {msg.photoDataUri && (
                    <img src={msg.photoDataUri} alt="Captured Prescription" className="mb-2 rounded-lg max-w-full h-auto border" />
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  
                  {msg.role === 'assistant' && msg.orderId && msg.orderDetails && (
                    <OrderCard details={msg.orderDetails} orderId={msg.orderId} />
                  )}

                  <div className={cn(
                    "mt-2 text-[10px] flex items-center justify-between gap-4 font-bold uppercase tracking-wider",
                    msg.role === 'user' ? "text-white/60" : "text-slate-400"
                  )}>
                    <span>{msg.timestamp}</span>
                    {msg.traceUrl && (
                      <a href={msg.traceUrl} target="_blank" className="flex items-center gap-1 hover:text-primary transition-colors">
                        <ExternalLink className="h-3 w-3" /> Langfuse Trace
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex flex-col items-start animate-in fade-in slide-in-from-left-2">
                <div className="bg-white border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-3">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-white shrink-0">
          {capturedImage && (
            <div className="mb-4 relative w-32 h-32 animate-in fade-in zoom-in">
              <img src={capturedImage} alt="Preview" className="w-full h-full object-cover rounded-lg border-2 border-primary" />
              <button 
                onClick={() => setCapturedImage(null)}
                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex gap-2 items-center bg-slate-50 px-3 py-1.5 rounded-xl border">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about refills or order medication..."
              className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 px-0 h-9 text-sm"
              disabled={isLoading}
            />
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-8 w-8 text-slate-400 hover:text-primary"
                onClick={startCamera}
                disabled={isLoading}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-slate-400 hover:text-primary">
                <Mic className="h-4 w-4" />
              </Button>
              <Button onClick={handleSend} disabled={isLoading || (!input.trim() && !capturedImage)} size="icon" className="rounded-full h-8 w-8 bg-[#4D67F6] hover:bg-[#3B54D9]">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Reasoning Panel */}
      <Card className="order-3 lg:col-span-3 border-none shadow-sm bg-white overflow-hidden flex flex-col min-h-[300px] lg:min-h-0">
        <CardHeader className="pb-4 bg-slate-50/50 shrink-0 border-b">
          <CardTitle className="text-lg font-bold text-[#1E293B] flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-500" /> Reasoning Chain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-6 flex-1 overflow-y-auto min-h-0 scrollbar-none">
          <div className="space-y-3">
            {reasoningSteps.map((step) => (
              <div key={step.id} className={cn(
                "p-3 rounded-xl border transition-all duration-300",
                step.status === 'completed' ? "bg-[#F0FDF4] border-[#DCFCE7]" : 
                step.status === 'loading' ? "bg-primary/5 border-primary/10 animate-pulse" : 
                "bg-slate-50/50 opacity-40"
              )}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-700">{step.label}</span>
                  {step.status === 'completed' && (
                    <Badge className="bg-[#DCFCE7] text-[#166534] border-none text-[8px] h-4 px-1">SUCCESS</Badge>
                  )}
                  {step.status === 'loading' && <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" />}
                </div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                  {step.status === 'completed' ? 'Verified & Validated' : step.status === 'loading' ? 'Processing...' : 'Awaiting Task'}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-dashed text-center shrink-0">
            <Info className="h-4 w-4 mx-auto mb-2 text-slate-300" />
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Auditability Active</p>
            <p className="text-[8px] text-slate-400 mt-1 font-mono">Trace ID: {displayTraceId || 'Initializing...'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Camera Dialog */}
      <Dialog open={isCameraOpen} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Capture Prescription</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={stopCamera}>Cancel</Button>
            <Button onClick={capturePhoto}>Capture Photo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
