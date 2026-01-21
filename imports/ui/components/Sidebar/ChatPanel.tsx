import React, { useState, useRef, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useChat } from '../../hooks/useChat';
import { ChatMessage } from '../../../api/chat/chat';
import { Avatar } from '../UI/Avatar';

interface ChatPanelProps {
  sessionId: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId }) => {
  const { messages, isLoading, sendMessage } = useChat(sessionId);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = useTracker(() => Meteor.userId(), []);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText.trim());
      setInputText('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Chat
        </h3>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-500 text-sm">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(message => (
            <ChatMessageItem
              key={message._id}
              message={message}
              isOwn={message.userId === currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            data-chat-input
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (press C)"
            className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, isOwn }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (message.type === 'system') {
    return (
      <div className="text-center text-xs text-gray-500 py-2">
        {message.message}
      </div>
    );
  }
  
  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar name={message.userName} src={message.userAvatar} size="sm" />
      
      <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          {!isOwn && (
            <span className="text-xs font-medium text-gray-900 dark:text-white">
              {message.userName}
            </span>
          )}
          <span className="text-xs text-gray-500">
            {formatTime(message.createdAt)}
          </span>
          {message.editedAt && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
        </div>
        
        <div
          className={`inline-block px-3 py-2 rounded-lg text-sm ${
            isOwn
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
          }`}
        >
          {message.type === 'code_snippet' && message.code ? (
            <pre className="font-mono text-xs bg-black/20 p-2 rounded overflow-x-auto">
              <code>{message.code.content}</code>
            </pre>
          ) : (
            <p className="whitespace-pre-wrap">{message.message}</p>
          )}
        </div>
        
        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="flex gap-1 mt-1">
            {message.reactions.map(reaction => (
              <span
                key={reaction.emoji}
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700"
              >
                {reaction.emoji} {reaction.users.length}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
