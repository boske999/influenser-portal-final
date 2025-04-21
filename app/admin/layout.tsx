'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import AdminSidebar from '../components/AdminSidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoading, isAuthenticated, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Skip if still loading
    if (isLoading) return;
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // If user is not admin, redirect to dashboard
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  // Show loading spinner while auth status is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080808]">
        <div className="w-8 h-8 border-t-2 border-[#FFB900] rounded-full animate-spin"></div>
      </div>
    )
  }

  // If not authenticated or not admin, don't render children to prevent flicker
  if (!isAuthenticated || !isAdmin) {
    return null;
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