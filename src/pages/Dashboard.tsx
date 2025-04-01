
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowDown, 
  ArrowUp, 
  Calculator, 
  Calendar, 
  CreditCard, 
  Home, 
  PiggyBank, 
  Plus, 
  Receipt, 
  Wallet,
  TrendingUp,
  Users,
  ChevronRight,
  Settings,
  BarChart,
  LogOut as LogOutIcon,
  User as UserIcon,
  ArrowUpDown,
  UserPlus
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { CircularProgressIndicator } from "@/components/CircularProgressIndicator";
import BottomNav from "@/components/ui/bottom-nav";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    getUserFinances,
    logout,
    selectProfile
  } = useFinance();
  const navigate = useNavigate();

  // Buscando dados atualizados para garantir que todas as despesas sejam contabilizadas
  const expensesByCategory = getCategoryExpenses();
  const totalExpenses = getMonthlyExpenseTotal();
  const currentBalance = calculateBalance();
  const realIncome = getRealIncome();
  const investmentAmount = getTotalInvestments();
  const projectedReturn = getProjectedInvestmentReturn(12);
  const totalInvestment = getTotalInvestments();
  
  // Evitar divisão por zero e garantir um valor percentual válido
  const projectedReturnPercentage = totalInvestment > 0 
    ? Math.min(100, (projectedReturn / totalInvestment) * 100) 
    : 0;

  const otherUsers = users.filter(user => user.id !== currentUser?.id);

  const chartData = expensesByCategory.map((item) => ({
    name: item.category,
    value: item.amount,
  }));

  // Calculate if the balance is positive, negative or neutral
  const getBalanceStatus = () => {
    if (currentBalance > 0) return "positive";
    if (currentBalance < 0) return "negative";
    return "neutral";
  };

  const balanceStatus = getBalanceStatus();

  // Navigate to different screens
  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchUser = (userId) => {
    selectProfile(userId);
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
              <DropdownMenuLabel className="text-white">Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem 
                className="text-white hover:bg-finance-dark-lighter cursor-pointer"
                onClick={() => navigate('/settings')}
              >
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              
              {otherUsers.length > 0 && (
                <>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuLabel className="text-white">Trocar de Usuário</DropdownMenuLabel>
                  {otherUsers.map(user => (
                    <DropdownMenuItem 
                      key={user.id}
                      className="text-white hover:bg-finance-dark-lighter cursor-pointer"
                      onClick={() => handleSwitchUser(user.id)}
                    >
                      <UserIcon className="mr-2 h-4 w-4" />
                      {user.name}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem 
                className="text-red-500 hover:bg-finance-dark-lighter cursor-pointer"
                onClick={handleLogout}
              >
                <LogOutIcon className="mr-2 h-4 w-4" />
                Sair da Conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <Card className="bg-finance-dark-card text-white">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-gray-400 text-sm">Saldo Atual</p>
                <h2 className="text-2xl font-bold">{formatCurrency(currentBalance)}</h2>
              </div>
              {balanceStatus === "positive" && <ArrowUp className="text-green-500 w-6 h-6" />}
              {balanceStatus === "negative" && <ArrowDown className="text-red-500 w-6 h-6" />}
              {balanceStatus === "neutral" && <TrendingUp className="text-yellow-500 w-6 h-6" />}
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
              value={projectedReturnPercentage}
              size={150}
              centerContent={
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{projectedReturnPercentage.toFixed(1)}%</p>
                </div>
              }
            />
            <p className="text-white mt-4">
              Retorno Projetado: {formatCurrency(projectedReturn)}
            </p>
          </div>
        </Card>
      </div>

      {/* User Comparison Section - Improved */}
      {otherUsers.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-white text-xl font-bold mb-4">
            Comparação de Finanças
          </h2>
          <div className="space-y-4">
            {otherUsers.map(user => {
              const otherUserBalance = getUserBalance(user.id);
              const otherUserFinances = getUserFinances(user.id);
              const otherUserInvestments = otherUserFinances.investments.reduce(
                (sum, inv) => sum + inv.amount, 0
              );
              const otherUserExpenses = otherUserFinances.expenses.reduce(
                (sum, exp) => sum + exp.amount, 0
              );
              const balanceDiff = currentBalance - otherUserBalance;
              const investmentDiff = investmentAmount - otherUserInvestments;
              const expenseDiff = totalExpenses - otherUserExpenses;
              
              return (
                <Card 
                  key={user.id} 
                  className="finance-card p-4 cursor-pointer hover:bg-finance-dark-lighter transition-colors"
                  onClick={() => handleNavigation('/user-comparison')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-finance-dark-lighter flex items-center justify-center mr-3 overflow-hidden">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <h3 className="text-white font-bold">{user.name}</h3>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
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
                        {investmentDiff > 0 ? <TrendingUp size={14} /> : <ArrowDown size={14} />}
                        <span>{formatCurrency(Math.abs(investmentDiff))} {investmentDiff > 0 ? 'a mais' : 'a menos'}</span>
                      </div>
                    </div>
                    
                    <div className="bg-finance-dark-card rounded-lg p-3">
                      <p className="text-gray-400 text-sm mb-1">Despesas</p>
                      <p className="text-white font-bold">
                        {formatCurrency(otherUserExpenses)}
                      </p>
                      <div className={`flex items-center mt-1 text-xs ${expenseDiff < 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {expenseDiff < 0 ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                        <span>{formatCurrency(Math.abs(expenseDiff))} {expenseDiff < 0 ? 'a menos' : 'a mais'}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Improved Quick Actions Section */}
      <div className="px-4 mt-6 mb-20">
        <Card className="finance-card p-4">
          <h2 className="text-white text-xl font-bold mb-4">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              className="bg-finance-dark-card hover:bg-finance-dark-lighter transition-colors p-4 rounded-lg flex flex-col items-center justify-center"
              onClick={() => handleNavigation('/cashflow')}
            >
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mb-3">
                <ArrowUpDown className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-medium">Fluxo de Caixa</span>
            </button>
            
            <button 
              className="bg-finance-dark-card hover:bg-finance-dark-lighter transition-colors p-4 rounded-lg flex flex-col items-center justify-center"
              onClick={() => handleNavigation('/add-transaction')}
            >
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-medium">Nova Transação</span>
            </button>
            
            <button 
              className="bg-finance-dark-card hover:bg-finance-dark-lighter transition-colors p-4 rounded-lg flex flex-col items-center justify-center"
              onClick={() => handleNavigation('/investment-returns')}
            >
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-medium">Rendimentos</span>
            </button>
            
            <button 
              className="bg-finance-dark-card hover:bg-finance-dark-lighter transition-colors p-4 rounded-lg flex flex-col items-center justify-center"
              onClick={() => handleNavigation('/investments')}
            >
              <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mb-3">
                <PiggyBank className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-medium">Investimentos</span>
            </button>
            
            <button 
              className="bg-finance-dark-card hover:bg-finance-dark-lighter transition-colors p-4 rounded-lg flex flex-col items-center justify-center"
              onClick={() => handleNavigation('/user-comparison')}
            >
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center mb-3">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-medium">Comparação de Finanças</span>
            </button>
            
            <button 
              className="bg-finance-dark-card hover:bg-finance-dark-lighter transition-colors p-4 rounded-lg flex flex-col items-center justify-center"
              onClick={() => handleNavigation('/settings')}
            >
              <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center mb-3">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-medium">Configurações</span>
            </button>
          </div>
        </Card>
      </div>

      {/* Barra de navegação inferior */}
      <BottomNav currentPath="/dashboard" />
    </div>
  );
};

export default Dashboard;
