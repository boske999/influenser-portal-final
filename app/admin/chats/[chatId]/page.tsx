'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from '../../../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import ChatMessage from '../../../components/ChatMessage';

type AdminChatParams = {
  params: {
    chatId: string;
  };
};

export default function AdminChatPage({ params }: AdminChatParams) {
  const { chatId } = params;
  const searchParams = useSearchParams();
  const proposalId = searchParams.get('proposalId');
  const { user } = useAuth();
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch the proposal and initial messages
  useEffect(() => {
    const fetchData = async () => {
      if (!chatId || !proposalId || !user) return;
      
      try {
        setLoading(true);
        
        // Fetch proposal details
        const { data: proposalData, error: proposalError } = await supabase
          .from('proposals')
          .select('*')
          .eq('id', proposalId)
          .single();
          
        if (proposalError) {
          console.error('Error fetching proposal:', proposalError);
        } else {
          setProposal(proposalData);
        }
        
        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select(`
            id,
            chat_id,
            user_id,
            message,
            created_at,
            is_read,
            user:users(full_name, email)
          `)
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });
          
        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
        } else {
          console.log('Successfully fetched messages:', messagesData?.length || 0);
          setMessages(messagesData || []);
          
          // Mark messages as read
          const unreadIds = messagesData
            .filter((msg: any) => !msg.is_read && msg.user_id !== user.id)
            .map((msg: any) => msg.id);
            
          if (unreadIds.length > 0) {
            console.log('Marking messages as read:', unreadIds.length);
            await supabase
              .from('chat_messages')
              .update({ is_read: true })
              .in('id', unreadIds);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up real-time subscription for new messages
    console.log('Setting up real-time chat subscription for chatId:', chatId);
    
    // Create a unique channel name for this admin chat
    const channelName = `admin-chat-${chatId}-${Date.now()}`;
    console.log('Creating admin channel:', channelName);
    
    const channel = supabase.channel(channelName);
    
    const subscription = channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `chat_id=eq.${chatId}`,
      }, async (payload: any) => {
        console.log('New message received via postgres_changes:', payload);
        
        // Fetch user data for the new message
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', payload.new.user_id)
          .single();
          
        if (userError) {
          console.error('Error fetching user data for message:', userError);
        }
        
        const newMsg = {
          ...payload.new,
          user: userData || null
        };
        
        console.log('Adding new message to admin state:', newMsg);
        
        // Add to messages
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          if (prev.some(msg => msg.id === newMsg.id)) {
            console.log('Message already exists in admin chat, skipping:', newMsg.id);
            return prev;
          }
          console.log('New message added to admin state:', newMsg.id);
          return [...prev, newMsg];
        });
        
        // Mark as read if it's not from admin
        if (payload.new.user_id !== user?.id) {
          await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('id', payload.new.id);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to postgres changes for admin chat:', chatId);
        } else {
          console.log('Admin subscription status changed:', status);
        }
      });
    
    console.log('Subscription activated for admin chat:', chatId);
      
    return () => {
      console.log('Cleaning up subscription for admin chat:', chatId);
      supabase.removeChannel(channel);
    };
  }, [chatId, proposalId, user]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !chatId) return;
    
    try {
      setSendingMessage(true);
      
      // Send message
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          user_id: user.id,
          message: newMessage,
          is_read: false,
        })
        .select('id, created_at')
        .single();
        
      if (error) {
        console.error('Error sending message:', error);
        return;
      }
      
      // Add optimistic update (the subscription will catch the real update)
      const optimisticMessage = {
        id: data.id,
        chat_id: chatId,
        user_id: user.id,
        message: newMessage,
        created_at: data.created_at,
        is_read: false,
        user: {
          full_name: null,  // Admin name will be fetched by the subscription
          email: user.email || null
        }
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };
  
  if (loading) {
    return (
      <div className="h-screen p-6 bg-background text-white flex flex-col">
        <h1 className="text-2xl font-bold mb-6">Chat</h1>
        <div className="flex items-center justify-center flex-grow">
          <div className="w-8 h-8 border-t-2 border-[#FFB900] rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen p-6 bg-background text-white flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Chat: {proposal?.title || 'Unknown Proposal'}
        </h1>
      </div>
      
      <div className="flex-grow flex flex-col bg-[#121212] rounded-lg border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-white font-medium">Conversation</h3>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400 text-center">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`my-2 flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.user_id === user?.id
                        ? 'bg-[#FFB900] text-black'
                        : 'bg-[#1A1A1A] text-white'
                    }`}
                  >
                    <div className="text-xs mb-1">
                      {message.user_id === user?.id
                        ? 'You (Admin)'
                        : message.user?.full_name || message.user?.email || 'Unknown User'}
                    </div>
                    <div className="break-words">{message.message}</div>
                    <div className="text-xs mt-1 opacity-70">
                      {new Date(message.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        <div className="p-4 border-t border-white/5">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#FFB900]"
              disabled={sendingMessage}
            />
            <button
              type="submit"
              disabled={sendingMessage || !newMessage.trim()}
              className="px-4 py-3 bg-[#FFB900] text-black rounded-lg hover:bg-[#E6A800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingMessage ? (
                <span className="inline-block w-5 h-5 border-t-2 border-black rounded-full animate-spin" />
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20.25 12L3.75 3.75L6.375 12L3.75 20.25L20.25 12Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 