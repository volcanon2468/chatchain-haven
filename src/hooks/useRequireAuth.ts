
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User } from '@/context/AuthContext';

export const useRequireAuth = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || '';
  };

  const userInitials = user ? getInitials(user.displayName) : '';

  return { user, userInitials, logout };
};
