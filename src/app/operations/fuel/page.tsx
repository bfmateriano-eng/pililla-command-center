'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Sidebar from '@/components/Sidebar'
import { Fuel, User, Gauge, Clock, FileText, CheckCircle, AlertCircle, Loader2, DollarSign } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { MyDocument } from '@/app/dashboard/approvals/page'

export default function FuelRequestPage() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<any[]>([])
  const [ambulances, setAmbulances] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  // Local state for auto-calculation
  const [calcLiters, setCalcLiters] = useState<number>(0)
  const [calcTotal, setCalcTotal] = useState<number>(0)

  const [formData, setFormData] = useState({
    ambulance_id: '',
    driver_id: '',
    odometer: '',
    fuel_product: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      // 1. Load Ambulances and Drivers
      const { data: amb } = await supabase.from('ambulances').select('*').eq('is_active', true).order('call_sign')
      const { data: drv } = await supabase.from('drivers').select('*').eq('is_active', true).order('full_name')
      
      // 2. Load Fuel Requisitions - Including approved_by_name for the PDF logic
      const { data: req, error: reqError } = await supabase
        .from('fuel_requests')
        .select(`*, ambulances (call_sign, plate_number), drivers (full_name)`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (reqError) throw reqError

      if (amb) setAmbulances(amb)
      if (drv) setDrivers(drv)
      if (req) setRequests(req)
    } catch (err: any) {
      console.error("Fetch error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCloseRecord(id: string) {
    // Validation: Only require financial data now
    if (!calcLiters || !calcTotal) {
      alert("Please fill in actual liters and actual total price from the receipt.")
      return
    }

    setUpdatingId(id)
    // Auto-compute Price per Liter: Total / Liters
    const pricePerL = calcTotal / calcLiters 
    
    const { error } = await supabase
      .from('fuel_requests')
      .update({ 
        actual_liters: calcLiters,
        total_amount: calcTotal,
        price_per_liter: pricePerL, 
        status: 'Closed' 
      })
      .eq('id', id)

    if (error) {
      alert('Update Error: ' + error.message)
    } else {
      alert("Fuel record updated and finalized successfully.")
      setCalcLiters(0)
      setCalcTotal(0)
      fetchData()
    }
    setUpdatingId(null)
  }

  function handleAmbulanceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selectedId = e.target.value
    const selectedAmb = ambulances.find(a => a.id === selectedId)
    if (selectedAmb) {
      // Automatic fuel product mapping based on vehicle type
      const product = selectedAmb.fuel_type === 'Diesel' ? 'VPower Diesel' : 'VPower Gasoline'
      setFormData({ ...formData, ambulance_id: selectedId, fuel_product: product })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('fuel_requests').insert([{
      ambulance_id: formData.ambulance_id,
      driver_id: formData.driver_id,
      odometer_reading: parseInt(formData.odometer),
      fuel_product: formData.fuel_product,
      status: 'Pending'
    }])
    if (error) alert(error.message)
    else {
      alert('Request Submitted!')
      setFormData({ ambulance_id: '', driver_id: '', odometer: '', fuel_product: '' })
      fetchData()
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex text-slate-800">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: REQUEST LIST */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center">
            <Fuel className="w-6 h-6 mr-2 text-blue-600" /> Fuel Requisition Log
          </h2>

          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>
          ) : requests.map((req) => (
            <div key={req.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-mono text-xs text-gray-400 font-bold">{req.tracking_id}</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">{req.ambulances?.call_sign}</h3>
                  <div className="text-sm text-gray-500 mt-1 flex space-x-4">
                    <span className="flex items-center"><User className="w-3 h-3 mr-1"/> {req.drivers?.full_name}</span>
                    <span className="flex items-center"><Gauge className="w-3 h-3 mr-1"/> {req.odometer_reading} km</span>
                  </div>
                </div>
                
                {(req.status === 'Approved' || req.status === 'Closed') && (
                  <PDFDownloadLink 
                    document={<MyDocument data={req} />} 
                    fileName={`PO-${req.tracking_id}.pdf`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
                  >
                    {({ loading }) => (loading ? 'Loading...' : <><FileText className="w-3 h-3"/> Print PO Slip</>)}
                  </PDFDownloadLink>
                )}
              </div>

              {/* FINANCIAL RECONCILIATION AREA */}
              {req.status === 'Approved' && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">Actual Liters</label>
                    <input 
                      type="number" 
                      step="any"
                      onChange={(e) => setCalcLiters(parseFloat(e.target.value))}
                      placeholder="0.00" 
                      className="w-full p-2 text-sm border rounded bg-white outline-none focus:ring-2 focus:ring-blue-400" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">Actual Total Price (₱)</label>
                    <input 
                      type="number" 
                      step="any"
                      onChange={(e) => setCalcTotal(parseFloat(e.target.value))}
                      placeholder="0.00" 
                      className="w-full p-2 text-sm border rounded bg-white outline-none focus:ring-2 focus:ring-blue-400" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Price/L (Auto)</label>
                    <div className="p-2 text-sm bg-gray-100 border rounded font-mono text-gray-600 h-[38px] flex items-center">
                      {(calcTotal && calcLiters) ? (calcTotal / calcLiters).toFixed(2) : '0.00'}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCloseRecord(req.id)}
                    disabled={updatingId === req.id}
                    className="bg-blue-700 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-blue-800 transition active:scale-95 disabled:bg-gray-400 shadow-sm"
                  >
                    {updatingId === req.id ? 'Finalizing...' : 'Finalize Record'}
                  </button>
                </div>
              )}

              {req.status === 'Closed' && (
                <div className="pt-2 border-t flex justify-between items-center text-xs">
                    <div className="text-gray-500 font-medium">
                      Final Total: <span className="text-gray-900 font-bold">₱ {req.total_amount?.toLocaleString()}</span> 
                      <span className="mx-2 text-gray-300">|</span>
                      Actual Volume: <span className="text-gray-900 font-bold">{req.actual_liters}L</span>
                    </div>
                    <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold border border-green-100 uppercase tracking-tighter flex items-center gap-1">
                      <CheckCircle className="w-3 h-3"/> Record Finalized
                    </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: NEW REQUISITION FORM */}
        <div className="bg-white p-6 rounded-lg shadow-xl border-t-4 border-blue-600 h-fit sticky top-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center uppercase tracking-tight">
            <Fuel className="w-5 h-5 mr-2 text-blue-600" /> New Requisition
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50 p-3 rounded text-xs text-gray-500 border border-gray-200">
              <div className="flex justify-between mb-1 text-[10px] uppercase font-bold">
                <span>Tracking ID:</span>
                <span className="font-mono text-gray-400 italic">Auto-generated</span>
              </div>
              <div className="flex justify-between">
                <span>Today's Date:</span>
                <span className="font-bold text-gray-700">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ambulance Unit</label>
              <select 
                required
                className="w-full p-2.5 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                value={formData.ambulance_id}
                onChange={handleAmbulanceChange}
              >
                <option value="">Select Vehicle...</option>
                {ambulances.map(a => <option key={a.id} value={a.id}>{a.call_sign}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Fuel Product</label>
              <input 
                type="text" 
                disabled 
                value={formData.fuel_product || 'Select Ambulance first...'} 
                className="w-full p-2.5 border rounded-lg text-sm bg-gray-100 font-bold text-gray-600 shadow-sm" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Requesting Driver</label>
              <select 
                required
                className="w-full p-2.5 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                value={formData.driver_id} 
                onChange={(e) => setFormData({...formData, driver_id: e.target.value})}
              >
                <option value="">Select Driver...</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Current Odometer (km)</label>
              <input 
                type="number" 
                required 
                placeholder="000000" 
                className="w-full p-2.5 border rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" 
                value={formData.odometer} 
                onChange={(e) => setFormData({...formData, odometer: e.target.value})} 
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 mt-4"
            >
              SUBMIT REQUISITION
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Pending') return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-[10px] font-bold flex items-center uppercase border border-yellow-200"><Clock className="w-3 h-3 mr-1"/> Pending</span>
  if (status === 'Approved') return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-[10px] font-bold flex items-center uppercase border border-blue-200"><CheckCircle className="w-3 h-3 mr-1"/> Approved</span>
  if (status === 'Closed') return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-[10px] font-bold flex items-center uppercase border border-green-200"><FileText className="w-3 h-3 mr-1"/> Finalized</span>
  if (status === 'Rejected') return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-[10px] font-bold flex items-center uppercase border border-red-200"><AlertCircle className="w-3 h-3 mr-1"/> Rejected</span>
  return null
}