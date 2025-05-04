'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

type AdminResponse = {
  id: string
  status: 'approved' | 'rejected' | 'pending'
  message_to_user: string | null
  created_at: string
}

type Response = {
  id: string
  proposal_id: string
  user_id: string
  status: 'accepted' | 'rejected' | 'pending_update'
  proposed_publish_date: string | null
  message: string | null
  created_at: string
  proposal: {
    title: string
    company_name: string
  }
  admin_responses?: AdminResponse | AdminResponse[]
}

// Definišimo konstante za poređenje
const STATUS_APPROVED = "approved";
const STATUS_REJECTED = "rejected";
const STATUS_PENDING = "pending";

export default function ResponsesPage() {
  const { user } = useAuth()
  const [responses, setResponses] = useState<Response[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Add a debug function to fetch info about the admin_responses table
  useEffect(() => {
    const debugDatabaseSchema = async () => {
      if (!user) return;

      try {
        console.log('DEBUG - Checking admin_responses schema information');
        
        // Try to fetch just one admin response to analyze structure
        const { data, error } = await supabase
          .from('admin_responses')
          .select('*')
          .limit(1);
          
        if (error) {
          console.error('DEBUG - Error fetching admin_responses sample:', error);
        } else if (data && data.length > 0) {
          console.log('DEBUG - Sample admin_response raw data:', data[0]);
          console.log('DEBUG - Sample admin_response status:', data[0].status);
          console.log('DEBUG - Sample admin_response status type:', typeof data[0].status);
          
          // Try comparing string values directly
          const status = data[0].status;
          console.log('DEBUG - Direct string comparison results:');
          console.log('  status === "approved":', status === "approved");
          console.log('  status === "rejected":', status === "rejected");
          console.log('  status === "pending":', status === "pending");
          console.log('  status.toLowerCase() === "approved":', String(status).toLowerCase() === "approved");
          console.log('  status.toLowerCase() === "rejected":', String(status).toLowerCase() === "rejected");
          console.log('  status.toLowerCase() === "pending":', String(status).toLowerCase() === "pending");
        } else {
          console.log('DEBUG - No admin_responses found in database for debugging');
        }
      } catch (error) {
        console.error('DEBUG - Error in schema debugging:', error);
      }
    };
    
    if (user) {
      debugDatabaseSchema();
    }
  }, [user]);

  useEffect(() => {
    const fetchResponses = async () => {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('responses')
          .select(`
            id,
            proposal_id,
            user_id,
            status,
            proposed_publish_date,
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
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching responses:', error);
        } else if (data) {
          console.log('DEBUG - Raw responses data:', data);
          
          // For each response, specifically log the admin_responses data
          data.forEach(item => {
            console.log(`DEBUG - Response ID: ${item.id}`);
            console.log('DEBUG - Admin responses for this response:', item.admin_responses);
            if (item.admin_responses && item.admin_responses.length > 0) {
              console.log('DEBUG - Admin response status:', item.admin_responses[0].status);
              console.log('DEBUG - Admin response status type:', typeof item.admin_responses[0].status);
              console.log('DEBUG - Admin message to user:', item.admin_responses[0].message_to_user);
            }
          });
          
          // Transform the data to match our Response type
          const formattedResponses: Response[] = data.map((item: any) => {
            return {
              ...item,
              proposal: {
                title: item.proposal?.title || '',
                company_name: item.proposal?.company_name || ''
              }
            };
          });
          
          setResponses(formattedResponses);
        }
      } catch (error) {
        console.error('Error fetching responses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResponses();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-t-2 border-[#FFB900] rounded-full animate-spin"></div>
      </div>
    )
  }

  // Verzija koja radi sa bilo kojim tipom vrednosti
  const renderAdminStatusBadge = (response: Response) => {
    if (!response.admin_responses) {
      return (
        <span className="px-3 py-1 status-badge rounded-full text-sm bg-yellow-900/20 text-yellow-500">
          Pending Review
        </span>
      );
    }
    
    // Sigurno dobijanje admin response objekta
    const adminResponse = Array.isArray(response.admin_responses) 
      ? (response.admin_responses.length > 0 ? response.admin_responses[0] : null)
      : response.admin_responses;
    
    if (!adminResponse || adminResponse.status === undefined) {
      return (
        <span className="px-3 py-1 status-badgerounded-full text-sm bg-yellow-900/20 text-yellow-500">
          Pending Review
        </span>
      );
    }
    
    // Konvertujemo status u string za poređenje
    const statusStr = String(adminResponse.status).toLowerCase();
    
    // Provera statusa
    if (statusStr === "rejected" || statusStr.includes("reject")) {
      return (
        <span className="px-3 py-1 status-basge rounded-full text-sm bg-red-900/20 text-red-500">
          Rejected by Admin
        </span>
      );
    } else if (statusStr === "approved" || statusStr.includes("approv")) {
      return (
        <span className="px-3 py-1 status-badge rounded-full text-sm bg-green-900/20 text-green-500">
          Approved by Admin
        </span>
      );
    } else if (statusStr === "pending" || statusStr.includes("pend")) {
      return (
        <span className="px-3 py-1 status-badge rounded-full text-sm bg-yellow-900/20 text-yellow-500">
          Pending Review
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 status-badge rounded-full text-sm bg-yellow-900/20 text-yellow-500">
          Status: {adminResponse.status || "Unknown"}
        </span>
      );
    }
  };

  return (
    <div className="p-8 min-h-screen bg-background">
      {/* Header */}
      <div className="mb-12">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Your Responses</h1>
          <p className="text-gray-400">View and manage your responses to proposals</p>
        </div>
      </div>

      {/* Responses List */}
      <div className="space-y-6">
        {responses.length === 0 ? (
          <div className="bg-[#121212] border border-white/5 p-8 text-center">
            <p className="text-gray-300">You haven't responded to any proposals yet.</p>
            <Link 
              href="/dashboard" 
              className="mt-4 inline-flex items-center space-x-2 text-[#FFB900]"
            >
              <span>Browse Proposals</span>
              <svg width="7" height="14" viewBox="0 0 7 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L6 7L1 13" stroke="#FFB900" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        ) : (
          responses.map((response) => (
            <div key={response.id} className="bg-[#121212] border border-white/5 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {response.proposal.title}
                  </h3>
                  <p className="text-gray-400">{response.proposal.company_name}</p>
                  
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                    <div>
                      <p className="text-sm text-[#FFB900]">Your Response</p>
                      <p className="text-gray-300 capitalize">
                        {(() => {
                          if (!response.admin_responses) {
                            return "Pending Review";
                          }
                          
                          const adminResponse = Array.isArray(response.admin_responses) 
                            ? (response.admin_responses.length > 0 ? response.admin_responses[0] : null)
                            : response.admin_responses;
                          
                          if (!adminResponse || adminResponse.status === undefined) {
                            return "Pending Review";
                          }
                          
                          const statusStr = String(adminResponse.status).toLowerCase();
                          
                          if (statusStr === "approved" || statusStr.includes("approv")) {
                            return "Approved";
                          } else if (statusStr === "rejected" || statusStr.includes("reject")) {
                            return "Rejected";
                          } else if (statusStr === "pending" || statusStr.includes("pend")) {
                            return "Pending Review";
                          } else {
                            return `Unknown (${adminResponse.status})`;
                          }
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#FFB900]">Admin Status</p>
                      <p className="text-gray-300 capitalize">
                        {(() => {
                          if (!response.admin_responses) {
                            return "Pending Review";
                          }
                          
                          const adminResponse = Array.isArray(response.admin_responses) 
                            ? (response.admin_responses.length > 0 ? response.admin_responses[0] : null)
                            : response.admin_responses;
                          
                          if (!adminResponse || adminResponse.status === undefined) {
                            return "Pending Review";
                          }
                          
                          const statusStr = String(adminResponse.status).toLowerCase();
                          
                          if (statusStr === "approved" || statusStr.includes("approv")) {
                            return "Approved";
                          } else if (statusStr === "rejected" || statusStr.includes("reject")) {
                            return "Rejected";
                          } else if (statusStr === "pending" || statusStr.includes("pend")) {
                            return "Pending Review";
                          } else {
                            return `Unknown (${adminResponse.status})`;
                          }
                        })()}
                      </p>
                    </div>
                    {response.proposed_publish_date && (
                      <div>
                        <p className="text-sm text-[#FFB900]">Proposed Publish Date</p>
                        <p className="text-gray-300">
                          {new Date(response.proposed_publish_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {response.message && (
                    <div className="mt-4">
                      <p className="text-sm text-[#FFB900]">Your Message</p>
                      <p className="text-gray-300 mt-1">{response.message}</p>
                    </div>
                  )}
                  
                  {/* Admin Message section */}
                  {(() => {
                    const adminResponse = Array.isArray(response.admin_responses) 
                      ? (response.admin_responses.length > 0 ? response.admin_responses[0] : null)
                      : response.admin_responses;
                    
                    if (!adminResponse || !adminResponse.message_to_user) {
                      return null;
                    }
                    
                    return (
                      <div className="mt-4 p-3 bg-[#1A1A1A] rounded-lg">
                        <p className="text-sm text-[#FFB900] mb-1">Admin Message:</p>
                        <p className="text-gray-300 text-sm">{adminResponse.message_to_user}</p>
                      </div>
                    );
                  })()}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3  status-badge rounded-full text-sm ${
                    response.status === 'accepted' 
                      ? 'bg-green-900/20 text-green-500' 
                      : response.status === 'pending_update'
                        ? 'bg-yellow-900/20 text-yellow-500'
                        : 'bg-red-900/20 text-red-500'
                  }`}>
                    {response.status === 'accepted' ? 'Accepted' : response.status === 'pending_update' ? 'Pending Update' : 'Declined'}
                  </span>
                  
                  {(response.status === 'accepted' || response.status === 'pending_update') && renderAdminStatusBadge(response)}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-6">
                <Link 
                  href={`/dashboard/view-response?id=${response.id}`}
                  className="inline-flex items-center space-x-2 text-[#FFB900]"
                >
                  <span>View Response Details</span>
                  <svg width="7" height="14" viewBox="0 0 7 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 7L1 13" stroke="#FFB900" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
                
                <Link 
                  href={`/dashboard/proposal/${response.proposal_id}`}
                  className="inline-flex items-center space-x-2 text-[#FFB900]"
                >
                  <span>View Proposal</span>
                  <svg width="7" height="14" viewBox="0 0 7 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L6 7L1 13" stroke="#FFB900" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 