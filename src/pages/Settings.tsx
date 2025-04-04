
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinance } from '@/context/FinanceContext';
import { 
  ArrowLeft, 
  User,
  Users,
  LogOut,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BottomNav from "@/components/ui/bottom-nav";

const Settings = () => {
  const { 
    currentUser, 
    logout, 
    updateUserProfile, 
    users,
    selectProfile,
    supabaseUser
  } = useFinance();
  const navigate = useNavigate();
  
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setUserName(currentUser.name || '');
    setAvatarUrl(currentUser.avatarUrl || '');
  }, [currentUser, navigate]);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileUpload(e.target.files[0]);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(e.target.files[0]);
      setAvatarUrl(previewUrl);
    }
  };
  
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    try {
      // In a real app, we would upload the file to storage
      // For this demo, we'll just use the file name or existing avatar
      const newAvatar = fileUpload 
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`
        : avatarUrl;
      
      await updateUserProfile({
        name: userName,
        avatarUrl: newAvatar
      });
      
      // Se não houver um novo arquivo para upload, recarregue as informações do perfil
      if (currentUser.id) {
        await selectProfile(currentUser.id);
      }
      
      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    }
  };

  const otherUsers = users.filter(user => user.id !== currentUser?.id);
  
  const handleSwitchUser = async (userId: string) => {
    await selectProfile(userId);
    toast.success('Perfil alterado com sucesso');
  };
  
  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center p-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Configurações</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer">
                <Avatar>
                  {currentUser?.avatarUrl ? (
                    <AvatarImage 
                      src={currentUser.avatarUrl} 
                      alt={currentUser.name} 
                    />
                  ) : (
                    <AvatarFallback className="bg-gray-700 text-white">
                      {currentUser?.name ? currentUser.name.substring(0, 1).toUpperCase() : 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-finance-dark-card border-finance-dark-lighter">
              {otherUsers.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-white">Trocar de Usuário</DropdownMenuLabel>
                  {otherUsers.map(user => (
                    <DropdownMenuItem 
                      key={user.id}
                      className="text-white hover:bg-finance-dark-lighter cursor-pointer"
                      onClick={() => handleSwitchUser(user.id)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      {user.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-gray-700" />
                </>
              )}
              <DropdownMenuItem 
                className="text-red-500 hover:bg-finance-dark-lighter cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair da Conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-6 px-4">
        <Card className="finance-card">
          <div className="flex flex-col items-center mb-6 p-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-finance-dark-lighter mb-2">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar do usuário" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                    {userName.substring(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 bg-finance-blue text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              >
                <Upload size={16} />
              </label>
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
            <h2 className="text-white font-medium mt-2">{currentUser?.name || 'Usuário'}</h2>
            <p className="text-gray-400 text-sm">{currentUser?.email || 'Email não disponível'}</p>
          </div>
          
          <div className="space-y-4 p-6">
            <div>
              <Label htmlFor="userName" className="text-white">Nome de Usuário</Label>
              <Input 
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="finance-input mt-1"
                placeholder="Seu nome"
              />
            </div>
            
            <Button 
              onClick={handleSaveProfile}
              className="w-full finance-btn mt-4"
            >
              Salvar Alterações
            </Button>
            
            <div className="border-t border-finance-dark-lighter my-4 pt-4">
              <Button 
                variant="outline" 
                className="w-full border-red-500 text-red-500 hover:bg-red-500/10"
                onClick={handleLogout}
              >
                Sair da Conta
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
