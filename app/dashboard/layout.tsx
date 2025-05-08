'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import ClientProviders from '../components/ClientProviders'

// Create a redirection key unique to this layout to track redirects
const REDIRECT_KEY = 'dashboard_redirect_check';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoading, isAuthenticated, isAdmin } = useAuth()
  const router = useRouter()
  const [layoutMounted, setLayoutMounted] = useState(false)

  // On first render, mark that we've performed this check
  useEffect(() => {
    setLayoutMounted(true);
    
    // Cleanup to remove the lock when component unmounts
    return () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(REDIRECT_KEY);
      }
    };
  }, []);

  // Separate effect for redirection to avoid conflicts
  useEffect(() => {
    // Skip if not yet mounted or still loading authentication
    if (!layoutMounted || isLoading) return;
    
    // Prevent multiple redirects in the same session
    const hasCheckedRedirect = sessionStorage.getItem(REDIRECT_KEY);
    if (hasCheckedRedirect) return;
    
    // Mark that we've performed this check
    sessionStorage.setItem(REDIRECT_KEY, 'true');
    
    // Handle redirects based on authentication and role
    if (!isAuthenticated) {
      console.log("Dashboard: User not authenticated, redirecting to login");
      window.location.replace('/login');
      return;
    }
    
    if (isAdmin) {
      console.log("Dashboard: User is admin, redirecting to admin panel");
      window.location.replace('/admin');
      return;
    }

    console.log("Dashboard: User authenticated and has correct role");
  }, [isLoading, isAuthenticated, isAdmin, layoutMounted]);

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
    <ClientProviders>
      <div className="app-layout">
        <Sidebar />
        <main className="app-layout-content">
          <div className="main-content">
            {children}
          </div>
        </main>
      </div>
    </ClientProviders>
  )
} 