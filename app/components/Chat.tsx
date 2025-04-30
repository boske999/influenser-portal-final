'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from '../context/ChatContext';
import ChatMessage from './ChatMessage';

type ChatProps = {
  proposalId: string;
};

export default function Chat({ proposalId }: ChatProps) {
  const { 
    messages, 
    loading, 
    error, 
    sendMessage, 
    setChatProposalId, 
    markMessagesAsRead,
    chatId 
  } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set current proposal ID in context
    const initializeChat = async () => {
      if (!initialized) {
        console.log('Initializing chat for proposal:', proposalId);
        setIsLoading(true);
        await setChatProposalId(proposalId);
        setInitialized(true);
        setIsLoading(false);
        console.log('Chat initialized for proposal:', proposalId, 'Chat ID:', chatId);
      }
    };
    
    initializeChat();
  }, [proposalId, setChatProposalId, initialized, chatId]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark messages as read when the component is mounted
  useEffect(() => {
    if (chatId && messages.length > 0) {
      console.log('Marking messages as read for chat:', chatId);
      markMessagesAsRead();
    }
  }, [chatId, messages, markMessagesAsRead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      setIsLoading(true);
      console.log('Sending message:', newMessage);
      await sendMessage(newMessage);
      setNewMessage('');
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return <div className="flex justify-center items-center h-64">Loading conversation...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/5">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#FFB900]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !newMessage.trim()}
            className="px-4 py-3 bg-[#FFB900] text-black rounded-lg hover:bg-[#E6A800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
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
        </div>
      </form>
    </div>
  );
} 