'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/server'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const cookieStore = cookies()
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    return { error: error.message }
  }
  
  // After login, get the user to determine where to redirect
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'An unexpected error occurred. Please try again.' }
  }
  
  // Get user data (role) to determine redirect
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
    
  const redirectTo = userData?.role === 'admin' ? '/admin' : '/dashboard'
  
  return { success: true, redirectTo }
}

export async function logout() {
  const cookieStore = cookies()
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
} 