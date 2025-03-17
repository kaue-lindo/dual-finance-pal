
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinance } from '@/context/FinanceContext';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import InvestmentCalculator from '@/components/InvestmentCalculator';

const AddIncome = () => {
  const { currentUser, addIncome } = useFinance();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [activeTab, setActiveTab] = useState('income');

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const handleAddIncome = () => {
    if (!description || !amount) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    addIncome({
      description,
      amount: parseFloat(amount),
      date: new Date(),
      recurring: isRecurring,
    });

    toast({
      title: 'Sucesso',
      description: 'Entrada adicionada com sucesso',
    });

    // Reset form
    setDescription('');
    setAmount('');
    setIsRecurring(false);

    // Redirect to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      {/* Header */}
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Entrada de Saldo</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <Tabs defaultValue="income" className="mt-6 px-4" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 bg-finance-dark-lighter">
          <TabsTrigger value="income">Renda</TabsTrigger>
          <TabsTrigger value="investment">Investimentos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="income">
          <Card className="finance-card mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="description" className="text-white">Descrição</Label>
                <Input 
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Salário"
                  className="finance-input mt-1"
                />
              </div>

              <div>
                <Label htmlFor="amount" className="text-white">Valor</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">R$</span>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="finance-input pl-10"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="recurring" className="text-white">Renda Recorrente</Label>
                <Switch
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                  className="data-[state=checked]:bg-finance-blue"
                />
              </div>

              <Button 
                onClick={handleAddIncome}
                className="w-full finance-btn"
              >
                Adicionar Entrada
              </Button>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="investment">
          <InvestmentCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddIncome;
