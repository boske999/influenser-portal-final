'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function AdminTest() {
  const { user, isAuthenticated, isAdmin, userData } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  
  useEffect(() => {
    const fetchSessionInfo = async () => {
      // Import supabase dynamically to avoid server-side issues
      const { supabase } = await import('../../lib/supabase')
      const { data } = await supabase.auth.getSession()
      setSessionInfo(data.session)
    }
    
    fetchSessionInfo()
  }, [])
  
  return (
    <div className="p-10 bg-gray-900 min-h-screen">
      <h1 className="text-4xl font-bold text-white mb-8">Admin Test Page</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-semibold mb-4">Authentication Status</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-700 p-3 rounded">
            <span className="text-gray-400">Authenticated:</span>
            <span className={isAuthenticated ? 'text-green-400 ml-2' : 'text-red-400 ml-2'}>
              {isAuthenticated ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div className="bg-gray-700 p-3 rounded">
            <span className="text-gray-400">Admin:</span>
            <span className={isAdmin ? 'text-green-400 ml-2' : 'text-red-400 ml-2'}>
              {isAdmin ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div className="bg-gray-700 p-3 rounded">
            <span className="text-gray-400">User ID:</span>
            <span className="text-blue-400 ml-2">
              {user?.id || 'None'}
            </span>
          </div>
          
          <div className="bg-gray-700 p-3 rounded">
            <span className="text-gray-400">Role:</span>
            <span className="text-yellow-400 ml-2">
              {userData?.role || 'None'}
            </span>
          </div>
        </div>
        
        <h3 className="text-xl font-semibold mb-3">Session Data</h3>
        <pre className="bg-gray-700 p-4 rounded overflow-auto text-xs">
          {sessionInfo ? JSON.stringify(sessionInfo, null, 2) : 'No session data'}
        </pre>
      </div>
      
      <div className="mt-8 flex gap-4">
        <button 
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Home
        </button>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Go to Dashboard
        </button>
        <button 
          onClick={() => window.location.href = '/login'}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Go to Login
        </button>
      </div>
    </div>
  )
} 