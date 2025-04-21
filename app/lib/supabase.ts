import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fbmdbvijfufsjpsuorxi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibWRidmlqZnVmc2pwc3VvcnhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTI3NjksImV4cCI6MjA2MDY2ODc2OX0.WpbyAQo8HyoMW1YWGM24MX22rmFth49Zjq17JMAwfGo';

// Kreiramo globalni Supabase klijent sa podesivim opcijama skladištenja
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    autoRefreshToken: true,
    // Onemogućavamo automatsku detekciju sesije iz URL-a koja može da napravi probleme
    detectSessionInUrl: false, 
  },
});

// Pomoćna funkcija za konzistentno dobavljanje podataka korisnika iz baze
export async function fetchUserData(userId: string) {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role, full_name, avatar_url')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Greška pri dobavljanju podataka o korisniku:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Izuzetak pri dobavljanju podataka o korisniku:', err);
    return null;
  }
}

export type { User, Session } from '@supabase/supabase-js'; 