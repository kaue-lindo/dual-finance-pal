
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinance } from '@/context/FinanceContext';
import { ArrowLeft, Home, ShoppingCart, DollarSign, BarChart3, Upload, Receipt } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { currentUser, logout, updateUserProfile } = useFinance();
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
  
  const handleSaveProfile = () => {
    if (!currentUser) return;
    
    // In a real app, we would upload the file to storage
    // For this demo, we'll just use the file name or existing avatar
    const newAvatar = fileUpload 
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`
      : avatarUrl;
    
    updateUserProfile({
      name: userName,
      avatarUrl: newAvatar
    });
    
    toast.success('Perfil atualizado com sucesso');
  };
  
  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Configurações</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="mt-6 px-4">
        <Card className="finance-card">
          <div className="flex flex-col items-center mb-6">
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
          
          <div className="space-y-4">
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

      {/* Fixed navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-finance-dark-card py-3 flex justify-around items-center">
        <button className="navbar-icon" onClick={() => navigate('/dashboard')}>
          <Home className="w-6 h-6 text-white" />
        </button>
        <button className="navbar-icon" onClick={() => navigate('/expenses')}>
          <ShoppingCart className="w-6 h-6 text-white" />
        </button>
        <div className="-mt-8">
          <button 
            className="w-12 h-12 rounded-full bg-finance-blue flex items-center justify-center"
            onClick={() => navigate('/add-income')}
          >
            <DollarSign className="w-6 h-6 text-white" />
          </button>
        </div>
        <button className="navbar-icon" onClick={() => navigate('/investments')}>
          <BarChart3 className="w-6 h-6 text-white" />
        </button>
        <button className="navbar-icon" onClick={() => navigate('/all-transactions')}>
          <Receipt className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

export default Settings;
