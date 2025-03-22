
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinance } from '@/context/FinanceContext';
import { DollarSign, User, Mail, Lock, LogIn, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Login = () => {
  const { 
    login, 
    signup, 
    signInWithGoogle, 
    users, 
    selectProfile, 
    selectedProfile, 
    isAuthenticated,
    loading
  } = useFinance();
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('login');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated and has selected a profile, redirect to dashboard
    if (isAuthenticated && selectedProfile) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, selectedProfile, navigate]);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success('Login realizado com sucesso');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        console.error("Google login failed with error:", result.error);
      }
    } catch (error) {
      console.error("Google login exception:", error);
      toast.error("Erro ao fazer login com Google");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(email, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSelection = () => {
    if (!selectedUser) {
      toast.error('Por favor, selecione um perfil');
      return;
    }

    selectProfile(selectedUser);
    navigate('/dashboard');
  };

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-finance-dark">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-finance-blue mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-finance-dark p-4">
      <Card className="w-full max-w-md finance-card p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-finance-blue flex items-center justify-center mb-4 shadow-lg">
            <DollarSign size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">DualFinance</h1>
          <p className="text-gray-400">Controle financeiro para dois</p>
        </div>

        {!isAuthenticated ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-finance-dark-lighter">
              <TabsTrigger value="login" className="data-[state=active]:bg-finance-blue text-white">Login</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-finance-blue text-white">Cadastro</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-finance-dark-lighter text-white border-gray-600"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-finance-dark-lighter text-white border-gray-600"
                    placeholder="********"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleEmailLogin}
                className="w-full finance-btn flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <LogIn size={18} />
                )}
                Entrar
              </Button>
              
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-gray-600 w-full"></div>
                <span className="bg-finance-card px-2 text-gray-400 text-sm">ou</span>
                <div className="border-t border-gray-600 w-full"></div>
              </div>
              
              <Button
                onClick={handleGoogleLogin}
                variant="outline"
                className="w-full border-gray-600 text-white hover:bg-gray-700 flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                )}
                Continuar com Google
              </Button>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-white">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-finance-dark-lighter text-white border-gray-600"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-white">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-finance-dark-lighter text-white border-gray-600"
                    placeholder="********"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleSignup}
                className="w-full finance-btn flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader size={18} className="animate-spin" />
                ) : 'Criar conta'}
              </Button>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-medium text-white">Selecione seu perfil</h2>
              <p className="text-gray-400 text-sm mt-1">Escolha qual perfil deseja utilizar</p>
            </div>
            
            <Separator className="bg-gray-700" />
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 rounded-lg flex flex-col items-center cursor-pointer transition-colors ${
                    selectedUser === user.id ? 'bg-finance-blue shadow-lg' : 'bg-finance-dark-lighter hover:bg-opacity-70'
                  }`}
                  onClick={() => setSelectedUser(user.id)}
                >
                  <div className="w-14 h-14 rounded-full bg-finance-dark-card flex items-center justify-center mb-3">
                    {user.avatarUrl ? (
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback className="bg-finance-dark-card text-white">
                          {user.name.substring(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <User size={24} className="text-white" />
                    )}
                  </div>
                  <span className="text-white font-medium">{user.name}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={handleProfileSelection}
              className="w-full finance-btn mt-6"
              disabled={loading}
            >
              {loading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                'Continuar'
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Login;
