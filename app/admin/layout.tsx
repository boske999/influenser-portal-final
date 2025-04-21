'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import AdminSidebar from '../components/AdminSidebar'
import { supabase } from '../lib/supabase'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [checkingRole, setCheckingRole] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        console.log('Admin layout - No user, redirecting to login')
        router.push('/login')
        return
      }
      
      // Check if user is an admin
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('Error checking admin role:', error)
        router.push('/dashboard')
        return
      }

      // If user is not an admin, redirect to user dashboard
      if (data?.role !== 'admin') {
        console.log('User is not an admin, redirecting to dashboard')
        router.push('/dashboard')
        return
      }
      
      setCheckingRole(false)
    }
    
    if (!isLoading) {
      checkAdminStatus()
    }
  }, [user, isLoading, router])

  if (isLoading || checkingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080808]">
        <div className="w-8 h-8 border-t-2 border-[#FFB900] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#080808]">
      <AdminSidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 