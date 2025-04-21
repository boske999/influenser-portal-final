'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Session, User, supabase, fetchUserData } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userMetadata: {
    full_name: string | null;
    avatar_url: string | null;
    role: string | null;
  } | null;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  refreshUserMetadata: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Ključna konstanta koja upravlja redosledom učitavanja
const AUTH_STATE = {
  PENDING: 'PENDING',      // Provera sesije u toku
  SESSION_LOADED: 'SESSION_LOADED',   // Sesija učitana, metapodaci još nisu
  METADATA_LOADED: 'METADATA_LOADED', // Sve učitano
  ERROR: 'ERROR'           // Greška u učitavanju
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userMetadata, setUserMetadata] = useState<AuthContextType['userMetadata']>(null);
  const [authState, setAuthState] = useState(AUTH_STATE.PENDING);
  const router = useRouter();

  // Osigurava da se podaci uvek dobavljaju na isti način
  const fetchUserMetadata = useCallback(async (userId: string): Promise<AuthContextType['userMetadata']> => {
    if (!userId) {
      console.log("AuthContext: Nema ID korisnika, preskačem dobavljanje metapodataka");
      return null;
    }
    
    console.log("AuthContext: Dobavljanje metapodataka za korisnika ID:", userId);
    const userData = await fetchUserData(userId);
    
    if (!userData) {
      console.error("AuthContext: Neuspešno dobavljanje metapodataka");
      return null;
    }
    
    console.log("AuthContext: Uspešno dobavljeni metapodaci:", userData);
    return userData;
  }, []);

  // Funkcija za osvežavanje metapodataka korisnika
  const refreshUserMetadata = useCallback(async () => {
    if (!user?.id) {
      console.log("AuthContext: Nema ID korisnika za osvežavanje");
      return;
    }
    
    console.log("AuthContext: Osvežavanje metapodataka za korisnika ID:", user.id);
    const metadata = await fetchUserMetadata(user.id);
    
    if (metadata) {
      console.log("AuthContext: Postavljanje osveženih metapodataka");
      setUserMetadata(metadata);
      setAuthState(AUTH_STATE.METADATA_LOADED);
    }
  }, [user, fetchUserMetadata]);

  // Glavna funkcija za inicijalizaciju autentikacije
  const initializeAuth = useCallback(async () => {
    try {
      console.log("AuthContext: Inicijalizacija autentikacije");
      setIsLoading(true);
      setAuthState(AUTH_STATE.PENDING);
      
      // 1. Dobavljanje sesije - uvek prvi korak
      console.log("AuthContext: Dobavljanje sesije");
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("AuthContext: Greška pri dobavljanju sesije:", error);
        setAuthState(AUTH_STATE.ERROR);
        setIsLoading(false);
        return;
      }
      
      // 2. Ažuriranje stanja sa sesijom
      if (session) {
        console.log("AuthContext: Pronađena sesija, korisnik:", session.user.id);
        setSession(session);
        setUser(session.user);
        setAuthState(AUTH_STATE.SESSION_LOADED);
        
        // 3. Dobavljanje metapodataka
        console.log("AuthContext: Dobavljanje metapodataka za korisnika:", session.user.id);
        const metadata = await fetchUserMetadata(session.user.id);
        
        if (metadata) {
          console.log("AuthContext: Postavljanje metapodataka", metadata);
          setUserMetadata(metadata);
          setAuthState(AUTH_STATE.METADATA_LOADED);
        } else {
          console.warn("AuthContext: Nisu pronađeni metapodaci");
        }
      } else {
        console.log("AuthContext: Nije pronađena sesija");
        setUser(null);
        setSession(null);
        setUserMetadata(null);
      }
    } catch (error) {
      console.error("AuthContext: Izuzetak pri inicijalizaciji:", error);
      setAuthState(AUTH_STATE.ERROR);
    } finally {
      console.log("AuthContext: Inicijalizacija završena");
      setIsLoading(false);
    }
  }, [fetchUserMetadata]);

  // Osluškivanje promene stanja autentikacije
  useEffect(() => {
    // Postavljamo osvežavanje autentikacije pri svakom učitavanju stranice
    initializeAuth();
    
    // Osluškivanje promene stanja autentikacije
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("AuthContext: Promena stanja autentikacije, događaj:", event);
        
        if (event === 'SIGNED_IN') {
          console.log("AuthContext: Korisnik se prijavio");
          setSession(newSession);
          setUser(newSession?.user || null);
          setAuthState(AUTH_STATE.SESSION_LOADED);
          
          if (newSession?.user) {
            const metadata = await fetchUserMetadata(newSession.user.id);
            if (metadata) {
              setUserMetadata(metadata);
              setAuthState(AUTH_STATE.METADATA_LOADED);
            }
          }
        } 
        else if (event === 'SIGNED_OUT') {
          console.log("AuthContext: Korisnik se odjavio");
          setSession(null);
          setUser(null);
          setUserMetadata(null);
          setAuthState(AUTH_STATE.PENDING);
        }
        else if (event === 'TOKEN_REFRESHED') {
          console.log("AuthContext: Token osvežen");
          setSession(newSession);
          setUser(newSession?.user || null);
          
          // Ovde nemamo još metapodatke, ali imamo sesiju
          setAuthState(AUTH_STATE.SESSION_LOADED);
          
          // Dobavljamo metapodatke
          if (newSession?.user) {
            const metadata = await fetchUserMetadata(newSession.user.id);
            if (metadata) {
              setUserMetadata(metadata);
              setAuthState(AUTH_STATE.METADATA_LOADED);
            }
          }
        }
        
        setIsLoading(false);
      }
    );
    
    // Čišćenje pretplate kada se komponenta demontira
    return () => {
      console.log("AuthContext: Čišćenje pretplate");
      subscription.unsubscribe();
    };
  }, [initializeAuth, fetchUserMetadata]);

  // Funkcija za prijavu
  const signIn = async (email: string, password: string) => {
    try {
      console.log("AuthContext: Prijava korisnika:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error("AuthContext: Greška pri prijavi:", error);
        return { error };
      }
      
      // Uspešna prijava, preusmeravanje na dashboard
      console.log("AuthContext: Uspešna prijava, preusmeravanje na dashboard");
      router.push('/dashboard');
      return { error: null };
    } catch (error) {
      console.error("AuthContext: Izuzetak pri prijavi:", error);
      return { error };
    }
  };

  // Funkcija za odjavu
  const signOut = async () => {
    try {
      console.log("AuthContext: Odjava korisnika");
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error("AuthContext: Greška pri odjavi:", error);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    userMetadata,
    signIn,
    signOut,
    refreshUserMetadata,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth mora biti korišćen unutar AuthProvider-a');
  }
  return context;
}; 