
import { toast } from 'sonner';
import { User } from '../constants';
import { supabase } from '@/integrations/supabase/client';

export const useUserProfile = (
  currentUser: User | null,
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>
) => {
  const updateUserProfile = async (userData: { name?: string, avatarUrl?: string }) => {
    if (!currentUser) return;
    
    try {
      // Get the current Supabase authentication session
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      
      const updatedUser = {
        ...currentUser,
        name: userData.name || currentUser.name,
        avatarUrl: userData.avatarUrl || currentUser.avatarUrl
      };
      
      // Update user profile in Supabase
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: currentUser.id,
          auth_id: sessionData.session.user.id,
          name: updatedUser.name,
          avatar_url: updatedUser.avatarUrl
        });
      
      if (error) {
        console.error('Error updating profile in Supabase:', error);
        toast.error('Erro ao atualizar perfil no banco de dados');
        return;
      }
      
      // Update current user state
      setCurrentUser(updatedUser);
      
      // Store in localStorage for persistence
      if (localStorage.getItem('financeCurrentUser')) {
        localStorage.setItem('financeCurrentUser', JSON.stringify(updatedUser));
      }
      
      // Store in users collection for future logins
      const savedUsers = localStorage.getItem('financeUsers');
      if (savedUsers) {
        const storedUsers = JSON.parse(savedUsers);
        
        storedUsers[currentUser.id] = updatedUser;
        localStorage.setItem('financeUsers', JSON.stringify(storedUsers));
      }
      
      // Update selected profile in localStorage
      localStorage.setItem('selectedFinanceProfile', currentUser.id);
      
      toast.success('Perfil atualizado com sucesso');
      
      // Retornar o usuário atualizado para uso na aplicação
      return updatedUser;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      toast.error('Erro ao atualizar perfil');
    }
  };

  return {
    updateUserProfile
  };
};
