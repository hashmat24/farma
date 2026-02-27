
import { AdminDashboard } from '@/components/AdminDashboard';
import { getDashboardData } from '@/app/actions/pharmacy';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const data = await getDashboardData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Operations Dashboard</h1>
          <p className="text-muted-foreground">Monitor inventory, orders, and predictive refill alerts.</p>
        </div>
        <div className="flex items-center gap-2 bg-card border rounded-lg px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live Warehouse Sync Active
        </div>
      </div>

      <AdminDashboard data={data} />
    </div>
  );
}
