'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Sidebar from '@/components/Sidebar'
import { 
  Ambulance, Clock, User, Plus, MapPin, Activity, Save, Search, 
  Edit2, X, Users, ArrowRight, Fuel, AlertCircle, Loader2, Calendar, Filter, CheckCircle2, Printer
} from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { TripTicketDocument } from '@/components/TripTicketPDF'

// TYPES
type Destination = {
  name: string
  time: string
  status: string
}

type PatientEntry = {
  tempId: number 
  db_id?: string 
  name: string
  age: string
  sex: string
  destinations: Destination[]
}

export default function DispatchPage() {
  // --- STATE ---
  const [loading, setLoading] = useState(true)
  const [dispatches, setDispatches] = useState<any[]>([])
  const [ambulances, setAmbulances] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [availableFuelSlips, setAvailableFuelSlips] = useState<any[]>([])

  // --- FILTER STATE ---
  const [statusFilter, setStatusFilter] = useState('Pending')
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])

  // --- FORM STATE ---
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dispatchType, setDispatchType] = useState('Medical Emergency')
  const [ambulanceId, setAmbulanceId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [patientManifest, setPatientManifest] = useState<PatientEntry[]>([])

  const [currentPatient, setCurrentPatient] = useState<PatientEntry>({
    tempId: 0, name: '', age: '', sex: 'M', destinations: []
  })
  
  const [patientSearch, setPatientSearch] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [destInput, setDestInput] = useState('')

  useEffect(() => {
    loadData()
  }, [statusFilter, dateFilter])

  async function loadData() {
    setLoading(true)
    try {
      const { data: amb } = await supabase.from('ambulances').select('*').eq('is_active', true).order('call_sign')
      const { data: drv } = await supabase.from('drivers').select('*').eq('is_active', true).order('full_name')
      
      const { data: fuel } = await supabase
        .from('fuel_requests')
        .select('id, tracking_id, fuel_product')
        .in('status', ['Approved', 'Closed'])

      // Fetch dispatch logs with ambulance and driver info always present
      let query = supabase.from('dispatch_logs')
        .select(`
          *, 
          ambulances(call_sign, plate_number), 
          drivers(full_name),
          fuel_requests:linked_fuel_id(*) 
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter)
      }
      
      query = query.gte('created_at', `${dateFilter}T00:00:00`)
                  .lte('created_at', `${dateFilter}T23:59:59`)

      const { data: dsp, error: dspError } = await query

      if (dspError) throw dspError
      setAmbulances(amb || [])
      setDrivers(drv || [])
      setAvailableFuelSlips(fuel || [])
      setDispatches(dsp || [])
    } catch (err: any) {
      console.error("Fetch error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  async function linkFuelToDispatch(dispatchId: string, fuelId: string, trackingId: string) {
    if (!fuelId) return
    const confirmLink = window.confirm(`Confirm linking Fuel PO [${trackingId}] to this mission?`)
    if (!confirmLink) return

    const { error } = await supabase
      .from('dispatch_logs')
      .update({ linked_fuel_id: fuelId })
      .eq('id', dispatchId)

    if (error) {
        alert("Linking Error: " + error.message)
    } else {
        alert("Fuel Slip Attached Successfully.")
        loadData()
    }
  }

  async function closeMission(dispatchId: string) {
    const confirmClose = window.confirm("Are you sure you want to CLOSE this mission?")
    if (!confirmClose) return

    const { error } = await supabase
      .from('dispatch_logs')
      .update({ status: 'Closed' })
      .eq('id', dispatchId)

    if (error) alert(error.message)
    else {
      alert("Mission Status: COMPLETED")
      loadData()
    }
  }

  function getStatusStyle(status: string) {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Open': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Closed': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  async function handleSearch(query: string) {
    setPatientSearch(query); setCurrentPatient({ ...currentPatient, name: query }) 
    if (query.length > 2) {
      const { data } = await supabase.from('patients').select('*').ilike('full_name', `%${query}%`).limit(5)
      setSearchResults(data || []); setShowResults(true)
    } else { setShowResults(false) }
  }

  function selectDbPatient(p: any) {
    setCurrentPatient({ ...currentPatient, db_id: p.id, name: p.full_name, age: p.age?.toString() || '', sex: p.sex || 'M' })
    setPatientSearch(p.full_name); setShowResults(false)
  }

  function addDestinationToCurrent() {
    if (!destInput) return
    const newDest: Destination = { name: destInput, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), status: 'Arrived' }
    setCurrentPatient({ ...currentPatient, destinations: [...currentPatient.destinations, newDest] })
    setDestInput('')
  }

  function removeDestFromCurrent(idx: number) {
    const updated = [...currentPatient.destinations]; updated.splice(idx, 1);
    setCurrentPatient({ ...currentPatient, destinations: updated })
  }

  function addPatientToManifest() {
    if (!currentPatient.name) return alert("Patient Name is required")
    setPatientManifest([...patientManifest, { ...currentPatient, tempId: Date.now() }])
    setCurrentPatient({ tempId: 0, name: '', age: '', sex: 'M', destinations: [] })
    setPatientSearch('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (patientManifest.length === 0) return alert("Please add at least one patient.")
    const payload = {
      dispatch_type: dispatchType, ambulance_id: ambulanceId, driver_id: driverId,
      patient_manifest: patientManifest, patient_name: patientManifest[0].name, 
      patient_age: parseInt(patientManifest[0].age) || 0, patient_sex: patientManifest[0].sex,
    }
    const res = isEditing && editingId 
      ? await supabase.from('dispatch_logs').update(payload).eq('id', editingId)
      : await supabase.from('dispatch_logs').insert([{ ...payload, tracking_id: `DSP-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`, status: 'Pending' }])
    
    if (res.error) alert(res.error.message)
    else {
      alert(isEditing ? 'Updated!' : 'Logged!'); setIsEditing(false); setEditingId(null);
      setPatientManifest([]); setAmbulanceId(''); setDriverId(''); loadData()
    }
  }

  function startEdit(dispatch: any) {
    setIsEditing(true); setEditingId(dispatch.id); setDispatchType(dispatch.dispatch_type);
    setAmbulanceId(dispatch.ambulance_id); setDriverId(dispatch.driver_id);
    setPatientManifest(Array.isArray(dispatch.patient_manifest) ? dispatch.patient_manifest : []);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex text-slate-800">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center tracking-tight">
              <Activity className="w-7 h-7 mr-2 text-red-600" /> Mission Board
            </h2>
            
            <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border text-slate-800">
              <div className="flex items-center text-gray-400 px-2 border-r">
                <Calendar className="w-4 h-4 mr-2" />
                <input 
                  type="date" 
                  className="text-xs outline-none text-gray-700 font-bold" 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)} 
                />
              </div>
              <div className="flex items-center text-gray-400 px-2">
                <Filter className="w-4 h-4 mr-2" />
                <select 
                  className="text-xs outline-none text-gray-700 font-bold bg-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Open">In Progress</option>
                  <option value="Closed">Completed</option>
                  <option value="All">All Status</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-400" /></div>
          ) : (
            <div className="space-y-4">
              {dispatches.map((dispatch) => (
                <div key={dispatch.id} className={`bg-white border-l-8 ${dispatch.status === 'Closed' ? 'border-green-500' : 'border-red-500'} rounded-lg shadow-md p-5 relative transition-all hover:shadow-lg`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-black text-gray-400 font-mono tracking-tighter">{dispatch.tracking_id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusStyle(dispatch.status)}`}>
                          {dispatch.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-black text-gray-900 leading-tight uppercase">{dispatch.dispatch_type}</h3>
                      
                      <div className="mt-4 space-y-2">
                        {Array.isArray(dispatch.patient_manifest) && dispatch.patient_manifest.map((p: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-md border border-gray-100">
                            <div className="flex items-center font-bold text-sm text-gray-800">
                              <User className="w-4 h-4 mr-2 text-blue-600" />
                              {p.name} <span className="text-gray-400 ml-2 font-normal">({p.sex}/{p.age})</span>
                            </div>
                            <div className="ml-6 text-xs text-gray-500 mt-1 font-medium italic">
                              {Array.isArray(p.destinations) && p.destinations.map((d: Destination) => d.name).join(' → ')}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* --- PRINTING & LINKING LOGIC (NO PO REQUIREMENT) --- */}
                      <div className="mt-5 pt-4 border-t border-dashed flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                          {/* PRINT BUTTON: Always visible */}
                          <PDFDownloadLink 
                            document={
                              <TripTicketDocument 
                                data={{
                                  // Fallback to Dispatch details if no Fuel PO is linked
                                  ...(dispatch.fuel_requests || { tracking_id: dispatch.tracking_id }), 
                                  drivers: dispatch.drivers, 
                                  ambulances: dispatch.ambulances,
                                  dispatch_logs: [dispatch],
                                  created_at: dispatch.created_at
                                }} 
                                missionIndex={1} 
                              />
                            } 
                            fileName={`TripTicket-${dispatch.tracking_id}.pdf`}
                            className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-blue-800 transition-all shadow-md active:scale-95"
                          >
                            {({ loading }) => (
                              loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Printer className="w-3 h-3" /> Print Trip Ticket</>
                            )}
                          </PDFDownloadLink>

                          {dispatch.fuel_requests && (
                            <div className="flex items-center bg-orange-50 text-orange-700 px-3 py-2 rounded-lg font-bold text-[10px] border border-orange-200 uppercase tracking-tight">
                              <Fuel className="w-3.5 h-3.5 mr-2" /> Linked PO: {dispatch.fuel_requests.tracking_id}
                            </div>
                          )}
                        </div>

                        {!dispatch.fuel_requests && (
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                              <select 
                                className="text-[10px] font-black bg-white border border-gray-200 text-blue-600 rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:bg-blue-50 transition-colors flex-1 sm:flex-none uppercase"
                                onChange={(e) => {
                                  const selected = availableFuelSlips.find(s => s.id === e.target.value);
                                  if(selected) linkFuelToDispatch(dispatch.id, selected.id, selected.tracking_id);
                                }}
                              >
                                <option value="">+ Link Fuel PO (Optional)</option>
                                {availableFuelSlips.map(slip => (
                                    <option key={slip.id} value={slip.id}>{slip.tracking_id} ({slip.fuel_product})</option>
                                ))}
                              </select>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right ml-4 space-y-2">
                        <div className="font-black text-gray-800 bg-gray-100 px-3 py-1.5 rounded-lg text-sm mb-2 shadow-inner uppercase">
                        {dispatch.ambulances?.call_sign || 'UNASSIGNED'}
                      </div>
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-tight mb-4">{dispatch.drivers?.full_name || 'No Driver'}</div>
                      
                      {dispatch.status !== 'Closed' && (
                        <button 
                          onClick={() => closeMission(dispatch.id)}
                          className="bg-green-600 text-white text-[10px] font-black px-4 py-2 rounded-lg flex items-center hover:bg-green-700 w-full justify-center shadow-sm mb-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> CLOSE MISSION
                        </button>
                      )}

                      <button onClick={() => startEdit(dispatch)} className="bg-white text-blue-600 text-xs font-bold border-2 border-blue-100 px-4 py-2 rounded-lg hover:bg-blue-50 transition-all flex items-center justify-center w-full">
                        <Edit2 className="w-3 h-3 mr-2" /> EDIT LOG
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- FORM PANEL --- */}
        <div className={`bg-white p-6 rounded-2xl shadow-2xl border-t-8 h-fit sticky top-8 ${isEditing ? 'border-orange-500' : 'border-blue-900'}`}>
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center uppercase tracking-tight">
            {isEditing ? 'Update Dispatch' : 'New Mission Entry'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mission Type</label>
                <select className="w-full mt-1 p-2.5 border rounded-lg bg-white text-sm font-bold" value={dispatchType} onChange={(e) => setDispatchType(e.target.value)}>
                  <option>Medical Emergency</option>
                  <option>Hospital Transfer</option>
                  <option>Road Incident</option>
                  <option>Others</option>
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <select required className="p-2.5 border rounded-lg text-sm bg-white font-bold" value={ambulanceId} onChange={(e) => setAmbulanceId(e.target.value)}>
                  <option value="">Select Ambulance</option>
                  {ambulances.map(a => <option key={a.id} value={a.id}>{a.call_sign}</option>)}
                </select>
                <select required className="p-2.5 border rounded-lg text-sm bg-white font-bold" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                  <option value="">Select Driver</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select>
              </div>
            </div>

            <div className="border-2 border-dashed border-blue-100 p-4 rounded-xl bg-blue-50/50">
              <label className="text-xs font-black text-blue-900 uppercase">Patient Information</label>
              <div className="relative mt-2">
                <input type="text" placeholder="Full Name" className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={patientSearch} onChange={(e) => handleSearch(e.target.value)} />
                {showResults && (
                  <div className="absolute top-11 w-full bg-white shadow-xl border z-20 rounded-lg max-h-40 overflow-auto">
                    {searchResults.map(p => (
                      <div key={p.id} onClick={() => selectDbPatient(p)} className="p-3 text-sm hover:bg-blue-50 cursor-pointer border-b last:border-0 font-medium">
                        {p.full_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <input type="number" placeholder="Age" className="w-20 p-2.5 border rounded-lg text-sm" value={currentPatient.age} onChange={(e) => setCurrentPatient({...currentPatient, age: e.target.value})} />
                <select className="flex-1 p-2.5 border rounded-lg text-sm font-bold" value={currentPatient.sex} onChange={(e) => setCurrentPatient({...currentPatient, sex: e.target.value})}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              <div className="mt-4 pt-3 border-t border-blue-100">
                <div className="flex gap-2">
                  <input type="text" placeholder="Add Destination" className="flex-1 p-2.5 border rounded-lg text-xs outline-none" value={destInput} onChange={(e) => setDestInput(e.target.value)} />
                  <button type="button" onClick={addDestinationToCurrent} className="bg-blue-900 text-white px-4 rounded-lg text-xs font-bold">ADD</button>
                </div>
                <div className="mt-3 space-y-1">
                  {currentPatient.destinations.map((d, i) => (
                    <div key={i} className="text-[10px] flex justify-between bg-white px-3 py-1.5 rounded-lg border font-bold text-gray-600">
                      <span>📍 {d.name}</span>
                      <button type="button" onClick={() => removeDestFromCurrent(i)} className="text-red-500 hover:text-red-700 font-black">×</button>
                    </div>
                  ))}
                </div>
              </div>
              <button type="button" onClick={addPatientToManifest} className="w-full mt-4 bg-blue-100 text-blue-900 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-200 transition-colors">
                Add to Manifest
              </button>
            </div>

            {patientManifest.length > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Onboard Manifest ({patientManifest.length})</label>
                {patientManifest.map((p) => (
                  <div key={p.tempId} className="bg-gray-50 border p-3 rounded-xl relative text-xs shadow-sm">
                    <div className="font-black text-gray-800">{p.name} <span className="text-gray-400 font-normal">({p.sex}/{p.age})</span></div>
                    {p.destinations.length > 0 && (
                      <div className="text-[9px] text-blue-500 mt-1 font-bold italic">
                        {p.destinations.map(d => d.name).join(' → ')}
                      </div>
                    )}
                    <button type="button" onClick={() => { setPatientManifest(patientManifest.filter(pm => pm.tempId !== p.tempId)) }} className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className={`w-full py-4 rounded-xl text-white font-black shadow-xl transition-all active:scale-95 text-sm uppercase tracking-widest ${isEditing ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-700 hover:bg-green-800'}`}>
              {isEditing ? 'SAVE MISSION UPDATES' : 'CONFIRM DISPATCH'}
            </button>
            {isEditing && (
              <button type="button" onClick={() => { setIsEditing(false); setPatientManifest([]); }} className="w-full text-xs font-bold text-gray-400 uppercase tracking-tighter hover:text-gray-600">Cancel Edit Mode</button>
            )}
          </form>
        </div>
      </main>
    </div>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}