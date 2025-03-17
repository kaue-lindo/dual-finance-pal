
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinance } from '@/context/FinanceContext';
import { DollarSign, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Login = () => {
  const { users, login } = useFinance();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = () => {
    if (!selectedUser) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um usuário',
        variant: 'destructive',
      });
      return;
    }

    login(selectedUser, rememberMe);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-finance-dark p-4">
      <Card className="w-full max-w-md finance-card">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-finance-blue flex items-center justify-center mb-4">
            <DollarSign size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">DualFinance</h1>
          <p className="text-gray-400">Controle financeiro para dois</p>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="user" className="text-white mb-2 block">
              Selecione seu perfil
            </Label>
            <div className="grid grid-cols-2 gap-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 rounded-lg flex flex-col items-center cursor-pointer transition-colors ${
                    selectedUser === user.id ? 'bg-finance-blue' : 'bg-finance-dark-lighter'
                  }`}
                  onClick={() => setSelectedUser(user.id)}
                >
                  <div className="w-12 h-12 rounded-full bg-finance-dark-card flex items-center justify-center mb-2">
                    <User size={24} className="text-white" />
                  </div>
                  <span className="text-white font-medium">{user.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="data-[state=checked]:bg-finance-blue"
            />
            <Label htmlFor="rememberMe" className="text-gray-300">
              Lembrar login
            </Label>
          </div>

          <Button
            onClick={handleLogin}
            className="w-full finance-btn"
          >
            Entrar
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
