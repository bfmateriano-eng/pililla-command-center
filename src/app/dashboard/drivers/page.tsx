'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Sidebar from '@/components/Sidebar'
import { Users, UserPlus, Loader2, Trash2, CheckCircle2, XCircle } from 'lucide-react'

// --- 1. STRICT TYPES ---
interface Driver {
  id: string;
  full_name: string;
  license_number: string;
  is_active: boolean;
  created_at: string;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [authorized, setAuthorized] = useState<boolean>(false)
  const [formData, setFormData] = useState({
    full_name: '',
    license_number: ''
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
        fetchDrivers()
      }
    }
    checkAccess()
  }, [])

  async function fetchDrivers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('full_name', { ascending: true })
    
    if (error) console.error('Error:', error)
    else setDrivers(data as Driver[] || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('drivers').insert([formData])

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Driver Added Successfully!')
      setFormData({ full_name: '', license_number: '' })
      fetchDrivers()
    }
  }

  async function toggleStatus(id: string, currentStatus: boolean) {
    const { error } = await supabase.from('drivers').update({ is_active: !currentStatus }).eq('id', id)
    if (!error) fetchDrivers()
  }

  async function deleteDriver(id: string) {
    if (confirm("Are you sure you want to remove this driver from the registry?")) {
      const { error } = await supabase.from('drivers').delete().eq('id', id)
      if (error) alert(error.message)
      else fetchDrivers()
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
    <div className="min-h-screen bg-[#f8fafc] flex text-slate-800">
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
                <Users className="mr-3 h-7 w-7 text-blue-600" /> Personnel Registry
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Driver & Mission Eligibility Management</p>
                <span className="text-gray-300">|</span>
                <img src="/images/better-pililla.png" alt="Better Pililla" className="h-4 object-contain opacity-70" />
              </div>
            </div>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border shadow-sm flex items-center gap-2">
             <span className="text-[10px] font-black text-gray-400 uppercase">Registry Total:</span>
             <span className="text-sm font-black text-blue-900">{drivers.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* LEFT: Driver List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-blue-900 opacity-20" />
              </div>
            ) : drivers.length === 0 ? (
              <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-200 text-center">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm italic">No personnel found in registry.</p>
              </div>
            ) : (
              drivers.map((driver: Driver) => (
                <div key={driver.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center transition-all hover:shadow-md group">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${driver.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      <Users className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-blue-900 uppercase tracking-tight leading-none">{driver.full_name}</h3>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">License No.</span>
                        <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                          {driver.license_number}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleStatus(driver.id, driver.is_active)}
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center gap-2 ${
                        driver.is_active 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {driver.is_active ? (
                        <><CheckCircle2 className="w-3 h-3" /> Eligible</>
                      ) : (
                        <><XCircle className="w-3 h-3" /> Off-duty</>
                      )}
                    </button>
                    <button 
                      onClick={() => deleteDriver(driver.id)}
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

          {/* RIGHT: Add Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 sticky top-8">
              <h2 className="text-lg font-black text-blue-900 mb-8 flex items-center uppercase tracking-tight">
                <UserPlus className="w-5 h-5 mr-2 text-blue-600" /> New Registration
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Personnel Full Name</label>
                  <input 
                    type="text" required placeholder="JUAN DELA CRUZ"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all uppercase font-bold text-sm"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value.toUpperCase()})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">License Reference ID</label>
                  <input 
                    type="text" required placeholder="N01-XX-XXXXXX"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl uppercase font-mono font-bold text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all"
                    value={formData.license_number}
                    onChange={(e) => setFormData({...formData, license_number: e.target.value.toUpperCase()})}
                  />
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