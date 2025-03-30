
import { toast } from "@/hooks/use-toast";

// Define message type
export interface Message {
  id: string;
  sender: string;
  receiver: string | null;
  groupId: string | null;
  content: string;
  timestamp: number;
  readBy: string[];
  blockchainHash?: string;
}

// Mock blockchain implementation for demo purposes
// In a real application, this would integrate with Ethereum, Solana, or another blockchain
class BlockchainService {
  private messages: Message[] = [];
  private localStorageKey = 'blockchain_messages';
  
  constructor() {
    // Load messages from localStorage on init
    this.loadMessages();
  }
  
  private loadMessages(): void {
    const storedMessages = localStorage.getItem(this.localStorageKey);
    if (storedMessages) {
      this.messages = JSON.parse(storedMessages);
    }
  }
  
  private saveMessages(): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.messages));
  }
  
  // Simulate sending a message to the blockchain
  async sendMessage(message: Omit<Message, 'id' | 'timestamp' | 'blockchainHash' | 'readBy'>): Promise<Message> {
    // Create a new message with required fields
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      readBy: [message.sender],
      blockchainHash: this.generateFakeHash(),
    };
    
    try {
      // Simulate blockchain transaction delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Add to our local store
      this.messages.push(newMessage);
      this.saveMessages();
      
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
      this.saveMessages();
    }
  }
  
  // Generate a fake blockchain transaction hash
  private generateFakeHash(): string {
    return '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}

// Create a singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;
