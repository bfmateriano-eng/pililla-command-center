'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Sidebar from '@/components/Sidebar'
import { Search, Loader2, Download, ClipboardList, Package, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { TripTicketDocument } from '@/components/TripTicketPDF'

// --- 1. TYPES ---
interface GSORecord {
  id: string;
  tracking_id: string;
  created_at: string;
  total_amount: number;
  fuel_product: string;
  actual_liters: number;
  odometer_reading: number;
  ambulances: {
    call_sign: string;
    plate_number: string;
  };
  drivers: {
    full_name: string;
  };
  dispatch_logs: Array<{
    id: string;
    tracking_id: string;
    patient_manifest: any[];
  }>;
}

type SortKey = 'created_at' | 'tracking_id' | 'total_amount';
type SortOrder = 'asc' | 'desc';

export default function GSOPage() {
  const [loading, setLoading] = useState<boolean>(true)
  const [records, setRecords] = useState<GSORecord[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  
  // --- SORT STATE ---
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetchGSORecords()
  }, [])

  async function fetchGSORecords() {
    setLoading(true)
    const { data, error } = await supabase
      .from('fuel_requests')
      .select(`
        *,
        ambulances(call_sign, plate_number),
        drivers(full_name),
        dispatch_logs!linked_fuel_id(id, tracking_id, patient_manifest)
      `)
      .eq('status', 'Closed') 
      .order('created_at', { ascending: false })

    if (!error) setRecords(data as unknown as GSORecord[])
    setLoading(false)
  }

  // --- SORTING LOGIC ---
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const sortedRecords = [...records].sort((a, b) => {
    let aValue: any = a[sortKey];
    let bValue: any = b[sortKey];

    if (sortKey === 'created_at') {
      aValue = new Date(a.created_at).getTime();
      bValue = new Date(b.created_at).getTime();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredRecords = sortedRecords.filter(r => 
    r.tracking_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.ambulances?.call_sign.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort Icon Helper
  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b border-gray-200 gap-4">
          <div className="flex items-center gap-4">
            <img src="/images/lgu-logo.png" className="w-16 h-16 object-contain drop-shadow-md" alt="Pililla Logo" />
            <div>
              <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter flex items-center">
                <ClipboardList className="mr-2 h-6 w-6 text-blue-600" /> GSO Monitoring Ledger
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">General Services Office</p>
                <span className="text-gray-300">|</span>
                <img src="/images/better-pililla.png" alt="Better Pililla" className="h-4 object-contain opacity-70" />
              </div>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search PO ID or Unit..." 
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white text-[10px] uppercase tracking-[0.2em]">
                <th className="p-5 cursor-pointer hover:bg-blue-800 transition-colors" onClick={() => toggleSort('tracking_id')}>
                  <div className="flex items-center">PO Control ID <SortIcon k="tracking_id" /></div>
                </th>
                <th className="p-5">Vehicle Asset</th>
                <th className="p-5">Driver</th>
                <th className="p-5 cursor-pointer hover:bg-blue-800 transition-colors" onClick={() => toggleSort('created_at')}>
                  <div className="flex items-center">Date <SortIcon k="created_at" /></div>
                </th>
                <th className="p-5 cursor-pointer hover:bg-blue-800 transition-colors" onClick={() => toggleSort('total_amount')}>
                  <div className="flex items-center">Expenditure <SortIcon k="total_amount" /></div>
                </th>
                <th className="p-5">Patient Manifest</th>
                <th className="p-5 text-center">Generate Trip Tickets</th>
              </tr>
            </thead>
            <tbody className="text-xs font-bold text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-blue-900 w-10 h-10 opacity-20" />
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-20 text-center text-gray-400 uppercase tracking-widest">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <td className="p-5 font-mono text-blue-600">{rec.tracking_id}</td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-blue-900 uppercase">{rec.ambulances?.call_sign}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{rec.ambulances?.plate_number}</span>
                      </div>
                    </td>
                    <td className="p-5 uppercase">{rec.drivers?.full_name}</td>
                    <td className="p-5 text-gray-500">{new Date(rec.created_at).toLocaleDateString()}</td>
                    <td className="p-5">
                      <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100">
                        ₱{rec.total_amount?.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-5 max-w-[200px]">
                      <div className="truncate text-gray-400 font-medium italic">
                        {rec.dispatch_logs?.flatMap(d => d.patient_manifest?.map(p => p.name)).join(', ') || 'N/A'}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-2 items-center">
                        {rec.dispatch_logs && rec.dispatch_logs.length > 0 ? (
                          rec.dispatch_logs.map((dispatch, index) => (
                            <PDFDownloadLink 
                              key={dispatch.id}
                              document={<TripTicketDocument data={rec} missionIndex={index + 1} />} 
                              fileName={`TripTicket-${rec.tracking_id}-${(index + 1).toString().padStart(2, '0')}.pdf`}
                              className="w-full flex items-center justify-center gap-2 bg-white border-2 border-blue-100 text-blue-700 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all text-[10px] font-black uppercase tracking-tighter"
                            >
                              {({ loading }) => (
                                loading ? '...' : <><Download className="w-3 h-3" /> Ticket #{(index + 1).toString().padStart(2, '0')}</>
                              )}
                            </PDFDownloadLink>
                          ))
                        ) : (
                          <div className="flex items-center gap-1 text-orange-400 text-[10px] uppercase">
                            <Package className="w-3 h-3" /> No Mission Linked
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}