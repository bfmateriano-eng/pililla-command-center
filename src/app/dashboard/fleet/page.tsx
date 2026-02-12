'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Sidebar from '@/components/Sidebar'
import { Truck, AlertCircle, CheckCircle, Plus, Loader2, Trash2 } from 'lucide-react'

// --- 1. STRICT TYPES ---
interface Ambulance {
  id: string;
  call_sign: string;
  plate_number: string;
  fuel_type: string;
  current_odometer: number;
  is_active: boolean;
  created_at: string;
}

export default function FleetPage() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [authorized, setAuthorized] = useState<boolean>(false)
  const [formData, setFormData] = useState({
    call_sign: '',
    plate_number: '',
    fuel_type: 'Diesel',
    current_odometer: 0
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
        fetchFleet()
      }
    }
    checkAccess()
  }, [])

  async function fetchFleet() {
    setLoading(true)
    const { data, error } = await supabase
      .from('ambulances')
      .select('*')
      .order('call_sign', { ascending: true })
    
    if (error) console.error('Error fetching:', error)
    else setAmbulances(data as Ambulance[] || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('ambulances').insert([formData])

    if (error) {
      alert('Error adding ambulance: ' + error.message)
    } else {
      alert('Ambulance Added Successfully!')
      fetchFleet()
      setFormData({ call_sign: '', plate_number: '', fuel_type: 'Diesel', current_odometer: 0 })
    }
  }

  async function toggleStatus(id: string, currentStatus: boolean) {
    const { error } = await supabase.from('ambulances').update({ is_active: !currentStatus }).eq('id', id)
    if (!error) fetchFleet()
  }

  async function deleteUnit(id: string) {
    if (confirm("Are you sure you want to remove this unit from the registry?")) {
      const { error } = await supabase.from('ambulances').delete().eq('id', id)
      if (error) alert(error.message)
      else fetchFleet()
    }
  }

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
            <img 
              src="/images/lgu-logo.png" 
              alt="Pililla LGU Logo" 
              className="w-16 h-16 object-contain drop-shadow-md" 
            />
            <div>
              <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter flex items-center">
                <Truck className="mr-3 h-7 w-7 text-blue-600" /> Fleet Registry
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">MDRRMO Vehicle Asset Management</p>
                <span className="text-gray-300">|</span>
                <img src="/images/better-pililla.png" alt="Better Pililla" className="h-4 object-contain opacity-70" />
              </div>
            </div>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border shadow-sm flex items-center gap-2">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fleet Size:</span>
             <span className="text-sm font-black text-blue-900">{ambulances.length} Units</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* LEFT COLUMN: LIST */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-blue-900 opacity-20" />
              </div>
            ) : ambulances.length === 0 ? (
              <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-200 text-center">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm italic">No ambulance units found in registry.</p>
              </div>
            ) : (
              ambulances.map((amb: Ambulance) => (
                <div key={amb.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center transition-all hover:shadow-md group">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${amb.is_active ? 'bg-blue-50 text-blue-900' : 'bg-red-50 text-red-600'}`}>
                      <Truck className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-blue-900 uppercase tracking-tight leading-none">{amb.call_sign}</h3>
                      <div className="flex items-center gap-4 mt-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          Plate: <span className="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{amb.plate_number}</span>
                        </p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          Fuel: <span className={`font-bold ${amb.fuel_type === 'Diesel' ? 'text-orange-600' : 'text-blue-600'}`}>{amb.fuel_type}</span>
                        </p>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-300"></div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Odometer: {amb.current_odometer.toLocaleString()} km</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleStatus(amb.id, amb.is_active)}
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 border ${
                        amb.is_active 
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {amb.is_active ? 'Active' : 'Maintenance'}
                    </button>
                    <button 
                      onClick={() => deleteUnit(amb.id)}
                      className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Remove from Registry"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RIGHT COLUMN: FORM */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 sticky top-8">
              <h2 className="text-lg font-black text-blue-900 mb-8 flex items-center uppercase tracking-tight">
                <Plus className="w-5 h-5 mr-2 text-blue-600" /> Unit Registration
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Vehicle Call Sign</label>
                  <input 
                    type="text" required placeholder="e.g. ALPHA-1"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all uppercase font-bold text-sm"
                    value={formData.call_sign}
                    onChange={(e) => setFormData({...formData, call_sign: e.target.value.toUpperCase()})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">License Plate Number</label>
                  <input 
                    type="text" required placeholder="SAA 1234"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl uppercase font-mono font-bold text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all"
                    value={formData.plate_number}
                    onChange={(e) => setFormData({...formData, plate_number: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fuel Type</label>
                      <select 
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all cursor-pointer font-bold text-sm"
                        value={formData.fuel_type}
                        onChange={(e) => setFormData({...formData, fuel_type: e.target.value})}
                      >
                        <option value="Diesel">Diesel</option>
                        <option value="Gasoline">Gasoline</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Starting KM</label>
                      <input 
                        type="number" required
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-bold text-sm"
                        value={formData.current_odometer}
                        onChange={(e) => setFormData({...formData, current_odometer: parseInt(e.target.value) || 0})}
                      />
                   </div>
                </div>
                <button type="submit" className="w-full bg-blue-900 text-white py-4 rounded-2xl hover:bg-blue-800 transition-all font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-900/20 mt-2 active:scale-95">
                  Confirm Registration
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}