'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Sidebar from '@/components/Sidebar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, Fuel, Award, Calendar, Loader2 } from 'lucide-react'

// --- 1. STRICT TYPES ---
interface FuelStat {
  name: string;
  liters: number;
}

interface DriverStat {
  name: string;
  count: number;
}

interface AnalyticsSummary {
  totalLiters: number;
  totalCost: number;
  totalDispatches: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState<boolean>(true)
  const [authorized, setAuthorized] = useState<boolean>(false)
  const [fuelStats, setFuelStats] = useState<FuelStat[]>([])
  const [driverStats, setDriverStats] = useState<DriverStat[]>([])
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalLiters: 0,
    totalCost: 0,
    totalDispatches: 0,
  })

  // 1. SECURITY GATE: Verify role on load
  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/'
        return
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (roleData?.role !== 'HEAD') {
        alert("Unauthorized Access. Returning to Operations.")
        window.location.href = '/operations/dispatch'
      } else {
        setAuthorized(true)
        loadAnalytics()
      }
    }
    checkAccess()
  }, [dateRange])

  async function loadAnalytics() {
    setLoading(true)
    
    // Fetch Closed Fuel Requests
    const { data: fuelData } = await supabase
      .from('fuel_requests')
      .select('actual_liters, total_amount, ambulances(call_sign)')
      .eq('status', 'Closed')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end + 'T23:59:59')

    // Fetch Closed Dispatches
    const { data: dispData } = await supabase
      .from('dispatch_logs')
      .select('drivers(full_name)')
      .eq('status', 'Closed')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end + 'T23:59:59')

    const fuelMap: Record<string, number> = {}
    let totalL = 0
    let totalC = 0

    fuelData?.forEach((item: any) => {
      const name = item.ambulances?.call_sign || 'Unknown'
      fuelMap[name] = (fuelMap[name] || 0) + Number(item.actual_liters || 0)
      totalL += Number(item.actual_liters || 0)
      totalC += Number(item.total_amount || 0)
    })

    const driverMap: Record<string, number> = {}
    dispData?.forEach((item: any) => {
      const name = item.drivers?.full_name || 'Unknown'
      driverMap[name] = (driverMap[name] || 0) + 1
    })

    setFuelStats(Object.keys(fuelMap).map(name => ({ name, liters: fuelMap[name] })))
    setDriverStats(Object.keys(driverMap).map(name => ({ name, count: driverMap[name] })))
    setSummary({
      totalLiters: totalL,
      totalCost: totalC,
      totalDispatches: dispData?.length || 0
    })
    setLoading(false)
  }

  const COLORS = ['#1e3a8a', '#dc2626', '#059669', '#d97706', '#7c3aed'];

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-900" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        
        {/* --- BRANDED HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b border-gray-200 gap-4">
          <div className="flex items-center gap-4">
            {/* LGU LOGO */}
            <img 
              src="/images/lgu-logo.png" 
              alt="Pililla LGU Logo" 
              className="w-20 h-20 object-contain drop-shadow-md" 
            />
            <div>
              <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter flex items-center">
                <TrendingUp className="mr-2 h-6 w-6 text-blue-600" /> Performance Analytics
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Command Center Data Oversight</p>
                <span className="text-gray-300">|</span>
                <img src="/images/better-pililla.png" alt="Better Pililla" className="h-4 object-contain opacity-80" />
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <Calendar className="w-4 h-4 text-blue-600" />
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                className="text-xs font-black outline-none cursor-pointer text-gray-700" 
                value={dateRange.start} 
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})} 
              />
              <span className="text-gray-300 font-bold text-xs">TO</span>
              <input 
                type="date" 
                className="text-xs font-black outline-none cursor-pointer text-gray-700" 
                value={dateRange.end} 
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})} 
              />
            </div>
          </div>
        </div>

        {/* --- KPI SUMMARY CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-blue-900 transition-transform hover:scale-[1.02]">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Total Fuel Expenditure</p>
            <div className="text-3xl font-black text-blue-900">₱ {summary.totalCost.toLocaleString()}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-orange-500 transition-transform hover:scale-[1.02]">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Liters Consumed</p>
            <div className="text-3xl font-black text-orange-600">{summary.totalLiters.toLocaleString()} <span className="text-sm">L</span></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-red-600 transition-transform hover:scale-[1.02]">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Successful Missions</p>
            <div className="text-3xl font-black text-red-700">{summary.totalDispatches}</div>
          </div>
        </div>

        {/* --- CHARTS SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center">
              <Fuel className="w-4 h-4 mr-2 text-blue-600" /> Fuel usage by Ambulance Unit
            </h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={10} 
                    tick={{fill: '#64748b', fontWeight: 'bold'}} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    fontSize={10} 
                    tick={{fill: '#64748b', fontWeight: 'bold'}} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} 
                  />
                  <Bar dataKey="liters" radius={[6, 6, 0, 0]} barSize={40}>
                    {fuelStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center">
              <Award className="w-4 h-4 mr-2 text-red-600" /> Dispatch count by Personnel
            </h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={driverStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={9} 
                    tick={{fill: '#64748b', fontWeight: 'bold'}} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    fontSize={10} 
                    tick={{fill: '#64748b', fontWeight: 'bold'}} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px'}} />
                  <Bar dataKey="count" fill="#1e3a8a" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}