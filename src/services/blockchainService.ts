import { toast } from "@/hooks/use-toast";
import axios from 'axios';
import { supabase } from "@/integrations/supabase/client";

export interface Message {
  id: string;
  sender: string;
  receiver: string | null;
  groupId: string | null;
  content: string;
  timestamp: number;
  readBy: string[];
  blockchainHash: string;
}

class BlockchainService {
  private messages: Message[] = [];
  private localStorageKey = 'pinata_message_cache';
  private pinataApiKey = '5cbee2fe3065676c77e1';
  private pinataSecretKey = 'bae89724ce421998357f446ef4743140e771b62e30734fa885b3204f399cc777';
  private pinataGatewayUrl = 'pink-blank-felidae-946.mypinata.cloud';
  private configKey = 'pinata_config';
  private deletedMessagesKey = 'deleted_messages';
  private deletedMessages: Record<string, string[]> = {};
  
  constructor() {
    this.loadMessagesFromCache();
    this.loadPinataConfig();
    this.loadDeletedMessages();
  }
  
  private loadMessagesFromCache(): void {
    try {
      const storedMessages = localStorage.getItem(this.localStorageKey);
      if (storedMessages) {
        this.messages = JSON.parse(storedMessages);
      }
    } catch (error) {
      console.error("Error loading messages from cache:", error);
      this.messages = [];
    }
  }
  
