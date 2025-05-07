'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SessionCleaner() {
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  async function clearSession() {
    setIsProcessing(true);
    setMessage(null);
    
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        
        // Clear cookies related to Supabase auth
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          
          // Clear cookies that might be related to auth
          if (name.includes('supabase') || name.includes('sb-') || name.includes('auth')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
          }
        }
      }
      
      setMessage('Session data cleared. Redirecting to login...');
      
      // Wait a moment before redirecting
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      console.error('Error clearing session:', err);
      setMessage('Error clearing session data');
    } finally {
      setIsProcessing(false);
    }
  }
  
  // Helper for direct access with timestamp
  function directAccess(path: string) {
    const timestamp = Date.now();
    const url = `${path}?t=${timestamp}`;
    window.location.href = url;
  }
  
  // Helper for going to login with bypass flag
  function bypassLogin() {
    window.location.href = '/login?bypass=true';
  }
  
  return (
    <div className="fixed top-20 left-4 z-50">
      <div className="bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-white">Auth Tools</h3>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-white text-xs px-1.5 py-0.5 bg-gray-700 rounded"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
        
        {expanded ? (
          <>
            <div className="space-y-2">
              <div>
                <h4 className="text-xs text-gray-300 mb-1">Session</h4>
                <button
                  onClick={clearSession}
                  disabled={isProcessing}
                  className={`text-xs px-3 py-1.5 rounded w-full ${isProcessing 
                    ? 'bg-gray-700 text-gray-300' 
                    : 'bg-red-700 hover:bg-red-800 text-white'} transition-colors`}
                >
                  {isProcessing ? 'Clearing...' : 'Clear Session Data'}
                </button>
              </div>
              
              <div>
                <h4 className="text-xs text-gray-300 mb-1">Direct Access</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => directAccess('/admin')}
                    className="text-xs px-2 py-1.5 rounded bg-blue-700 hover:bg-blue-800 text-white transition-colors"
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => directAccess('/dashboard')}
                    className="text-xs px-2 py-1.5 rounded bg-green-700 hover:bg-green-800 text-white transition-colors"
                  >
                    Dashboard
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="text-xs text-gray-300 mb-1">Fix Redirect Loop</h4>
                <button
                  onClick={bypassLogin}
                  className="text-xs px-3 py-1.5 rounded w-full bg-yellow-700 hover:bg-yellow-800 text-white transition-colors"
                >
                  Login with Bypass
                </button>
              </div>
            </div>
            
            {message && (
              <div className="mt-2 text-xs bg-red-950 p-2 rounded text-red-200">
                {message}
              </div>
            )}
          </>
        ) : (
          // Collapsed view - just the Clear Session button
          <button
            onClick={clearSession}
            disabled={isProcessing}
            className={`text-xs px-3 py-1.5 rounded w-full ${isProcessing 
              ? 'bg-gray-700 text-gray-300' 
              : 'bg-red-700 hover:bg-red-800 text-white'} transition-colors`}
          >
            {isProcessing ? 'Clearing...' : 'Clear Session'}
          </button>
        )}
      </div>
    </div>
  );
} 