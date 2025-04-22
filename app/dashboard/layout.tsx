'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import { NotificationProvider } from '../context/NotificationContext'

export default function DashboardLayout({
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
    
    // If user is admin, redirect to admin
    if (isAdmin) {
      router.push('/admin');
      return;
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  // Show loading spinner while auth status is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin"></div>
      </div>
    )
  }

  // If not authenticated, don't render children to prevent flicker
  if (!isAuthenticated || isAdmin) {
    return null;
  }

  return (
    <NotificationProvider>
      <div className="app-layout">
        <Sidebar />
        <main className="app-layout-content">
          <div className="main-content">
            {children}
          </div>
        </main>
      </div>
    </NotificationProvider>
  )
} 