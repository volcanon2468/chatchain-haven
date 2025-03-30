
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

// Define user type
export type User = {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  walletAddress: string;
  status?: string;
};

export interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
}