  private updateCache(): void {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.messages));
    } catch (error) {
      console.error("Error updating message cache:", error);
      toast({
        title: "Cache Error",
        description: "Failed to save messages to local cache.",
        variant: "destructive",
      });
    }
  }

  private loadPinataConfig(): void {
    try {
      const config = localStorage.getItem(this.configKey);
      if (config) {
        const { apiKey, secretKey, gatewayUrl } = JSON.parse(config);
        this.pinataApiKey = apiKey || '5cbee2fe3065676c77e1';
        this.pinataSecretKey = secretKey || 'bae89724ce421998357f446ef4743140e771b62e30734fa885b3204f399cc777';
        this.pinataGatewayUrl = gatewayUrl || 'pink-blank-felidae-946.mypinata.cloud';
      }
    } catch (error) {
      console.error("Error loading Pinata config:", error);
    }
  }

  private loadDeletedMessages(): void {
    try {
      const deletedData = localStorage.getItem(this.deletedMessagesKey);
      if (deletedData) {
        this.deletedMessages = JSON.parse(deletedData);
      }
    } catch (error) {
      console.error("Error loading deleted messages:", error);
      this.deletedMessages = {};
    }
  }

  private saveDeletedMessages(): void {
    try {
      localStorage.setItem(this.deletedMessagesKey, JSON.stringify(this.deletedMessages));
    } catch (error) {
      console.error("Error saving deleted messages:", error);
    }
  }

  public deleteMessage(messageId: string, userId: string): void {
    if (!userId) return;
    
    if (!this.deletedMessages[userId]) {
      this.deletedMessages[userId] = [];
    }
    
    if (!this.deletedMessages[userId].includes(messageId)) {
      this.deletedMessages[userId].push(messageId);
      this.saveDeletedMessages();
      
      toast({
        description: "Message deleted from your view",
      });
    }
  }

  public isMessageDeletedForUser(messageId: string, userId: string): boolean {
    if (!userId || !this.deletedMessages[userId]) return false;
    return this.deletedMessages[userId].includes(messageId);
  }

  private savePinataConfig(): void {
    try {
      const config = {
        apiKey: this.pinataApiKey,
        secretKey: this.pinataSecretKey,
        gatewayUrl: this.pinataGatewayUrl
      };
      localStorage.setItem(this.configKey, JSON.stringify(config));
    } catch (error) {
      console.error("Error saving Pinata config:", error);
    }
  }

  public isDemoMode(): boolean {
    return !this.pinataApiKey || !this.pinataSecretKey;
  }
  
  public setApiKeys(apiKey: string, secretKey: string, gatewayUrl: string = 'https://gateway.pinata.cloud'): void {
    this.pinataApiKey = apiKey;
    this.pinataSecretKey = secretKey;
    this.pinataGatewayUrl = gatewayUrl;
    this.savePinataConfig();
    
    toast({
      title: "IPFS Connected",
      description: "Your Pinata IPFS connection has been established.",
    });
  }

  private async uploadToIPFS(content: any): Promise<string | null> {
    if (this.isDemoMode()) {
      console.log("Using demo mode with fake IPFS hash");
      await new Promise(resolve => setTimeout(resolve, 300)); 
      return this.generateFakeHash();
    }
    
    try {
      console.log("Uploading to IPFS via Pinata...");
      
      const data = JSON.stringify({
        pinataOptions: {
          cidVersion: 1
        },
        pinataMetadata: {
          name: `ChatChain-Message-${Date.now()}`
        },
        pinataContent: content
      });

      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey
          }
        }
      );
      
      console.log("IPFS upload successful:", response.data);
      toast({
        description: "Message stored on IPFS blockchain",
      });
      
      return response.data.IpfsHash;
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      toast({
        title: "IPFS Error",
        description: "Failed to store message on IPFS. Using local storage instead.",
        variant: "destructive",
      });
      return this.generateFakeHash(); 
    }
  }

  private async getFromIPFS(hash: string): Promise<any | null> {
    if (this.isDemoMode() || hash.startsWith('0x')) {
      return null;
    }
    
    try {
      let gatewayUrl = this.pinataGatewayUrl;
      if (!gatewayUrl.startsWith('http')) {
        gatewayUrl = `https://${gatewayUrl}`;
      }
      if (!gatewayUrl.endsWith('/')) {
        gatewayUrl += '/';
      }
      
      console.log(`Fetching from IPFS: ${gatewayUrl}ipfs/${hash}`);
      const response = await axios.get(`${gatewayUrl}ipfs/${hash}`);
      return response.data;
    } catch (error) {
      console.error("Error retrieving from IPFS:", error);
      return null;
    }
  }
  
  async sendMessage(message: Omit<Message, 'id' | 'timestamp' | 'blockchainHash' | 'readBy'>): Promise<Message> {
    const messageContent = {
      ...message,
      timestamp: Date.now(),
    };
    
    try {
      console.log("Preparing to send message:", messageContent);
      
      const ipfsHash = await this.uploadToIPFS(messageContent);
      
      if (!ipfsHash) {
        throw new Error("Failed to upload to IPFS");
      }
      
      const newMessage: Message = {
        ...message,
        id: crypto.randomUUID(),
        timestamp: messageContent.timestamp,
        readBy: [message.sender],
        blockchainHash: ipfsHash,
      };
      
      this.messages.push(newMessage);
      this.updateCache();
      
      try {
        const { error } = await supabase.from('messages').insert({
          id: newMessage.id,
          sender_id: newMessage.sender,
          receiver_id: newMessage.receiver,
          group_id: newMessage.groupId,
          content: newMessage.content,
          timestamp: new Date(newMessage.timestamp).toISOString(),
          read_by: newMessage.readBy,
          blockchain_hash: newMessage.blockchainHash
        });
        
        if (error) {
          console.error('Error saving message to database:', error);
        }
      } catch (dbError) {
        console.error('Database error while saving message:', dbError);
      }
      
      console.log('Message sent to blockchain and database:', newMessage);
      return newMessage;
    } catch (error) {
      console.error('Error sending message to blockchain:', error);
      toast({
        title: "Message Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  }
  
  async getMessages(options: { userId?: string; contactId?: string; groupId?: string }): Promise<Message[]> {
    try {
      let dbMessages: Message[] = [];
      
      if (options.groupId) {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('group_id', options.groupId)
          .order('timestamp', { ascending: true });
          
        if (error) {
          console.error('Error fetching group messages from DB:', error);
        } else if (data) {
          dbMessages = data.map(this.mapDbMessageToMessage);
        }
      } else if (options.userId && options.contactId) {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${options.userId},receiver_id.eq.${options.userId}`)
          .or(`sender_id.eq.${options.contactId},receiver_id.eq.${options.contactId}`)
          .is('group_id', null)
          .order('timestamp', { ascending: true });
          
        if (error) {
          console.error('Error fetching direct messages from DB:', error);
        } else if (data) {
          dbMessages = data.filter(msg => 
            (msg.sender_id === options.userId && msg.receiver_id === options.contactId) || 
            (msg.sender_id === options.contactId && msg.receiver_id === options.userId)
          ).map(this.mapDbMessageToMessage);
        }
      }
      
      const localMessages = this.messages.filter(message => {
        if (options.groupId) {
          return message.groupId === options.groupId;
        }
        
        if (options.userId && options.contactId) {
          return (
            (message.sender === options.userId && message.receiver === options.contactId) || 
            (message.sender === options.contactId && message.receiver === options.userId)
          );
        }
        
        return false;
      });
      
      const mergedMessages = [...dbMessages];
      
      for (const localMsg of localMessages) {
        if (!mergedMessages.some(m => m.id === localMsg.id)) {
          mergedMessages.push(localMsg);
        }
      }
      
      const enhancedMessages = await this.enrichMessagesWithIPFSContent(mergedMessages);
      
      if (options.userId) {
        return enhancedMessages
          .filter(msg => !this.isMessageDeletedForUser(msg.id, options.userId))
          .sort((a, b) => a.timestamp - b.timestamp);
      }
      
      return enhancedMessages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Error retrieving messages:', error);
      
      const filteredMessages = this.messages
        .filter(message => {
          if (options.groupId) {
            return message.groupId === options.groupId;
          }
          
          if (options.userId && options.contactId) {
            return (
              (message.sender === options.userId && message.receiver === options.contactId) || 
              (message.sender === options.contactId && message.receiver === options.userId)
            );
          }
          
          return false;
        })
        .filter(msg => options.userId ? !this.isMessageDeletedForUser(msg.id, options.userId) : true)
        .sort((a, b) => a.timestamp - b.timestamp);
        
      return filteredMessages;
    }
  }
  
  private async enrichMessagesWithIPFSContent(messages: Message[]): Promise<Message[]> {
    if (this.isDemoMode()) {
      return messages;
    }
    
    const batchSize = 5;
    const result: Message[] = [];
    
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const enrichedBatch = await Promise.all(
        batch.map(async (message) => {
          if (!message.blockchainHash.startsWith('0x')) {
            try {
              const ipfsContent = await this.getFromIPFS(message.blockchainHash);
              if (ipfsContent) {
                console.log(`Retrieved IPFS content for message ${message.id}`);
              }
            } catch (error) {
              console.error(`Failed to retrieve IPFS content for message ${message.id}:`, error);
            }
          }
          return message;
        })
      );
      
      result.push(...enrichedBatch);
    }
    
    return result;
  }
  
  private mapDbMessageToMessage(dbMessage: any): Message {
    return {
      id: dbMessage.id,
      sender: dbMessage.sender_id,
      receiver: dbMessage.receiver_id,
      groupId: dbMessage.group_id,
      content: dbMessage.content,
      timestamp: new Date(dbMessage.timestamp).getTime(),
      readBy: dbMessage.read_by || [],
      blockchainHash: dbMessage.blockchain_hash
    };
  }
  
  async markMessagesAsRead(messageIds: string[], userId: string): Promise<void> {
    if (!messageIds.length) return;
    
    let updated = false;
    
    this.messages = this.messages.map(message => {
      if (messageIds.includes(message.id) && !message.readBy.includes(userId)) {
        updated = true;
        return {
          ...message,
          readBy: [...message.readBy, userId]
        };
      }
      return message;
    });
    
    if (updated) {
      this.updateCache();
    }
    
    try {
      for (const msgId of messageIds) {
        const { data, error } = await supabase
          .from('messages')
          .select('read_by')
          .eq('id', msgId)
          .single();
          
        if (error) {
          console.error(`Error fetching read status for message ${msgId}:`, error);
          continue;
        }
        
        const readBy = data.read_by || [];
        if (!readBy.includes(userId)) {
          readBy.push(userId);
          
          const { error: updateError } = await supabase
            .from('messages')
            .update({ read_by: readBy })
            .eq('id', msgId);
            
          if (updateError) {
            console.error(`Error updating read status for message ${msgId}:`, updateError);
          }
        }
      }
    } catch (error) {
      console.error('Error updating read status in database:', error);
    }
  }
  
  private generateFakeHash(): string {
    return '0x' + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)).join('');
  }
  
  clearCache(): void {
    this.messages = [];
    localStorage.removeItem(this.localStorageKey);
  }
  
  clearDeletedMessages(userId: string): void {
    if (userId && this.deletedMessages[userId]) {
      delete this.deletedMessages[userId];
      this.saveDeletedMessages();
      toast({
        description: "Deleted messages restored",
      });
    }
  }
}

const blockchainService = new BlockchainService();
export default blockchainService;
