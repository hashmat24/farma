
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Pill, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50/50 p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto bg-primary p-3 rounded-2xl w-fit shadow-lg shadow-primary/20">
            <Pill className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Access your Agentic AI Pharmacy account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="doctor@curacare.ai" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Security Key</Label>
                <Link href="#" className="text-xs text-primary hover:underline font-bold">Forgot?</Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-50"
              />
            </div>
            <Button type="submit" className="w-full h-11 font-bold shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign In to Dashboard
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center text-sm border-t pt-6 bg-slate-50/50 rounded-b-lg">
          <p className="text-slate-500 font-medium">
            New to CuraCare?{' '}
            <Link href="/signup" className="text-primary hover:underline font-bold">Create Patient Account</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
