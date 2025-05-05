'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { refreshSession } from '../lib/supabase';

export default function ErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string>('');
  const { refreshAndReload, signOut, isAuthenticated } = useAuth();
  const autoRedirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Handler za neuhvaćena obećanja
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Proveriti da li je greška vezana za autentifikaciju
      const errorString = String(event.reason);
      if (
        errorString.includes('auth') || 
        errorString.includes('token') || 
        errorString.includes('session') ||
        errorString.includes('unauthorized') ||
        errorString.includes('403') ||
        errorString.includes('401')
      ) {
        setHasError(true);
        setErrorInfo('Izgleda da je došlo do problema sa vašom sesijom.');
        startAutoRedirectTimer();
        event.preventDefault(); // Sprečiti podrazumevano rukovanje greškom
      }
    };
    
    // Handler za opšte greške
    const handleError = (event: ErrorEvent) => {
      console.error('Error caught by boundary:', event.error);
      
      // Proveriti da li poruka o grešci sadrži stringove vezane za autentifikaciju
      const errorString = String(event.error);
      if (
        errorString.includes('auth') || 
        errorString.includes('token') || 
        errorString.includes('session') ||
        errorString.includes('unauthorized') ||
        errorString.includes('403') ||
        errorString.includes('401')
      ) {
        setHasError(true);
        setErrorInfo('Izgleda da je došlo do problema sa vašom sesijom.');
        startAutoRedirectTimer();
        event.preventDefault(); // Sprečiti podrazumevano rukovanje greškom
      }
    };

    // Funkcija za automatsko preusmeravanje nakon 30 sekundi
    const startAutoRedirectTimer = () => {
      // Očistiti postojeći tajmer ako postoji
      if (autoRedirectTimerRef.current) {
        clearTimeout(autoRedirectTimerRef.current);
      }
      
      // Postaviti novi tajmer
      autoRedirectTimerRef.current = setTimeout(() => {
        console.log("Auto redirect timer triggered, signing out");
        signOut();
      }, 30000); // 30 sekundi
    };

    // Dodati osluškivače događaja
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      // Očistiti osluškivače događaja i tajmere
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
      if (autoRedirectTimerRef.current) {
        clearTimeout(autoRedirectTimerRef.current);
      }
    };
  }, [signOut]);

  // Handler za osvežavanje sesije
  const handleRefresh = async () => {
    setHasError(false); // Resetuj stanje greške
    
    // Očisti tajmer za automatsko preusmeravanje
    if (autoRedirectTimerRef.current) {
      clearTimeout(autoRedirectTimerRef.current);
      autoRedirectTimerRef.current = null;
    }
    
    await refreshAndReload();
  };

  // Handler za odjavu
  const handleSignOut = async () => {
    // Očisti tajmer za automatsko preusmeravanje
    if (autoRedirectTimerRef.current) {
      clearTimeout(autoRedirectTimerRef.current);
      autoRedirectTimerRef.current = null;
    }
    
    await signOut();
  };

  if (hasError && isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background bg-opacity-75">
        <div className="max-w-md p-6 mx-auto bg-white rounded-lg shadow-xl">
          <h2 className="mb-4 text-xl font-bold text-gray-800">Problem sa aplikacijom</h2>
          <p className="mb-4 text-gray-600">{errorInfo || 'Došlo je do problema sa aplikacijom. Molimo vas da probate da osvežite sesiju ili se ponovo prijavite.'}</p>
          <p className="mb-4 text-sm text-gray-500">Bićete automatski odjavljeni za 30 sekundi ako ne preduzmete akciju.</p>
          <div className="flex space-x-4">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none"
            >
              Osvežite sesiju
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600 focus:outline-none"
            >
              Odjavi se
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 