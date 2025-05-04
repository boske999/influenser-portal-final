'use client';

import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ChatProvider } from '../context/ChatContext';
import { useState, useEffect } from 'react';
import { supabase, ensureChatBucketExists } from '../lib/supabase';
import ToastProvider from './ToastProvider';

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
        
        // Ensure the chat bucket exists for file uploads
        await ensureChatBucketExists();
        
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
        <ChatProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ChatProvider>
      </NotificationProvider>
    </AuthProvider>
  );
} 