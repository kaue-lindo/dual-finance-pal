
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PieChart } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateTotalForMonth } from '@/utils/chartUtils';

const UserComparison = () => {
  const navigate = useNavigate();
  const { users, finances, getCategoryExpenses } = useFinance();
  const [userOne, setUserOne] = useState<string | null>(null);
  const [userTwo, setUserTwo] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'category' | 'monthly'>('category');
  const [monthsToShow, setMonthsToShow] = useState(6);

  useEffect(() => {
    if (users.length > 0) {
      setUserOne(users[0].id);
      setUserTwo(users[1]?.id || users[0].id);
    }
  }, [users]);

  if (!userOne || !userTwo) {
    return <div>Carregando...</div>;
  }

  const userOneName = users.find(user => user.id === userOne)?.name || 'Usuário 1';
  const userTwoName = users.find(user => user.id === userTwo)?.name || 'Usuário 2';

  const userOneData = getCategoryExpenses(userOne);
  const userTwoData = getCategoryExpenses(userTwo);

  const categoryNames = Array.from(new Set([...userOneData.map(item => item.category), ...userTwoData.map(item => item.category)]));

  const chartData = categoryNames.map(category => {
    const userOneExpense = userOneData.find(item => item.category === category)?.amount || 0;
    const userTwoExpense = userTwoData.find(item => item.category === category)?.amount || 0;
    return {
      category: category,
      [userOneName]: userOneExpense,
      [userTwoName]: userTwoExpense,
    };
  });

  const months = Array.from({ length: monthsToShow }, (_, i) => {
    const date = subMonths(new Date(), monthsToShow - 1 - i);
    return format(date, 'MMMM', { locale: ptBR });
  });

  const userOneIncomes = finances[userOne]?.incomes || [];
  const userTwoIncomes = finances[userTwo]?.incomes || [];

  const userOneTransactions = months.map(month => {
    return calculateTotalForMonth(userOneIncomes, month);
  });

  const userTwoTransactions = months.map(month => {
    return calculateTotalForMonth(userTwoIncomes, month);
  });

  const monthlyData = months.map((month, index) => ({
    month: month,
    [userOneName]: Number(userOneTransactions[index] || 0),
    [userTwoName]: Number(userTwoTransactions[index] || 0),
  }));

  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Comparativo de Usuários</h1>
          <Button variant="ghost" size="icon" className="navbar-icon">
            <PieChart size={24} className="text-white" />
          </Button>
        </div>
      </div>

      <div className="px-4 pt-4">
        <Card className="finance-card mb-4">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Filtros</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userOne" className="text-white">Usuário 1:</Label>
                <Select value={userOne} onValueChange={(value: string) => setUserOne(value)}>
                  <SelectTrigger className="bg-finance-dark-card text-white">
                    <SelectValue placeholder="Selecione o Usuário 1" />
                  </SelectTrigger>
                  <SelectContent className="bg-finance-dark-card text-white">
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="userTwo" className="text-white">Usuário 2:</Label>
                <Select value={userTwo} onValueChange={(value: string) => setUserTwo(value)}>
                  <SelectTrigger className="bg-finance-dark-card text-white">
                    <SelectValue placeholder="Selecione o Usuário 2" />
                  </SelectTrigger>
                  <SelectContent className="bg-finance-dark-card text-white">
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="chartType" className="text-white">Tipo de Gráfico:</Label>
              <Select value={chartType} onValueChange={(value: 'category' | 'monthly') => setChartType(value)}>
                <SelectTrigger className="bg-finance-dark-card text-white">
                  <SelectValue placeholder="Selecione o Tipo de Gráfico" />
                </SelectTrigger>
                <SelectContent className="bg-finance-dark-card text-white">
                  <SelectItem value="category">Por Categoria</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {chartType === 'monthly' && (
              <div className="mt-4">
                <Label htmlFor="monthsToShow" className="text-white">Meses a Mostrar:</Label>
                <Input
                  type="number"
                  id="monthsToShow"
                  className="bg-finance-dark-card text-white"
                  value={monthsToShow}
                  onChange={(e) => setMonthsToShow(Number(e.target.value))}
                />
              </div>
            )}
          </div>
        </Card>

        <Card className="finance-card">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Comparativo</h2>

            {chartType === 'category' ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" stroke="white" />
                  <YAxis stroke="white" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={userOneName} fill="#8884d8" />
                  <Bar dataKey={userTwoName} fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="white" />
                  <YAxis stroke="white" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={userOneName} fill="#8884d8" />
                  <Bar dataKey={userTwoName} fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserComparison;
