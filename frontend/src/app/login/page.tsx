'use client'

import { useState, useTransition, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { loginAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function LoginForm() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const [formError, setFormError] = useState<string | null>(null)
  const error = formError ?? urlError
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await loginAction(formData)
      if (result?.error) {
        setFormError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col items-center justify-center p-4 selection:bg-primary/30 antialiased overflow-hidden relative">
      {/* Subtle Glow Effect */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none opacity-50 mix-blend-screen" />
      
      <div className="w-full max-w-[400px] relative z-10 flex flex-col items-center">
        
        {/* Branding */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-3 mb-6 transition-transform hover:scale-105">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(193,123,79,0.1)]">
              <span className="font-semibold text-2xl text-primary tracking-tighter">M</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold tracking-tighter text-zinc-100 text-center">Welcome back</h1>
          <p className="text-zinc-400 mt-2 font-medium text-[15px] text-center">Log in to your Morphix account</p>
        </div>

        {/* Form Card */}
        <Card className="w-full bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-medium text-zinc-100">Sign In</CardTitle>
            <CardDescription className="text-zinc-400 text-sm">
              Enter your email and password to access your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-zinc-300 text-sm font-medium">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  className="h-11 bg-zinc-900/60 border-zinc-800 focus-visible:ring-primary/50 text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors border shadow-inner"
                />
              </div>
              
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-300 text-sm font-medium">Password</Label>
                  <Link href="/forgot-password" className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="••••••••"
                  required 
                  className="h-11 bg-zinc-900/60 border-zinc-800 focus-visible:ring-primary/50 text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors border shadow-inner"
                />
              </div>

              <div className="flex items-center space-x-2.5 py-1">
                <Checkbox id="remember" name="remember" className="border-zinc-700 data-[state=checked]:bg-primary rounded-[4px]" />
                <Label htmlFor="remember" className="text-sm font-medium leading-none text-zinc-400 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                  Remember me
                </Label>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-3 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="size-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isPending}
                className="w-full h-11 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-medium transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-[1.02]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="animate-spin mr-2 size-4" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center mt-8 text-sm font-medium text-zinc-500">
          Don't have an account?{' '}
          <Link href="/signup" className="text-zinc-300 hover:text-white transition-colors underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
