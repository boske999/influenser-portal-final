'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

// Define types for the Supabase response
type ChatUser = {
  full_name: string | null;
  email: string | null;
};

type ChatMessage = {
  id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  user_id: string;
  users: ChatUser;
};

type Proposal = {
  id: string;
  title: string;
  user_id: string;
};

type Chat = {
  id: string;
  proposal_id: string;
  created_at: string;
  proposals: Proposal;
  chat_messages: ChatMessage[];
};

type ProcessedChat = {
  id: string;
  proposalId: string;
  proposalName: string;
  latestMessage: any | null;
  unreadCount: number;
  created_at: string;
  userEmail: string | null;
};

type GroupedChats = {
  [proposalId: string]: {
    proposalName: string;
    chats: ProcessedChat[];
  };
};

export default function AdminChatsPage() {
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ProcessedChat[]>([]);
  const [groupedChats, setGroupedChats] = useState<GroupedChats>({});
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch all chats with related proposal and latest message
        const { data, error } = await supabase
          .from('chats')
          .select(`
            id,
            proposal_id,
            created_at,
            proposals:proposal_id (
              id,
              title
            ),
            chat_messages (
              id,
              message,
              created_at,
              is_read,
              user_id,
              users:user_id (
                full_name,
                email
              )
            )
          `)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching chats:', error);
          return;
        }

        // Process the data to get the latest message and user info
        const processedChats = await Promise.all((data || []).map(async (chat: any) => {
          const messages = chat.chat_messages || [];
          // Sort messages by date (newest first)
          const sortedMessages = [...messages].sort(
            (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          const latestMessage = sortedMessages[0] || null;
          const unreadCount = messages.filter((msg: any) => !msg.is_read && msg.user_id !== user.id).length;
          
          // Find the user who is not the admin (to get the chat name)
          const userMessage = messages.find((msg: ChatMessage) => msg.user_id !== user.id);
          let userEmail = userMessage?.users?.email || null;
          
          // If we couldn't find a user from messages, look for the user in responses
          if (!userEmail) {
            try {
              // First get the user_id from the response
              const { data: responseData, error: responseError } = await supabase
                .from('responses')
                .select('user_id')
                .eq('proposal_id', chat.proposal_id)
                .single();
                
              if (!responseError && responseData && responseData.user_id) {
                // Then fetch the user's email using the user_id
                const { data: userData, error: userError } = await supabase
                  .from('users')
                  .select('email')
                  .eq('id', responseData.user_id)
                  .single();
                  
                if (!userError && userData && userData.email) {
                  userEmail = userData.email;
                }
              }
            } catch (err) {
              console.log('No response found for this proposal');
            }
          }
          
          return {
            id: chat.id,
            proposalId: chat.proposal_id,
            proposalName: chat.proposals?.title || 'Unnamed Proposal',
            latestMessage,
            unreadCount,
            created_at: chat.created_at,
            userEmail
          };
        }));
        
        setChats(processedChats);
        
        // Group chats by proposal
        const grouped: GroupedChats = {};
        
        processedChats.forEach(chat => {
          if (!grouped[chat.proposalId]) {
            grouped[chat.proposalId] = {
              proposalName: chat.proposalName,
              chats: []
            };
          }
          
          grouped[chat.proposalId].chats.push(chat);
        });
        
        setGroupedChats(grouped);
      } catch (err) {
        console.error('Error fetching chats:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChats();
  }, [user]);
  
  const handleChatClick = (chatId: string, proposalId: string) => {
    router.push(`/admin/chats/${chatId}?proposalId=${proposalId}`);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-background text-white">
        <h1 className="text-2xl font-bold mb-6">Chats</h1>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-t-2 border-[#FFB900] rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-6 bg-background text-white">
      <h1 className="text-2xl font-bold mb-6">Chats</h1>
      
      {Object.keys(groupedChats).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <p>No chats available</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {Object.entries(groupedChats).map(([proposalId, group]) => (
            <div key={proposalId} className="bg-[#121212] border border-white/10 rounded-lg p-4">
              <h2 className="text-xl font-bold mb-4 text-[#FFB900] border-b border-white/10 pb-2">
                {group.proposalName}
              </h2>
              
              <div className="grid gap-3">
                {group.chats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => handleChatClick(chat.id, chat.proposalId)}
                    className="bg-[#1A1A1A] border border-white/5 rounded-lg p-3 cursor-pointer hover:bg-[#242424] transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-sm text-white/80">
                        Chat name: {chat.userEmail || 'Unknown user'}
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="bg-[#FFB900] text-black text-xs font-medium px-2 py-1 rounded-full">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-400 mb-1">
                      {chat.latestMessage ? (
                        <>
                          <span className="font-medium text-white">
                            {chat.latestMessage.users?.email || 'Unknown'}:
                          </span>{' '}
                          {chat.latestMessage.message.length > 60 
                            ? `${chat.latestMessage.message.substring(0, 60)}...` 
                            : chat.latestMessage.message}
                        </>
                      ) : (
                        <span>No messages yet</span>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {chat.latestMessage 
                        ? new Date(chat.latestMessage.created_at).toLocaleString() 
                        : new Date(chat.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 