'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  ClipboardList, 
  Fuel, 
  CheckSquare, 
  Truck, 
  Users, 
  LogOut,
  Shield
} from 'lucide-react'

export default function Sidebar() {
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    async function getUserRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('id', user.id)
          .single()
        setRole(data?.role || 'STAFF')
      }
      setLoading(false)
    }
    getUserRole()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return <div className="w-64 bg-gray-900 h-screen" />

  return (
    <div className="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-gray-800 flex items-center gap-3">
        <Shield className="text-blue-500" />
        <span className="font-bold tracking-tight">PILILLA COMCEN</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {/* SHARED ACCESS: STAFF & HEAD */}
        <p className="text-gray-500 text-[10px] uppercase font-bold px-2 mb-2">Operations</p>
        <Link href="/operations/dispatch" className={`flex items-center p-2 rounded hover:bg-gray-800 ${pathname === '/operations/dispatch' ? 'bg-blue-600' : ''}`}>
          <ClipboardList className="w-4 h-4 mr-3" /> Dispatch Log
        </Link>
        <Link href="/operations/fuel" className={`flex items-center p-2 rounded hover:bg-gray-800 ${pathname === '/operations/fuel' ? 'bg-blue-600' : ''}`}>
          <Fuel className="w-4 h-4 mr-3" /> Fuel Request
        </Link>

        {/* HEAD ONLY ACCESS */}
        {role === 'HEAD' && (
          <>
            <p className="text-gray-500 text-[10px] uppercase font-bold px-2 mt-6 mb-2">Admin / Management</p>
            <Link href="/dashboard/analytics" className={`flex items-center p-2 rounded hover:bg-gray-800 ${pathname === '/dashboard/analytics' ? 'bg-blue-600' : ''}`}>
              <LayoutDashboard className="w-4 h-4 mr-3" /> Analytics
            </Link>
            <Link href="/dashboard/approvals" className={`flex items-center p-2 rounded hover:bg-gray-800 ${pathname === '/dashboard/approvals' ? 'bg-blue-600' : ''}`}>
              <CheckSquare className="w-4 h-4 mr-3" /> Fuel Approvals
            </Link>
            <Link href="/dashboard/fleet" className={`flex items-center p-2 rounded hover:bg-gray-800 ${pathname === '/dashboard/fleet' ? 'bg-blue-600' : ''}`}>
              <Truck className="w-4 h-4 mr-3" /> Fleet Registry
            </Link>
            <Link href="/dashboard/drivers" className={`flex items-center p-2 rounded hover:bg-gray-800 ${pathname === '/dashboard/drivers' ? 'bg-blue-600' : ''}`}>
              <Users className="w-4 h-4 mr-3" /> Personnel
            </Link>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button onClick={handleLogout} className="flex items-center w-full p-2 text-red-400 hover:bg-red-900/20 rounded transition">
          <LogOut className="w-4 h-4 mr-3" /> Sign Out
        </button>
      </div>
    </div>
  )
}