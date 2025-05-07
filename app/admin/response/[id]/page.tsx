'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'

type ResponseDetail = {
  id: string
  status: 'accepted' | 'rejected'
  quote: string
  proposed_publish_date: string | null
  platforms: string[]
  payment_method: string
  message: string
  uploaded_video_url: string | null
  video_link: string | null
  created_at: string
  user_id: string
  proposal_id: string
  user_email: string
  proposal_title: string
  company_name: string
  admin_response?: {
    id: string | null
    status: 'pending' | 'approved' | 'rejected'
    message_to_user: string | null
  } | null
}

export default function ResponseDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [response, setResponse] = useState<ResponseDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [responseAction, setResponseAction] = useState<'approved' | 'rejected'>('approved')
  const [adminMessage, setAdminMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  useEffect(() => {
    const fetchResponseDetails = async () => {
      try {
        // First fetch the response
        const { data: responseData, error: responseError } = await supabase
          .from('responses')
          .select(`
            id,
            status,
            quote,
            proposed_publish_date,
            platforms,
            payment_method,
            message,
            uploaded_video_url,
            video_link,
            created_at,
            user_id,
            proposal_id
          `)
          .eq('id', id)
          .single()
        
        if (responseError) {
          console.error('Error fetching response:', responseError)
          router.push('/admin')
          return
        }
        
        // Fetch user info
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', responseData.user_id)
          .single()
          
        if (userError) {
          console.error('Error fetching user:', userError)
        }
        
        // Fetch proposal info
        const { data: proposalData, error: proposalError } = await supabase
          .from('proposals')
          .select('title, company_name')
          .eq('id', responseData.proposal_id)
          .single()
          
        if (proposalError) {
          console.error('Error fetching proposal:', proposalError)
        }

        // Fetch admin response if exists
        const { data: adminResponseData, error: adminResponseError } = await supabase
          .from('admin_responses')
          .select('id, status, message_to_user')
          .eq('response_id', id)
          .maybeSingle()

        if (adminResponseError) {
          console.error('Error fetching admin response:', adminResponseError)
        }
        
        // Combine all data
        const combinedData: ResponseDetail = {
          ...responseData,
          user_email: userData?.email || 'Unknown User',
          proposal_title: proposalData?.title || 'Unknown Proposal',
          company_name: proposalData?.company_name || '',
          admin_response: adminResponseData
        }
        
        setResponse(combinedData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (id) {
      fetchResponseDetails()
    }
  }, [id, router])

  const handleSubmitResponse = async () => {
    if (!response) return
    
    setIsSubmitting(true)
    
    try {
      // Check if admin response already exists
      const adminResponseExists = response.admin_response?.id
      
      if (adminResponseExists) {
        // Update existing admin response
        const { error } = await supabase
          .from('admin_responses')
          .update({
            status: responseAction,
            message_to_user: adminMessage,
          })
          .eq('id', adminResponseExists)
        
        if (error) throw error
      } else {
        // Create new admin response
        const { error } = await supabase
          .from('admin_responses')
          .insert({
            response_id: response.id,
            status: responseAction,
            message_to_user: adminMessage,
          })
        
        if (error) throw error
      }
      
      // Refresh the page to show updated data
      router.refresh()
      
      // Update local state
      setResponse({
        ...response,
        admin_response: {
          id: response.admin_response?.id || null,
          status: responseAction,
          message_to_user: adminMessage
        }
      })
      
      // Hide the form
      setShowResponseForm(false)
    } catch (error) {
      console.error('Error submitting admin response:', error)
      alert('Failed to submit response. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Format date function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  }
  
  if (isLoading || !response) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080808]">
        <div className="w-8 h-8 border-t-2 border-[#FFB900] rounded-full animate-spin"></div>
      </div>
    )
  }
  
  return (
    <div className="p-10">
      <div className="flex items-center space-x-2 mb-6">
        <Link href="/admin" className="text-[#FFB900]">Admin Dashboard</Link>
        <span className="text-gray-400">{'>'}</span>
        <Link href={`/admin/proposal/${response.proposal_id}/responses`} className="text-[#FFB900]">Proposal</Link>
        <span className="text-gray-400">{'>'}</span>
        <span className="text-gray-400">Details</span>
      </div>
      
      <Link href={`/admin/proposal/${response.proposal_id}/responses`} className="text-[#FFB900] inline-flex items-center mb-8">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
          <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </Link>
      
      <div className="bg-[#121212] border border-white/5 p-8 rounded-lg mb-10">
        <div className="mb-8">
          <p className="text-[#FFB900] text-sm mb-2">Response By</p>
          <h1 className="text-white text-3xl font-bold">{response.user_email}</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div>
            <p className="text-[#FFB900] text-sm mb-2">Quote</p>
            <p className="text-white">{response.quote || 'No quote provided'}</p>
          </div>
          
          <div>
            <p className="text-[#FFB900] text-sm mb-2">Date</p>
            <p className="text-white">{formatDate(response.created_at)}</p>
          </div>
          
          <div>
            <p className="text-[#FFB900] text-sm mb-2">Platforms</p>
            <p className="text-white">{response.platforms?.join(', ') || 'None'}</p>
          </div>
          
          {response.proposed_publish_date && (
            <div>
              <p className="text-[#FFB900] text-sm mb-2">Publish Date</p>
              <p className="text-white">{formatDate(response.proposed_publish_date)}</p>
            </div>
          )}
          
          {response.payment_method && (
            <div>
              <p className="text-[#FFB900] text-sm mb-2">Payment Method</p>
              <p className="text-white">{response.payment_method}</p>
            </div>
          )}
          
          <div>
            <p className="text-[#FFB900] text-sm mb-2">Status</p>
            <p className={`capitalize ${
              response.status === 'accepted' ? 'text-green-500' : 'text-red-500'
            }`}>
              {response.status}
            </p>
          </div>

          <div>
            <p className="text-[#FFB900] text-sm mb-2">Admin Response</p>
            <p className={`capitalize ${
              response.admin_response?.status === 'approved' ? 'text-green-500' : 
              response.admin_response?.status === 'rejected' ? 'text-red-500' : 
              'text-gray-400'
            }`}>
              {response.admin_response?.status || 'Pending'}
            </p>
          </div>
        </div>
        
        {response.message && (
          <div className="mb-10">
            <p className="text-[#FFB900] text-sm mb-2">Message</p>
            <p className="text-white whitespace-pre-wrap">{response.message}</p>
          </div>
        )}

        {response.admin_response?.message_to_user && (
          <div className="mb-10">
            <p className="text-[#FFB900] text-sm mb-2">Admin Message</p>
            <p className="text-white whitespace-pre-wrap">{response.admin_response.message_to_user}</p>
          </div>
        )}
        
        {(response.video_link || response.uploaded_video_url) && (
          <div>
            <p className="text-[#FFB900] text-sm mb-4">Video</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {response.video_link && (
                <div className="bg-black aspect-video relative flex items-center justify-center rounded overflow-hidden">
                  <a 
                    href={response.video_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="bg-[#FFB900] rounded-full w-16 h-16 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 3L19 12L5 21V3Z" fill="black"/>
                      </svg>
                    </div>
                  </a>
                </div>
              )}
              
              {response.uploaded_video_url && (
                <div className="bg-black aspect-video relative flex items-center justify-center rounded overflow-hidden">
                  <a 
                    href={response.uploaded_video_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="bg-[#FFB900] rounded-full w-16 h-16 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 3L19 12L5 21V3Z" fill="black"/>
                      </svg>
                    </div>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {!showResponseForm ? (
        <div className="flex justify-center space-x-4">
          <button 
            className="bg-white text-black px-8 py-3 rounded-full font-medium flex items-center space-x-2"
            onClick={() => {
              setResponseAction('approved')
              setShowResponseForm(true)
            }}
          >
            <span>Apply Offer</span>
            <svg width="7" height="14" viewBox="0 0 7 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L6 7L1 13" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <button 
            className="border border-white text-white px-8 py-3 rounded-full font-medium flex items-center space-x-2"
            onClick={() => {
              setResponseAction('rejected')
              setShowResponseForm(true)
            }}
          >
            <span>Decline Offer</span>
            <svg width="7" height="14" viewBox="0 0 7 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L6 7L1 13" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      ) : (
        <div className="bg-[#121212] border border-white/5 p-8 rounded-lg">
          <h2 className="text-white text-xl font-bold mb-4">
            {responseAction === 'approved' ? 'Apply Offer' : 'Decline Offer'}
          </h2>
          
          <div className="mb-6">
            <label htmlFor="adminMessage" className="block text-[#FFB900] text-sm mb-2">
              Message to User
            </label>
            <textarea
              id="adminMessage"
              className="w-full bg-[#1A1A1A] border border-white/10 rounded p-3 text-white"
              rows={5}
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
              placeholder="Enter your message to the user..."
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              className="border border-white text-white px-6 py-2 rounded-md"
              onClick={() => setShowResponseForm(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            
            <button
              className={`bg-[#FFB900] text-black px-6 py-2 rounded-md font-medium ${isSubmitting ? 'opacity-50' : ''}`}
              onClick={handleSubmitResponse}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 