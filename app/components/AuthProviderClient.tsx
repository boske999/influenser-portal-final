'use client';

import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthProviderClient({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Simple initialization to check if Supabase is available
    const initAuth = async () => {
      try {
        await supabase.auth.getSession();
        setIsReady(true);
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Still set ready even if there's an error
        setIsReady(true);
      }
    };
    
    initAuth();
  }, []);

  // Simple loading screen
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <AuthProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </AuthProvider>
  );
} 