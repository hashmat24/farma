
'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Package, 
  ClipboardList, 
  Activity,
  ArrowDownToLine,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Medicine, Order, RefillAlert } from '@/app/lib/db';

type DashboardProps = {
  data: {
    medicines: Medicine[];
    lowStock: Medicine[];
    refillAlerts: RefillAlert[];
    orders: Order[];
  };
};

export function AdminDashboard({ data }: DashboardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inventory Table */}
        <Card className="shadow-lg border-none bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Inventory Status
            </CardTitle>
            <CardDescription>Real-time stock levels across all medicines</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.medicines.map((m) => (
                  <TableRow key={m.id} className={m.stock_qty < m.reorder_threshold ? "bg-destructive/5" : ""}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.stock_qty} {m.unit}</TableCell>
                    <TableCell>
                      {m.stock_qty <= 0 ? (
                        <Badge variant="destructive">Out</Badge>
                      ) : m.stock_qty < m.reorder_threshold ? (
                        <Badge className="bg-orange-500">Low</Badge>
                      ) : (
                        <Badge className="bg-green-600 text-white">Healthy</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Refill Alerts */}
        <Card className="shadow-lg border-none bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <ArrowDownToLine className="h-5 w-5" /> Predictive Refill Alerts
            </CardTitle>
            <CardDescription>Patients needing refills within 48 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Days Left</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.refillAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                      No critical refill alerts found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.refillAlerts.map((alert, i) => (
                    <TableRow key={i} className="bg-orange-50">
                      <TableCell className="font-medium">{alert.patient_name}</TableCell>
                      <TableCell>{alert.medicine_name}</TableCell>
                      <TableCell className="font-bold text-orange-700">{alert.days_left}d</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Order Log */}
      <Card className="shadow-lg border-none bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" /> Recent Transaction Log
          </CardTitle>
          <CardDescription>Audit of autonomous pharmacist transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Medicine</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.orders.slice(0, 5).map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs font-bold">{order.id}</TableCell>
                  <TableCell className="font-mono text-xs">{order.patient_id}</TableCell>
                  <TableCell>{data.medicines.find(m => m.id === order.medicine_id)?.name}</TableCell>
                  <TableCell>{formatDate(order.date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-green-600 text-xs font-bold uppercase">
                      <CheckCircle2 className="h-3 w-3" /> {order.status}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
