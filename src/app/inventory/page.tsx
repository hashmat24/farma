
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

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const data = await getDashboardData();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Admin Inventory Dashboard</h1>
        <p className="text-muted-foreground">Complete management of medication stock and requirements.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Master Inventory List</CardTitle>
          <CardDescription>Real-time view of all pharmaceutical stock.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Medicine Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Prescription</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.medicines.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.id}</TableCell>
                  <TableCell className="font-medium">{m.name} <span className="text-xs text-muted-foreground">({m.dosage})</span></TableCell>
                  <TableCell>{m.category}</TableCell>
                  <TableCell className={m.stock_qty < m.reorder_threshold ? "text-destructive font-bold" : ""}>
                    {m.stock_qty}
                  </TableCell>
                  <TableCell>{m.unit}</TableCell>
                  <TableCell>
                    {m.prescription_required ? (
                      <Badge variant="secondary">Required</Badge>
                    ) : (
                      <Badge variant="outline">OTC</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {m.stock_qty <= 0 ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : m.stock_qty < m.reorder_threshold ? (
                      <Badge className="bg-orange-500">Low Stock</Badge>
                    ) : (
                      <Badge className="bg-green-600 text-white">In Stock</Badge>
                    )}
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
