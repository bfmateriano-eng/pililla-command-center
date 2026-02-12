'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ShieldCheck, Mail, Lock, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email, password
      })

      if (error) throw error

      if (data?.user) {
        // Fetch role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        // Role-based routing
        if (roleData?.role === 'HEAD') {
          window.location.assign('/dashboard/analytics')
        } else {
          window.location.assign('/operations/dispatch')
        }
      }
    } catch (err: any) {
      alert(err.message || "Access Denied: Invalid Credentials")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Subtle Branding */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-900/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-900/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/images/lgu-logo.png" 
            alt="Pililla LGU Logo" 
            className="w-24 h-24 object-contain drop-shadow-2xl mb-4" 
          />
          <h2 className="text-white font-black text-2xl uppercase tracking-tighter text-center">
            MDRRMO Command Center
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              Municipality of Pililla
            </p>
            <span className="text-slate-600 text-[10px]">|</span>
            <img src="/images/better-pililla.png" alt="Better Pililla" className="h-3 object-contain opacity-60" />
          </div>
        </div>

        {/* Login Card */}
        <form 
          onSubmit={handleLogin} 
          className="bg-white p-8 rounded-[2rem] shadow-2xl space-y-6 border border-slate-100"
        >
          <div className="text-center mb-4">
            <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-900 mb-2">
               <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">System Authentication</h1>
            <p className="text-xs text-slate-400 font-medium">Authorized Personnel Access Only</p>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="email" 
                placeholder="Official Email Address" 
                required 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="password" 
                placeholder="Secure Password" 
                required 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] disabled:bg-slate-300 flex items-center justify-center"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Authenticating...</>
            ) : (
              'Access Command Center'
            )}
          </button>
          
          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
            PROVINCE OF RIZAL • PHILIPPINES
          </p>
        </form>
      </div>
    </div>
  )
}