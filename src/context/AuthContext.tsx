
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

// Define user type
export type User = {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  walletAddress: string;
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for existing session on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get user from localStorage (in a real app, verify this with a backend)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // In a production app, these would communicate with a secure backend
  // For this demo, we're using localStorage to simulate persistence
  
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call and blockchain wallet creation/retrieval
      // In production, this would verify credentials against a database and get the user's wallet
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // Demo users for testing
      if (username === 'demo' && password === 'password') {
        const demoUser: User = {
          id: '1',
          username: 'demo',
          displayName: 'Demo User',
          walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        };
        
        localStorage.setItem('user', JSON.stringify(demoUser));
        setUser(demoUser);
        toast({
          title: "Login successful",
          description: `Welcome back, ${demoUser.displayName}!`,
        });
        return true;
      }
      
      // Check if this user exists in our "database" (localStorage)
      const usersJson = localStorage.getItem('users');
      const users: Record<string, User & { password: string }> = usersJson ? JSON.parse(usersJson) : {};
      
      const userRecord = Object.values(users).find(u => u.username === username);
      if (userRecord && userRecord.password === password) {
        const { password: _, ...userData } = userRecord;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        toast({
          title: "Login successful",
          description: `Welcome back, ${userData.displayName}!`,
        });
        return true;
      }
      
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const register = async (username: string, password: string, displayName: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // Check if username is already taken
      const usersJson = localStorage.getItem('users');
      const users: Record<string, User & { password: string }> = usersJson ? JSON.parse(usersJson) : {};
      
      if (Object.values(users).some(u => u.username === username)) {
        toast({
          title: "Registration failed",
          description: "Username already exists",
          variant: "destructive",
        });
        return false;
      }
      
      // Create new user with a simulated wallet address
      const randomWallet = '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      const newUser: User & { password: string } = {
        id: Date.now().toString(),
        username,
        password,
        displayName,
        walletAddress: randomWallet,
      };
      
      // Save to "database"
      users[newUser.id] = newUser;
      localStorage.setItem('users', JSON.stringify(users));
      
      // Auto login after registration
      const { password: _, ...userData } = newUser;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      toast({
        title: "Registration successful",
        description: `Welcome to ChatChain Haven, ${displayName}!`,
      });
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };
  
  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const updatedUser = { ...user, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Also update in the users "database"
      const usersJson = localStorage.getItem('users');
      if (usersJson) {
        const users: Record<string, User & { password: string }> = JSON.parse(usersJson);
        if (users[user.id]) {
          users[user.id] = { ...users[user.id], ...data };
          localStorage.setItem('users', JSON.stringify(users));
        }
      }
      
      setUser(updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      register, 
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
