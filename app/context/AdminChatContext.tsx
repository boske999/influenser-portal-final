'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type AdminChatContextType = {
  unreadCount: number;
  markMessagesAsRead: (chatId: string) => Promise<void>;
};

const AdminChatContext = createContext<AdminChatContextType>({
  unreadCount: 0,
  markMessagesAsRead: async () => {},
});

export const useAdminChat = () => useContext(AdminChatContext);

export const AdminChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Function to fetch unread count that can be reused - memoized with useCallback
  const fetchUnreadCount = useCallback(async (activeChatId?: string) => {
    if (!user) return;
    
    try {
      // First, immediately set unread count to 0 if we're viewing a chat
      // This provides immediate feedback in the UI
      if (activeChatId) {
        console.log('Admin chat: Immediately setting unread count to 0 for active chat');
        setUnreadCount(0);
      }
      
      // Get all proposals created by this admin
      const { data: adminProposals, error: proposalsError } = await supabase
        .from('proposals')
        .select('id')
        .eq('created_by', user.id);
      
      if (proposalsError) {
        console.error('Error fetching admin proposals:', proposalsError);
        return;
      }
      
      if (!adminProposals || adminProposals.length === 0) {
        setUnreadCount(0);
        return;
      }
      
      // Get the proposal IDs
      const proposalIds = adminProposals.map(p => p.id);
      
      // Get unread messages from chats linked to admin's proposals
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          chat:chats!inner(
            proposal_id
          )
        `)
        .eq('is_read', false)
        .neq('user_id', user.id)
        .in('chats.proposal_id', proposalIds);
      
      if (error) {
        console.error('Error fetching admin unread chat count:', error);
        return;
      }
      
      setUnreadCount(data?.length || 0);
      console.log('Admin unread messages count:', data?.length || 0);
    } catch (err) {
      console.error('Error fetching admin unread chat count:', err);
    }
  }, [user]); // Only recreate this function when user changes
  
  // Function to mark messages as read in a specific chat
  const markMessagesAsRead = useCallback(async (chatId: string) => {
    if (!user || !chatId) return;
    
    try {
      // Immediately update the UI for better feedback
      fetchUnreadCount(chatId);
      
      // Get all unread messages in this chat not sent by the admin
      const { data: unreadMessages, error: fetchError } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('chat_id', chatId)
        .eq('is_read', false)
        .neq('user_id', user.id);
      
      if (fetchError) {
        console.error('Error fetching unread messages:', fetchError);
        return;
      }
      
      if (!unreadMessages || unreadMessages.length === 0) return;
      
      const unreadMessageIds = unreadMessages.map(msg => msg.id);
      
      // Mark messages as read
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .in('id', unreadMessageIds);
      
      if (updateError) {
        console.error('Error marking messages as read:', updateError);
        return;
      }
      
      // Update the global unread count
      fetchUnreadCount();
      
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [user, fetchUnreadCount]); // Include fetchUnreadCount as a dependency
  
  // Track overall unread message count across all chats for admin
  useEffect(() => {
    if (!user) return;
    
    let isSubscribed = true;
    
    // Initial fetch
    fetchUnreadCount();
    
    // Subscribe to changes in the chat_messages table for unread messages (new messages)
    const newMessagesSubscription = supabase
      .channel('admin_unread_messages_new')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, () => {
        // Refetch the unread count when any new message is added
        if (isSubscribed) {
          fetchUnreadCount();
        }
      })
      .subscribe();
      
    // Subscribe to changes when messages are marked as read
    const readMessagesSubscription = supabase
      .channel('admin_unread_messages_read')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `is_read=eq.true`, // Filter for messages being marked as read
      }, () => {
        // Refetch the unread count when messages are marked as read
        if (isSubscribed) {
          fetchUnreadCount();
        }
      })
      .subscribe();
    
    return () => {
      isSubscribed = false;
      newMessagesSubscription.unsubscribe();
      readMessagesSubscription.unsubscribe();
    };
  }, [user, fetchUnreadCount]); // Add fetchUnreadCount as a dependency

  return (
    <AdminChatContext.Provider value={{ unreadCount, markMessagesAsRead }}>
      {children}
    </AdminChatContext.Provider>
  );
}; 