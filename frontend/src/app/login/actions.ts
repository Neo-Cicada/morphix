'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { checkRateLimit } from '@/lib/rateLimit'

// 5 login attempts per 15 minutes per IP — blocks brute-force attacks
const LOGIN_LIMIT = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000

export async function loginAction(formData: FormData) {
    const ip = (await headers()).get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    const rl = checkRateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)
    if (!rl.allowed) {
        const wait = Math.ceil((rl.resetAt - Date.now()) / 60_000)
        return { error: `Too many login attempts. Please try again in ${wait} minute${wait === 1 ? '' : 's'}.` }
    }

    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Email and password are required' }
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
