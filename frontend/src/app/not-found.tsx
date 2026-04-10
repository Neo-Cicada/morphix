import Link from 'next/link'
import { ArrowLeft, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col items-center justify-center p-4 antialiased overflow-hidden relative">
      {/* Glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/8 blur-[120px] rounded-full pointer-events-none opacity-40 mix-blend-screen" />

      <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center text-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-10 transition-transform hover:scale-105">
          <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(193,123,79,0.1)]">
            <span className="font-semibold text-2xl text-primary tracking-tighter">M</span>
          </div>
        </Link>

        <div className="size-14 rounded-full bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mb-5">
          <SearchX className="size-7 text-zinc-400" />
        </div>

        <p className="text-5xl font-bold text-zinc-800 mb-4 select-none">404</p>
        <h1 className="text-xl font-semibold text-zinc-100 mb-2">Page not found</h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-7">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col gap-3 w-full">
          <Button
            asChild
            className="w-full h-11 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-medium transition-all hover:scale-[1.02]"
          >
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            className="w-full h-11 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 font-medium"
          >
            <Link href="/">
              <ArrowLeft className="size-4 mr-2" />
              Back to homepage
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
