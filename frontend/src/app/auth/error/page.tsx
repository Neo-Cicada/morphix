import Link from 'next/link'
import { AlertTriangle, ArrowLeft, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  'no_code': {
    title: 'Missing authentication code',
    description: 'The authentication link is incomplete or malformed. Please request a new link.',
  },
  'exchange_failed': {
    title: 'Authentication failed',
    description: 'We couldn\'t verify your identity. The link may have expired or already been used.',
  },
  'default': {
    title: 'Authentication error',
    description: 'Something went wrong during sign in. Please try again or contact support if the issue persists.',
  },
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; message?: string }>
}) {
  const params = await searchParams
  const errorCode = params.code ?? 'default'
  const customMessage = params.message

  const { title, description } = ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES['default']

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col items-center justify-center p-4 antialiased overflow-hidden relative">
      {/* Glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-500/8 blur-[120px] rounded-full pointer-events-none opacity-60 mix-blend-screen" />

      <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-10 transition-transform hover:scale-105">
          <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(193,123,79,0.1)]">
            <span className="font-semibold text-2xl text-primary tracking-tighter">M</span>
          </div>
        </Link>

        {/* Error card */}
        <div className="w-full bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-xl rounded-xl shadow-2xl p-8 flex flex-col items-center text-center">
          <div className="size-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
            <AlertTriangle className="size-7 text-red-400" />
          </div>

          <h1 className="text-xl font-semibold text-zinc-100 mb-2">{title}</h1>
          <p className="text-sm text-zinc-400 leading-relaxed mb-1">
            {customMessage ?? description}
          </p>

          {errorCode !== 'default' && customMessage && (
            <p className="text-xs text-zinc-600 mt-1 font-mono">{customMessage}</p>
          )}

          <div className="flex flex-col gap-3 w-full mt-7">
            <Button
              asChild
              className="w-full h-11 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-medium transition-all hover:scale-[1.02]"
            >
              <Link href="/login">
                <RefreshCcw className="size-4 mr-2" />
                Try signing in again
              </Link>
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

        <p className="text-center mt-6 text-xs text-zinc-600">
          Need help?{' '}
          <a
            href="mailto:support@morphix.ai"
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}
