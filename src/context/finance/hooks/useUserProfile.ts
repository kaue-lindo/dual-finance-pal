
import { toast } from 'sonner';
import { User } from '../constants';
import { supabase } from '@/integrations/supabase/client';

export const useUserProfile = (
  currentUser: User | null,
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>
) => {
  const updateUserProfile = async (userData: { name?: string, avatarUrl?: string, phone?: string, photo?: string }) => {
    if (!currentUser) return currentUser as User;
    
    try {
      // Get the current Supabase authentication session
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return currentUser;
      }
      
      const updatedUser = {
        ...currentUser,
        name: userData.name || currentUser.name,
        avatarUrl: userData.avatarUrl || currentUser.avatarUrl,
        phone: userData.phone || currentUser.phone,
        photo: userData.photo || currentUser.photo
      };
      
      // Update user profile in Supabase with improved logging
      console.log('Updating user profile with data:', {
        user_id: currentUser.id,
        auth_id: sessionData.session.user.id,
        name: updatedUser.name,
        avatar_url: updatedUser.avatarUrl,
        phone: updatedUser.phone,
        photo: updatedUser.photo
      });
      
      // Fix: Using upsert with proper conflict handling and proper column names
      const { error, data } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: currentUser.id,
          auth_id: sessionData.session.user.id,
          name: updatedUser.name,
          avatar_url: updatedUser.avatarUrl,
          phone: updatedUser.phone,
          photo: updatedUser.photo
        }, {
          onConflict: 'user_id'
        })
        .select();
      
      if (error) {
        console.error('Error updating profile in Supabase:', error);
        toast.error('Erro ao atualizar perfil no banco de dados');
        return currentUser;
      }
      
      console.log('Profile updated successfully in Supabase:', data);
      
      // Update current user state
      setCurrentUser(updatedUser);
      
      // Store in localStorage for persistence
      if (localStorage.getItem('financeCurrentUser')) {
        localStorage.setItem('financeCurrentUser', JSON.stringify(updatedUser));
      }
      
      // Update stored users collection
      const savedUsers = localStorage.getItem('financeUsers');
      if (savedUsers) {
        try {
          const storedUsers = JSON.parse(savedUsers);
          if (typeof storedUsers === 'object') {
            // Check if it's an array (old format) or object (new format)
            if (Array.isArray(storedUsers)) {
              // Old format: array of users
              const updatedUsers = storedUsers.map(user => 
                user.id === currentUser.id ? updatedUser : user
              );
              localStorage.setItem('financeUsers', JSON.stringify(updatedUsers));
            } else {
              // New format: object with user IDs as keys
              storedUsers[currentUser.id] = updatedUser;
              localStorage.setItem('financeUsers', JSON.stringify(storedUsers));
            }
          }
        } catch (e) {
          console.error('Error updating users in localStorage:', e);
        }
      }
      
      // Update selected profile in localStorage
      localStorage.setItem('selectedFinanceProfile', currentUser.id);
      
      toast.success('Perfil atualizado com sucesso');
      
      return updatedUser;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      toast.error('Erro ao atualizar perfil');
      return currentUser;
    }
  };

  return {
    updateUserProfile
  };
};
