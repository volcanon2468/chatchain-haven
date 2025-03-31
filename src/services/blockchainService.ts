import { toast } from "@/hooks/use-toast";
import axios from 'axios';
import { supabase } from "@/integrations/supabase/client";

// Define message type
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

// Integration with IPFS via Pinata
class BlockchainService {
  private messages: Message[] = [];
  private localStorageKey = 'pinata_message_cache';
  private pinataApiKey = '5cbee2fe3065676c77e1';
  private pinataSecretKey = 'bae89724ce421998357f446ef4743140e771b62e30734fa885b3204f399cc777
';
  private pinataGatewayUrl = 'pink-blank-felidae-946.mypinata.cloud';
  private configKey = 'pinata_config';
  
  constructor() {
    // Load messages from localStorage cache on init
    this.loadMessagesFromCache();
    
    // Load Pinata configuration if available
    this.loadPinataConfig();
  }
  
  private loadMessagesFromCache(): void {
    try {
      const storedMessages = localStorage.getItem(this.localStorageKey);
      if (storedMessages) {
        this.messages = JSON.parse(storedMessages);
      }
    } catch (error) {
      console.error("Error loading messages from cache:", error);
      // If there's an error reading from localStorage, initialize with empty array
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
        this.pinataSecretKey = secretKey || 'bae89724ce421998357f446ef4743140e771b62e30734fa885b3204f399cc777
';
        this.pinataGatewayUrl = gatewayUrl || 'pink-blank-felidae-946.mypinata.cloud';
      }
    } catch (error) {
      console.error("Error loading Pinata config:", error);
    }
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

  // Demo authentication status for Pinata
  public isDemoMode(): boolean {
    return !this.pinataApiKey || !this.pinataSecretKey;
  }
  
  // Method to set Pinata API keys at runtime
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

  // Upload message content to IPFS via Pinata
  private async uploadToIPFS(content: any): Promise<string | null> {
    // If in demo mode, generate fake hash
    if (this.isDemoMode()) {
      console.log("Using demo mode with fake IPFS hash");
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
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
      return this.generateFakeHash(); // Fallback to fake hash
    }
  }

  // Get content from IPFS via Pinata gateway
  private async getFromIPFS(hash: string): Promise<any | null> {
    // If in demo mode or using fake hash, return null
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
  
  // Send a message to the blockchain (IPFS in this case)
  async sendMessage(message: Omit<Message, 'id' | 'timestamp' | 'blockchainHash' | 'readBy'>): Promise<Message> {
    // Create a new message
    const messageContent = {
      ...message,
      timestamp: Date.now(),
    };
    
    try {
      console.log("Preparing to send message:", messageContent);
      
      // Upload to IPFS or generate fake hash in demo mode
      const ipfsHash = await this.uploadToIPFS(messageContent);
      
      if (!ipfsHash) {
        throw new Error("Failed to upload to IPFS");
      }
      
      // Create full message with blockchain hash
      const newMessage: Message = {
        ...message,
        id: crypto.randomUUID(),
        timestamp: messageContent.timestamp,
        readBy: [message.sender],
        blockchainHash: ipfsHash,
      };
      
      // Add to local cache
      this.messages.push(newMessage);
      this.updateCache();
      
      // Also store in Supabase database for cross-user sync
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
  
  // Get messages for a specific conversation (direct or group)
  async getMessages(options: { userId?: string; contactId?: string; groupId?: string }): Promise<Message[]> {
    try {
      // First, try to get messages from Supabase for real-time sync
      let dbMessages: Message[] = [];
      
      if (options.groupId) {
        // Group messages
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
        // Direct messages between two users
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
          // Filter to only include messages between these two users
          dbMessages = data.filter(msg => 
            (msg.sender_id === options.userId && msg.receiver_id === options.contactId) || 
            (msg.sender_id === options.contactId && msg.receiver_id === options.userId)
          ).map(this.mapDbMessageToMessage);
        }
      }
      
      // Merge with local cache to ensure we have everything
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
      
      // Merge and deduplicate messages from both sources
      const mergedMessages = [...dbMessages];
      
      // Add local messages that aren't in the database yet
      for (const localMsg of localMessages) {
        if (!mergedMessages.some(m => m.id === localMsg.id)) {
          mergedMessages.push(localMsg);
        }
      }
      
      // Attempt to load IPFS content for non-demo messages if needed
      const enhancedMessages = await this.enrichMessagesWithIPFSContent(mergedMessages);
      
      // Sort by timestamp
      return enhancedMessages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Error retrieving messages:', error);
      
      // Fallback to local cache if database query fails
      return this.messages.filter(message => {
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
      }).sort((a, b) => a.timestamp - b.timestamp);
    }
  }
  
  // Enrich messages with IPFS content if available and needed
  private async enrichMessagesWithIPFSContent(messages: Message[]): Promise<Message[]> {
    // Skip IPFS enrichment in demo mode
    if (this.isDemoMode()) {
      return messages;
    }
    
    // Process in batches to avoid overwhelming the IPFS gateway
    const batchSize = 5;
    const result: Message[] = [];
    
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const enrichedBatch = await Promise.all(
        batch.map(async (message) => {
          // Only try to load content from IPFS if the hash is a real IPFS hash (not starting with 0x)
          if (!message.blockchainHash.startsWith('0x')) {
            try {
              const ipfsContent = await this.getFromIPFS(message.blockchainHash);
              if (ipfsContent) {
                // If we successfully retrieved IPFS content, we might want to use or validate it
                console.log(`Retrieved IPFS content for message ${message.id}`);
                // Note: In this implementation we're keeping the message content from the database
                // but we could replace or validate it with the IPFS content if needed
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
  
  // Mark messages as read
  async markMessagesAsRead(messageIds: string[], userId: string): Promise<void> {
    if (!messageIds.length) return;
    
    let updated = false;
    
    // Update local cache
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
    
    // Update in database
    try {
      for (const msgId of messageIds) {
        // Get current read_by array from database
        const { data, error } = await supabase
          .from('messages')
          .select('read_by')
          .eq('id', msgId)
          .single();
          
        if (error) {
          console.error(`Error fetching read status for message ${msgId}:`, error);
          continue;
        }
        
        // Add user to read_by array if not already present
        const readBy = data.read_by || [];
        if (!readBy.includes(userId)) {
          readBy.push(userId);
          
          // Update database
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
  
  // Generate a fake blockchain transaction hash for demo mode
  private generateFakeHash(): string {
    // Use a similar pattern to what our database is using for wallet addresses
    return '0x' + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)).join('');
  }
  
  // Clear all message cache - useful for testing
  clearCache(): void {
    this.messages = [];
    localStorage.removeItem(this.localStorageKey);
  }
}

// Create a singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;
