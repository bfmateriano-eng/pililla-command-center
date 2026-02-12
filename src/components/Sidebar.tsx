'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Activity, 
  Fuel, 
  BarChart3, 
  Users, 
  Truck, 
  FileCheck, 
  ClipboardList, 
  LogOut,
  ShieldCheck,
  TrendingUp
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    async function getRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('id', user.id)
          .single()
        setRole(data?.role || 'STAFF')
      }
    }
    getRole()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.assign('/')
  }

  // Define authorization flags
  const isHead = role === 'HEAD'
  const isGSO = role === 'GSO'
  const isStaff = role === 'STAFF'

  return (
    <aside className="w-64 bg-[#0f172a] h-screen fixed left-0 top-0 text-slate-300 flex flex-col border-r border-slate-800 z-50">
      {/* Branding Section */}
      <div className="p-6 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <img 
            src="/images/lgu-logo.png" 
            alt="LGU Logo" 
            className="w-10 h-10 object-contain drop-shadow-md" 
          />
          <div>
            <h1 className="text-white font-black text-sm uppercase tracking-tighter leading-none">MDRRMO</h1>
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mt-1">Pililla, Rizal</p>
          </div>
        </div>
        <div className="mt-4 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center gap-2">
           <ShieldCheck className="w-3 h-3 text-blue-400" />
           <span className="text-[10px] font-black uppercase text-slate-400">{role || 'Authenticating...'}</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {/* OPERATIONS GROUP (Staff & Head) */}
        {(isStaff || isHead) && (
          <>
            <div className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Operations</div>
            <SidebarLink href="/operations/dispatch" icon={<Activity className="w-4 h-4" />} label="Mission Board" active={pathname === '/operations/dispatch'} />
            <SidebarLink href="/operations/fuel" icon={<Fuel className="w-4 h-4" />} label="Fuel Requisition" active={pathname === '/operations/fuel'} />
          </>
        )}

        {/* ASSET MONITORING (GSO & Head) */}
        {(isGSO || isHead) && (
          <>
            <div className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Asset Monitoring</div>
            <SidebarLink 
              href="/dashboard/gso" 
              icon={<ClipboardList className="w-4 h-4" />} 
              label="GSO PO Ledger" 
              active={pathname === '/dashboard/gso'} 
            />
            <SidebarLink 
              href="/dashboard/gso/analytics" 
              icon={<TrendingUp className="w-4 h-4" />} 
              label="GSO Analytics" 
              active={pathname === '/dashboard/gso/analytics'} 
            />
          </>
        )}

        {/* ADMINISTRATIVE GROUP (Head Only) */}
        {isHead && (
          <>
            <div className="px-3 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Administration</div>
            <SidebarLink href="/dashboard/analytics" icon={<BarChart3 className="w-4 h-4" />} label="Data Analytics" active={pathname === '/dashboard/analytics'} />
            <SidebarLink href="/dashboard/approvals" icon={<FileCheck className="w-4 h-4" />} label="Fuel Approvals" active={pathname === '/dashboard/approvals'} />
            <SidebarLink href="/dashboard/drivers" icon={<Users className="w-4 h-4" />} label="Personnel Registry" active={pathname === '/dashboard/drivers'} />
            <SidebarLink href="/dashboard/fleet" icon={<Truck className="w-4 h-4" />} label="Fleet Registry" active={pathname === '/dashboard/fleet'} />
          </>
        )}
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

function SidebarLink({ href, icon, label, active }: { href: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}