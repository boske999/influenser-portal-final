'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Special component to completely bypass middleware redirects
 * This should be used in development only when dealing with persistent auth/redirect issues
 */
export default function BypassMiddleware({ path = '/admin' }: { path?: string }) {
  const { isAuthenticated, isAdmin, userData } = useAuth();
  const [countdown, setCountdown] = useState(5);
  const [bypassing, setBypassing] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  useEffect(() => {
    if (bypassing && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    if (bypassing && countdown === 0) {
      const targetPath = isAdmin && userData?.role === 'admin' ? '/admin' : '/dashboard';
      const url = `${targetPath || path}?noRedirect=true&t=${Date.now()}`;
      window.location.href = url;
    }
  }, [bypassing, countdown, isAdmin, userData, path]);

  function startBypass() {
    // Clear auth cookies first
    try {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
      // Also clear local storage
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('Cookies and storage cleared, starting bypass...');
      setBypassing(true);
    } catch (err) {
      console.error('Error during bypass:', err);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-red-900 p-3 rounded-lg shadow-lg max-w-xs">
        <h3 className="text-sm font-semibold text-white mb-2">Emergency Bypass</h3>
        
        {!bypassing ? (
          <>
            <p className="text-xs text-red-200 mb-3">
              This will attempt to completely bypass server middleware and force navigation.
              Use only when you're stuck in a redirect loop.
            </p>
            
            <button
              onClick={startBypass}
              className="text-xs px-3 py-1.5 rounded bg-red-700 hover:bg-red-800 text-white transition-colors w-full"
            >
              Emergency Bypass
            </button>
          </>
        ) : (
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">{countdown}</div>
            <p className="text-xs text-red-200">
              Bypassing middleware...
              <br />
              Direct access will start in {countdown} seconds
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 