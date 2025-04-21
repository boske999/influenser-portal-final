'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function SettingsPage() {
  const { user, isLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return
      
      // Check if user is an admin
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (error || data?.role !== 'admin') {
        // Not an admin, redirect to user dashboard
        router.push('/dashboard')
      }
    }
    
    if (user && !isLoading) {
      checkAdminStatus()
      setLoading(false)
    }
  }, [user, isLoading, router])
  
  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080808]">
        <div className="w-8 h-8 border-t-2 border-[#FFB900] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-white text-4xl font-bold">Settings</h1>
      </div>
      
      <div className="bg-[#121212] border border-white/5 p-6 text-center">
        <p className="text-white text-xl">Settings page is under development</p>
      </div>
    </div>
  )
} 