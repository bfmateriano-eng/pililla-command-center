'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Sidebar from '@/components/Sidebar'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts'
import { TrendingUp, Fuel, Calculator, Calendar, Loader2, CreditCard } from 'lucide-react'

// --- 1. TYPES ---
interface GSOAnalytics {
  totalSpent: number;
  totalLiters: number;
  avgCostPerTrip: number;
}

export default function GSOAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<GSOAnalytics>({ totalSpent: 0, totalLiters: 0, avgCostPerTrip: 0 });
  const [fuelTrend, setFuelTrend] = useState<any[]>([]);
  const [unitSpending, setUnitSpending] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadGSOData();
  }, [dateRange]);

  async function loadGSOData() {
    setLoading(true);
    // Fetch closed requests for financial audit
    const { data: fuelData } = await supabase
      .from('fuel_requests')
      .select('*, ambulances(call_sign)')
      .eq('status', 'Closed')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end + 'T23:59:59');

    if (fuelData) {
      const totalS = fuelData.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
      const totalL = fuelData.reduce((acc, curr) => acc + (curr.actual_liters || 0), 0);
      
      setSummary({
        totalSpent: totalS,
        totalLiters: totalL,
        avgCostPerTrip: fuelData.length > 0 ? totalS / fuelData.length : 0
      });

      // Process Spending by Unit
      const unitMap: Record<string, number> = {};
      fuelData.forEach(item => {
        const name = item.ambulances?.call_sign || 'Unknown';
        unitMap[name] = (unitMap[name] || 0) + (item.total_amount || 0);
      });
      setUnitSpending(Object.keys(unitMap).map(name => ({ name, amount: unitMap[name] })));

      // Process Trend (Simple daily grouping)
      const trendMap: Record<string, number> = {};
      fuelData.forEach(item => {
        const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        trendMap[date] = (trendMap[date] || 0) + (item.total_amount || 0);
      });
      setFuelTrend(Object.keys(trendMap).map(date => ({ date, amount: trendMap[date] })));
    }
    setLoading(false);
  }

  const COLORS = ['#1e3a8a', '#0ea5e9', '#3b82f6', '#60a5fa', '#93c5fd'];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-slate-800">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        
        {/* --- HEADER --- */}
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <img src="/images/lgu-logo.png" className="w-16 h-16 object-contain" alt="Logo" />
            <div>
              <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter flex items-center">
                <TrendingUp className="mr-2 h-6 w-6" /> GSO Fiscal Analytics
              </h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Supply & Expenditure Oversight</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border shadow-sm flex items-center gap-3">
             <Calendar className="w-4 h-4 text-blue-600" />
             <input 
              type="date" 
              className="text-xs font-black outline-none" 
              value={dateRange.start} 
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
             />
             <span className="text-gray-300">/</span>
             <input 
              type="date" 
              className="text-xs font-black outline-none" 
              value={dateRange.end} 
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
             />
          </div>
        </div>

        {/* --- KPI SUMMARY --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <CreditCard className="w-8 h-8 text-blue-900 mb-4" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Fuel Spend</p>
            <h2 className="text-3xl font-black text-blue-900">₱ {summary.totalSpent.toLocaleString()}</h2>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <Fuel className="w-8 h-8 text-sky-500 mb-4" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Liters Audited</p>
            <h2 className="text-3xl font-black text-sky-600">{summary.totalLiters.toLocaleString()} L</h2>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <Calculator className="w-8 h-8 text-indigo-500 mb-4" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg. Cost per Mission</p>
            <h2 className="text-3xl font-black text-indigo-900">₱ {Math.round(summary.avgCostPerTrip).toLocaleString()}</h2>
          </div>
        </div>

        {/* --- CHARTS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Expenditure Trend (PHP)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fuelTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" fontSize={10} tick={{fill: '#94a3b8', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} tick={{fill: '#94a3b8', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Line type="monotone" dataKey="amount" stroke="#1e3a8a" strokeWidth={4} dot={{r: 4, fill: '#1e3a8a'}} activeDot={{r: 8}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Spending by Vehicle Unit</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitSpending} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" fontSize={10} tick={{fill: '#475569', fontWeight: 'bold'}} axisLine={false} tickLine={false} width={80} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="amount" radius={[0, 10, 10, 0]} barSize={20}>
                    {unitSpending.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}