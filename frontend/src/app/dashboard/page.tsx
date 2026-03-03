import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col items-center justify-center p-4 selection:bg-primary/30 antialiased overflow-hidden relative">
      {/* Subtle Glow Effect */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none opacity-50 mix-blend-screen" />
      
      <div className="z-10 text-center space-y-6 relative flex flex-col items-center">
        <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 mx-auto shadow-[0_0_30px_rgba(59,130,246,0.15)] mb-2">
          <span className="font-semibold text-4xl text-primary tracking-tighter">M</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-zinc-100">
          Welcome to Morphix
        </h1>
        
        <p className="text-zinc-400 font-medium text-lg">
          Logged in as <span className="text-zinc-300">{user.email}</span>
        </p>

        <form action={async () => {
          'use server'
          const supabase = await createClient()
          await supabase.auth.signOut()
          redirect('/login')
        }} className="pt-8">
          <Button type="submit" variant="outline" className="h-11 px-8 rounded-full border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-all">
            Log out
          </Button>
        </form>
      </div>
    </div>
  )
}
