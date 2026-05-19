import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function StatCard({ title, value, trend, positive }: any) {
  return (
    <div className="bg-white p-5 rounded-xl border border-brand-line flex flex-col shadow-sm">
      <span className="text-[11px] text-brand-slate font-bold uppercase tracking-wider mb-1">{title}</span>
      <span className="text-3xl font-extrabold tracking-tight text-brand-ink">{value}</span>
      <div className={cn(
        "text-xs font-bold mt-1.5",
        positive ? "text-green-600" : "text-brand-slate"
      )}>
        {positive ? "↑" : "•"} {trend} vs last period
      </div>
    </div>
  );
}

export default function Dashboard() {
  const sales = useLiveQuery(() => db.sales.toArray());
  const products = useLiveQuery(() => db.products.toArray());

  const totalRevenue = sales?.reduce((sum, s) => sum + s.total_amount, 0) || 0;
  const totalSalesCount = sales?.length || 0;
  
  const chartData = useMemo(() => {
    if (!sales) return [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      
      const daySales = sales.filter(s => {
        const saleDate = new Date(s.created_at);
        return saleDate >= dayStart && saleDate < dayEnd;
      });

      data.push({
        name: format(date, 'EEE'),
        revenue: daySales.reduce((sum, s) => sum + s.total_amount, 0),
      });
    }
    return data;
  }, [sales]);

  const topProducts = useMemo(() => {
    if (!products) return [];
    return [...products].sort((a, b) => b.stock_quantity - a.stock_quantity).slice(0, 4);
  }, [products]);

  return (
    <div className="p-6 grid grid-cols-12 gap-6 max-w-[1400px] mx-auto">
      <div className="col-span-12 flex items-center justify-between mb-2">
        <h1 className="text-2xl font-black text-brand-ink tracking-tight">Business Overview</h1>
        <div className="flex gap-2">
           <button className="bg-white border border-brand-line px-4 py-2 rounded-lg text-sm font-bold text-brand-slate hover:bg-slate-50">Export Data</button>
           <button className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm shadow-blue-500/20">Sync Now</button>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <StatCard title="Today's Revenue" value={`GH₵ ${totalRevenue.toLocaleString()}`} trend="12%" positive />
        <StatCard title="Active Transactions" value={totalSalesCount.toString()} trend="Avg Basket 34.00" positive />
        <StatCard title="Inventory Value" value={`GH₵ ${(products?.reduce((s, p) => s + (p.price * p.stock_quantity), 0) || 0).toLocaleString()}`} trend="5 items low" />
      </div>

      <div className="col-span-12 lg:col-span-8 bg-white border border-brand-line rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-bold text-brand-ink">Sales Velocity</h3>
          <span className="text-xs font-bold text-brand-slate uppercase">Last 7 Days</span>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} dy={10} />
              <YAxis hide />
              <Tooltip cursor={{ stroke: '#2563eb', strokeWidth: 1 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={4} fill="#2563eb" fillOpacity={0.05} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4 bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col shadow-sm">
        <h3 className="font-bold text-blue-900 mb-6 flex items-center gap-2">
          <span className="bg-blue-600 text-white text-[10px] px-1.5 rounded py-0.5 font-black uppercase">AI</span>
          Insights
        </h3>
        <div className="space-y-4 flex-1">
           <div className="bg-white p-4 rounded-xl text-sm border border-blue-50 leading-relaxed shadow-sm">
              Based on recent trends, <strong className="text-blue-700">Coca-Cola 500ml</strong> is your top performer.
           </div>
           <div className="bg-white p-4 rounded-xl text-sm border border-blue-50 leading-relaxed shadow-sm">
              <strong className="text-red-600">Restock Alert:</strong> Low inventory for Milo 400g. Expected stock out in 2 days.
           </div>
        </div>
        <div className="mt-6 pt-6 border-t border-blue-100">
           <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm shadow-sm hover:bg-blue-700 transition-colors">
              Ask AI Assistant
           </button>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-8 bg-white border border-brand-line rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="text-left px-6 py-4 text-[11px] font-bold text-brand-slate uppercase tracking-wider">Product Name</th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-brand-slate uppercase tracking-wider">Price (GHS)</th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-brand-slate uppercase tracking-wider">Stock</th>
              <th className="text-right px-6 py-4 text-[11px] font-bold text-brand-slate uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-line">
            {topProducts?.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-brand-ink text-sm">{p.name}</td>
                <td className="px-6 py-4 font-medium text-brand-slate text-sm">{p.price.toFixed(2)}</td>
                <td className="px-6 py-4 font-black text-brand-ink text-sm">{p.stock_quantity}</td>
                <td className="px-6 py-4 text-right">
                  <span className={cn(
                    "text-[10px] font-black uppercase px-2 py-1 rounded",
                    p.stock_quantity < 10 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
                  )}>
                    {p.stock_quantity < 10 ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
