'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import { supabase } from '../lib/supabase'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, userMetadata } = useAuth()
  const router = useRouter()
  const [checkingRole, setCheckingRole] = useState(true)
  const [timeoutOccurred, setTimeoutOccurred] = useState(false)

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Loading timeout triggered after 3 seconds');
      setTimeoutOccurred(true);
      setCheckingRole(false);
    }, 3000); // 3 seconds timeout

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Simple function to check if the user should be redirected
    const checkRedirect = async () => {
      try {
        console.log('checkRedirect running, isLoading:', isLoading, 'user:', !!user, 'userMetadata:', !!userMetadata);
        
        // Skip checks if timeout occurred
        if (timeoutOccurred) {
          console.log('Timeout occurred, skipping checks');
          setCheckingRole(false);
          return;
        }

        // Don't do anything while auth is still loading - unless timeout occurred
        if (isLoading && !timeoutOccurred) {
          console.log('Auth is still loading, waiting...');
          return;
        }
        
        // If no user is logged in, redirect to login
        if (!user) {
          console.log('No user found, redirecting to login');
          router.push('/login');
          setCheckingRole(false);
          return;
        }
        
        // Check if the user is an admin from metadata
        if (userMetadata?.role === 'admin') {
          console.log('User is admin, redirecting to admin panel');
          router.push('/admin');
          setCheckingRole(false);
          return;
        }
        
        // Regular user, just set checkingRole to false
        console.log('Regular user confirmed, loading dashboard');
        setCheckingRole(false);
      } catch (error) {
        console.error('Error in checkRedirect:', error);
        setCheckingRole(false); // Set to false even if there's an error
      }
    };
    
    checkRedirect();
  }, [user, isLoading, userMetadata, router, timeoutOccurred]);

  console.log('Render state:', { isLoading, checkingRole, timeoutOccurred });
  
  if ((isLoading || checkingRole) && !timeoutOccurred) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
} 