
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
    const savedUsers = localStorage.getItem('financeUsers');
    const storedUsers = savedUsers ? JSON.parse(savedUsers) : {};
    
    // Get the base user from predefined users
    const baseUser = predefinedUsers.find(u => u.id === userId);
    
    // Check if we have a stored version with profile updates
    const storedUser = storedUsers[userId];
    
    // Use the stored user if available, otherwise use the base user
    const user = storedUser || baseUser;
    
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
