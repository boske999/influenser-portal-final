'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './context/AuthContext'
import LoadingTimeout from './components/LoadingTimeout'

// Create a redirection key unique to home page
const HOME_REDIRECT_KEY = 'home_redirect_performed';

export default function Home() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const [pageMounted, setPageMounted] = useState(false)
  
  // Mark the page as mounted
  useEffect(() => {
    setPageMounted(true);
    
    // Clean up when component unmounts
    return () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(HOME_REDIRECT_KEY);
      }
    };
  }, []);
  
  // Handle redirection based on auth state
  useEffect(() => {
    // Wait until auth is loaded and page is mounted
    if (isLoading || !pageMounted) return;
    
    // Check if we've already redirected
    const hasRedirected = sessionStorage.getItem(HOME_REDIRECT_KEY);
    if (hasRedirected) return;
    
    // Set redirection flag
    sessionStorage.setItem(HOME_REDIRECT_KEY, 'true');
    
    // Redirect based on auth status
    if (isAuthenticated) {
      console.log("Home: User authenticated, redirecting...");
      if (isAdmin) {
        console.log("Home: User is admin, redirecting to admin");
        window.location.replace('/admin');
      } else {
        console.log("Home: User is not admin, redirecting to dashboard");
        window.location.replace('/dashboard');
      }
    } else {
      console.log("Home: User not authenticated, redirecting to login");
      window.location.replace('/login');
    }
  }, [isAuthenticated, isAdmin, isLoading, pageMounted]);
  
  // Simple loading spinner while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin"></div>
      <LoadingTimeout isLoading={isLoading} />
    </div>
  )
} 