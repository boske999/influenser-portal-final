'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './context/AuthContext'

export default function Home() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    // Wait until auth is loaded
    if (isLoading) return
    
    // Redirect based on auth status
    if (isAuthenticated) {
      if (isAdmin) {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } else {
      router.push('/login')
    }
  }, [isAuthenticated, isAdmin, isLoading, router])
  
  // Simple loading spinner while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin"></div>
    </div>
  )
} 