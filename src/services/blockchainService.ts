
import { toast } from "@/hooks/use-toast";
import axios from 'axios';

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

// Integration with IPFS via Pinata for demonstration purposes
// In a production app, you'd use a more sophisticated blockchain solution
class BlockchainService {
  private messages: Message[] = [];
  private localStorageKey = 'pinata_message_cache';
  private pinataApiKey = 'YOUR_PINATA_API_KEY'; // For demo we use a placeholder
  private pinataSecretKey = 'YOUR_PINATA_SECRET_KEY'; // For demo we use a placeholder
  private pinataGatewayUrl = 'https://gateway.pinata.cloud/ipfs/';
  
  constructor() {
    // Load messages from localStorage cache on init
    this.loadMessagesFromCache();
  }
  
  private loadMessagesFromCache(): void {
    const storedMessages = localStorage.getItem(this.localStorageKey);
    if (storedMessages) {
      this.messages = JSON.parse(storedMessages);
    }
  }
  
  private updateCache(): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.messages));
  }

  // Demo authentication status for Pinata
  // For a real implementation, this would check API key validity
  public isDemoMode(): boolean {
    return this.pinataApiKey === 'YOUR_PINATA_API_KEY';
  }
  
  // Method to set Pinata API keys at runtime
  public setApiKeys(apiKey: string, secretKey: string): void {
    this.pinataApiKey = apiKey;
    this.pinataSecretKey = secretKey;
    toast({
      title: "Blockchain Connected",
      description: "Your IPFS connection has been established.",
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
      
      return response.data.IpfsHash;
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      return null;
    }
  }

  // Get content from IPFS via Pinata gateway
  private async getFromIPFS(hash: string): Promise<any | null> {
    // If in demo mode or using fake hash, return null
    if (this.isDemoMode() || hash.startsWith('0x')) {
      return null;
    }
    
    try {
      const response = await axios.get(`${this.pinataGatewayUrl}${hash}`);
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
      
      console.log('Message sent to blockchain:', newMessage);
      return newMessage;
    } catch (error) {
      console.error('Error sending message to blockchain:', error);
      toast({
        title: "Message Error",
        description: "Failed to send message to blockchain. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  }
  
  // Get messages for a specific conversation (direct or group)
  async getMessages(options: { userId?: string; contactId?: string; groupId?: string }): Promise<Message[]> {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    
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
  
  // Mark messages as read
  async markMessagesAsRead(messageIds: string[], userId: string): Promise<void> {
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
  }
  
  // Generate a fake blockchain transaction hash for demo mode
  private generateFakeHash(): string {
    return '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
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
