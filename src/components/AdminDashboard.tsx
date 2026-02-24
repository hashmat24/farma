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

  const formatDate = (dateStr: string) => {
    if (!mounted) return "";
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Total Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" /> {data.medicines.length} Items
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-destructive text-destructive-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" /> {data.lowStock.length} Items
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-500 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Refill Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Clock className="h-6 w-6" /> {data.refillAlerts.length} Active
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent text-accent-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="h-6 w-6" /> {data.orders.length} Processed
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inventory Table */}
        <Card className="shadow-lg border-none">
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
                  <TableHead>Required Rx</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.medicines.map((m) => (
                  <TableRow key={m.id} className={m.stock_qty < m.reorder_threshold ? "bg-red-50" : ""}>
                    <TableCell className="font-medium">{m.name} <span className="text-xs text-muted-foreground ml-1">({m.dosage})</span></TableCell>
                    <TableCell>{m.stock_qty}</TableCell>
                    <TableCell>
                      {m.prescription_required ? (
                        <Badge variant="secondary">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {m.stock_qty <= 0 ? (
                        <Badge variant="destructive">Out of Stock</Badge>
                      ) : m.stock_qty < m.reorder_threshold ? (
                        <Badge className="bg-orange-500">Low Stock</Badge>
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
        <Card className="shadow-lg border-none">
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
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Exhaustion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.refillAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                      No critical refill alerts found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.refillAlerts.map((alert, i) => (
                    <TableRow key={i} className="bg-orange-50">
                      <TableCell className="font-mono text-xs">{alert.patient_id}</TableCell>
                      <TableCell>{alert.medicine_name}</TableCell>
                      <TableCell className="font-bold text-orange-700">{alert.days_left}d</TableCell>
                      <TableCell>{formatDate(alert.exhaustion_date)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Order Log */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" /> Order History
          </CardTitle>
          <CardDescription>Complete audit log of autonomous pharmacist transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Medicine</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.id}</TableCell>
                  <TableCell>{order.patient_id}</TableCell>
                  <TableCell>{data.medicines.find(m => m.id === order.medicine_id)?.name}</TableCell>
                  <TableCell>{order.qty}</TableCell>
                  <TableCell>{formatDate(order.date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-green-600">
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
