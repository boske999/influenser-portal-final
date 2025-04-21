'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Please enter your email address')
      return
    }
    
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?message=Check+your+email+to+reset+your+password`,
      })
      
      if (error) {
        setError(error.message || 'Failed to send reset password email')
      } else {
        setSuccessMessage('Reset password link sent! Check your email inbox.')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Reset Password form */}
      <div className="w-1/2 flex items-center justify-center">
        <div className="max-w-[505px] px-4 py-6 space-y-8">
          {/* Logo */}
          <div className="mb-8">
            <Image 
              src="https://fbmdbvijfufsjpsuorxi.supabase.co/storage/v1/object/public/company-logos/logos/Vector.svg" 
              alt="Logo" 
              width={40} 
              height={40} 
              className="navbar-logo" 
            />
          </div>
          
          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-textPrimary">Reset Password</h1>
            <p className="text-textSecondary">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Success message */}
            {successMessage && (
              <div className="bg-green-900/20 text-green-400 px-4 py-3 rounded-md">
                {successMessage}
              </div>
            )}
            
            <div className="space-y-3">
              {/* Email input */}
              <div>
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="input-field focus:border-white text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              {/* Error message */}
              {error && (
                <div className="text-red-500 text-sm mt-1">{error}</div>
              )}
            </div>
            
            {/* Reset Password button and back to login */}
            <div className="flex items-center space-x-5">
              <button 
                type="submit" 
                className="primary-button w-3/5"
                disabled={isLoading}
              >
                <span>{isLoading ? 'Sending...' : 'Reset Password'}</span>
                <svg 
                  width="7" 
                  height="14" 
                  viewBox="0 0 7 14" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M1 1L6 7L1 13" 
                    stroke="#131110" 
                    strokeWidth="1.67" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              
              <div className="text-sm text-white">
                <p>Remember your password?</p>
                <p className="text-yellow-400 cursor-pointer" onClick={() => router.push('/login')}>
                  Log In
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {/* Right side - Logo image */}
      <div className="w-1/2 login-bg relative flex items-center justify-center">
        <Image 
          src="https://fbmdbvijfufsjpsuorxi.supabase.co/storage/v1/object/public/company-logos/logos/Frame%2022.webp" 
          alt="Logo" 
          width={2000} 
          height={2000}
          className="image-100-cover"
        />
      </div>
    </div>
  )
} 