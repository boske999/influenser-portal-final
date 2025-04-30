'use client';

import { useAuth } from '../context/AuthContext';
import { ChatMessage as ChatMessageType } from '../context/ChatContext';

type ChatMessageProps = {
  message: ChatMessageType;
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const { user } = useAuth();
  const isCurrentUser = message.user_id === user?.id;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`flex mb-4 ${
        isCurrentUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[75%] px-4 py-2 rounded-lg ${
          isCurrentUser
            ? 'bg-[#FFB900] text-black rounded-tr-none'
            : 'bg-[#1A1A1A] text-white rounded-tl-none'
        }`}
      >
        {!isCurrentUser && (
          <div className="text-sm font-medium mb-1">
            {message.user?.full_name || message.user?.email || 'User'}
          </div>
        )}
        <p className="text-sm break-words">{message.message}</p>
        <div
          className={`text-xs mt-1 ${
            isCurrentUser ? 'text-black/70' : 'text-white/60'
          }`}
        >
          {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  );
} 