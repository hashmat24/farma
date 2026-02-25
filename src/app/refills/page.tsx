
import { getDashboardData } from '@/app/actions/pharmacy';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, User, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RefillsPage() {
  const data = await getDashboardData();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Proactive Refill Alerts</h1>
        <p className="text-muted-foreground">Predictive analysis of patient medication exhaustion dates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.refillAlerts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card border rounded-xl">
            No patients currently require proactive refill notifications.
          </div>
        ) : (
          data.refillAlerts.map((alert, i) => (
            <Card key={i} className="border-l-4 border-l-orange-500 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> {alert.patient_name}
                  </CardTitle>
                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
                    Due in {alert.days_left}d
                  </Badge>
                </div>
                <CardDescription className="font-medium text-foreground">{alert.medicine_name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" /> 
                  Exhaustion: {new Date(alert.exhaustion_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Calculated from 1 unit/day dosage
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full gap-2">
                  <Bell className="h-4 w-4" /> Notify Patient
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
