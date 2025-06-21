import React, { createContext, useContext, useState } from 'react';
import MessageBanner from './MessageBanner'; // adjust path if needed

type MessageType = 'success' | 'cancel' | 'error' | 'info';

interface Message {
  type: MessageType;
  text: string;
}

interface MessageContextType {
  showMessage: (msg: Message) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState<Message | null>(null);

  const clearMessage = () => setMessage(null);

  return (
    <MessageContext.Provider value={{ showMessage: setMessage }}>
      {children}
      {message && (
        <MessageBanner
          type={message.type}
          text={message.text}
          onClose={clearMessage}
          duration={3000}
        />
      )}
    </MessageContext.Provider>
  );
};