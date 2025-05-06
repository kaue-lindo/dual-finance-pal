
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Globe, Smartphone, Camera, Building, Info, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  const { currentUser, updateUserProfile } = useFinance();
  const { 
    currency, 
    setCurrency, 
    companyInfo, 
    updateCompanyInfo 
  } = useConfig();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>(currency);
  
  // Company information
  const [companyName, setCompanyName] = useState(companyInfo.name);
  const [companyEmail, setCompanyEmail] = useState(companyInfo.contactEmail);
  const [companyDescription, setCompanyDescription] = useState(companyInfo.description);
  
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
  
  const handleSaveCompanyInfo = () => {
    updateCompanyInfo({
      name: companyName,
      contactEmail: companyEmail,
      description: companyDescription
    });
    
    toast.success('Informações da empresa atualizadas!');
  };
  
  const handleSaveAppSettings = () => {
    setCurrency(selectedCurrency);
    toast.success('Configurações salvas com sucesso!');
  };
  
  if (!currentUser) {
    navigate('/login');
    return null;
  }
  
  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      <div className="finance-card rounded-b-xl p-4">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Configurações</h1>
          <div className="w-10"></div>
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
          
          <TabsContent value="profile">
            <Card className="bg-finance-dark-card p-4 mb-4">
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
                  className="w-full bg-finance-blue hover:bg-finance-blue/80"
                  onClick={handleSaveProfile}
                >
                  Salvar Perfil
                </Button>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="company">
            <Card className="bg-finance-dark-card p-4 mb-4">
              <h2 className="text-lg font-semibold text-white mb-4">Informações da Empresa</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-1">Nome da Empresa</label>
                  <div className="flex">
                    <Input 
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)} 
                      className="finance-input"
                      placeholder="Nome da empresa"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-1">Email de Contato</label>
                  <div className="flex">
                    <Input 
                      value={companyEmail} 
                      onChange={(e) => setCompanyEmail(e.target.value)} 
                      className="finance-input"
                      placeholder="contato@empresa.com"
                      type="email"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-1">Sobre a Dual Finance</label>
                  <div className="flex">
                    <Textarea 
                      value={companyDescription} 
                      onChange={(e) => setCompanyDescription(e.target.value)} 
                      className="finance-input min-h-[100px]"
                      placeholder="Descreva sua empresa"
                    />
                  </div>
                </div>
                
                <div className="bg-finance-dark-lighter rounded-md p-3">
                  <h3 className="text-sm font-medium text-white mb-2">Sobre nós</h3>
                  <p className="text-xs text-gray-300 mb-2">
                    A Dual Finance é uma plataforma inovadora de gestão financeira fundada em 2024. 
                    Nossa missão é tornar o controle financeiro acessível e eficiente para todos.
                  </p>
                  <p className="text-xs text-gray-300 mb-2">
                    Oferecemos ferramentas intuitivas para rastreamento de despesas, gestão de receitas 
                    e análise de investimentos, ajudando nossos usuários a tomar decisões financeiras inteligentes.
                  </p>
                  <p className="text-xs text-gray-400 mt-4">
                    © 2024 Dual Finance. Todos os direitos reservados.
                  </p>
                </div>
                
                <Button 
                  className="w-full bg-finance-blue hover:bg-finance-blue/80"
                  onClick={handleSaveCompanyInfo}
                >
                  Salvar Informações
                </Button>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="app">
            <Card className="bg-finance-dark-card p-4 mb-4">
              <h2 className="text-lg font-semibold text-white mb-4">Configurações do Aplicativo</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-1">Moeda</label>
                  <Select 
                    value={selectedCurrency} 
                    onValueChange={(value: CurrencyType) => setSelectedCurrency(value)}
                  >
                    <SelectTrigger className="finance-input">
                      <SelectValue placeholder="Selecione a moeda" />
                    </SelectTrigger>
                    <SelectContent className="bg-finance-dark-card border-finance-dark-lighter">
                      <SelectItem value="BRL">Real (R$)</SelectItem>
                      <SelectItem value="USD">Dólar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="bg-finance-dark-lighter rounded-md p-3">
                  <h3 className="text-sm font-medium text-white mb-2">Precisa de ajuda?</h3>
                  <p className="text-xs text-gray-300 mb-2">
                    Entre em contato com nosso suporte para dúvidas ou problemas com o aplicativo.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Mail className="w-3 h-3" /> suporte@dualfinance.com
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
                    <Globe className="w-3 h-3" /> www.dualfinance.com
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-finance-blue hover:bg-finance-blue/80"
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
