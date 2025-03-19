
import { useState, useEffect } from 'react';
import { User, predefinedUsers } from '../constants';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('financeCurrentUser');
    
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    setLoading(false);
  }, []);

  const login = (userId: string, remember: boolean) => {
    const user = predefinedUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      if (remember) {
        localStorage.setItem('financeCurrentUser', JSON.stringify(user));
      }
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('financeCurrentUser');
  };

  return {
    currentUser,
    setCurrentUser,
    loading,
    login,
    logout,
    users: predefinedUsers
  };
};
