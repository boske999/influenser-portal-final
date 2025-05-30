import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'

export async function requireAuthServer() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }
  
  return user
}

export async function getUserDataServer(userId: string) {
  if (!userId) return null
  
  const supabase = await createClient()
  const { data, error } = await supabase.from('users').select('role, full_name, avatar_url').eq('id', userId).single()
  
  if (error) {
    console.error('Error fetching user data:', error)
    return null
  }
  
  return data
}

export async function getUserWithRoleServer() {
  const user = await requireAuthServer()
  const userData = await getUserDataServer(user.id)
  
  return { user, userData }
}

export async function redirectBasedOnAuthServer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const userData = await getUserDataServer(user.id)
  const destination = userData?.role === 'admin' ? '/admin' : '/dashboard'
  
  redirect(destination)
} 