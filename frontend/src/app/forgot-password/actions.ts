'use server'

import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { checkRateLimit } from '@/lib/rateLimit'

// 3 attempts per hour per IP
const LIMIT = 3
const WINDOW_MS = 60 * 60 * 1000

export async function forgotPasswordAction(formData: FormData) {
    const ip = (await headers()).get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    const rl = checkRateLimit(`forgot-password:${ip}`, LIMIT, WINDOW_MS)
    if (!rl.allowed) {
        return { error: 'Too many attempts. Please try again later.' }
    }

    const email = formData.get('email') as string
    if (!email) {
        return { error: 'Email is required' }
    }

    const supabase = await createClient()
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
        return { error: error.message }
    }

    // Always return success to avoid leaking whether an email exists
    return { success: 'If an account exists for that email, a reset link has been sent.' }
}
