'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, ExternalLink, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { chatAction } from '@/app/actions/pharmacy';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  traceUrl?: string;
  orderId?: string;
};

export function ChatInterface() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your AI Pharmacist. How can I help you today? I can check your refill status or process a new medication order.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const result = await chatAction('patient123', userMsg);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result.response,
        traceUrl: result.trace_url,
        orderId: result.order_id
      }]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a response from the AI pharmacist. Please check your connection and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window)) {
      toast({
        variant: 'destructive',
        title: 'Not Supported',
        description: 'Web Speech API is not supported in this browser.'
      });
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    // @ts-ignore
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  if (!mounted) {
    return (
      <Card className="flex flex-col h-[75vh] w-full max-w-4xl mx-auto shadow-xl border-t-4 border-t-primary bg-background/50 backdrop-blur">
        <div className="p-4 border-b flex items-center justify-between bg-card">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex-1 p-4 bg-muted/10" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[75vh] w-full max-w-4xl mx-auto shadow-xl border-t-4 border-t-primary bg-background/50 backdrop-blur">
      <div className="p-4 border-b flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-semibold text-primary">AI Pharmacist Online</span>
        </div>
        <div className="text-xs text-muted-foreground italic">Powered by CuraCare GenAI</div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1 px-2">
                {msg.role === 'assistant' ? (
                  <>
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">CuraCare Agent</span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">You</span>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </>
                )}
              </div>
              <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                {msg.content}
                {msg.traceUrl && (
                  <div className="mt-3 pt-2 border-t border-primary/10 flex items-center justify-between">
                    <span className="text-[10px] opacity-60">Trace ID available</span>
                    <a 
                      href={msg.traceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] flex items-center gap-1 hover:underline text-accent-foreground font-medium"
                    >
                      <ExternalLink className="h-2 w-2" /> View Trace
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1 px-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Thinking...</span>
              </div>
              <div className="chat-bubble-ai flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground italic">Processing your request...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-card rounded-b-lg">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSpeech}
            className={cn(isListening ? "text-destructive border-destructive" : "text-primary")}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about refills or order medication..."
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
