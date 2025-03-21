
import { toast } from 'sonner';
import { User } from '../constants';

export const useUserProfile = (
  currentUser: User | null,
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>
) => {
  const updateUserProfile = (userData: { name?: string, avatarUrl?: string }) => {
    if (!currentUser) return;
    
    const updatedUser = {
      ...currentUser,
      name: userData.name || currentUser.name,
      avatarUrl: userData.avatarUrl || currentUser.avatarUrl
    };
    
    // Update current user state
    setCurrentUser(updatedUser);
    
    // Store in localStorage for persistence
    if (localStorage.getItem('financeCurrentUser')) {
      localStorage.setItem('financeCurrentUser', JSON.stringify(updatedUser));
    }
    
    // Store in users collection for future logins
    const savedUsers = localStorage.getItem('financeUsers');
    const storedUsers = savedUsers ? JSON.parse(savedUsers) : {};
    
    storedUsers[currentUser.id] = updatedUser;
    localStorage.setItem('financeUsers', JSON.stringify(storedUsers));
    
    toast.success('Perfil atualizado com sucesso');
  };

  return {
    updateUserProfile
  };
};
