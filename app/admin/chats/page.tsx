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
};

type Proposal = {
  id: string;
  title: string;
  user_id: string;
};

type Chat = {
  id: string;
  proposal_id: string;
  user_id: string;
  created_at: string;
  proposals: Proposal;
  users: ChatUser;
  chat_messages: ChatMessage[];
};

type ProcessedChat = {
  id: string;
  proposalId: string;
  proposalName: string;
  userId: string;
  userName: string;
  userEmail: string;
  latestMessage: string | null;
  latestMessageTime: string | null;
  unreadCount: number;
  created_at: string;
};

type GroupedChats = {
  [proposalId: string]: {
    proposalName: string;
    users: {
      [userId: string]: {
        userName: string;
        userEmail: string;
        chat: ProcessedChat;
      }
    }
  };
};

export default function AdminChatsPage() {
  const [loading, setLoading] = useState(true);
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
            user_id,
            created_at,
            proposals:proposal_id (
              id,
              title
            ),
            users:user_id (
              full_name,
              email
            ),
            chat_messages (
              id,
              message,
              created_at,
              is_read,
              user_id
            )
          `)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching chats:', error);
          return;
        }
        
        // Process chats with their messages
        const processedChats = (data || []).map((chat: any) => {
          const messages = chat.chat_messages || [];
          const latestMessage = messages.length > 0 
            ? messages.sort((a: any, b: any) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0]
            : null;
            
          const unreadCount = messages.filter((msg: any) => 
            !msg.is_read && msg.user_id !== user.id
          ).length;
          
          return {
            id: chat.id,
            proposalId: chat.proposal_id,
            proposalName: chat.proposals?.title || 'Unnamed Proposal',
            userId: chat.user_id,
            userName: chat.users?.full_name || 'Unknown User',
            userEmail: chat.users?.email || 'Unknown Email',
            latestMessage: latestMessage?.message || null,
            latestMessageTime: latestMessage?.created_at || null,
            unreadCount,
            created_at: chat.created_at
          };
        });
        
        // Group chats by proposal AND user
        const grouped: GroupedChats = {};
        
        processedChats.forEach(chat => {
          // Create proposal group if it doesn't exist
          if (!grouped[chat.proposalId]) {
            grouped[chat.proposalId] = {
              proposalName: chat.proposalName,
              users: {}
            };
          }
          
          // Add this chat to the appropriate user within the proposal group
          grouped[chat.proposalId].users[chat.userId] = {
            userName: chat.userName,
            userEmail: chat.userEmail,
            chat: chat
          };
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
          {Object.entries(groupedChats).map(([proposalId, proposal]) => (
            <div key={proposalId} className="bg-[#121212] border border-white/10 rounded-lg p-4">
              <h2 className="text-xl font-bold mb-4 text-[#FFB900] border-b border-white/10 pb-2">
                {proposal.proposalName}
              </h2>
              
              <div className="grid gap-3">
                {Object.entries(proposal.users).map(([userId, userData]) => {
                  const chat = userData.chat;
                  
                  return (
                    <div
                      key={chat.id}
                      onClick={() => handleChatClick(chat.id, chat.proposalId)}
                      className="bg-[#1A1A1A] border border-white/5 rounded-lg p-3 cursor-pointer hover:bg-[#242424] transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-sm text-white/80">
                          User: {userData.userEmail || userData.userName}
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
                              {chat.latestMessage.length > 60 
                                ? `${chat.latestMessage.substring(0, 60)}...` 
                                : chat.latestMessage}
                            </span>
                          </>
                        ) : (
                          <span>No messages yet</span>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {chat.latestMessageTime 
                          ? new Date(chat.latestMessageTime).toLocaleString() 
                          : new Date(chat.created_at).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 