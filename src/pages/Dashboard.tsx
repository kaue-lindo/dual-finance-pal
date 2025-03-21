
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CircularProgressIndicator } from "@/components/CircularProgressIndicator";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency } from "@/context/finance/utils/formatting";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts";
import { Home, ShoppingCart, DollarSign, BarChart3, Receipt, Calculator, Calendar } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard = () => {
  const {
    currentUser,
    users,
    calculateBalance,
    getMonthlyExpenseTotal,
    getCategoryExpenses,
    getRealIncome,
    getTotalInvestments,
    getProjectedInvestmentReturn,
    getUserBalance,
    getUserFinances
  } = useFinance();
  const navigate = useNavigate();

  const expensesByCategory = getCategoryExpenses();
  const totalExpenses = getMonthlyExpenseTotal();
  const currentBalance = calculateBalance();
  const realIncome = getRealIncome();
  const investmentAmount = getTotalInvestments();
  const projectedReturn = getProjectedInvestmentReturn(12);

  const otherUsers = users.filter(user => user.id !== currentUser?.id);

  const chartData = expensesByCategory.map((item) => ({
    name: item.category,
    value: item.amount,
  }));

  // Navigate to different screens
  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      <div className="finance-card rounded-b-xl">
        <div className="p-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">
              Olá, {currentUser?.name || 'Usuário'}!
            </h1>
            <p className="text-gray-400">
              Bem-vindo de volta ao DualFinance 👋
            </p>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden">
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt="Avatar do usuário"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-700 text-white text-lg font-bold">
                {currentUser?.name.substring(0, 1).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <Card className="bg-finance-dark-card text-white">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-gray-400 text-sm">Saldo Atual</p>
                <h2 className="text-2xl font-bold">{formatCurrency(currentBalance)}</h2>
              </div>
              <TrendingUp className="text-green-500 w-6 h-6" />
            </div>
          </Card>
          <Card className="bg-finance-dark-card text-white">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-gray-400 text-sm">Despesas Mensais</p>
                <h2 className="text-2xl font-bold">{formatCurrency(totalExpenses)}</h2>
              </div>
              <ArrowDown className="text-red-500 w-6 h-6" />
            </div>
          </Card>
          <Card className="bg-finance-dark-card text-white">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-gray-400 text-sm">Renda Real</p>
                <h2 className="text-2xl font-bold">{formatCurrency(realIncome)}</h2>
              </div>
              <ArrowUp className="text-green-500 w-6 h-6" />
            </div>
          </Card>
          <Card className="bg-finance-dark-card text-white">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-gray-400 text-sm">Total Investido</p>
                <h2 className="text-2xl font-bold">{formatCurrency(investmentAmount)}</h2>
              </div>
              <TrendingUp className="text-green-500 w-6 h-6" />
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6 px-4">
        <Card className="finance-card p-4">
          <h2 className="text-white text-xl font-bold mb-4">
            Despesas por Categoria
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-400">
              Nenhuma despesa registrada neste mês.
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 px-4">
        <Card className="finance-card p-4">
          <h2 className="text-white text-xl font-bold mb-4">
            Projeção de Investimentos (12 meses)
          </h2>
          <div className="flex flex-col items-center">
            <CircularProgressIndicator
              value={projectedReturn}
              size={150}
            />
            <p className="text-white mt-4">
              Retorno Projetado: {formatCurrency(projectedReturn)}
            </p>
          </div>
        </Card>
      </div>

      {/* User Comparison Section */}
      {otherUsers.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-white text-xl font-bold mb-3">Comparação entre Usuários</h2>
          {otherUsers.map(user => {
            const otherUserBalance = getUserBalance(user.id);
            const otherUserFinances = getUserFinances(user.id);
            const otherUserInvestments = otherUserFinances.investments.reduce(
              (sum, inv) => sum + inv.amount, 0
            );
            const currentUserInvestments = getTotalInvestments();
            const balanceDiff = currentBalance - otherUserBalance;
            const investmentDiff = currentUserInvestments - otherUserInvestments;
            
            return (
              <Card key={user.id} className="finance-card mb-4 p-4">
                <div>
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-finance-dark-lighter flex items-center justify-center mr-3">
                      {user.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user.name} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold">
                          {user.name.substring(0, 1)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-white font-bold">{user.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-finance-dark-card rounded-lg p-3">
                      <p className="text-gray-400 text-sm mb-1">Saldo</p>
                      <p className="text-white font-bold">
                        {formatCurrency(otherUserBalance)}
                      </p>
                      <div className={`flex items-center mt-1 text-xs ${balanceDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {balanceDiff > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        <span>{formatCurrency(Math.abs(balanceDiff))} {balanceDiff > 0 ? 'a mais' : 'a menos'}</span>
                      </div>
                    </div>
                    
                    <div className="bg-finance-dark-card rounded-lg p-3">
                      <p className="text-gray-400 text-sm mb-1">Investimentos</p>
                      <p className="text-white font-bold">
                        {formatCurrency(otherUserInvestments)}
                      </p>
                      <div className={`flex items-center mt-1 text-xs ${investmentDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {investmentDiff > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        <span>{formatCurrency(Math.abs(investmentDiff))} {investmentDiff > 0 ? 'a mais' : 'a menos'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Extended Navigation Bar with Additional Shortcuts */}
      <div className="fixed bottom-0 left-0 right-0 bg-finance-dark-card py-3 flex justify-around items-center">
        <button className="navbar-icon" onClick={() => handleNavigation('/dashboard')}>
          <Home className="w-6 h-6 text-white" />
        </button>
        <button className="navbar-icon" onClick={() => handleNavigation('/expenses')}>
          <ShoppingCart className="w-6 h-6 text-white" />
        </button>
        <div className="-mt-8">
          <button 
            className="w-12 h-12 rounded-full bg-finance-blue flex items-center justify-center"
            onClick={() => handleNavigation('/add-income')}
          >
            <DollarSign className="w-6 h-6 text-white" />
          </button>
        </div>
        <button className="navbar-icon" onClick={() => handleNavigation('/investments')}>
          <BarChart3 className="w-6 h-6 text-white" />
        </button>
        <button className="navbar-icon" onClick={() => handleNavigation('/all-transactions')}>
          <Receipt className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Additional Navigation Options */}
      <div className="px-4 mt-6 mb-20">
        <Card className="finance-card p-4">
          <h2 className="text-white text-xl font-bold mb-4">
            Outras Opções
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              className="bg-finance-dark-card p-3 rounded-lg flex flex-col items-center justify-center"
              onClick={() => handleNavigation('/simulator')}
            >
              <Calculator className="w-8 h-8 text-white mb-2" />
              <span className="text-white">Simulador</span>
            </button>
            
            <button 
              className="bg-finance-dark-card p-3 rounded-lg flex flex-col items-center justify-center"
              onClick={() => handleNavigation('/future-transactions')}
            >
              <Calendar className="w-8 h-8 text-white mb-2" />
              <span className="text-white">Transações Futuras</span>
            </button>
            
            <button 
              className="bg-finance-dark-card p-3 rounded-lg flex flex-col items-center justify-center"
              onClick={() => handleNavigation('/future-graphs')}
            >
              <BarChart3 className="w-8 h-8 text-white mb-2" />
              <span className="text-white">Gráficos Futuros</span>
            </button>
            
            <button 
              className="bg-finance-dark-card p-3 rounded-lg flex flex-col items-center justify-center"
              onClick={() => handleNavigation('/settings')}
            >
              <DollarSign className="w-8 h-8 text-white mb-2" />
              <span className="text-white">Configurações</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
