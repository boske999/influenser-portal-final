'use client'

import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthDebug() {
  const { user, isLoading, isAuthenticated, signOut, userData } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [expanded, setExpanded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  async function refreshSession() {
    setRefreshing(true)
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error("Session refresh error:", error)
      } else {
        setSessionInfo(data.session)
      }
    } catch (err) {
      console.error("Error during session refresh:", err)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    refreshSession()
  }, [user])

  return (
    <div className="fixed bottom-0 right-0 p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 font-mono shadow-lg max-w-md">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-white">Auth Debug</h3>
          <div className="flex gap-2">
            <button 
              onClick={refreshSession}
              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              onClick={() => setExpanded(!expanded)}
              className="px-2 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600 transition-colors"
            >
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="flex gap-1.5">
            <span className="text-gray-400">Loading:</span>
            <span className={isLoading ? 'text-yellow-400' : 'text-green-400'}>
              {isLoading ? 'true' : 'false'}
            </span>
          </div>
          <div className="flex gap-1.5">
            <span className="text-gray-400">Authenticated:</span>
            <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
              {isAuthenticated ? 'true' : 'false'}
            </span>
          </div>
          <div className="flex gap-1.5">
            <span className="text-gray-400">Role:</span>
            <span className="text-cyan-400">{userData?.role || 'none'}</span>
          </div>
          <div className="flex gap-1.5">
            <span className="text-gray-400">Session:</span>
            <span className={sessionInfo ? 'text-green-400' : 'text-red-400'}>
              {sessionInfo ? 'active' : 'none'}
            </span>
          </div>
        </div>

        {expanded && (
          <>
            <hr className="border-gray-700 my-2" />
            
            <div className="mb-2">
              <h4 className="text-white mb-1">User Info:</h4>
              <pre className="whitespace-pre-wrap break-all text-xs bg-gray-900 p-1.5 rounded">
                {user ? JSON.stringify(user, null, 2) : 'No user data'}
              </pre>
            </div>
            
            {userData && (
              <div className="mb-2">
                <h4 className="text-white mb-1">User Profile:</h4>
                <pre className="whitespace-pre-wrap break-all text-xs bg-gray-900 p-1.5 rounded">
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </div>
            )}
            
            {sessionInfo && (
              <div className="mb-2">
                <h4 className="text-white mb-1">Session Info:</h4>
                <pre className="whitespace-pre-wrap break-all text-xs bg-gray-900 p-1.5 rounded">
                  {JSON.stringify({
                    expires_at: sessionInfo.expires_at,
                    token_type: sessionInfo.token_type,
                    provider_token: sessionInfo.provider_token ? '[PRESENT]' : null,
                    provider_refresh_token: sessionInfo.provider_refresh_token ? '[PRESENT]' : null,
                    access_token: sessionInfo.access_token ? '[PRESENT]' : null,
                    refresh_token: sessionInfo.refresh_token ? '[PRESENT]' : null,
                  }, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="flex gap-2 mt-3">
              <button 
                onClick={() => signOut()}
                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 