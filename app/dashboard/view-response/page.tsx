'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import LoadingTimeout from '../../components/LoadingTimeout'

type Response = {
  id: string
  proposal_id: string
  user_id: string
  status: 'accepted' | 'rejected' | 'pending_update'
  proposed_publish_date: string | null
  quote: string | null
  platforms: string[]
  payment_method: string | null
  uploaded_video_url: string | null
  video_link: string | null
  message: string | null
  created_at: string
  admin_responses?: {
    id: string
    status: 'approved' | 'rejected' | 'pending'
    message_to_user: string | null
    created_at: string
  } | Array<{
    id: string
    status: 'approved' | 'rejected' | 'pending'
    message_to_user: string | null
    created_at: string
  }>
  proposal: {
    title: string
    company_name: string
  }
}

const platforms = [
  { id: 'youtube', name: 'YouTube', icon: '📺' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'facebook', name: 'Facebook', icon: '👥' },
  { id: 'x', name: 'X / Twitter', icon: '🐦' }
]

const paymentMethods = [
  { id: 'paypal', name: 'PayPal' },
  { id: 'wire', name: 'Wire Transfer' },
  { id: 'crypto', name: 'Cryptocurrency' }
]

export default function ViewResponsePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const responseId = searchParams?.get('id')
  const updated = searchParams?.get('updated')
  
  const [response, setResponse] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)

  useEffect(() => {
    if (updated === 'true') {
      setShowUpdateBanner(true)
      // Hide the banner after 5 seconds
      const timer = setTimeout(() => {
        setShowUpdateBanner(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [updated])

  useEffect(() => {
    const fetchResponseDetails = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      if (!responseId) {
        router.push('/dashboard/responses')
        return
      }

      try {
        // Fetch response details
        const { data, error } = await supabase
          .from('responses')
          .select(`
            id,
            proposal_id,
            user_id,
            status,
            proposed_publish_date,
            quote,
            platforms,
            payment_method,
            uploaded_video_url,
            video_link,
            message,
            created_at,
            proposal:proposals(
              title,
              company_name
            ),
            admin_responses(
              id,
              status,
              message_to_user,
              created_at
            )
          `)
          .eq('id', responseId)
          .eq('user_id', user.id)
          .single()
        
        if (error) {
          console.error('Error fetching response:', error)
          router.push('/dashboard/responses')
          return
        }
        
        // Always get the latest admin status to account for status changes
        if (data.admin_responses && Array.isArray(data.admin_responses) && data.admin_responses.length > 0) {
          // Refresh admin responses data to get the most current status
          const { data: adminData, error: adminError } = await supabase
            .from('admin_responses')
            .select('id, status, message_to_user, created_at')
            .eq('response_id', responseId)
            .order('created_at', { ascending: false })
            .limit(1)
            
          if (!adminError && adminData && adminData.length > 0) {
            data.admin_responses = adminData
          }
        }
        
        // Format the data to match our Response type
        const formattedResponse: Response = {
          ...data,
          proposal: {
            title: data.proposal ? (data.proposal as any).title || '' : '',
            company_name: data.proposal ? (data.proposal as any).company_name || '' : ''
          }
        };
        
        setResponse(formattedResponse)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!isLoading) {
      fetchResponseDetails()
    }
  }, [user, isLoading, router, responseId, updated])

  const renderAdminStatusBadge = () => {
    if (!response) {
      return null;
    }
    
    // Check if admin_responses is undefined or null
    if (!response.admin_responses) {
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-yellow-900/20 text-yellow-500">
          Pending Review
        </span>
      );
    }
    
    // Proveri da li je admin_responses objekat ili niz
    const adminResponse = Array.isArray(response.admin_responses) 
      ? (response.admin_responses.length > 0 ? response.admin_responses[0] : undefined)
      : response.admin_responses;
    
    // Provera da li postoji status polje
    if (!adminResponse || adminResponse.status === undefined) {
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-yellow-900/20 text-yellow-500">
          Pending Review
        </span>
      );
    }
    
    // Konvertujemo status u string za poređenje
    const statusStr = String(adminResponse.status).toLowerCase();
    
    // Use direct value comparison
    if (statusStr === "rejected" || statusStr.includes("reject")) {
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-red-900/20 text-red-500">
          Rejected by Admin
        </span>
      );
    } else if (statusStr === "approved" || statusStr.includes("approv")) {
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-green-900/20 text-green-500">
          Approved by Admin
        </span>
      );
    } else if (statusStr === "pending" || statusStr.includes("pend")) {
      // Check if the status used to be rejected (implying it was edited and is now pending)
      if (updated === 'true') {
        return (
          <span className="px-3 py-1 rounded-full text-sm bg-yellow-900/20 text-yellow-500">
            Pending Review (Updated)
          </span>
        );
      }
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-yellow-900/20 text-yellow-500">
          Pending Review
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-yellow-900/20 text-yellow-500">
          Status: {adminResponse.status || "Unknown"}
        </span>
      );
    }
  };

  const getPaymentMethodName = (id: string | null) => {
    if (!id) return 'Not selected';
    const method = paymentMethods.find(m => m.id === id);
    return method ? method.name : id;
  }
  
  const getAdminResponse = () => {
    if (!response || !response.admin_responses) return null;
    
    return Array.isArray(response.admin_responses) 
      ? (response.admin_responses.length > 0 ? response.admin_responses[0] : null)
      : response.admin_responses;
  }
  
  const isRejectedByAdmin = () => {
    const adminResponse = getAdminResponse();
    if (!adminResponse) return false;
    
    const statusStr = String(adminResponse.status).toLowerCase();
    return statusStr === "rejected" || statusStr.includes("reject");
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-t-2 border-[#FFB900] rounded-full animate-spin"></div>
        <LoadingTimeout isLoading={true} />
      </div>
    )
  }

  if (!response) {
    return (
      <div className="p-8 min-h-screen bg-background">
        <div className="flex flex-col items-center justify-center p-12 bg-[#121212] border border-white/5 text-center rounded-md">
          <p className="text-xl text-gray-300 mb-3">Response not found</p>
          <p className="text-gray-400">The response you are looking for doesn't exist</p>
          <Link
            href="/dashboard/responses"
            className="mt-8 inline-flex items-center justify-between px-8 py-4 bg-white rounded-full"
          >
            <span className="mr-4 text-black font-medium">Back to Responses</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 min-h-screen bg-background">
      {/* Success banner */}
      {showUpdateBanner && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
          <div className="bg-green-900/90 text-green-100 px-4 py-3 rounded-lg shadow-lg border border-green-700 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p>Your response has been updated successfully!</p>
            </div>
            <button onClick={() => setShowUpdateBanner(false)} className="text-green-100 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Back button */}
      <div className="mb-8">
        <Link
          href={`/dashboard/responses`}
          className="text-[#FFB900] flex items-center space-x-2"
        >
          <svg width="7" height="14" viewBox="0 0 7 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 1L1 7L6 13" stroke="#FFB900" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Back to Responses</span>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{response.proposal.title}</h1>
              <p className="text-gray-400">{response.proposal.company_name}</p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                response.status === 'accepted' 
                  ? 'bg-green-900/20 text-green-500' 
                  : response.status === 'pending_update'
                    ? 'bg-yellow-900/20 text-yellow-500'
                    : 'bg-red-900/20 text-red-500'
              }`}>
                {response.status === 'accepted' ? 'Accepted' : response.status === 'pending_update' ? 'Pending Update' : 'Declined'}
              </span>
              
              {(response.status === 'accepted' || response.status === 'pending_update') && renderAdminStatusBadge()}

              <div className="text-sm text-gray-400">
                Responded on: {new Date(response.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Message (if exists) */}
        {(() => {
          if (!response.admin_responses) {
            return null;
          }
          
          // Proveri da li je admin_responses objekat ili niz
          const adminResponse = Array.isArray(response.admin_responses) 
            ? (response.admin_responses.length > 0 ? response.admin_responses[0] : undefined)
            : response.admin_responses;
          
          if (!adminResponse || !adminResponse.message_to_user) {
            return null;
          }
          
          // Sada znamo da je poruka validna
          return (
            <div className="bg-[#121212] border border-white/5 p-6 rounded-lg mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Admin Response</h2>
              
              <div className="flex items-center mb-4">
                <span className="text-[#FFB900] mr-2">Status:</span>
                {renderAdminStatusBadge()}
              </div>
              
              <div>
                <h3 className="text-[#FFB900] mb-2">Message from Admin</h3>
                <div className="p-4 bg-[#1A1A1A] rounded-lg">
                  <p className="text-gray-300">{adminResponse.message_to_user}</p>
                </div>
              </div>
              
              {(isRejectedByAdmin() || response.status === 'pending_update') && (
                <div className="mt-6">
                  <Link
                    href={`/dashboard/edit-response?id=${response.id}`}
                    className="inline-flex items-center justify-center px-6 py-3 bg-[#FFB900] rounded-full text-black hover:bg-[#E2A600] transition"
                  >
                    Edit Your Response
                  </Link>
                </div>
              )}
            </div>
          );
        })()}

        <div className="bg-[#121212] border border-white/5 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-white mb-6">Your Response</h2>

          {response.status === 'rejected' ? (
            <div className="mb-6">
              <h3 className="text-[#FFB900] mb-2">Reason for Declining</h3>
              <p className="text-gray-300">{response.message || 'No reason provided'}</p>
            </div>
          ) : (
            <>
              {response.quote && (
                <div className="mb-6">
                  <h3 className="text-[#FFB900] mb-2">Your Quote</h3>
                  <p className="text-gray-300">{response.quote}</p>
                </div>
              )}
              
              {response.proposed_publish_date && (
                <div className="mb-6">
                  <h3 className="text-[#FFB900] mb-2">Proposed Publish Date</h3>
                  <p className="text-gray-300">{new Date(response.proposed_publish_date).toLocaleDateString()}</p>
                </div>
              )}
              
              {response.platforms && response.platforms.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-[#FFB900] mb-2">Selected Platforms</h3>
                  <div className="flex flex-wrap gap-2">
                    {response.platforms.map(platformId => {
                      const platform = platforms.find(p => p.id === platformId);
                      return platform ? (
                        <div
                          key={platform.id}
                          className="px-3 py-2 bg-[#1A1A1A] rounded-lg flex items-center"
                        >
                          <span className="mr-2">{platform.icon}</span>
                          <span className="text-gray-300">{platform.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              
              {response.payment_method && (
                <div className="mb-6">
                  <h3 className="text-[#FFB900] mb-2">Payment Method</h3>
                  <p className="text-gray-300">{getPaymentMethodName(response.payment_method)}</p>
                </div>
              )}
              
              {response.video_link && (
                <div className="mb-6">
                  <h3 className="text-[#FFB900] mb-2">Video Link</h3>
                  <a 
                    href={response.video_link} 
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="text-blue-400 underline break-words"
                  >
                    {response.video_link}
                  </a>
                </div>
              )}
              
              {response.uploaded_video_url && (
                <div className="mb-6">
                  <h3 className="text-[#FFB900] mb-2">Uploaded Video</h3>
                  <video 
                    className="w-full max-h-96 rounded-lg" 
                    controls
                    src={response.uploaded_video_url}
                  />
                </div>
              )}
              
              {response.message && (
                <div className="mb-6">
                  <h3 className="text-[#FFB900] mb-2">Additional Message</h3>
                  <p className="text-gray-300">{response.message}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between mt-8">
          <Link
            href="/dashboard/responses"
            className="inline-flex items-center justify-center px-6 py-3 border border-white/20 rounded-full text-white hover:bg-white/5 transition"
          >
            Back to Responses
          </Link>
          
          <div className="flex space-x-3">
            <Link
              href={`/dashboard/chats/${response.proposal_id}`}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 border border-white/20 rounded-full text-white hover:bg-white/5 transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-medium">Open Chat</span>
            </Link>
            
            <Link
              href={`/dashboard/proposal/${response.proposal_id}`}
              className="inline-flex items-center space-x-2 justify-center px-6 py-3 bg-[#FFB900] rounded-full text-black hover:bg-[#E2A600] transition"
            >
              <span>View Proposal</span>
              <svg width="7" height="14" viewBox="0 0 7 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L6 7L1 13" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 