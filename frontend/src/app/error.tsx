'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertOctagon, ArrowLeft, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col items-center justify-center p-4 antialiased overflow-hidden relative">
      {/* Glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-500/8 blur-[120px] rounded-full pointer-events-none opacity-50 mix-blend-screen" />

      <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center text-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-10 transition-transform hover:scale-105">
          <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(193,123,79,0.1)]">
            <span className="font-semibold text-2xl text-primary tracking-tighter">M</span>
          </div>
        </Link>

        <div className="size-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
          <AlertOctagon className="size-7 text-red-400" />
        </div>

        <h1 className="text-xl font-semibold text-zinc-100 mb-2">Something went wrong</h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-1">
          An unexpected error occurred. You can try refreshing the page or go back to the dashboard.
        </p>

        {error.digest && (
          <p className="text-xs text-zinc-600 font-mono mt-2">Error ID: {error.digest}</p>
        )}

        <div className="flex flex-col gap-3 w-full mt-7">
          <Button
            onClick={reset}
            className="w-full h-11 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-medium transition-all hover:scale-[1.02]"
          >
            <RefreshCcw className="size-4 mr-2" />
            Try again
          </Button>

          <Button
            asChild
            variant="ghost"
            className="w-full h-11 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 font-medium"
          >
            <Link href="/dashboard">
              <ArrowLeft className="size-4 mr-2" />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
