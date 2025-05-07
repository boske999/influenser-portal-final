import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Konstante iz .env ili supabase konfiguracije za admin pristup
const SUPABASE_URL = 'https://fbmdbvijfufsjpsuorxi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// Kreiramo admin klijenta sa service_role ključem
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

type RequestData = {
  email: string;
  password: string;
  fullName?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Samo POST metoda je dozvoljena
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, fullName } = req.body as RequestData;

    // Validacija ulaznih podataka
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('Creating user with admin API:', email);

    // Proveri da li korisnik već postoji - jednostavnim filterom nakon dobijanja svih korisnika
    const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return res.status(500).json({ error: 'Failed to check if user exists' });
    }
    
    const existingUser = data.users.find(user => user.email === email);

    if (existingUser) {
      console.log('User already exists, updating password');
      
      // Ažuriraj lozinku postojećeg korisnika
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password }
      );

      if (updateError) {
        console.error('Error updating user:', updateError);
        return res.status(500).json({ error: 'Failed to update user password' });
      }

      // Vrati postojećeg korisnika
      return res.status(200).json({ user: existingUser, updated: true });
    }

    // Kreiraj novog korisnika
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,  // Automatski potvrdi email
      user_metadata: { full_name: fullName }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    console.log('User created successfully:', newUser.user.id);

    // Kreiraj profil korisnika u tabeli users
    if (newUser.user && fullName) {
      await supabaseAdmin
        .from('users')
        .upsert({
          id: newUser.user.id,
          email,
          full_name: fullName,
          created_at: new Date().toISOString()
        });
    }

    return res.status(201).json({ user: newUser.user });
  } catch (error: any) {
    console.error('Unexpected error in create-user API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 