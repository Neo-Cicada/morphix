'use client'

import { useState, useTransition } from 'react'
import { signupAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function onSubmit(formData: FormData) {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await signupAction(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess(result.success)
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
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <span className="font-semibold text-2xl text-primary tracking-tighter">M</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold tracking-tighter text-zinc-100 text-center">Create an account</h1>
          <p className="text-zinc-400 mt-2 font-medium text-[15px] text-center">Start turning software into cinema</p>
        </div>

        {/* Form Card */}
        <Card className="w-full bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-medium text-zinc-100">Sign Up</CardTitle>
            <CardDescription className="text-zinc-400 text-sm">
              Enter your details below to create your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex flex-col items-center text-center py-6 gap-4">
                <div className="size-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                  <CheckCircle2 className="size-6 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-zinc-100">Check your email</h3>
                  <p className="text-sm text-zinc-400 px-4">{success}</p>
                </div>
                <Button asChild variant="outline" className="mt-4 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100">
                  <Link href="/login">Return to login</Link>
                </Button>
              </div>
            ) : (
              <form action={onSubmit} className="space-y-5">
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
                  <Label htmlFor="password" className="text-zinc-300 text-sm font-medium">Password</Label>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    placeholder="Create a strong password"
                    required 
                    className="h-11 bg-zinc-900/60 border-zinc-800 focus-visible:ring-primary/50 text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors border shadow-inner"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="confirmPassword" className="text-zinc-300 text-sm font-medium">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type="password" 
                    placeholder="Repeat your password"
                    required 
                    className="h-11 bg-zinc-900/60 border-zinc-800 focus-visible:ring-primary/50 text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors border shadow-inner"
                  />
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
                  className="w-full h-11 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-medium transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-[1.02] mt-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="animate-spin mr-2 size-4" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        {!success && (
          <p className="text-center mt-8 text-sm font-medium text-zinc-500">
            Already have an account?{' '}
            <Link href="/login" className="text-zinc-300 hover:text-white transition-colors underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        )}

      </div>
    </div>
  )
}
