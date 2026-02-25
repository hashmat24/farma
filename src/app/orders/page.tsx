
import { getDashboardData } from '@/app/actions/pharmacy';
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
import { ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const data = await getDashboardData();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Order History</h1>
        <p className="text-muted-foreground">Complete audit log of all pharmaceutical transactions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Processed Orders</CardTitle>
          <CardDescription>Historical record of orders with integrated observability traces.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Medicine</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Traceability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs font-bold">{order.id}</TableCell>
                  <TableCell className="font-mono text-xs">{order.patient_id}</TableCell>
                  <TableCell>{data.medicines.find(m => m.id === order.medicine_id)?.name}</TableCell>
                  <TableCell>{order.qty}</TableCell>
                  <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={
                      order.status === 'delivered' ? 'bg-green-600' : 'bg-primary'
                    }>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <a 
                      href={`https://cloud.langfuse.com/project/demo/traces/${order.trace_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> View Trace
                    </a>
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
