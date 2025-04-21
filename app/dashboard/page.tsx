'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { useNotifications } from '../context/NotificationContext'

type Company = {
  id: string
  name: string
  proposalCount: number
  hasNew: boolean
}

type Proposal = {
  id: string
  title: string
  company_name: string
  campaign_start_date: string
  campaign_end_date: string
  short_description: string
  created_at: string
  user_response?: {
    id: string
    status: string
    created_at: string
  } | null
  admin_response?: {
    id: string
    status: string
    message_to_user?: string
    created_at: string
  } | null
}

export default function Dashboard() {
  const { user, isLoading, userData, session, refreshUserData } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [fullName, setFullName] = useState<string>('')
  const { unreadCount } = useNotifications()
  const [timeoutOccurred, setTimeoutOccurred] = useState(false)

  // Add special effect for page refresh
  useEffect(() => {
    // Ako imamo korisnika, ali nemamo metadata, to je verovatno nakon refresh-a
    if (user && !userData) {
      refreshUserData();
    }
  }, [user, userData, refreshUserData]);

  // Remove the 3-second timeout effect
  useEffect(() => {
    setTimeoutOccurred(false);
    setCheckingRole(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkUserRole = async () => {
      // Skip checks if timeout has already occurred
      if (timeoutOccurred) {
        setCheckingRole(false);
        setLoading(false);
        return;
      }
      
      if (isLoading && !timeoutOccurred) {
        return;
      }
      
      if (!user) {
        router.push('/login')
        return
      }
      
      try {
        setLoading(true); // Set to loading while fetching data
        
        // Try to get user data from metadata first if available
        if (userData) {
          setIsAdmin(userData.role === 'admin')
          
          // Set full name explicitly from metadata
          if (userData.full_name) {
            setFullName(userData.full_name)
          }
        } else {
          // Fallback to fetching from Supabase directly
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role, email, full_name')
            .eq('id', user.id)
            .single()
          
          if (userError) {
            console.error("Dashboard: Nije moguće dohvatiti podatke o korisniku:", userError.message)
          } else if (userData) {
            setIsAdmin(userData.role === 'admin')
            
            if (userData.full_name) {
              setFullName(userData.full_name)
            }
          } else {
            setIsAdmin(false)
          }
        }
        
        // Get current date
        const currentDate = new Date().toISOString().split('T')[0]
        
        // First, fetch proposals
        const { data: proposalData, error: proposalError } = await supabase
          .from('proposals')
          .select('*')
          .gte('campaign_end_date', currentDate)
          .order('created_at', { ascending: false })
        
        if (proposalError) {
          console.error('Error fetching proposals:', proposalError)
          // Use mock data
          setProposals(getMockProposals())
        } else if (proposalData && proposalData.length > 0) {
          // If we have proposals, fetch responses for this user
          const proposalIds = proposalData.map(p => p.id)
          
          const { data: responseData, error: responseError } = await supabase
            .from('responses')
            .select(`
              *,
              admin_responses(*)
            `)
            .eq('user_id', user.id)
            .in('proposal_id', proposalIds)
          
          if (responseError) {
            console.error('Error fetching responses:', responseError)
            setProposals(proposalData)
          } else {
            // Map responses to their proposals
            const enhancedProposals = proposalData.map(proposal => {
              const userResponse = responseData?.find(r => r.proposal_id === proposal.id)
              
              // Sigurno dobavljanje admin response podataka
              let adminResponse = null;
              if (userResponse && userResponse.admin_responses) {
                // Proveri da li je admin_responses objekat ili niz
                if (Array.isArray(userResponse.admin_responses)) {
                  adminResponse = userResponse.admin_responses.length > 0 ? userResponse.admin_responses[0] : null;
                } else {
                  adminResponse = userResponse.admin_responses;
                }
              }
              
              return {
                ...proposal,
                user_response: userResponse || null,
                admin_response: adminResponse
              }
            })
            
            setProposals(enhancedProposals)
          }
        } else {
          setProposals(getMockProposals())
        }
        
      } catch (error) {
        console.error('Error:', error)
        // Use mock data for error case
        setProposals(getMockProposals())
      } finally {
        setCheckingRole(false)
        setLoading(false)
      }
    }

    // Only run when auth is finished loading or we have a timeout
    if ((!isLoading || timeoutOccurred) && checkingRole) {
      checkUserRole()
    }
  }, [user, isLoading, userData, router, checkingRole, timeoutOccurred, fullName])

  // Helper function to check if a proposal is from the last 7 days
  const isRecentProposal = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }

  if ((isLoading || checkingRole || loading) && !timeoutOccurred) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin"></div>
      </div>
    )
  }

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
  
  // Calculate timeline in days
  const calculateTimeline = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays} days`
  }

  // Add a helper function to render status badges
  const renderStatusBadge = (proposal: Proposal) => {
    // User hasn't responded yet
    if (!proposal.user_response) {
      return (
        <span className="px-2 status-badge py-1 text-xs bg-gray-700 text-gray-300 rounded-full">
          No Response
        </span>
      );
    }

    // User has responded
    if (proposal.user_response.status === 'accepted') {
      return (
        <span className="px-2 status-badge py-1 text-xs bg-[#FFB900] text-black rounded-full">
          Applied
        </span>
      );
    } else {
      // User declined
      return (
        <span className="px-2 status-badge py-1 text-xs bg-red-700 text-white rounded-full">
          Declined
        </span>
      );
    }
  };

  // Add a helper function to render admin status badges
  const renderAdminStatusBadge = (proposal: Proposal) => {
    // Only show admin status if user has applied
    if (!proposal.user_response || proposal.user_response.status !== 'accepted') {
      return null;
    }

    // If no admin_response exists
    if (!proposal.admin_response) {
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-yellow-900/20 text-yellow-500 mt-1">
          Pending Review
        </span>
      );
    }

    if (!proposal.admin_response.status) {
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-yellow-900/20 text-yellow-500 mt-1">
          Pending Review
        </span>
      );
    }
    
    // Konvertujemo status u string za poređenje
    const statusStr = String(proposal.admin_response.status).toLowerCase();
    
    // Provera statusa
    if (statusStr === "rejected" || statusStr.includes("reject")) {
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-red-900/20 text-red-500 mt-1">
          Rejected by Admin
        </span>
      );
    } else if (statusStr === "approved" || statusStr.includes("approv")) {
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-green-900/20 text-green-500 mt-1">
          Approved by Admin
        </span>
      );
    } else if (statusStr === "pending" || statusStr.includes("pend")) {
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-yellow-900/20 text-yellow-500 mt-1">
          Pending Review
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-yellow-900/20 text-yellow-500 mt-1">
          Status: {proposal.admin_response.status || "Unknown"}
        </span>
      );
    }
  };

  // Function to get mock proposals data
  const getMockProposals = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    const mockProposals = [
      {
        id: '1',
        title: 'New Product Launch Campaign',
        company_name: 'Tech Innovations Inc.',
        campaign_start_date: '2023-04-19',
        campaign_end_date: '2023-05-19',
        short_description: 'Help us promote our revolutionary new smart device to your audience.',
        created_at: '2023-04-01',
        user_response: null,
        admin_response: null
      },
      {
        id: '2',
        title: 'Eco-Friendly Brand Awareness',
        company_name: 'Green Earth Products',
        campaign_start_date: '2023-04-14',
        campaign_end_date: '2023-05-14',
        short_description: 'Promote sustainable living and environmentally friendly products.',
        created_at: '2023-04-05',
        user_response: {
          id: 'resp1',
          status: 'accepted',
          created_at: '2023-04-06',
          admin_responses: {
            id: 'adminresp1',
            status: 'approved',
            message_to_user: 'Great! Looking forward to working with you.',
            created_at: '2023-04-07'
          }
        },
        admin_response: {
          id: 'adminresp1',
          status: 'approved',
          message_to_user: 'Great! Looking forward to working with you.',
          created_at: '2023-04-07'
        }
      },
      {
        id: '3',
        title: 'Summer Fashion Collection',
        company_name: 'Style Trends',
        campaign_start_date: '2023-05-01',
        campaign_end_date: '2023-05-30',
        short_description: 'Showcase our new summer fashion collection to fashion enthusiasts.',
        created_at: '2023-04-10',
        user_response: {
          id: 'resp2',
          status: 'rejected',
          created_at: '2023-04-11'
        },
        admin_response: null
      },
      {
        id: '4',
        title: 'Gaming Tournament Sponsorship',
        company_name: 'Game Master',
        campaign_start_date: '2023-05-15',
        campaign_end_date: '2023-06-15',
        short_description: 'Sponsor our upcoming gaming tournament with prizes and exposure.',
        created_at: '2023-04-15',
        user_response: {
          id: 'resp3',
          status: 'accepted',
          created_at: '2023-04-16',
          admin_responses: {
            id: 'adminresp2',
            status: 'rejected',
            message_to_user: 'Unfortunately, we found another partner for this campaign.',
            created_at: '2023-04-17'
          }
        },
        admin_response: {
          id: 'adminresp2',
          status: 'rejected',
          message_to_user: 'Unfortunately, we found another partner for this campaign.',
          created_at: '2023-04-17'
        }
      }
    ];
    
    // Filter to only include active proposals
    const currentDateObj = new Date(currentDate);
    return mockProposals.filter(proposal => {
      const endDate = new Date(proposal.campaign_end_date);
      return endDate >= currentDateObj;
    });
  };

  // Render different dashboard based on user role
  if (isAdmin) {
    // Admin Dashboard based on the first image
    return (
      <div className="p-8 min-h-screen bg-[#080808]">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <Link 
            href="/admin/create-proposal"
            className="px-4 py-2 rounded-md bg-white text-black flex items-center space-x-2"
          >
            <span>Create New</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 7H13M7 1V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
        
        <div className="space-y-px">
          {companies.map((company) => (
            <div 
              key={company.id} 
              className="flex items-center justify-between p-6 bg-[#121212] border-b border-white/5"
            >
              <div className="flex items-center space-x-2">
                <h3 className="text-white font-medium">{company.name}</h3>
                {company.hasNew && (
                  <span className="px-1.5 py-0.5 text-xs bg-[#FFB900] text-black rounded">new</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-white">{company.proposalCount} Proposals</span>
                <Link
                  href={`/admin/company/${company.id}`}
                  className="text-[#FFB900] flex items-center space-x-1"
                >
                  <span>View Now</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  } else {
    // User Dashboard based on the second image
    return (
      <div className="p-8 min-h-screen bg-background">
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">
              Welcome{fullName ? `, ${fullName}` : ''}
            </h1>
            <p className="text-gray-400">View available offers and track the status of your responses</p>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link href="/dashboard/notifications" className="relative flex items-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 hover:text-white transition-colors">
                <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FFB900] text-black text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            
            <Link 
              href="/dashboard/old-proposals" 
              className="text-[#FFB900] flex items-center space-x-2"
            >
              <span>View Past Campaigns</span>
              <svg width="7" height="14" viewBox="0 0 7 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L6 7L1 13" stroke="#FFB900" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* Featured Proposal */}
        {proposals.length > 0 && (
          <div className="bg-[#121212] border border-white/5 mb-10">
            <div className="p-10 big-item">
              <div className="mb-8">
                <div className="inline-block px-4 py-1 border border-[#FFB900] text-[#FFB900] rounded-full mb-4">
                  New
                </div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-bold text-white">{proposals[0].title}</h2>
                  <div className="flex flex-col items-start big-answer-wrap">
                    {renderStatusBadge(proposals[0])}
                    {proposals[0].user_response && proposals[0].user_response.status === 'accepted' && renderAdminStatusBadge(proposals[0])}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="border-t border-white/10 border-b border-white/10">
                  <div className="py-3">
                    <div className="flex space-x-24">
                      <div>
                        <p className="text-sm text-[#FFB900]">Company</p>
                        <p className="text-gray-300">{proposals[0].company_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#FFB900]">Campaign Date</p>
                        <p className="text-gray-300">
                          {formatDateRange(
                            proposals[0].campaign_start_date,
                            proposals[0].campaign_end_date
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#FFB900]">Timeline</p>
                        <p className="text-gray-300">
                          {calculateTimeline(
                            proposals[0].campaign_start_date,
                            proposals[0].campaign_end_date
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-gray-300">{proposals[0].short_description}</p>
              </div>

              <Link
                href={`/dashboard/proposal/${proposals[0].id}`}
                className="inline-flex items-center space-x-3 text-[#FFB900]"
              >
                <span>Learn More</span>
                <svg width="7" height="14" viewBox="0 0 7 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L6 7L1 13" stroke="#FFB900" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Recent Proposals Grid */}
        <div className="grid grid-cols-3 gap-8">
          {proposals.slice(1, 4).map((proposal) => (
            <div key={proposal.id} className="bg-[#121212] border border-white/5">
              <div className="p-10 small-item">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">{proposal.title}</h3>
                  <div className="flex big-answer-wrap flex-col items-end">
                    {renderStatusBadge(proposal)}
                    {proposal.user_response && proposal.user_response.status === 'accepted' && renderAdminStatusBadge(proposal)}
                  </div>
                </div>

                {/* Admin message if there is one */}
                {proposal.admin_response?.message_to_user && (
                  <div className="mb-4 p-3 bg-[#1A1A1A] rounded-lg">
                    <p className="text-sm text-[#FFB900] mb-1">Admin Message:</p>
                    <p className="text-gray-300 text-sm">{proposal.admin_response.message_to_user}</p>
                  </div>
                )}

                <div className="space-y-3 mb-8">
                  <div className="border-t border-white/10">
                    <div className="py-3">
                      <p className="text-sm text-[#FFB900]">Company</p>
                      <p className="text-gray-300">{proposal.company_name}</p>
                    </div>
                  </div>
                  <div className="border-t border-white/10">
                    <div className="py-3">
                      <p className="text-sm text-[#FFB900]">Campaign Date</p>
                      <p className="text-gray-300">
                        {formatDateRange(
                          proposal.campaign_start_date,
                          proposal.campaign_end_date
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-white/10 border-b border-white/10">
                    <div className="py-3">
                      <p className="text-sm text-[#FFB900]">Timeline</p>
                      <p className="text-gray-300">
                        {calculateTimeline(
                          proposal.campaign_start_date,
                          proposal.campaign_end_date
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-5">
                  <p className="text-gray-300 line-clamp-4">{proposal.short_description}</p>
                </div>

                <Link
                  href={`/dashboard/proposal/${proposal.id}`}
                  className="inline-flex items-center space-x-3 text-[#FFB900]"
                >
                  <span>Learn More</span>
                  <svg width="7" height="14" viewBox="0 0 7 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 7L1 13" stroke="#FFB900" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
}