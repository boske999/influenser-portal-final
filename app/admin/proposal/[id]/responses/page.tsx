'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../../context/AuthContext'
import { supabase } from '../../../../lib/supabase'

type UserResponse = {
  id: string
  status: 'accepted' | 'rejected'
  proposed_publish_date: string | null
  platforms: string[]
  message: string
  quote: string
  payment_method: string
  created_at: string
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
  admin_response?: {
    status: 'pending' | 'approved' | 'rejected'
    message_to_user: string | null
  } | null
}

type Proposal = {
  id: string
  title: string
  company_name: string
}

export default function AllResponsesPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [responses, setResponses] = useState<UserResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch the proposal details
        const { data: proposalData, error: proposalError } = await supabase
          .from('proposals')
          .select('id, title, company_name')
          .eq('id', id)
          .single()
        
        if (proposalError) {
          console.error('Error fetching proposal:', proposalError)
          router.push('/admin')
          return
        }
        
        setProposal(proposalData)
        
        // 2. Fetch responses with user_id
        const { data: responseData, error: responseError } = await supabase
          .from('responses')
          .select('id, status, proposed_publish_date, platforms, message, quote, payment_method, created_at, user_id')
          .eq('proposal_id', id)
          .order(sortField, { ascending: sortOrder === 'asc' })
        
        if (responseError || !responseData) {
          console.error('Error fetching responses:', responseError)
          setIsLoading(false)
          return
        }
        
        // 3. Get a unique list of user IDs
        const userIds = Array.from(new Set(responseData.map(r => r.user_id)))
        
        // 4. Fetch all users in a single query
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url')
          .in('id', userIds)
        
        if (usersError) {
          console.error('Error fetching users:', usersError)
        }
        
        // 5. Create a map of users by ID
        const usersMap = new Map()
        usersData?.forEach(user => {
          usersMap.set(user.id, user)
        })
        
        // 6. Fetch admin responses
        const { data: adminResponses, error: adminResponsesError } = await supabase
          .from('admin_responses')
          .select('id, response_id, status, message_to_user')
        
        if (adminResponsesError) {
          console.error('Error fetching admin responses:', adminResponsesError)
        }
        
        // 7. Create a map of admin responses by response_id
        const adminResponsesMap = new Map()
        adminResponses?.forEach(ar => {
          adminResponsesMap.set(ar.response_id, ar)
        })
        
        // 8. Combine all the data
        const formattedResponses = responseData.map(item => {
          const userData = usersMap.get(item.user_id) || { id: item.user_id, email: 'Unknown', full_name: null, avatar_url: null }
          const adminResponse = adminResponsesMap.get(item.id)
          
          return {
            id: item.id,
            status: item.status,
            proposed_publish_date: item.proposed_publish_date,
            platforms: item.platforms || [],
            message: item.message || '',
            quote: item.quote || '',
            payment_method: item.payment_method || '',
            created_at: item.created_at,
            user: {
              id: userData.id,
              email: userData.email,
              full_name: userData.full_name,
              avatar_url: userData.avatar_url
            },
            admin_response: adminResponse ? {
              status: adminResponse.status,
              message_to_user: adminResponse.message_to_user
            } : null
          } as UserResponse
        })
        
        // 9. Sort by user name if needed
        if (sortField === 'user.full_name') {
          formattedResponses.sort((a, b) => {
            const nameA = (a.user.full_name || a.user.email || '').toLowerCase()
            const nameB = (b.user.full_name || b.user.email || '').toLowerCase()
            return sortOrder === 'asc' 
              ? nameA.localeCompare(nameB)
              : nameB.localeCompare(nameA)
          })
        }
        // Sort by admin status if needed
        else if (sortField === 'admin_status') {
          formattedResponses.sort((a, b) => {
            const statusA = a.admin_response?.status || 'pending'
            const statusB = b.admin_response?.status || 'pending'
            // Custom status order: approved, pending, rejected
            const statusOrder = { 
              approved: 1, 
              pending: 2, 
              rejected: 3 
            }
            const orderA = statusOrder[statusA as keyof typeof statusOrder]
            const orderB = statusOrder[statusB as keyof typeof statusOrder]
            
            return sortOrder === 'asc' 
              ? orderA - orderB
              : orderB - orderA
          })
        }
        
        setResponses(formattedResponses)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (id) {
      fetchData()
    }
  }, [id, router, sortField, sortOrder])
  
  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Default to descending for a new field
      setSortField(field)
      setSortOrder('desc')
    }
  }
  
  // Format date function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  
  if (isLoading || !proposal) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080808]">
        <div className="w-8 h-8 border-t-2 border-[#FFB900] rounded-full animate-spin"></div>
      </div>
    )
  }
  
  // Separate responses by status
  const acceptedResponses = responses.filter(r => r.status === 'accepted')
  const rejectedResponses = responses.filter(r => r.status === 'rejected')
  
  return (
    <div className="p-10">
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin" className="text-[#FFB900]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-white text-3xl font-bold">{proposal.title}</h1>
            <p className="text-gray-400">{proposal.company_name}</p>
          </div>
        </div>
        
        <Link 
          href={`/admin/proposal/${id}/edit`} 
          className="px-4 py-2 bg-white rounded-md text-black flex items-center space-x-2"
        >
          <span className="font-medium">Edit Proposal</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.3332 2.00004C11.5084 1.82494 11.7157 1.68605 11.9451 1.59129C12.1745 1.49653 12.4213 1.44775 12.6707 1.44775C12.92 1.44775 13.1668 1.49653 13.3962 1.59129C13.6256 1.68605 13.8329 1.82494 14.0082 2.00004C14.1833 2.17513 14.3222 2.38246 14.4169 2.61187C14.5117 2.84128 14.5605 3.08809 14.5605 3.33737C14.5605 3.58666 14.5117 3.83346 14.4169 4.06288C14.3222 4.29229 14.1833 4.49962 14.0082 4.67471L4.83317 13.8497L1.33317 14.6667L2.14984 11.1667L11.3332 2.00004Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>

      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-white text-2xl font-bold">All Responses ({responses.length})</h2>
        
        <div className="flex items-center space-x-4">
          <span className="text-white">Sort By:</span>
          <button 
            onClick={() => handleSort('created_at')}
            className={`px-3 py-1 rounded ${sortField === 'created_at' ? 'bg-[#FFB900] text-black' : 'bg-[#222] text-white'}`}
          >
            Date {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            onClick={() => handleSort('status')}
            className={`px-3 py-1 rounded ${sortField === 'status' ? 'bg-[#FFB900] text-black' : 'bg-[#222] text-white'}`}
          >
            Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            onClick={() => handleSort('user.full_name')}
            className={`px-3 py-1 rounded ${sortField === 'user.full_name' ? 'bg-[#FFB900] text-black' : 'bg-[#222] text-white'}`}
          >
            Name {sortField === 'user.full_name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            onClick={() => handleSort('admin_status')}
            className={`px-3 py-1 rounded ${sortField === 'admin_status' ? 'bg-[#FFB900] text-black' : 'bg-[#222] text-white'}`}
          >
            Admin Status {sortField === 'admin_status' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>
      
      {responses.length === 0 ? (
        <div className="bg-[#121212] border border-white/5 p-6 text-center">
          <p className="text-gray-400">No responses yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table headers */}
          <div className="grid grid-cols-6 gap-4 text-[#FFB900] text-sm px-4 py-2">
            <div>Email</div>
            <div>Date</div>
            <div>Quote</div>
            <div>Platforms</div>
            <div>Admin Status</div>
            <div className="text-right">Details</div>
          </div>
          
          {/* Table rows */}
          {responses.map((response) => (
            <div 
              key={response.id} 
              className={`bg-[#121212] border ${
                response.status === 'accepted' ? 'border-[#1e3a1e]' : 'border-[#3a1e1e]'
              } p-6 grid grid-cols-6 gap-4 items-center`}
            >
              <div>
                <p className="text-white">{response.user.email}</p>
              </div>
              
              <div>
                <p className="text-white">{formatDate(response.created_at)}</p>
              </div>
              
              <div>
                <p className="text-white">{response.quote || 'No quote provided'}</p>
              </div>
              
              <div>
                <p className="text-white">{response.platforms?.join(', ') || 'None'}</p>
              </div>
              
              <div>
                <p className={`capitalize font-medium ${
                  response.admin_response?.status === 'approved' ? 'text-green-500' : 
                  response.admin_response?.status === 'rejected' ? 'text-red-500' : 
                  'text-gray-400'
                }`}>
                  {response.admin_response?.status || 'Pending'}
                </p>
              </div>
              
              <div className="text-right">
                <Link 
                  href={`/admin/response/${response.id}`}
                  className="text-[#FFB900] inline-flex items-center space-x-2"
                >
                  <span>Details</span>
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
  )
} 