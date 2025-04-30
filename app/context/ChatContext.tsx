'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type ChatMessage = {
  id: string;
  chat_id: string;
  user_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  user?: {
    full_name: string | null;
    email: string | null;
  };
};

type ChatContextType = {
  chatId: string | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  setChatProposalId: (proposalId: string) => Promise<void>;
  markMessagesAsRead: () => Promise<void>;
  unreadCount: number;
};

const ChatContext = createContext<ChatContextType>({
  chatId: null,
  messages: [],
  loading: false,
  error: null,
  sendMessage: async () => {},
  setChatProposalId: async () => {},
  markMessagesAsRead: async () => {},
  unreadCount: 0,
});

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [currentProposalId, setCurrentProposalId] = useState<string | null>(null);

  const fetchChat = async (proposalId: string) => {
    // Prevent duplicate fetches for the same proposal
    if (proposalId === currentProposalId && chatId) {
      console.log('Chat already loaded for proposal:', proposalId);
      return;
    }
    
    if (!user || !proposalId) return;
    
    setLoading(true);
    setError(null);
    
    // Add a timeout in case the request takes too long
    const timeoutId = setTimeout(() => {
      setError('Request timed out. Please try again.');
      setLoading(false);
    }, 10000); // 10 seconds timeout
    
    try {
      // Find all chats for this proposal
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('proposal_id', proposalId);
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      if (chatError) {
        console.error('Error fetching chat:', chatError);
        setError('Failed to load chat');
        setLoading(false);
        return;
      }
      
      // Handle the case when no chat exists
      if (!chatData || chatData.length === 0) {
        // Chat doesn't exist yet, we need to create one
        try {
          console.log('Creating new chat for proposal:', proposalId);
          const { data: newChat, error: createError } = await supabase
            .from('chats')
            .insert({ proposal_id: proposalId })
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating chat:', createError);
            setError('Failed to create chat');
            setLoading(false);
            return;
          }
          
          console.log('Successfully created new chat:', newChat);
          setChatId(newChat.id);
          setCurrentProposalId(proposalId);
          setMessages([]);
        } catch (createErr: any) {
          console.error('Error creating chat:', createErr);
          setError('Failed to create chat');
          setLoading(false);
          return;
        }
      } else {
        // Handle the case when multiple chats exist - use the most recent one
        console.log(`Found ${chatData.length} chat(s) for proposal:`, proposalId);
        const mostRecentChat = chatData.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        console.log('Using most recent chat:', mostRecentChat.id);
        setChatId(mostRecentChat.id);
        setCurrentProposalId(proposalId);
        
        // Fetch messages for this chat
        await fetchMessages(mostRecentChat.id);
        
        // Clean up duplicate chats if there are more than one
        if (chatData.length > 1) {
          console.warn(`Found ${chatData.length} chats for proposal ${proposalId}. Using the most recent one.`);
          
          // Keep the most recent chat and delete the others
          const chatIdsToDelete = chatData
            .filter(chat => chat.id !== mostRecentChat.id)
            .map(chat => chat.id);
            
          if (chatIdsToDelete.length > 0) {
            try {
              // Delete the duplicate chats
              const { error: deleteError } = await supabase
                .from('chats')
                .delete()
                .in('id', chatIdsToDelete);
                
              if (deleteError) {
                console.error('Error deleting duplicate chats:', deleteError);
              } else {
                console.log(`Successfully deleted ${chatIdsToDelete.length} duplicate chats`);
              }
            } catch (deleteErr) {
              console.error('Error deleting duplicate chats:', deleteErr);
            }
          }
        }
      }
      
    } catch (err: any) {
      // Clear the timeout in case of error
      clearTimeout(timeoutId);
      console.error('Chat fetch error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMessages = async (chatId: string) => {
    if (!user || !chatId) return;
    
    try {
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
        setError('Failed to load messages');
        return;
      }
      
      // Format the messages to match our expected structure
      const formattedMessages = messagesData.map((msg: any) => ({
        id: msg.id,
        chat_id: msg.chat_id,
        user_id: msg.user_id,
        message: msg.message,
        created_at: msg.created_at,
        is_read: msg.is_read,
        user: msg.user
      }));
      
      setMessages(formattedMessages);
      
      // Count unread messages (not sent by the current user)
      const unread = formattedMessages.filter(
        msg => !msg.is_read && msg.user_id !== user.id
      ).length;
      
      setUnreadCount(unread);
      
    } catch (err: any) {
      console.error('Messages fetch error:', err);
      setError(err.message || 'An error occurred');
    }
  };
  
  const setChatProposalId = async (proposalId: string) => {
    // Skip if already loaded for this proposal
    if (proposalId === currentProposalId && chatId) {
      console.log('Chat already set for proposal:', proposalId);
      return;
    }
    
    await fetchChat(proposalId);
  };
  
  const sendMessage = async (message: string) => {
    if (!user || !chatId) return;
    
    try {
      const newMessage = {
        chat_id: chatId,
        user_id: user.id,
        message,
        is_read: false,
      };
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(newMessage)
        .select('id, created_at')
        .single();
      
      if (error) {
        console.error('Error sending message:', error);
        setError('Failed to send message');
        throw new Error('Failed to send message');
      }
      
      // Get current user data for optimistic update
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      
      // Add message to UI immediately instead of waiting for subscription
      const optimisticMessage: ChatMessage = {
        id: data.id,
        chat_id: chatId,
        user_id: user.id,
        message,
        created_at: data.created_at,
        is_read: false,
        user: {
          full_name: userData?.full_name || null,
          email: userData?.email || user.email || null
        }
      };
      
      console.log('Adding message to UI immediately:', optimisticMessage);
      
      // Update the messages array
      setMessages(prevMessages => {
        // Check if message already exists to prevent duplicates
        if (prevMessages.some(msg => msg.id === optimisticMessage.id)) {
          return prevMessages;
        }
        return [...prevMessages, optimisticMessage];
      });
      
    } catch (err: any) {
      console.error('Message send error:', err);
      setError(err.message || 'An error occurred');
      throw err;
    }
  };
  
  const markMessagesAsRead = async () => {
    if (!user || !chatId) return;
    
    try {
      // Get IDs of unread messages not sent by the current user
      const unreadMessageIds = messages
        .filter(msg => !msg.is_read && msg.user_id !== user.id)
        .map(msg => msg.id);
      
      if (unreadMessageIds.length === 0) return;
      
      // Only mark messages as read that were sent by others (not by the current user)
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .in('id', unreadMessageIds);
      
      if (error) {
        console.error('Error marking messages as read:', error);
        return;
      }
      
      // Update local unread count
      setUnreadCount(0);
      
      // Update local messages
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          unreadMessageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
        )
      );
      
    } catch (err: any) {
      console.error('Mark as read error:', err);
    }
  };
  
  // Set up real-time updates when chatId changes
  useEffect(() => {
    if (!chatId) return;
    
    console.log('Setting up real-time subscription for chat:', chatId);
    
    // Create a unique channel name for this chat
    const channelName = `chat-${chatId}-${Date.now()}`;
    console.log('Creating channel:', channelName);
    
    // Subscribe to new messages
    const channel = supabase.channel(channelName);
    
    const subscription = channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `chat_id=eq.${chatId}`,
      }, async (payload: any) => {
        console.log('Received new message via postgres_changes:', payload);
        // When a new message comes in, fetch the user data
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', payload.new.user_id)
            .single();
          
          if (userError) {
            console.error('Error fetching user data for new message:', userError);
          }
          
          const newMessage: ChatMessage = {
            id: payload.new.id,
            chat_id: payload.new.chat_id,
            user_id: payload.new.user_id,
            message: payload.new.message,
            created_at: payload.new.created_at,
            is_read: payload.new.is_read,
            user: userData || { full_name: null, email: null },
          };
          
          console.log('Adding new message to state:', newMessage);
          
          // Add the new message to the messages array
          setMessages(prevMessages => {
            // Check if message already exists to prevent duplicates
            if (prevMessages.some(msg => msg.id === newMessage.id)) {
              console.log('Message already exists, skipping:', newMessage.id);
              return prevMessages;
            }
            console.log('New message added to state:', newMessage.id);
            return [...prevMessages, newMessage];
          });
          
          // If the message is from someone else, increment unread count
          if (payload.new.user_id !== user?.id) {
            setUnreadCount(prev => prev + 1);
          }
        } catch (error) {
          console.error('Error processing new message:', error);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to postgres changes for chat:', chatId);
        } else {
          console.log('Subscription status changed:', status);
        }
      });
    
    console.log('Subscription activated for chat:', chatId);
    
    // Clean up subscription
    return () => {
      console.log('Cleaning up subscription for chat:', chatId);
      supabase.removeChannel(channel);
    };
  }, [chatId, user]);
  
  // Track overall unread message count across all chats
  useEffect(() => {
    if (!user) return;
    
    let isSubscribed = true;
    
    const fetchUnreadCount = async () => {
      if (!isSubscribed) return;
      
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact' })
          .eq('is_read', false)
          .neq('user_id', user.id);
        
        if (error) {
          console.error('Error fetching unread count:', error);
          return;
        }
        
        if (isSubscribed) {
          setUnreadCount(data?.length || 0);
        }
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };
    
    fetchUnreadCount();
    
    // Subscribe to changes in the chat_messages table for unread messages
    const subscription = supabase
      .channel('unread_messages')
      .on('postgres_changes', {
        event: '*', // Listen for all events
        schema: 'public',
        table: 'chat_messages',
      }, () => {
        // Refetch the unread count when any change happens
        if (isSubscribed) {
          fetchUnreadCount();
        }
      })
      .subscribe();
    
    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [user]);
  
  return (
    <ChatContext.Provider
      value={{
        chatId,
        messages,
        loading,
        error,
        sendMessage,
        setChatProposalId,
        markMessagesAsRead,
        unreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}; 