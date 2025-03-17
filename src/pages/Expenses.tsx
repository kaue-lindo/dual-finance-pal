
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  CreditCard,
  RefreshCw,
  DollarSign,
  Calculator
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

const Expenses = () => {
  const { currentUser, addExpense, getMonthlyExpenseTotal } = useFinance();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Daily expense
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // Installment expense
  const [installmentDescription, setInstallmentDescription] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [installmentCategory, setInstallmentCategory] = useState('');
  const [numberOfInstallments, setNumberOfInstallments] = useState('');

  // Selected days for monthly recurring expenses
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  
  // Calculate total for recurring expenses
  const [recurringTotal, setRecurringTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  useEffect(() => {
    if (isRecurring && amount) {
      calculateRecurringTotal();
    } else {
      setRecurringTotal(0);
    }
    
    // Get total monthly expenses
    setMonthlyTotal(getMonthlyExpenseTotal());
  }, [isRecurring, amount, recurringType, selectedDays]);

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const calculateRecurringTotal = () => {
    if (!amount) return;
    
    const expenseAmount = parseFloat(amount);
    const currentDate = new Date();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    let total = 0;
    
    if (recurringType === 'daily') {
      total = expenseAmount * daysInMonth;
    } else if (recurringType === 'weekly') {
      // Approximately 4 weeks in a month
      total = expenseAmount * 4;
    } else if (recurringType === 'monthly' && selectedDays.length > 0) {
      total = expenseAmount * selectedDays.length;
    } else if (recurringType === 'monthly') {
      total = expenseAmount; // Just once per month if no days selected
    }
    
    setRecurringTotal(total);
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day]
    );
  };

  const handleAddExpense = async () => {
    if (!description || !amount || !category) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    const expense = {
      description,
      amount: parseFloat(amount),
      category,
      date: new Date(),
      recurring: isRecurring ? {
        type: recurringType,
        days: recurringType === 'monthly' ? selectedDays : undefined,
      } : undefined,
    };

    await addExpense(expense);

    toast({
      title: 'Sucesso',
      description: 'Despesa adicionada com sucesso',
    });

    // Reset form
    setDescription('');
    setAmount('');
    setCategory('');
    setIsRecurring(false);
    setRecurringType('daily');
    setSelectedDays([]);

    // Navigate back to dashboard
    navigate('/dashboard');
  };

  const handleAddInstallment = async () => {
    if (!installmentDescription || !installmentAmount || !installmentCategory || !numberOfInstallments) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    const totalAmount = parseFloat(installmentAmount);
    const installments = parseInt(numberOfInstallments);
    const installmentValue = totalAmount / installments;

    const expense = {
      description: installmentDescription,
      amount: installmentValue,
      category: installmentCategory,
      date: new Date(),
      installment: {
        total: installments,
        current: 1,
        remaining: installments - 1,
      },
    };

    await addExpense(expense);

    toast({
      title: 'Sucesso',
      description: 'Compra parcelada adicionada com sucesso',
    });

    // Reset form
    setInstallmentDescription('');
    setInstallmentAmount('');
    setInstallmentCategory('');
    setNumberOfInstallments('');

    // Navigate back to dashboard
    navigate('/dashboard');
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      {/* Header */}
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Adicionar Gastos</h1>
          <div className="w-10"></div>
        </div>
        
        {/* Monthly expense total */}
        <div className="bg-finance-dark-lighter p-3 rounded-lg mb-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calculator size={18} className="text-finance-blue" />
            <span className="text-gray-400">Total mensal:</span>
          </div>
          <span className="text-white font-bold">{formatCurrency(monthlyTotal)}</span>
        </div>
      </div>

      <Tabs defaultValue="daily" className="mt-6 px-4">
        <TabsList className="grid grid-cols-2 bg-finance-dark-lighter">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Calendar size={16} />
            <span>Diário</span>
          </TabsTrigger>
          <TabsTrigger value="installment" className="flex items-center gap-2">
            <CreditCard size={16} />
            <span>Parcelado</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily">
          <Card className="finance-card mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="description" className="text-white">Descrição</Label>
                <Input 
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Almoço"
                  className="finance-input mt-1"
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-white">Categoria</Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                >
                  <SelectTrigger className="finance-input mt-1">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-finance-dark-lighter border-finance-dark">
                    <SelectItem value="food">Alimentação</SelectItem>
                    <SelectItem value="transport">Transporte</SelectItem>
                    <SelectItem value="entertainment">Entretenimento</SelectItem>
                    <SelectItem value="bills">Contas</SelectItem>
                    <SelectItem value="shopping">Compras</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
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
                <div className="flex items-center gap-2">
                  <RefreshCw size={18} className="text-white" />
                  <Label htmlFor="recurring" className="text-white">Gasto Recorrente</Label>
                </div>
                <Switch
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                  className="data-[state=checked]:bg-finance-blue"
                />
              </div>

              {isRecurring && (
                <div className="space-y-4 p-3 bg-finance-dark-lighter rounded-lg">
                  <div>
                    <Label className="text-white">Tipo de Recorrência</Label>
                    <Select
                      value={recurringType}
                      onValueChange={(value) => setRecurringType(value as 'daily' | 'weekly' | 'monthly')}
                    >
                      <SelectTrigger className="finance-input mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-finance-dark-lighter border-finance-dark">
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {recurringType === 'monthly' && (
                    <div>
                      <Label className="text-white mb-2 block">Dias do Mês</Label>
                      <div className="mb-2 grid grid-cols-7 gap-1">
                        {weekDays.map((day, index) => (
                          <div 
                            key={`weekday-${index}`}
                            className="text-gray-400 text-xs text-center"
                          >
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <div
                            key={day}
                            className={`flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-colors ${
                              selectedDays.includes(day) ? 'bg-finance-blue text-white' : 'bg-finance-dark-lighter text-gray-400'
                            }`}
                            onClick={() => handleDayToggle(day)}
                          >
                            {day}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Show recurring expense total calculation */}
                  {amount && (
                    <div className="mt-4 p-2 bg-finance-dark rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Total mensal estimado:</span>
                        <span className="text-white font-semibold">{formatCurrency(recurringTotal)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {recurringType === 'daily' ? 'Valor diário x dias no mês' : 
                         recurringType === 'weekly' ? 'Valor semanal x 4 semanas' : 
                         `Valor por ocorrência x ${selectedDays.length || 1} ${selectedDays.length > 1 ? 'dias' : 'dia'}`}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button 
                onClick={handleAddExpense}
                className="w-full finance-btn"
              >
                Adicionar Gasto
              </Button>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="installment">
          <Card className="finance-card mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="installmentDescription" className="text-white">Descrição</Label>
                <Input 
                  id="installmentDescription"
                  value={installmentDescription}
                  onChange={(e) => setInstallmentDescription(e.target.value)}
                  placeholder="Ex: Smartphone"
                  className="finance-input mt-1"
                />
              </div>

              <div>
                <Label htmlFor="installmentCategory" className="text-white">Categoria</Label>
                <Select
                  value={installmentCategory}
                  onValueChange={setInstallmentCategory}
                >
                  <SelectTrigger className="finance-input mt-1">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-finance-dark-lighter border-finance-dark">
                    <SelectItem value="electronics">Eletrônicos</SelectItem>
                    <SelectItem value="appliances">Eletrodomésticos</SelectItem>
                    <SelectItem value="furniture">Móveis</SelectItem>
                    <SelectItem value="clothing">Vestuário</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="installmentAmount" className="text-white">Valor Total</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">R$</span>
                  <Input
                    id="installmentAmount"
                    type="number"
                    value={installmentAmount}
                    onChange={(e) => setInstallmentAmount(e.target.value)}
                    placeholder="0,00"
                    className="finance-input pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="numberOfInstallments" className="text-white">Número de Parcelas</Label>
                <Input
                  id="numberOfInstallments"
                  type="number"
                  value={numberOfInstallments}
                  onChange={(e) => setNumberOfInstallments(e.target.value)}
                  min="2"
                  max="24"
                  placeholder="Ex: 12"
                  className="finance-input mt-1"
                />
              </div>

              {installmentAmount && numberOfInstallments && (
                <div className="p-3 bg-finance-dark-lighter rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Valor da parcela:</span>
                    <span className="text-white font-bold">
                      {formatCurrency(parseFloat(installmentAmount) / parseInt(numberOfInstallments || '1'))}
                    </span>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleAddInstallment}
                className="w-full finance-btn"
              >
                Adicionar Gasto Parcelado
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Expenses;
