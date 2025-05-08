
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Globe, Smartphone, Camera, Building, Info, CreditCard, ShieldCheck, HelpCircle, LogOut, Check, Sun, Moon, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useFinance } from '@/context/FinanceContext';
import { useConfig } from '@/context/ConfigContext';
import { CurrencyType } from '@/utils/currencyUtils';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BottomNav from '@/components/ui/bottom-nav';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Settings = () => {
  const navigate = useNavigate();
  const { currentUser, updateUserProfile, logout } = useFinance();
  const { 
    currency, 
    setCurrency, 
    companyInfo,
    theme,
    setTheme
  } = useConfig();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>(currency);
  const [isProfileUpdated, setIsProfileUpdated] = useState(false);
  const [isSettingsUpdated, setIsSettingsUpdated] = useState(false);
  
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setPhoto(currentUser.photo || '');
    }
  }, [currentUser]);

  useEffect(() => {
    setIsProfileUpdated(
      (currentUser?.name !== name && name !== '') ||
      (currentUser?.phone !== phone && phone !== '') ||
      (currentUser?.photo !== photo && photo !== '')
    );
  }, [name, phone, photo, currentUser]);

  useEffect(() => {
    setIsSettingsUpdated(selectedCurrency !== currency);
  }, [selectedCurrency, currency]);
  
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    try {
      await updateUserProfile({
        name,
        phone,
        photo
      });
      
      toast.success('Perfil atualizado com sucesso!');
      setIsProfileUpdated(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    }
  };
  
  const handleSaveAppSettings = () => {
    setCurrency(selectedCurrency);
    toast.success('Configurações salvas com sucesso!');
    setIsSettingsUpdated(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Erro ao fazer logout');
    }
  };
  
  if (!currentUser) {
    navigate('/login');
    return null;
  }
  
  const currencySymbolMap: Record<CurrencyType, string> = {
    BRL: 'R$',
    USD: '$',
    EUR: '€'
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-finance-blue via-purple-600 to-finance-blue rounded-b-xl p-4">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Configurações</h1>
          <div className="w-10"></div>
        </div>
        
        {/* User info summary */}
        <div className="mt-4 flex items-center gap-4 pb-6">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-lg">
            {photo ? (
              <img src={photo} alt={name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-white font-bold text-xl">{name || 'Usuário'}</h2>
            <p className="text-white/80 text-sm">{email}</p>
            <div className="mt-2 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <p className="text-white/80 text-xs">Online</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4 bg-gradient-to-r from-finance-dark-card via-finance-dark-lighter to-finance-dark-card rounded-lg p-1">
            <TabsTrigger 
              value="profile" 
              className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-finance-blue data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <User className="w-4 h-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger 
              value="company"
              className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-finance-blue data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <Building className="w-4 h-4 mr-2" />
              Empresa
            </TabsTrigger>
            <TabsTrigger 
              value="app"
              className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-finance-blue data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              App
            </TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-gradient-to-br from-finance-dark-card to-finance-dark-lighter border-none p-6 mb-4 rounded-xl shadow-lg">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-finance-blue" />
                Informações Pessoais
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-gray-300 mb-1 text-sm font-medium">Nome</label>
                  <div className="flex">
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="finance-input bg-finance-dark-lighter/50 border-finance-dark-lighter focus:border-finance-blue transition-all"
                      placeholder="Seu nome"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-1 text-sm font-medium">Email</label>
                  <div className="flex">
                    <Input 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="finance-input bg-finance-dark-lighter/50 border-finance-dark-lighter opacity-70"
                      placeholder="exemplo@email.com"
                      type="email"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email não pode ser alterado</p>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-1 text-sm font-medium">Telefone</label>
                  <div className="flex">
                    <Input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      className="finance-input bg-finance-dark-lighter/50 border-finance-dark-lighter focus:border-finance-blue transition-all"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-1 text-sm font-medium">URL da Foto</label>
                  <div className="flex">
                    <Input 
                      value={photo} 
                      onChange={(e) => setPhoto(e.target.value)} 
                      className="finance-input bg-finance-dark-lighter/50 border-finance-dark-lighter focus:border-finance-blue transition-all"
                      placeholder="https://exemplo.com/foto.jpg"
                    />
                  </div>
                </div>
                
                <Button 
                  className={cn(
                    "w-full rounded-lg transition-all",
                    isProfileUpdated 
                      ? "bg-gradient-to-r from-finance-blue to-purple-600 hover:opacity-90" 
                      : "bg-gray-700 cursor-not-allowed"
                  )}
                  disabled={!isProfileUpdated}
                  onClick={handleSaveProfile}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Salvar Perfil
                </Button>

                <div className="pt-4 border-t border-finance-dark-lighter/30 mt-4">
                  <Button 
                    variant="destructive" 
                    className="w-full rounded-lg"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair da conta
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          {/* Company Tab - Now read-only with improved design */}
          <TabsContent value="company">
            <Card className="bg-gradient-to-br from-finance-dark-card to-finance-dark-lighter border-none p-6 mb-4 rounded-xl shadow-lg">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
                <Building className="w-5 h-5 mr-2 text-finance-blue" />
                Informações da Empresa
              </h2>
              
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-finance-dark-lighter to-finance-dark-card rounded-xl p-5 border border-white/5 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-finance-blue to-purple-600 rounded-xl flex items-center justify-center">
                      <Building className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{companyInfo.name}</h3>
                      <p className="text-sm text-gray-300">Fundada em {companyInfo.foundingYear}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-finance-dark-card rounded-full flex items-center justify-center">
                        <Mail className="w-4 h-4 text-finance-blue" />
                      </div>
                      <span className="text-sm text-gray-300">{companyInfo.contactEmail}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-finance-dark-card rounded-full flex items-center justify-center">
                        <Globe className="w-4 h-4 text-finance-blue" />
                      </div>
                      <span className="text-sm text-gray-300">{companyInfo.website}</span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-white mb-3 flex items-center">
                      <Info className="w-4 h-4 mr-2 text-finance-blue" />
                      Sobre a Empresa
                    </h3>
                    <div className="bg-finance-dark-card/50 rounded-lg p-4 border border-finance-dark-lighter/30">
                      <p className="text-sm text-gray-300 leading-relaxed">{companyInfo.description}</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-white mb-3 flex items-center">
                      <Info className="w-4 h-4 mr-2 text-finance-blue" />
                      Nossa Missão
                    </h3>
                    <div className="bg-finance-dark-card/50 rounded-lg p-4 border border-finance-dark-lighter/30">
                      <p className="text-sm text-gray-300 leading-relaxed">{companyInfo.mission}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-6 bg-finance-dark-card/70 p-3 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-finance-blue" />
                    <p className="text-xs text-gray-400">
                      Seus dados estão protegidos com a mais alta tecnologia de segurança.
                    </p>
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-4 text-center">
                    © {new Date().getFullYear()} {companyInfo.name}. Todos os direitos reservados.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          {/* App Tab - Improved design */}
          <TabsContent value="app">
            <Card className="bg-gradient-to-br from-finance-dark-card to-finance-dark-lighter border-none p-6 mb-4 rounded-xl shadow-lg">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-finance-blue" />
                Configurações do Aplicativo
              </h2>
              
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-finance-dark-lighter to-finance-dark-card rounded-xl p-5 border border-white/5 shadow-lg">
                  <h3 className="text-md font-medium text-white mb-4 flex items-center">
                    <Palette className="w-5 h-5 mr-2 text-finance-blue" />
                    Preferências
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-gray-300 mb-3 text-sm">Moeda</label>
                      
                      <div className="grid grid-cols-3 gap-3">
                        {(['BRL', 'USD', 'EUR'] as CurrencyType[]).map((currencyOption) => (
                          <div
                            key={currencyOption}
                            className={`rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center ${
                              selectedCurrency === currencyOption 
                                ? 'bg-gradient-to-br from-finance-blue/30 to-purple-600/30 border-2 border-finance-blue shadow-lg' 
                                : 'bg-finance-dark-card border border-finance-dark-lighter/40 hover:bg-finance-dark-lighter/50'
                            }`}
                            onClick={() => setSelectedCurrency(currencyOption)}
                          >
                            <span className="text-2xl font-bold text-white mb-2">
                              {currencySymbolMap[currencyOption]}
                            </span>
                            <span className="text-xs text-gray-400">
                              {currencyOption === 'BRL' ? 'Real' : currencyOption === 'USD' ? 'Dólar' : 'Euro'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="py-4 border-t border-finance-dark-lighter/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {theme === 'dark' ? (
                            <Moon className="w-5 h-5 text-gray-300" />
                          ) : (
                            <Sun className="w-5 h-5 text-yellow-400" />
                          )}
                          <span className="text-sm text-gray-300">Tema {theme === 'dark' ? 'Escuro' : 'Claro'}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full h-9 w-9 p-0 border-finance-dark-lighter"
                          onClick={toggleTheme}
                        >
                          {theme === 'dark' ? (
                            <Sun className="h-4 w-4 text-yellow-400" />
                          ) : (
                            <Moon className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-finance-dark-lighter to-finance-dark-card rounded-xl p-5 border border-white/5 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <HelpCircle className="w-5 h-5 text-finance-blue" />
                    <h3 className="text-md font-medium text-white">Precisa de ajuda?</h3>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                    Entre em contato com nosso suporte para dúvidas ou problemas com o aplicativo.
                    Nossa equipe estará à disposição para ajudar com o que for necessário.
                  </p>
                  
                  <div className="flex flex-col space-y-3 mt-4">
                    <div className="flex items-center gap-3 bg-finance-dark-card/50 p-3 rounded-lg">
                      <Mail className="w-4 h-4 text-finance-blue" /> 
                      <span className="text-sm text-gray-300">suporte@dualfinance.com</span>
                    </div>
                    <div className="flex items-center gap-3 bg-finance-dark-card/50 p-3 rounded-lg">
                      <Globe className="w-4 h-4 text-finance-blue" /> 
                      <span className="text-sm text-gray-300">www.dualfinance.com</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className={cn(
                    "w-full rounded-lg transition-all",
                    isSettingsUpdated 
                      ? "bg-gradient-to-r from-finance-blue to-purple-600 hover:opacity-90" 
                      : "bg-gray-700 cursor-not-allowed"
                  )}
                  disabled={!isSettingsUpdated}
                  onClick={handleSaveAppSettings}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </Button>
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
