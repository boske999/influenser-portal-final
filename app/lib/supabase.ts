import { createClient, type User, type Session } from '@supabase/supabase-js';

const supabaseUrl = 'https://fbmdbvijfufsjpsuorxi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibWRidmlqZnVmc2pwc3VvcnhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTI3NjksImV4cCI6MjA2MDY2ODc2OX0.WpbyAQo8HyoMW1YWGM24MX22rmFth49Zjq17JMAwfGo';

// Create global Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: false, 
  },
});

// Ensure chat bucket exists
export async function ensureChatBucketExists() {
  try {
    // Check if the bucket already exists
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .getBucket('chat');
    
    if (bucketError && bucketError.message.includes('does not exist')) {
      // Create bucket if it doesn't exist
      const { data, error } = await supabase
        .storage
        .createBucket('chat', {
          public: false,
          fileSizeLimit: 20971520, // 20MB
        });
      
      if (error) {
        console.error('Error creating chat bucket:', error);
        return false;
      }
      
      console.log('Chat bucket created successfully');
      return true;
    } else if (bucketError) {
      console.error('Error checking chat bucket:', bucketError);
      return false;
    }
    
    // Bucket exists
    return true;
  } catch (err) {
    console.error('Exception while ensuring chat bucket exists:', err);
    return false;
  }
}

// Helper function to fetch user data from the database
export async function fetchUserData(userId: string) {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role, full_name, avatar_url')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Exception fetching user data:', err);
    return null;
  }
}

// User sign in and session creation
export async function signInUser(email: string, password: string): Promise<{
  user: User | null;
  session: Session | null;
  userData: any | null;
  error: any | null;
}> {
  try {
    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return { user: null, session: null, userData: null, error };
    }
    
    // Fetch user's role
    if (data.user) {
      const userData = await fetchUserData(data.user.id);
      
      // Return both auth user data and additional user data from users table
      return { 
        user: data.user, 
        session: data.session,
        userData,
        error: null 
      };
    }
    
    return { user: data.user, session: data.session, userData: null, error: null };
  } catch (error: any) {
    return { user: null, session: null, userData: null, error };
  }
}

// Sign out user
export async function signOutUser() {
  await supabase.auth.signOut();
}

/**
 * Pokušava da osvježi sesiju korisnika putem Supabase Auth API-a
 * @returns {Promise<boolean>} true ako je osvježavanje uspješno, false ako nije
 */
export async function refreshSession(): Promise<boolean> {
  try {
    console.log("Attempting to refresh session");
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error("Failed to refresh session:", error);
      return false;
    }
    
    console.log("Session refreshed successfully");
    return true;
  } catch (err) {
    console.error("Exception during session refresh:", err);
    return false;
  }
}

/**
 * Provjerava da li je trenutna sesija korisnika validna
 * @returns {Promise<boolean>} true ako je sesija validna, false ako nije
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error checking session validity:", error);
      return false;
    }
    
    // Ako session postoji i imamo access_token, sesija je validna
    return !!(data?.session?.access_token);
  } catch (err) {
    console.error("Exception checking session validity:", err);
    return false;
  }
}

/**
 * Provjera zdravlja konekcije - može se koristiti za testiranje veze sa Supabase-om
 * @returns {Promise<boolean>} true ako je veza zdrava, false ako nije
 */
export async function checkConnection(): Promise<boolean> {
  try {
    // Jednostavan zahtjev za provjeru konekcije
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error("Connection check failed:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Exception during connection check:", err);
    return false;
  }
}

export type { User, Session } from '@supabase/supabase-js'; 