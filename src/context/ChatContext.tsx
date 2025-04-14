import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import blockchainService, { Message } from '@/services/blockchainService';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  searchUsers: (query: string) => Promise<Contact[]>;
  refreshConversation: (conversationId: string) => void;
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
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    if (user) {
      loadContacts();
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation);
      
      const intervalId = setInterval(() => {
        if (currentConversation) {
          refreshMessages(currentConversation);
        }
      }, 5000);
      
      return () => clearInterval(intervalId);
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

  const loadContacts = async () => {
    if (!user) return;
    
    const storedContacts = localStorage.getItem(`contacts_${user.id}`);
    let loadedContacts: Contact[] = [];
    
    if (storedContacts) {
      loadedContacts = JSON.parse(storedContacts);
    } 
    
    if (loadedContacts.length === 0) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id);
          
        if (error) {
          console.error('Error fetching contacts:', error);
          loadDemoContacts();
        } else if (data && data.length > 0) {
          loadedContacts = data.map(profile => ({
            id: profile.id,
            username: profile.username,
            displayName: profile.display_name,
            avatar: profile.avatar_url,
            lastSeen: Date.now() - Math.floor(Math.random() * 60) * 60 * 1000,
            status: profile.status || 'Hey there, I am using ChatChain!',
          }));
          
          setContacts(loadedContacts);
          localStorage.setItem(`contacts_${user.id}`, JSON.stringify(loadedContacts));
        } else {
          loadDemoContacts();
        }
      } catch (error) {
        console.error('Error loading contacts:', error);
        loadDemoContacts();
      }
    } else {
      setContacts(loadedContacts);
    }
  };
  
  const loadDemoContacts = () => {
    if (!user) return;
    
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
    localStorage.setItem(`contacts_${user.id}`, JSON.stringify(demoContacts));
  };

  const loadConversations = async () => {
    if (!user) return;
    
    const storedConversations = localStorage.getItem(`conversations_${user.id}`);
    let conversationsList: Conversation[] = [];
    
    if (storedConversations) {
      conversationsList = JSON.parse(storedConversations);
    } else if (contacts.length > 0) {
      conversationsList = contacts.map(contact => ({
        id: `conv_${contact.id}`,
        type: 'direct' as const,
        participants: [contact],
        unreadCount: 0,
      }));
    }
    
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
      
      const unreadMessageIds = loadedMessages
        .filter(msg => msg.sender !== user.id && !msg.readBy.includes(user.id))
        .map(msg => msg.id);
        
      if (unreadMessageIds.length > 0) {
        await blockchainService.markMessagesAsRead(unreadMessageIds, user.id);
        
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

  const refreshMessages = async (conversation: Conversation) => {
    if (!user) return;
    
    try {
      let refreshedMessages: Message[] = [];
      
      if (conversation.type === 'direct') {
        const contactId = conversation.participants[0].id;
        refreshedMessages = await blockchainService.getMessages({
          userId: user.id,
          contactId,
        });
      } else if (conversation.type === 'group' && conversation.groupInfo) {
        refreshedMessages = await blockchainService.getMessages({
          groupId: conversation.groupInfo.id,
        });
      }
      
      if (refreshedMessages.length !== messages.length) {
        setMessages(refreshedMessages);
        
        const unreadMessageIds = refreshedMessages
          .filter(msg => msg.sender !== user.id && !msg.readBy.includes(user.id))
          .map(msg => msg.id);
          
        if (unreadMessageIds.length > 0) {
          await blockchainService.markMessagesAsRead(unreadMessageIds, user.id);
          
          setConversations(prev => prev.map(conv => 
            conv.id === conversation.id 
              ? { ...conv, unreadCount: 0 } 
              : conv
          ));
        }
        
        updateConversationsWithLastMessages();
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  };

  const updateConversationsWithLastMessages = async () => {
    if (!user) return;
    
    const updatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        if (conv.type === 'direct') {
          const contactId = conv.participants[0].id;
          const messages = await blockchainService.getMessages({
            userId: user.id,
            contactId,
          });
          
          const lastMessage = messages.length > 0 
            ? messages[messages.length - 1] 
            : undefined;
            
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
      
      setMessages(prev => [...prev, newMessage]);
      
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
    
    const existingConv = conversations.find(
      c => c.type === 'direct' && c.participants.some(p => p.id === contactId)
    );
    
    if (existingConv) {
      setCurrentConversation(existingConv);
      return;
    }
    
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
    
    try {
      const contactExists = contacts.some(c => c.username.toLowerCase() === username.toLowerCase());
      if (contactExists) {
        toast({
          title: "Contact already exists",
          description: `${username} is already in your contacts.`,
          variant: "default"
        });
        return false;
      }
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username)
        .single();
      
      if (profileError || !profileData) {
        console.error('Error fetching profile:', profileError);
        toast({
          title: "User not found",
          description: `Could not find a user with username "${username}".`,
          variant: "destructive"
        });
        return false;
      }
      
      if (profileData.id === user.id) {
        toast({
          title: "Cannot add yourself",
          description: "You cannot add yourself as a contact.",
          variant: "destructive"
        });
        return false;
      }
      
      const newContact: Contact = {
        id: profileData.id,
        username: profileData.username,
        displayName: profileData.display_name,
        avatar: profileData.avatar_url,
        lastSeen: Date.now(),
        status: profileData.status || undefined,
      };
      
      const updatedContacts = [...contacts, newContact];
      setContacts(updatedContacts);
      localStorage.setItem(`contacts_${user.id}`, JSON.stringify(updatedContacts));
      
      const newConversation: Conversation = {
        id: `conv_${newContact.id}`,
        type: 'direct',
        participants: [newContact],
        unreadCount: 0,
      };
      
      setConversations(prev => [...prev, newConversation]);
      saveConversations([...conversations, newConversation]);
      
      toast({
        title: "Contact added",
        description: `${newContact.displayName} has been added to your contacts.`,
      });
      
      return true;
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: "Error adding contact",
        description: "There was an error adding this contact. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const searchUsers = async (query: string): Promise<Contact[]> => {
    if (!query.trim() || !user) return [];
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq('id', user.id)
        .limit(10);
        
      if (error) {
        console.error('Error searching users:', error);
        return [];
      }
      
      return data.map(profile => ({
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatar: profile.avatar_url,
        status: profile.status || undefined,
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  const saveConversations = (updatedConversations: Conversation[]) => {
    if (user) {
      localStorage.setItem(`conversations_${user.id}`, JSON.stringify(updatedConversations));
    }
  };

  const refreshConversation = (conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation && user) {
      loadMessages(conversation);
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
      searchUsers,
      refreshConversation,
    }}>
      {children}
    </ChatContext.Provider>
  );
};
