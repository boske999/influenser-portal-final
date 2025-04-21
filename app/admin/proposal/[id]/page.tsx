'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'

type Proposal = {
  id: string
  title: string
  company_name: string
  campaign_start_date: string
  campaign_end_date: string
  short_description: string
  content: any
  created_at: string
}

type Response = {
  id: string
  user: {
    email: string
    full_name: string
  }
  status: 'accepted' | 'rejected'
  proposed_publish_date: string | null
  created_at: string
}

export default function ProposalDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchProposal = async () => {
      try {
        // Fetch the proposal
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('id', id)
          .single()
        
        if (error) {
          console.error('Error fetching proposal:', error)
          router.push('/admin')
          return
        }
        
        setProposal(data)
        
        // Fetch responses for this proposal with user info
        const { data: responseData, error: responseError } = await supabase
          .from('responses')
          .select(`
            id,
            status,
            proposed_publish_date,
            created_at,
            user:user_id (
              email,
              full_name
            )
          `)
          .eq('proposal_id', id)
          .order('created_at', { ascending: false })
        
        if (responseError) {
          console.error('Error fetching responses:', responseError)
        } else if (responseData) {
          // Transform the data to match the expected Response type
          const formattedResponses = responseData.map((item: any) => ({
            id: item.id,
            status: item.status,
            proposed_publish_date: item.proposed_publish_date,
            created_at: item.created_at,
            user: {
              email: item.user?.email || '',
              full_name: item.user?.full_name || ''
            }
          }))
          setResponses(formattedResponses)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (id) {
      fetchProposal()
    }
  }, [id, router])
  
  // Format date range function
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // Format the dates to display as "Month DD-DD" or "Month DD - Month DD" if different months
    const startMonth = start.toLocaleString('default', { month: 'long' })
    const endMonth = end.toLocaleString('default', { month: 'long' })
    
    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()}-${end.getDate()}`
    } else {
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`
    }
  }
  
  // Format date function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  
  // Calculate timeline in days
  const calculateTimeline = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays} days`
  }
  
  if (isLoading || !proposal) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080808]">
        <div className="w-8 h-8 border-t-2 border-[#FFB900] rounded-full animate-spin"></div>
      </div>
    )
  }
  
  return (
    <div className="p-10">
      <div className="mb-10 flex items-center space-x-4">
        <Link href={`/admin/company/${proposal.id}`} className="text-[#FFB900]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <h1 className="text-white text-3xl font-bold">{proposal.title}</h1>
      </div>
      
      <div className="grid grid-cols-3 gap-8 mb-12">
        <div className="bg-[#121212] border border-white/5 p-6">
          <h3 className="text-[#FFB900] text-sm mb-1">Company</h3>
          <p className="text-white">{proposal.company_name}</p>
        </div>
        <div className="bg-[#121212] border border-white/5 p-6">
          <h3 className="text-[#FFB900] text-sm mb-1">Campaign Date</h3>
          <p className="text-white">
            {formatDateRange(
              proposal.campaign_start_date,
              proposal.campaign_end_date
            )}
          </p>
        </div>
        <div className="bg-[#121212] border border-white/5 p-6">
          <h3 className="text-[#FFB900] text-sm mb-1">Timeline</h3>
          <p className="text-white">
            {calculateTimeline(
              proposal.campaign_start_date,
              proposal.campaign_end_date
            )}
          </p>
        </div>
      </div>
      
      <div className="mb-12">
        <h2 className="text-white text-2xl font-bold mb-4">Description</h2>
        <div className="bg-[#121212] border border-white/5 p-6">
          <p className="text-white">{proposal.short_description}</p>
        </div>
      </div>
      
      <div className="mb-12">
        <h2 className="text-white text-2xl font-bold mb-4">Full Content</h2>
        <div className="bg-[#121212] border border-white/5 p-6">
          {proposal.content?.blocks?.map((block: any, index: number) => (
            <div key={index} className="mb-4">
              {block.type === 'paragraph' && (
                <p className="text-white">{block.text}</p>
              )}
              {block.type === 'heading' && (
                <h3 className="text-white text-xl font-bold mb-2">{block.text}</h3>
              )}
              {block.type === 'list' && (
                <ul className="list-disc list-inside text-white">
                  {block.items.map((item: string, itemIndex: number) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-2xl font-bold">Responses ({responses.length})</h2>
          <Link 
            href={`/admin/proposal/${id}/responses`} 
            className="text-[#FFB900] flex items-center space-x-2"
          >
            <span>View All Responses</span>
            <svg width="7" height="14" viewBox="0 0 7 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L6 7L1 13" stroke="#FFB900" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
        
        {responses.length === 0 ? (
          <div className="bg-[#121212] border border-white/5 p-6 text-center">
            <p className="text-gray-400">No responses yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {responses.slice(0, 3).map((response) => (
              <div key={response.id} className={`bg-[#121212] border ${
                response.status === 'accepted' ? 'border-[#1e3a1e]' : 'border-[#3a1e1e]'
              } p-6`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white text-lg font-medium mb-2">
                      {response.user.full_name || response.user.email}
                    </h3>
                    
                    <div className="flex space-x-12 mb-4">
                      <div>
                        <p className="text-sm text-[#FFB900]">Submitted On</p>
                        <p className="text-gray-300">{formatDate(response.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#FFB900]">Proposed Publish Date</p>
                        <p className="text-gray-300">{formatDate(response.proposed_publish_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#FFB900]">Status</p>
                        <p className={`capitalize ${
                          response.status === 'accepted' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {response.status}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    href={`/admin/response/${response.id}`}
                    className="flex items-center space-x-2 text-[#FFB900]"
                  >
                    <span>View Response</span>
                    <svg width="7" height="14" viewBox="0 0 7 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L6 7L1 13" stroke="#FFB900" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 