
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFinance } from '@/context/FinanceContext';
import { useConfig } from '@/context/ConfigContext';
import { CurrencyType, currencySymbols } from '@/utils/currencyUtils';
import { 
  ArrowLeft, 
  User,
  Users,
  LogOut,
  Upload,
  Mail,
  Building,
  DollarSign,
  Euro,
  Landmark
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  
  const {
    currency,
    setCurrency,
    companyInfo,
    updateCompanyInfo,
    projectionTimeUnit,
    setProjectionTimeUnit,
    projectionTimeAmount,
    setProjectionTimeAmount
  } = useConfig();
  
  const navigate = useNavigate();
  
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  
  const [contactEmail, setContactEmail] = useState(companyInfo.contactEmail);
  const [companyName, setCompanyName] = useState(companyInfo.name);
  const [companyDescription, setCompanyDescription] = useState(companyInfo.description);
  
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setUserName(currentUser.name || '');
    setAvatarUrl(currentUser.avatarUrl || '');
    setContactEmail(companyInfo.contactEmail);
    setCompanyName(companyInfo.name);
    setCompanyDescription(companyInfo.description);
  }, [currentUser, navigate, companyInfo]);
  
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
      
      // If there's no new file to upload, reload the profile information
      if (currentUser.id) {
        await selectProfile(currentUser.id);
      }
      
      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handleSaveCompanyInfo = () => {
    updateCompanyInfo({
      name: companyName,
      contactEmail: contactEmail,
      description: companyDescription
    });
    toast.success('Informações da empresa atualizadas com sucesso');
  };

  const handleChangeCurrency = (value: string) => {
    setCurrency(value as CurrencyType);
    toast.success(`Moeda alterada para ${currencySymbols[value as CurrencyType]}`);
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
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="company">Empresa</TabsTrigger>
            <TabsTrigger value="app">Aplicativo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
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
                
                {otherUsers.length > 0 && (
                  <div className="border-t border-finance-dark-lighter mt-4 pt-4">
                    <h3 className="text-white font-medium mb-2 flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Alternar Usuário
                    </h3>
                    <div className="space-y-2">
                      {otherUsers.map(user => (
                        <Button 
                          key={user.id} 
                          variant="outline" 
                          className="w-full flex items-center justify-between border-finance-dark-lighter text-white hover:bg-finance-dark-lighter"
                          onClick={() => handleSwitchUser(user.id)}
                        >
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              {user.avatarUrl ? (
                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                              ) : (
                                <AvatarFallback className="bg-gray-700 text-white text-xs">
                                  {user.name ? user.name.substring(0, 1).toUpperCase() : 'U'}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <span>{user.name}</span>
                          </div>
                          <User size={16} />
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="border-t border-finance-dark-lighter mt-4 pt-4">
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
          </TabsContent>
          
          <TabsContent value="company">
            <Card className="finance-card p-6">
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <Building className="mr-2 h-5 w-5 text-finance-blue" />
                  <h2 className="text-white text-lg font-medium">Informações da Empresa</h2>
                </div>
                
                <div>
                  <Label htmlFor="companyName" className="text-white">Nome da Empresa</Label>
                  <Input 
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="finance-input mt-1"
                    placeholder="Nome da empresa"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contactEmail" className="text-white">Email de Contato</Label>
                  <Input 
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="finance-input mt-1"
                    placeholder="email@empresa.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="companyDescription" className="text-white">Sobre a Empresa</Label>
                  <Textarea 
                    id="companyDescription"
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    className="finance-input mt-1 h-24 resize-none"
                    placeholder="Descreva sua empresa..."
                  />
                </div>
                
                <Button 
                  onClick={handleSaveCompanyInfo}
                  className="w-full finance-btn mt-4"
                >
                  Salvar Informações
                </Button>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="app">
            <Card className="finance-card p-6">
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <Landmark className="mr-2 h-5 w-5 text-finance-blue" />
                  <h2 className="text-white text-lg font-medium">Configurações do Aplicativo</h2>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-white flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Moeda
                  </Label>
                  <Select value={currency} onValueChange={handleChangeCurrency}>
                    <SelectTrigger className="finance-input">
                      <SelectValue placeholder="Selecione a moeda" />
                    </SelectTrigger>
                    <SelectContent className="bg-finance-dark-card border-finance-dark-lighter">
                      <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                      <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-gray-400 text-xs mt-1">Esta configuração afeta como os valores são exibidos no aplicativo.</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Período de Projeção
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={projectionTimeAmount}
                      onChange={(e) => setProjectionTimeAmount(parseInt(e.target.value) || 1)}
                      className="finance-input w-1/3"
                    />
                    <Select 
                      value={projectionTimeUnit} 
                      onValueChange={(value) => setProjectionTimeUnit(value as 'days' | 'weeks' | 'months' | 'years')}
                      className="w-2/3"
                    >
                      <SelectTrigger className="finance-input">
                        <SelectValue placeholder="Unidade de tempo" />
                      </SelectTrigger>
                      <SelectContent className="bg-finance-dark-card border-finance-dark-lighter">
                        <SelectItem value="days">Dias</SelectItem>
                        <SelectItem value="weeks">Semanas</SelectItem>
                        <SelectItem value="months">Meses</SelectItem>
                        <SelectItem value="years">Anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">Define o período padrão para projeções financeiras.</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
