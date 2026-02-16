'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Sidebar from '@/components/Sidebar'
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { Check, X, FileCheck, Clock, Loader2, Award, User } from 'lucide-react'

// --- 1. STRICT TYPES ---
interface Ambulance {
  plate_number: string;
  call_sign: string;
}

interface Driver {
  full_name: string;
}

interface FuelRequest {
  id: string;
  tracking_id: string;
  status: string;
  fuel_product: string;
  odometer_reading: number;
  approved_at: string | null;
  created_at: string;
  approved_by_name: string | null; // New field for dynamic approver
  ambulances: Ambulance;
  drivers: Driver;
}

// Approver Options Constant
const APPROVERS = [
  { name: 'Engr. Joymee Vidanes-Labiste', title: 'Head, Command Center', file: 'joymee.png' },
  { name: 'Engr. Eligio D. Villareal', title: 'Head, GSO', file: 'bossv.png' }
];

// --- 2. PDF STYLING ---
const styles = StyleSheet.create({
  page: { flexDirection: 'row', flexWrap: 'wrap', padding: 20, backgroundColor: '#fff' },
  quadrant: { 
    width: '48%', 
    height: '48%', 
    border: '1pt solid #000', 
    padding: 15, 
    margin: '1%',
    flexDirection: 'column'
  },
  header: { 
    fontSize: 8, 
    textAlign: 'center', 
    marginBottom: 10,
    lineHeight: 1.5 
  },
  controlNo: { 
    fontSize: 8, 
    textAlign: 'right', 
    fontWeight: 'bold', 
    marginBottom: 5 
  },
  title: { 
    fontSize: 11, 
    textAlign: 'center', 
    marginBottom: 15, 
    fontWeight: 'bold', 
    textDecoration: 'underline' 
  },
  infoSection: { marginBottom: 10 },
  row: { 
    flexDirection: 'row', 
    borderBottom: '0.5pt solid #ccc', 
    paddingVertical: 3 
  },
  label: { fontSize: 8, width: '35%', color: '#333' },
  value: { fontSize: 8, width: '65%', fontWeight: 'bold' },
  
  table: { marginTop: 15, border: '1pt solid #000' },
  tableHeader: { 
    flexDirection: 'row', 
    backgroundColor: '#f0f0f0', 
    borderBottom: '1pt solid #000' 
  },
  tableCell: { 
    fontSize: 7, 
    padding: 5, 
    borderRight: '1pt solid #000', 
    textAlign: 'center' 
  },
  tableRow: { flexDirection: 'row', height: 40 }, 

  signatureSection: { 
    marginTop: 'auto', 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    paddingTop: 10
  },
  sigBox: { width: '45%', textAlign: 'center' },
  sigLine: { borderTop: '0.5pt solid #000', marginTop: 15, paddingTop: 2 },
  sigText: { fontSize: 7, color: '#444' },
  driverName: { fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase' },

  adminSignature: { 
    marginTop: 10, 
    textAlign: 'center', 
    borderTop: '0.5pt solid #000', 
    paddingTop: 3,
    alignItems: 'center'
  },
  eSignature: {
    width: 60,
    height: 'auto',
    marginBottom: -15, // Overlap slightly with name for realism
    zIndex: 10
  },
  copyLabel: { 
    marginTop: 5, 
    fontSize: 7, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    color: '#888' 
  }
})

// --- 3. PDF COMPONENTS ---
export const POSlipPDF = ({ data, copyLabel }: { data: FuelRequest, copyLabel: string }) => {
  // Determine which signature and title to show based on data.approved_by_name
  const approver = APPROVERS.find(a => a.name === data.approved_by_name) || APPROVERS[0];

  return (
    <View style={styles.quadrant}>
      <View style={styles.header}>
        <Text>REGION IV-A CALABARZON</Text>
        <Text>Province of Rizal</Text>
        <Text>Municipal Government of Pililla</Text>
      </View>
      <Text style={styles.controlNo}>Control No: {data.tracking_id}</Text>
      <Text style={styles.title}>PURCHASE ORDER SLIP</Text>
      <View style={styles.infoSection}>
        <View style={styles.row}>
          <Text style={styles.label}>Date Approved:</Text>
          <Text style={styles.value}>{data.approved_at ? new Date(data.approved_at).toLocaleDateString() : 'PENDING'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Plate No / Call Sign:</Text>
          <Text style={styles.value}>{data.ambulances?.plate_number} / {data.ambulances?.call_sign}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Requested Odometer:</Text>
          <Text style={styles.value}>{data.odometer_reading} km</Text>
        </View>
      </View>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, { width: '20%' }]}>QTY (L)</Text>
          <Text style={[styles.tableCell, { width: '40%' }]}>PRODUCT</Text>
          <Text style={[styles.tableCell, { width: '40%', borderRight: 0 }]}>TOTAL AMOUNT</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: '20%' }]}></Text>
          <Text style={[styles.tableCell, { width: '40%', fontSize: 8, fontWeight: 'bold' }]}>{data.fuel_product}</Text>
          <Text style={[styles.tableCell, { width: '40%', borderRight: 0 }]}></Text>
        </View>
      </View>
      <View style={styles.signatureSection}>
        <View style={styles.sigBox}>
          <Text style={styles.driverName}>{data.drivers?.full_name}</Text>
          <View style={styles.sigLine}>
            <Text style={styles.sigText}>Requesting Driver Signature</Text>
          </View>
        </View>
        <View style={styles.sigBox}>
          <Text style={styles.driverName}>{" "}</Text>
          <View style={styles.sigLine}>
            <Text style={styles.sigText}>Gas Station Personnel</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.adminSignature}>
        {/* E-SIGNATURE IMAGE */}
        <Image 
          src={`/signatures/${approver.file}`} 
          style={styles.eSignature} 
        />
        <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{approver.name.toUpperCase()}</Text>
        <Text style={{ fontSize: 6 }}>{approver.title} / Approving Officer</Text>
      </View>
      <Text style={styles.copyLabel}>*** {copyLabel} ***</Text>
    </View>
  );
};

