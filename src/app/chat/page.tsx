import { ChatInterface } from '@/components/ChatInterface';

export default function ChatPage() {
  return (
    <div className="flex flex-col min-h-screen lg:h-screen">
      <div className="p-4 lg:p-8 pb-0">
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">AI Pharmacist Chat</h1>
        <p className="text-sm lg:text-base text-muted-foreground">Intelligent prescription management and patient care.</p>
      </div>
      <div className="flex-1 p-4 lg:p-8">
        <ChatInterface />
      </div>
    </div>
  );
}
