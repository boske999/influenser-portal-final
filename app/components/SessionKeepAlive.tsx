'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { refreshSession, isSessionValid, supabase, checkConnection } from '../lib/supabase';

export default function SessionKeepAlive() {
  const { isAuthenticated, signOut } = useAuth();
  const lastActivityRef = useRef<number>(Date.now());
  const sessionCheckRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityHandledRef = useRef<boolean>(false);
  const healthCheckRef = useRef<NodeJS.Timeout | null>(null);
  const [connectionLost, setConnectionLost] = useState<boolean>(false);

  // Funkcija za proveru i obnavljanje konekcije
  async function checkAndRefreshConnection() {
    try {
      const isConnected = await checkConnection();
      
      if (!isConnected) {
        console.log("Connection check failed, attempting to refresh session");
        setConnectionLost(true);
        
        // Pokušaj osvežiti sesiju direktno
        const refreshSuccessful = await refreshSession();
        
        if (refreshSuccessful) {
          console.log("Connection restored through session refresh");
          setConnectionLost(false);
        } else {
          console.log("Failed to restore connection, might require page reload");
          // Ovde možete implementirati dodatnu logiku, kao što je prikazivanje poruke korisniku
        }
      } else if (connectionLost) {
        console.log("Connection check successful, connection restored");
        setConnectionLost(false);
      }
    } catch (err) {
      console.error("Error during health check:", err);
      setConnectionLost(true);
    }
  }

  // Track user activity
  useEffect(() => {
    if (!isAuthenticated) return;
    
    function updateLastActivity() {
      lastActivityRef.current = Date.now();
      // Ako je prethodno izgubljena konekcija, pokušaj da je obnoviš
      if (connectionLost) {
        checkAndRefreshConnection();
      }
    }
    
    // Add event listeners for user activity
    window.addEventListener('mousemove', updateLastActivity);
    window.addEventListener('mousedown', updateLastActivity);
    window.addEventListener('keypress', updateLastActivity);
    window.addEventListener('scroll', updateLastActivity);
    window.addEventListener('touchstart', updateLastActivity);
    
    return () => {
      window.removeEventListener('mousemove', updateLastActivity);
      window.removeEventListener('mousedown', updateLastActivity);
      window.removeEventListener('keypress', updateLastActivity);
      window.removeEventListener('scroll', updateLastActivity);
      window.removeEventListener('touchstart', updateLastActivity);
    };
  }, [isAuthenticated, connectionLost]);

  // Periodična provera zdravlja konekcije
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Provera konekcije svakih 30 sekundi
    healthCheckRef.current = setInterval(checkAndRefreshConnection, 30 * 1000);
    
    return () => {
      if (healthCheckRef.current) {
        clearInterval(healthCheckRef.current);
      }
    };
  }, [isAuthenticated, connectionLost]);

  // Proaktivno proveravamo i produžavamo sesiju
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Prvo osvežimo sesiju odmah pri pokretanju
    refreshSession();
    
    // Periodično proveravamo sesiju
    async function checkSession() {
      try {
        // Proveravamo koliko vremena je korisnik neaktivan
        const currentTime = Date.now();
        const inactiveTime = currentTime - lastActivityRef.current;
        const fiveMinutes = 5 * 60 * 1000; // Smanjeno sa 15 na 5 minuta
        
        // Ako je korisnik bio aktivan u poslednjih 5 minuta, osvežimo sesiju
        if (inactiveTime < fiveMinutes) {
          // Koristimo Supabase direktno za osvežavanje
          const { error } = await supabase.auth.refreshSession();
          if (error) {
            console.error("Failed to refresh session:", error);
            if (error.message.includes('expired') || error.message.includes('invalid')) {
              console.log("Session expired, signing out");
              signOut();
            }
          } else {
            console.log("Session refreshed successfully at:", new Date().toISOString());
          }
        } else {
          // Ako je korisnik neaktivan duže vreme, proveravamo da li je sesija i dalje validna
          const valid = await isSessionValid();
          if (!valid) {
            console.log("Session expired after inactivity, signing out");
            signOut();
          }
        }
      } catch (err) {
        console.error("Error during session check:", err);
      }
    }
    
    // Osvežavamo sesiju češće - svakih 5 minuta umesto 10
    sessionCheckRef.current = setInterval(checkSession, 5 * 60 * 1000);
    
    return () => {
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current);
      }
    };
  }, [isAuthenticated, signOut]);
  
  // Obradi promene vidljivosti browser taba
  useEffect(() => {
    if (!isAuthenticated) return;
    
    async function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        console.log("Tab became visible, checking and refreshing session");
        
        // Refreshuj odmah kada se vrati u tab
        const valid = await isSessionValid();
        if (valid) {
          await refreshSession();
          // Osvežavamo stranicu ako je prošlo više od 20 minuta neaktivnosti (smanjeno sa 30)
          const inactiveTime = Date.now() - lastActivityRef.current;
          const twentyMinutes = 20 * 60 * 1000;
          
          if (inactiveTime > twentyMinutes) {
            console.log("Inactive for more than 20 minutes, refreshing page");
            window.location.reload(); // Umesto refreshAndReload, koristimo direktno reload
          } else {
            // Proveri konekciju kada se korisnik vrati u tab
            const isConnected = await checkConnection();
            if (!isConnected) {
              console.log("Connection lost during tab inactivity, refreshing page");
              window.location.reload(); // Umesto refreshAndReload, koristimo direktno reload
            }
          }
        } else {
          console.log("Session expired while tab was inactive, signing out");
          signOut();
        }
        
        // Postavi poslednju aktivnost
        lastActivityRef.current = Date.now();
      }
    }

    // Proverimo da li je čitač već postavljen da izbegnemo dupliranje
    if (!visibilityHandledRef.current) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      visibilityHandledRef.current = true;
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        visibilityHandledRef.current = false;
      };
    }
  }, [isAuthenticated, signOut]);
  
  // Prikazujemo obaveštenje ako je konekcija izgubljena
  if (connectionLost && isAuthenticated) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
        <p>Veza sa serverom je izgubljena. Pokušavamo da je obnovimo...</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 bg-white text-red-500 px-3 py-1 rounded-md font-medium"
        >
          Osvežite stranicu
        </button>
      </div>
    );
  }
  
  // Komponenta obično ne renderuje ništa
  return null;
} 