'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from '../../../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import ChatMessage from '../../../components/ChatMessage';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage as MessageType } from '../../../context/ChatContext';

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
  const [messages, setMessages] = useState<MessageType[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
            attachment_url,
            file_name,
            user:users(full_name, email)
          `)
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });
          
        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
        } else {
          console.log('Successfully fetched messages:', messagesData?.length || 0);
          // Konvertuj rezultate u pravi MessageType tip
          const typedMessages: MessageType[] = messagesData.map((msg: any) => ({
            id: msg.id,
            chat_id: msg.chat_id,
            user_id: msg.user_id,
            message: msg.message,
            created_at: msg.created_at,
            is_read: msg.is_read,
            attachment_url: msg.attachment_url,
            file_name: msg.file_name,
            user: msg.user
          }));
          setMessages(typedMessages);
          
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
    
    if ((!newMessage.trim() && !selectedFile) || !user || !chatId) return;
    
    try {
      setSendingMessage(true);
      const messageText = newMessage;
      setNewMessage(''); // Očisti polje odmah
      
      let attachmentUrl = '';
      let fileName = '';
      
      // Upload file if present
      if (selectedFile) {
        setUploadingFile(true);
        
        try {
          // Generate unique file name with original extension
          const fileExt = selectedFile.name.split('.').pop();
          const uniqueFileName = `${uuidv4()}.${fileExt}`;
          const filePath = `${user.id}/${uniqueFileName}`;
          
          // Upload file to 'chat' bucket
          const { error: uploadError } = await supabase.storage
            .from('chat')
            .upload(filePath, selectedFile, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (uploadError) throw uploadError;
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('chat')
            .getPublicUrl(filePath);
            
          attachmentUrl = urlData.publicUrl;
          fileName = selectedFile.name;
          
          // Clear selected file
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          
        } catch (fileError: any) {
          console.error('Error uploading file:', fileError);
          setUploadError('Failed to upload file. Please try again.');
          setSendingMessage(false);
          setUploadingFile(false);
          return;
        } finally {
          setUploadingFile(false);
        }
      }
      
      // Send message
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          user_id: user.id,
          message: messageText,
          is_read: false,
          attachment_url: attachmentUrl || null,
          file_name: fileName || null
        })
        .select('id, created_at')
        .single();
        
      if (error) {
        console.error('Error sending message:', error);
        setNewMessage(messageText); // Vrati poruku nazad u input u slučaju greške
        return;
      }
      
      // Add optimistic update (the subscription will catch the real update)
      const optimisticMessage: MessageType = {
        id: data.id,
        chat_id: chatId,
        user_id: user.id,
        message: messageText,
        created_at: data.created_at,
        is_read: false,
        attachment_url: attachmentUrl,
        file_name: fileName,
        user: {
          full_name: null,  // Admin name will be fetched by the subscription
          email: user.email || null
        }
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setNewMessage(newMessage); // Vrati poruku nazad u input
    } finally {
      setSendingMessage(false);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        setUploadError('File is too large. Maximum size is 20MB.');
        return;
      }
      
      setSelectedFile(file);
      setUploadError(null);
    }
  };
  
  const handleCancelFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        <div className="p-4 border-t border-white/5">
          {selectedFile && (
            <div className="mb-2 bg-[#1A1A1A] rounded-lg p-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.5 2H8C6.93913 2 5.92172 2.42143 5.17157 3.17157C4.42143 3.92172 4 4.93913 4 6V18C4 19.0609 4.42143 20.0783 5.17157 20.8284C5.92172 21.5786 6.93913 22 8 22H16C17.0609 22 18.0783 21.5786 18.8284 20.8284C19.5786 20.0783 20 19.0609 20 18V9.5L12.5 2Z" 
                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2V10H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                <span className="text-gray-400 text-xs">
                  ({(selectedFile.size / 1024).toFixed(0)} KB)
                </span>
              </div>
              <button 
                onClick={handleCancelFile}
                className="text-gray-400 hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
          
          {uploadError && (
            <div className="mb-2 text-red-500 text-sm p-2 bg-red-500/10 rounded">
              {uploadError}
            </div>
          )}
        
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#FFB900]"
                disabled={sendingMessage || uploadingFile}
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                id="chat-file-input"
              />
              <label
                htmlFor="chat-file-input"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                onClick={(e) => {
                  if (sendingMessage || uploadingFile) {
                    e.preventDefault();
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 10L21 8C21 6.89543 20.1046 6 19 6L5 6C3.89543 6 3 6.89543 3 8L3 16C3 17.1046 3.89543 18 5 18L7 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.5 15L17.5 12L14.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17.5 12L9.5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </label>
            </div>
            <button
              type="submit"
              disabled={sendingMessage || uploadingFile || (!newMessage.trim() && !selectedFile)}
              className="px-4 py-3 bg-[#FFB900] text-black rounded-lg hover:bg-[#E6A800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(sendingMessage || uploadingFile) ? (
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