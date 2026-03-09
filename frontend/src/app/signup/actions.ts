'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { checkRateLimit } from '@/lib/rateLimit'

// 3 signups per hour per IP — blocks account/email spam
const SIGNUP_LIMIT = 3
const SIGNUP_WINDOW_MS = 60 * 60 * 1000

export async function signupAction(formData: FormData) {
    const ip = (await headers()).get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    const rl = checkRateLimit(`signup:${ip}`, SIGNUP_LIMIT, SIGNUP_WINDOW_MS)
    if (!rl.allowed) {
        return { error: 'Too many signup attempts from this IP. Please try again later.' }
    }

    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!email || !password || !confirmPassword) {
        return { error: 'All fields are required' }
    }

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match' }
    }

    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters' }
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
        },
    })

    if (error) {
        return { error: error.message }
    }

    // If session is null, email confirmation is required.
    if (!data.session) {
        return { success: 'Check your email to verify your account.' }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
