'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import Chat from '../../../components/Chat';

type ProposalInfo = {
  id: string;
  title: string;
  company_name: string;
};

export default function ChatPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [proposal, setProposal] = useState<ProposalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProposalInfo = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // Check if the proposal exists and user has access to it
        const { data: proposalData, error: proposalError } = await supabase
          .from('proposals')
          .select('id, title, company_name')
          .eq('id', params.id)
          .single();

        if (proposalError) {
          if (proposalError.code === 'PGRST116') {
            setError('Proposal not found');
          } else {
            console.error('Error fetching proposal:', proposalError);
            setError('Failed to load proposal information');
          }
          setLoading(false);
          return;
        }

        // Check if user has a response to this proposal
        const { data: responseData, error: responseError } = await supabase
          .from('responses')
          .select('id')
          .eq('proposal_id', params.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (responseError) {
          console.error('Error checking user response:', responseError);
          setError('Failed to verify your access to this chat');
          setLoading(false);
          return;
        }

        // If user is not an admin and doesn't have a response to this proposal, deny access
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        const isAdmin = userData?.role === 'admin';

        if (!isAdmin && !responseData) {
          setError('You do not have access to this chat');
          setLoading(false);
          return;
        }

        // Check if a chat exists for this proposal - but don't create one, let the ChatContext handle it
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('id')
          .eq('proposal_id', params.id);
          
        if (chatError) {
          console.error('Error checking chat existence:', chatError);
        } else if (chatData && chatData.length > 1) {
          console.warn(`Found ${chatData.length} chats for proposal ${params.id}.`);
        }

        setProposal(proposalData);
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading) {
      fetchProposalInfo();
    }
  }, [user, isLoading, router, params.id]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="p-8 min-h-screen bg-background">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-[#FFB900] flex items-center space-x-2"
          >
            <svg width="7" height="14" viewBox="0 0 7 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 1L1 7L6 13" stroke="#FFB900" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Back</span>
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center p-12 bg-[#121212] border border-white/5 text-center rounded-md">
          <p className="text-xl text-gray-300 mb-3">{error || 'Proposal not found'}</p>
          <p className="text-gray-400">You cannot access this chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-background">
      {/* Back button */}
      <div className="mb-8">
        <Link
          href={`/dashboard/proposal/${proposal.id}`}
          className="text-[#FFB900] flex items-center space-x-2"
        >
          <svg width="7" height="14" viewBox="0 0 7 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 1L1 7L6 13" stroke="#FFB900" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Back to Proposal</span>
        </Link>
      </div>
      
      {/* Chat header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{proposal.title}</h1>
        <p className="text-gray-400">{proposal.company_name}</p>
      </div>
      
      {/* Chat container */}
      <div className="bg-[#121212] rounded-lg border border-white/5 h-[calc(100vh-220px)]">
        <Chat proposalId={proposal.id} />
      </div>
    </div>
  );
} 