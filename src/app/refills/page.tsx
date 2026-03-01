'use client';

import { useState, useEffect } from 'react';
import { getDashboardData, getRefillAlerts } from '@/app/actions/pharmacy';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, User, Clock, Loader2, Pill } from 'lucide-react';
import { useFirebase } from '@/firebase/provider';
import { RefillAlert } from '@/app/lib/db';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function RefillsPage() {
  const { user, role, language } = useFirebase();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<RefillAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        if (role === 'admin') {
          const data = await getDashboardData();
          setAlerts(data.refillAlerts);
        } else if (user) {
          const patientAlerts = await getRefillAlerts(user.uid);
          setAlerts(patientAlerts);
        }
      } catch (error) {
        console.error("Failed to fetch refill alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [user, role]);

  const handleNotify = (alert: RefillAlert) => {
    toast({
      title: "Notification Sent",
      description: `Alert for ${alert.medicine_name} has been ${role === 'admin' ? 'sent to patient' : 'added to your reminders'}.`,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Analyzing medication cycles...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {role === 'admin' ? 'Global Refill Surveillance' : 'My Medication Cycle'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {role === 'admin' 
            ? 'Predictive analysis of all active patient medication exhaustion dates.' 
            : 'AI-powered tracking of your supply. We\'ll notify you when it\'s time for a refill.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {alerts.length === 0 ? (
          <div className="col-span-full py-20 text-center text-muted-foreground bg-white border border-dashed rounded-xl flex flex-col items-center gap-4">
            <Pill className="h-10 w-10 text-slate-200" />
            <div>
              <h3 className="text-lg font-bold text-slate-600">No Pending Refills</h3>
              <p className="text-sm">Your supply levels are currently optimal based on clinical consumption.</p>
            </div>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <Card key={i} className={cn(
              "border-l-4 shadow-sm hover:shadow-md transition-shadow",
              alert.days_left <= 2 ? "border-l-destructive" : "border-l-orange-500"
            )}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> 
                    {role === 'admin' ? alert.patient_name : 'Current Prescription'}
                  </CardTitle>
                  <Badge className={cn(
                    "font-bold border-none",
                    alert.days_left <= 2 
                      ? "bg-destructive/10 text-destructive" 
                      : "bg-orange-100 text-orange-700"
                  )}>
                    Due in {alert.days_left}d
                  </Badge>
                </div>
                <CardDescription className="font-bold text-slate-900 mt-1">
                  {alert.medicine_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Exhaustion
                    </p>
                    <p className="text-sm font-bold">{new Date(alert.exhaustion_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Consumption
                    </p>
                    <p className="text-sm font-bold">1 Unit/Day</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  className="w-full gap-2 font-bold" 
                  variant={alert.days_left <= 2 ? "default" : "outline"}
                  onClick={() => handleNotify(alert)}
                >
                  <Bell className="h-4 w-4" /> 
                  {role === 'admin' ? 'Notify Patient' : 'Set Reminder'}
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
