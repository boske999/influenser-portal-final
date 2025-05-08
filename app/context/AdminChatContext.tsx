'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type AdminChatContextType = {
  unreadCount: number;
};

const AdminChatContext = createContext<AdminChatContextType>({
  unreadCount: 0,
});

export const useAdminChat = () => useContext(AdminChatContext);

export const AdminChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Track overall unread message count across all chats for admin
  useEffect(() => {
    if (!user) return;
    
    let isSubscribed = true;
    
    const fetchUnreadCount = async () => {
      if (!isSubscribed) return;
      
      try {
        // Fetch all unread messages not sent by the current admin
        const { data, error } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact' })
          .eq('is_read', false)
          .neq('user_id', user.id);
        
        if (error) {
          console.error('Error fetching admin unread chat count:', error);
          return;
        }
        
        if (isSubscribed) {
          setUnreadCount(data?.length || 0);
        }
      } catch (err) {
        console.error('Error fetching admin unread chat count:', err);
      }
    };
    
    fetchUnreadCount();
    
    // Subscribe to changes in the chat_messages table for unread messages
    const subscription = supabase
      .channel('admin_unread_messages')
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
    <AdminChatContext.Provider value={{ unreadCount }}>
      {children}
    </AdminChatContext.Provider>
  );
}; 