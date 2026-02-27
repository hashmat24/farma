
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Pill, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SignupPage() {
  const auth = useAuth();
  const db = useFirestore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name: name,
        role: 'user', // Default role
        createdAt: new Date().toISOString()
      });
      
      // Redirect handled by AuthGuard
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50/50 p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto bg-indigo-500 p-3 rounded-2xl w-fit shadow-lg shadow-indigo-200">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">Patient Enrollment</CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Join the agentic healthcare revolution
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Legal Name</Label>
              <Input 
                id="name" 
                placeholder="Jane Smith" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Personal Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="jane.smith@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Create Security Key</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-50"
              />
            </div>
            <Button type="submit" className="w-full h-11 font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enroll as Patient
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center text-sm border-t pt-6 bg-slate-50/50 rounded-b-lg">
          <p className="text-slate-500 font-medium">
            Already enrolled?{' '}
            <Link href="/login" className="text-primary hover:underline font-bold">Sign In</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
