
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
    
    setCurrentUser(updatedUser);
    
    if (localStorage.getItem('financeCurrentUser')) {
      localStorage.setItem('financeCurrentUser', JSON.stringify(updatedUser));
    }
    
    toast.success('Perfil atualizado com sucesso');
  };

  return {
    updateUserProfile
  };
};
