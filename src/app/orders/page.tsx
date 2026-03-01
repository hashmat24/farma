
'use client';

import { useState, useEffect } from 'react';
import { getUserHistory, getDashboardData, getInventory } from '@/app/actions/pharmacy';
import { useFirebase } from '@/firebase/provider';
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
import { Button } from '@/components/ui/button';
import { ExternalLink, Package, Truck, CheckCircle2, Loader2, Search, Clock } from 'lucide-react';
import { Medicine, Order } from '@/app/lib/db';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

const statusConfig: Record<string, { label: string, color: string, progress: number }> = {
  'pending': { label: 'Received', color: 'bg-slate-400', progress: 10 },
  'processing': { label: 'Processing', color: 'bg-blue-500', progress: 40 },
  'shipped': { label: 'In Transit', color: 'bg-orange-500', progress: 75 },
  'delivered': { label: 'Delivered', color: 'bg-green-600', progress: 100 },
  'cancelled': { label: 'Cancelled', color: 'bg-destructive', progress: 0 },
};

export default function OrdersPage() {
  const { user, role } = useFirebase();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const meds = await getInventory();
        setMedicines(meds);

        if (role === 'admin') {
          const dashboard = await getDashboardData();
          setOrders(dashboard.orders);
        } else if (user) {
          const history = await getUserHistory(user.uid);
          setOrders(history);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, role]);

  const handleDownloadInvoice = (orderId: string) => {
    toast({
      title: "Generating Invoice",
      description: `Preparing clinical record for Order ${orderId}...`,
    });
    
    // Simulate invoice generation delay
    setTimeout(() => {
      toast({
        title: "Download Started",
        description: "The PDF invoice has been generated successfully.",
      });
    }, 1500);
  };

  const getTraceUrl = (traceId: string) => {
    const host = 'https://cloud.langfuse.com';
    return `${host}/project/demo/traces/${traceId}`;
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    medicines.find(m => m.id === o.medicine_id)?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Loading your order history...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {role === 'admin' ? 'Global Order Registry' : 'My Order History'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {role === 'admin' 
              ? 'Complete audit log and tracing for all clinical transactions.' 
              : 'Track your medication orders and view delivery status in real-time.'}
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Order ID or medicine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredOrders.length === 0 ? (
          <Card className="border-dashed py-20">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <Package className="h-12 w-12 text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-600">No orders found</h3>
              <p className="text-sm text-slate-400">Your orders will appear here once placed.</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const med = medicines.find(m => m.id === order.medicine_id);
            const status = statusConfig[order.status] || statusConfig.pending;
            
            return (
              <Card key={order.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-slate-50/50 pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-2.5 rounded-xl border shadow-sm">
                        <Pill className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order ID</span>
                          <span className="font-mono text-sm font-bold">{order.id}</span>
                        </div>
                        <h3 className="text-lg font-extrabold text-[#1E293B]">
                          {med?.name || 'Unknown Medication'} <span className="text-sm font-medium text-muted-foreground">({med?.dosage})</span>
                        </h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Placed On</p>
                      <p className="text-sm font-bold">{new Date(order.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 pb-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-5 space-y-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" /> Current Status
                        </span>
                        <Badge className={cn("font-bold capitalize", status.color)}>
                          {status.label}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <Progress value={status.progress} className="h-2" />
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          <span>Ordered</span>
                          <span>Processing</span>
                          <span>Shipped</span>
                          <span>Delivered</span>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Quantity</p>
                        <p className="text-sm font-extrabold">{order.qty} Units</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Price</p>
                        <p className="text-sm font-extrabold text-primary">${order.total_price.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="lg:col-span-3 flex flex-col gap-2">
                      {(role === 'admin' || order.trace_id !== 'manual-order') && (
                        <a 
                          href={getTraceUrl(order.trace_id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold border py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" /> Audit Trace
                        </a>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs font-bold"
                        onClick={() => handleDownloadInvoice(order.id)}
                      >
                        Download Invoice
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function Pill({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  );
}
