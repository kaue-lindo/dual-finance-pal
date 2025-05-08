
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Globe, Smartphone, Camera, Building, Info, CreditCard, ShieldCheck, HelpCircle, LogOut } from 'lucide-react';
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

const Settings = () => {
  const navigate = useNavigate();
  const { currentUser, updateUserProfile, logout } = useFinance();
  const { 
    currency, 
    setCurrency, 
    companyInfo
  } = useConfig();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>(currency);
  
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setPhoto(currentUser.photo || '');
    }
  }, [currentUser]);
  
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    try {
      await updateUserProfile({
        name,
        phone,
        photo
      });
      
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    }
  };
  
  const handleSaveAppSettings = () => {
    setCurrency(selectedCurrency);
    toast.success('Configurações salvas com sucesso!');
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
  
  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-finance-blue to-purple-600 rounded-b-xl p-4">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Configurações</h1>
          <div className="w-10"></div>
        </div>
        
        {/* User info summary */}
        <div className="mt-4 flex items-center gap-4 pb-2">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30">
            {photo ? (
              <img src={photo} alt={name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{name || 'Usuário'}</h2>
            <p className="text-white/80 text-sm">{email}</p>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4 bg-finance-dark-card">
            <TabsTrigger value="profile" className="data-[state=active]:bg-finance-blue">
              <User className="w-4 h-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="company" className="data-[state=active]:bg-finance-blue">
              <Building className="w-4 h-4 mr-2" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="app" className="data-[state=active]:bg-finance-blue">
              <CreditCard className="w-4 h-4 mr-2" />
              App
            </TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-gradient-to-br from-finance-dark-card to-finance-dark-lighter border-none p-4 mb-4">
              <h2 className="text-lg font-semibold text-white mb-4">Informações Pessoais</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-1">Nome</label>
                  <div className="flex">
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="finance-input"
                      placeholder="Seu nome"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-1">Email</label>
                  <div className="flex">
                    <Input 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="finance-input"
                      placeholder="exemplo@email.com"
                      type="email"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email não pode ser alterado</p>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-1">Telefone</label>
                  <div className="flex">
                    <Input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      className="finance-input"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-1">URL da Foto</label>
                  <div className="flex">
                    <Input 
                      value={photo} 
                      onChange={(e) => setPhoto(e.target.value)} 
                      className="finance-input"
                      placeholder="https://exemplo.com/foto.jpg"
                    />
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-finance-blue to-purple-500 hover:opacity-90"
                  onClick={handleSaveProfile}
                >
                  Salvar Perfil
                </Button>

                <div className="pt-4 border-t border-finance-dark-lighter/30 mt-4">
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair da conta
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          {/* Company Tab - Now read-only */}
          <TabsContent value="company">
            <Card className="bg-gradient-to-br from-finance-dark-card to-finance-dark-lighter border-none p-4 mb-4">
              <h2 className="text-lg font-semibold text-white mb-4">Informações da Empresa</h2>
              
              <div className="space-y-4">
                <div className="bg-finance-dark-lighter/50 rounded-md p-4 border border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <Building className="w-5 h-5 text-finance-blue" />
                    <h3 className="text-sm font-medium text-white">{companyInfo.name}</h3>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4 text-sm text-gray-300">
                    <Mail className="w-4 h-4 text-finance-blue" />
                    <span>{companyInfo.contactEmail}</span>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-white mb-2">Sobre a Empresa</h3>
                    <p className="text-sm text-gray-300">{companyInfo.description}</p>
                  </div>
                  
                  <h3 className="text-sm font-medium text-white mb-3">Sobre nós</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    A Dual Finance é uma plataforma inovadora de gestão financeira fundada em 2024. 
                    Nossa missão é tornar o controle financeiro acessível e eficiente para todos.
                  </p>
                  <p className="text-sm text-gray-300 mb-3">
                    Oferecemos ferramentas intuitivas para rastreamento de despesas, gestão de receitas 
                    e análise de investimentos, ajudando nossos usuários a tomar decisões financeiras inteligentes.
                  </p>
                  <p className="text-sm text-gray-300 mb-3">
                    Nossa equipe de especialistas combina conhecimento em finanças pessoais e tecnologia 
                    para criar soluções que simplificam a vida financeira dos nossos clientes.
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <ShieldCheck className="w-4 h-4 text-finance-blue" />
                    <p className="text-xs text-gray-400">
                      Seus dados estão protegidos com a mais alta tecnologia de segurança.
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                    © 2024 Dual Finance. Todos os direitos reservados.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          {/* App Tab */}
          <TabsContent value="app">
            <Card className="bg-gradient-to-br from-finance-dark-card to-finance-dark-lighter border-none p-4 mb-4">
              <h2 className="text-lg font-semibold text-white mb-4">Configurações do Aplicativo</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Moeda</label>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {(['BRL', 'USD', 'EUR'] as CurrencyType[]).map((currencyOption) => (
                      <div
                        key={currencyOption}
                        className={`rounded-lg p-3 cursor-pointer transition-all flex flex-col items-center justify-center ${
                          selectedCurrency === currencyOption 
                            ? 'bg-finance-blue/20 border-2 border-finance-blue' 
                            : 'bg-finance-dark-card border border-finance-dark-lighter/40'
                        }`}
                        onClick={() => setSelectedCurrency(currencyOption)}
                      >
                        <span className="text-lg font-bold text-white mb-1">
                          {currencySymbolMap[currencyOption]}
                        </span>
                        <span className="text-xs text-gray-400">
                          {currencyOption === 'BRL' ? 'Real' : currencyOption === 'USD' ? 'Dólar' : 'Euro'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-finance-dark-lighter/50 rounded-md p-4 border border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <HelpCircle className="w-5 h-5 text-finance-blue" />
                    <h3 className="text-sm font-medium text-white">Precisa de ajuda?</h3>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-3">
                    Entre em contato com nosso suporte para dúvidas ou problemas com o aplicativo.
                  </p>
                  
                  <div className="flex flex-col space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Mail className="w-4 h-4 text-finance-blue" /> 
                      suporte@dualfinance.com
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Globe className="w-4 h-4 text-finance-blue" /> 
                      www.dualfinance.com
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-finance-blue to-purple-500 hover:opacity-90"
                  onClick={handleSaveAppSettings}
                >
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
