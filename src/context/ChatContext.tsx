
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import blockchainService, { Message } from '@/services/blockchainService';
import { useAuth, User } from './AuthContext';

// Chat types
export interface Contact {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  lastSeen?: number;
  status?: string;
}

export interface Group {
  id: string;
  name: string;
  avatar?: string;
  members: string[];
  createdBy: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participants: Contact[];
  groupInfo?: Group;
  lastMessage?: Message;
  unreadCount: number;
}

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  contacts: Contact[];
  messages: Message[];
  isLoadingMessages: boolean;
  sendMessage: (content: string) => Promise<void>;
  selectConversation: (conversationId: string) => void;
  createConversation: (contactId: string) => void;
  createGroupConversation: (name: string, memberIds: string[]) => Promise<boolean>;
  addContact: (username: string) => Promise<boolean>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Load contacts and conversations from "storage"
  useEffect(() => {
    if (user) {
      loadContacts();
      loadConversations();
    }
  }, [user]);

  // When current conversation changes, load messages
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation);
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

  const loadContacts = () => {
    const storedContacts = localStorage.getItem(`contacts_${user?.id}`);
    if (storedContacts) {
      setContacts(JSON.parse(storedContacts));
    } else {
      // Add some demo contacts for first-time users
      const demoContacts: Contact[] = [
        {
          id: 'contact1',
          username: 'alice',
          displayName: 'Alice Johnson',
          lastSeen: Date.now() - 5 * 60 * 1000,
          status: 'Hey there, I am using ChatChain!',
        },
        {
          id: 'contact2',
          username: 'bob',
          displayName: 'Bob Smith',
          lastSeen: Date.now() - 35 * 60 * 1000,
          status: 'Available for blockchain talk',
        },
      ];
      setContacts(demoContacts);
      localStorage.setItem(`contacts_${user?.id}`, JSON.stringify(demoContacts));
    }
  };

  const loadConversations = async () => {
    const storedConversations = localStorage.getItem(`conversations_${user?.id}`);
    let conversationsList: Conversation[] = [];
    
    if (storedConversations) {
      conversationsList = JSON.parse(storedConversations);
    } else if (contacts.length > 0) {
      // Create default conversations with contacts
      conversationsList = contacts.map(contact => ({
        id: `conv_${contact.id}`,
        type: 'direct' as const,
        participants: [contact],
        unreadCount: 0,
      }));
    }
    
    // Load last message for each conversation
    const updatedConversations = await Promise.all(
      conversationsList.map(async (conv) => {
        if (conv.type === 'direct' && user) {
          const contactId = conv.participants[0].id;
          const messages = await blockchainService.getMessages({
            userId: user.id,
            contactId,
          });
          
          const lastMessage = messages.length > 0 
            ? messages[messages.length - 1] 
            : undefined;
            
          // Count unread messages
          const unreadCount = messages.filter(
            msg => msg.sender === contactId && !msg.readBy.includes(user.id)
          ).length;
            
          return {
            ...conv,
            lastMessage,
            unreadCount,
          };
        }
        return conv;
      })
    );
    
    setConversations(updatedConversations);
    saveConversations(updatedConversations);
  };

  const loadMessages = async (conversation: Conversation) => {
    if (!user) return;
    
    setIsLoadingMessages(true);
    try {
      let loadedMessages: Message[] = [];
      
      if (conversation.type === 'direct') {
        const contactId = conversation.participants[0].id;
        loadedMessages = await blockchainService.getMessages({
          userId: user.id,
          contactId,
        });
      } else if (conversation.type === 'group' && conversation.groupInfo) {
        loadedMessages = await blockchainService.getMessages({
          groupId: conversation.groupInfo.id,
        });
      }
      
      setMessages(loadedMessages);
      
      // Mark messages as read
      const unreadMessageIds = loadedMessages
        .filter(msg => msg.sender !== user.id && !msg.readBy.includes(user.id))
        .map(msg => msg.id);
        
      if (unreadMessageIds.length > 0) {
        await blockchainService.markMessagesAsRead(unreadMessageIds, user.id);
        
        // Update conversation unread count
        setConversations(prev => prev.map(conv => 
          conv.id === conversation.id 
            ? { ...conv, unreadCount: 0 } 
            : conv
        ));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!user || !currentConversation) return;
    
    try {
      const isGroup = currentConversation.type === 'group';
      const newMessage = await blockchainService.sendMessage({
        sender: user.id,
        receiver: isGroup ? null : currentConversation.participants[0].id,
        groupId: isGroup ? currentConversation.groupInfo!.id : null,
        content,
      });
      
      // Update messages list
      setMessages(prev => [...prev, newMessage]);
      
      // Update conversation last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConversation.id 
            ? { ...conv, lastMessage: newMessage } 
            : conv
        )
      );
      
      saveConversations(
        conversations.map(conv => 
          conv.id === currentConversation.id 
            ? { ...conv, lastMessage: newMessage } 
            : conv
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const selectConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId) ?? null;
    setCurrentConversation(conversation);
  };

  const createConversation = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    // Check if conversation already exists
    const existingConv = conversations.find(
      c => c.type === 'direct' && c.participants.some(p => p.id === contactId)
    );
    
    if (existingConv) {
      setCurrentConversation(existingConv);
      return;
    }
    
    // Create new conversation
    const newConv: Conversation = {
      id: `conv_${contact.id}`,
      type: 'direct',
      participants: [contact],
      unreadCount: 0,
    };
    
    setConversations(prev => [...prev, newConv]);
    setCurrentConversation(newConv);
    saveConversations([...conversations, newConv]);
  };

  const createGroupConversation = async (name: string, memberIds: string[]): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const members = contacts
        .filter(c => memberIds.includes(c.id))
        .map(c => ({ id: c.id, username: c.username, displayName: c.displayName, avatar: c.avatar }));
      
      if (members.length === 0) return false;
      
      const groupId = `group_${Date.now()}`;
      
      const groupInfo: Group = {
        id: groupId,
        name,
        members: [user.id, ...memberIds],
        createdBy: user.id,
        createdAt: Date.now(),
      };
      
      const newConversation: Conversation = {
        id: `conv_${groupId}`,
        type: 'group',
        participants: members,
        groupInfo,
        unreadCount: 0,
      };
      
      setConversations(prev => [...prev, newConversation]);
      setCurrentConversation(newConversation);
      saveConversations([...conversations, newConversation]);
      return true;
    } catch (error) {
      console.error('Error creating group:', error);
      return false;
    }
  };

  const addContact = async (username: string): Promise<boolean> => {
    if (!user) return false;
    
    // Check if contact already exists
    const contactExists = contacts.some(c => c.username === username);
    if (contactExists) return false;
    
    // In a real app, you'd verify the user exists in your system
    // For this demo, we'll create a mock contact
    const newContact: Contact = {
      id: `contact_${Date.now()}`,
      username,
      displayName: username,
      lastSeen: Date.now(),
    };
    
    const updatedContacts = [...contacts, newContact];
    setContacts(updatedContacts);
    localStorage.setItem(`contacts_${user.id}`, JSON.stringify(updatedContacts));
    
    return true;
  };

  const saveConversations = (updatedConversations: Conversation[]) => {
    if (user) {
      localStorage.setItem(`conversations_${user.id}`, JSON.stringify(updatedConversations));
    }
  };

  return (
    <ChatContext.Provider value={{
      conversations,
      currentConversation,
      contacts,
      messages,
      isLoadingMessages,
      sendMessage,
      selectConversation,
      createConversation,
      createGroupConversation,
      addContact,
    }}>
      {children}
    </ChatContext.Provider>
  );
};
