'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

interface CheckAuthStatusProps {
  requireAuth?: boolean
  adminOnly?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Komponenta koja garantuje konzistentan redosled učitavanja autentikacije
 * i obezbeđuje da su svi podaci o korisniku dostupni pre renderovanja sadržaja
 */
export default function CheckAuthStatus({
  requireAuth = true,
  adminOnly = false,
  children,
  fallback
}: CheckAuthStatusProps) {
  const { user, isLoading, userMetadata, refreshUserMetadata } = useAuth()
  const router = useRouter()
  const [hasVerifiedAuth, setHasVerifiedAuth] = useState(false)
  const [isDirectDBLoading, setIsDirectDBLoading] = useState(false)
  const [directUserData, setDirectUserData] = useState<any>(null)
  
  // Ovaj efekat kontroliše inicijalno učitavanje
  useEffect(() => {
    let isMounted = true
    
    const verifyAuth = async () => {
      try {
        // Za svaki slučaj, verifikovati sesiju direktno
        if (!user && requireAuth) {
          const { data } = await supabase.auth.getSession()
          
          // Ako nemamo sesiju a stranica zahteva autentikaciju, redirektujemo na login
          if (!data.session && requireAuth) {
            console.log('CheckAuthStatus: No session found, redirecting to login')
            router.push('/login')
            return
          }
        }
        
        // Ako imamo korisnika ali ne metapodatke, osvežiti metapodatke
        if (user && !userMetadata && !isDirectDBLoading) {
          console.log('CheckAuthStatus: User exists but metadata missing, refreshing')
          setIsDirectDBLoading(true)
          
          // Paralelno, direktno dobaviti podatke iz baze
          try {
            const { data, error } = await supabase
              .from('users')
              .select('role, full_name, avatar_url')
              .eq('id', user.id)
              .single()
            
            if (!error && data && isMounted) {
              console.log('CheckAuthStatus: Direct DB fetch successful:', data)
              setDirectUserData(data)
            }
          } catch (err) {
            console.error('CheckAuthStatus: Error fetching user data directly:', err)
          } finally {
            if (isMounted) setIsDirectDBLoading(false)
          }
          
          // Osvežiti metapodatke kroz kontekst
          refreshUserMetadata()
        }
        
        // Provera admin pristupa
        if (adminOnly) {
          const userRole = userMetadata?.role || directUserData?.role
          
          if (userRole !== 'admin') {
            console.log('CheckAuthStatus: User is not admin, redirecting to dashboard')
            router.push('/dashboard')
            return
          }
        }
        
        // Sve je verifikovano, postaviti hasVerifiedAuth na true
        if (isMounted) setHasVerifiedAuth(true)
      } catch (error) {
        console.error('CheckAuthStatus: Error verifying auth:', error)
        if (isMounted) setHasVerifiedAuth(true) // Dozvoliti render i u slučaju greške
      }
    }
    
    if (!isLoading) {
      verifyAuth()
    }
    
    return () => {
      isMounted = false
    }
  }, [user, userMetadata, isLoading, requireAuth, adminOnly, router, refreshUserMetadata])
  
  // Prikazati loading stanje dok se autentikacija verifikuje
  if ((isLoading || !hasVerifiedAuth) && requireAuth) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin"></div>
        </div>
      )
    )
  }
  
  return <>{children}</>
} 