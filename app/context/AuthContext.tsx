'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Session, User, signInUser, signOutUser, fetchUserData, supabase } from '../lib/supabase';

// User data from the users table
type UserData = {
  role: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

// Type for AuthContext that will be available throughout the application
type AuthContextType = {
  user: User | null;
  session: Session | null;
  userData: UserData | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null; userData?: UserData | null }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isUser: boolean;
  refreshUserData: () => Promise<void>;
};

// Create initial context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  console.log("AuthContext rendering, path:", pathname);

  // Function to refresh user data from the database
  const refreshUserData = async () => {
    if (!user) return;
    
    console.log("Refreshing user data for:", user.id);
    try {
      const data = await fetchUserData(user.id);
      console.log("User data refreshed:", data);
      setUserData(data as UserData | null);
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  // Function to initialize authentication - checks session and fetches user data
  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      console.log("Initializing auth...");
      
      // Get user session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error getting session:", error.message);
        setIsLoading(false);
        return;
      }
      
      console.log("Session check completed:", { 
        hasSession: !!session,
        userId: session?.user?.id 
      });
      
      if (!session) {
        // If there's no session, clear user data
        setUser(null);
        setSession(null);
        setUserData(null);
        setIsLoading(false);
        return;
      }
      
      // Update user data from session
      setUser(session.user);
      setSession(session);
      
      try {
        // Fetch user data from the database
        const userData = await fetchUserData(session.user.id);
        console.log("Retrieved user data:", userData);
        setUserData(userData as UserData | null);
      } catch (userDataError) {
        console.error("Error fetching user data:", userDataError);
        // Continue even if user data fetch fails - just set userData to null
        setUserData(null);
      }
      
    } catch (error) {
      console.error("Error initializing authentication:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load session on first render
  useEffect(() => {
    initializeAuth();
    
    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, newSession: Session | null) => {
        console.log("Auth state change event:", event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // If user signs in or token is refreshed, update user data
          if (newSession?.user) {
            console.log("Auth state change: Signed in/token refreshed");
            // Fetch user data
            const userData = await fetchUserData(newSession.user.id);
            console.log("Retrieved user data after auth change:", userData);
            setUser(newSession.user);
            setSession(newSession);
            setUserData(userData as UserData | null);
          }
        } 
        else if (event === 'SIGNED_OUT') {
          // If user signs out, reset state
          console.log("Auth state change: Signed out, clearing user data");
          setUser(null);
          setSession(null);
          setUserData(null);
        }
      }
    );
    
    // Clean up subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign-in function
  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting sign in for email:", email);
      const { user, session, userData, error } = await signInUser(email, password);
      
      if (error) {
        console.error("Sign in error:", error);
        return { error };
      }
      
      // Set user data on successful sign-in
      console.log("Sign in successful:", { 
        userId: user?.id,
        role: userData?.role 
      });
      
      // Set all data immediately
      setUser(user);
      setSession(session);
      setUserData(userData as UserData | null);
      
      // Wait a short time to ensure state is updated before component responds
      // This helps with redirection logic in the login component
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Let middleware handle the redirect
      return { error: null, userData };
    } catch (error) {
      console.error("Exception during sign in:", error);
      return { error };
    }
  };

  // Sign-out function
  const signOut = async () => {
    try {
      await signOutUser();
      setUser(null);
      setSession(null);
      setUserData(null);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Calculate helper boolean values for role checking
  const isAuthenticated = !!user && !!session;
  const isAdmin = isAuthenticated && userData?.role === 'admin';
  const isUser = isAuthenticated && userData?.role !== 'admin';

  console.log("Auth state:", { 
    isAuthenticated, 
    isAdmin, 
    isUser,
    role: userData?.role,
    userId: user?.id
  });

  // Values available through context
  const value = {
    user,
    session,
    userData,
    isLoading,
    signIn,
    signOut,
    isAuthenticated,
    isAdmin,
    isUser,
    refreshUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook for using auth context in components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 