export const MyDocument = ({ data }: { data: FuelRequest }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <POSlipPDF data={data} copyLabel="COMMAND CENTER COPY" />
      <POSlipPDF data={data} copyLabel="GAS STATION COPY" />
      <POSlipPDF data={data} copyLabel="ACCOUNTING COPY" />
      <POSlipPDF data={data} copyLabel="GSO COPY" />
    </Page>
  </Document>
)

// --- 4. MAIN PAGE COMPONENT ---
export default function ApprovalsPage() {
  const [requests, setRequests] = useState<FuelRequest[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [authorized, setAuthorized] = useState<boolean>(false)
  const [selectedApprover, setSelectedApprover] = useState(APPROVERS[0].name)

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
        fetchRequests()
      }
    }
    checkAccess()
  }, [])

  async function fetchRequests() {
    setLoading(true)
    const { data } = await supabase
      .from('fuel_requests')
      .select('*, ambulances(plate_number, call_sign), drivers(full_name)')
      .eq('status', 'Pending')
      .order('created_at', { ascending: false })
    setRequests(data as FuelRequest[] || [])
    setLoading(false)
  }

  async function handleAction(id: string, newStatus: string) {
    const { error } = await supabase
      .from('fuel_requests')
      .update({ 
        status: newStatus,
        approved_at: newStatus === 'Approved' ? new Date().toISOString() : null,
        approved_by_name: newStatus === 'Approved' ? selectedApprover : null
      })
      .eq('id', id)
    
    if (error) alert(error.message)
    else fetchRequests()
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-10 pb-6 border-b border-gray-200 gap-6">
          <div className="flex items-center gap-4">
            <img 
              src="/images/lgu-logo.png" 
              alt="Pililla LGU Logo" 
              className="w-16 h-16 object-contain drop-shadow-md" 
            />
            <div>
              <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter flex items-center">
                <FileCheck className="mr-2 h-6 w-6 text-green-600" /> Fuel Requisition Approvals
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Administrative Authorization Portal</p>
                <span className="text-gray-300">|</span>
                <img src="/images/better-pililla.png" alt="Better Pililla" className="h-4 object-contain opacity-80" />
              </div>
            </div>
          </div>
          
          {/* APPROVER SELECTOR DROPDOWN */}
          <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-2 w-full lg:w-80">
            <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest block flex items-center gap-2">
              <User className="w-3 h-3" /> Set Active Approver
            </label>
            <select 
              value={selectedApprover}
              onChange={(e) => setSelectedApprover(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {APPROVERS.map(app => (
                <option key={app.name} value={app.name}>{app.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-900 opacity-20" />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white p-20 rounded-3xl shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <Clock className="w-10 h-10 text-gray-200" />
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No pending fuel requests at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {requests.map((req) => (
              <div key={req.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center transition-all hover:shadow-md group">
                <div className="flex items-center gap-6 w-full">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-900 transition-colors">
                    <Award className="w-6 h-6 text-blue-900 group-hover:text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter font-mono">{req.tracking_id}</span>
                    <h3 className="text-xl font-black text-blue-900 uppercase tracking-tight">{req.ambulances?.call_sign}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <UserIcon className="w-3 h-3" /> {req.drivers?.full_name}
                      </p>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                        {req.fuel_product}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-6 md:mt-0 w-full md:w-auto">
                  <button 
                    onClick={() => handleAction(req.id, 'Rejected')}
                    className="flex-1 md:flex-none p-4 text-red-600 hover:bg-red-50 rounded-xl border border-red-100 transition-all active:scale-95"
                    title="Reject Request"
                  >
                    <X className="w-6 h-6 mx-auto" />
                  </button>
                  
                  <div className="flex flex-col gap-2 flex-[2] md:flex-none">
                    <button 
                      onClick={() => handleAction(req.id, 'Approved')}
                      className="bg-green-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-green-700 shadow-lg shadow-green-100 flex items-center justify-center transition-all active:scale-95"
                    >
                      <Check className="w-4 h-4 mr-2" /> Approve
                    </button>
                    
                    {/* Pass the dynamic approver to the PDF link as well for review */}
                    <PDFDownloadLink 
                      document={<MyDocument data={{...req, approved_by_name: selectedApprover}} />} 
                      fileName={`PO-${req.tracking_id}.pdf`}
                      className="text-[10px] text-blue-600 text-center font-black uppercase tracking-tighter hover:text-blue-800 underline"
                    >
                      {({ loading }) => (loading ? 'Preparing PO...' : 'Review PDF Slip')}
                    </PDFDownloadLink>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// User icon helper
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}