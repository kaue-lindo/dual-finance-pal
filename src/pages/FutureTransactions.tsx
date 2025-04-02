import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useFinance } from '@/context/FinanceContext';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, DollarSign, ShoppingCart, Trash, Calendar, Home, BarChart, TrendingUp, Filter, Plus, PieChart } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getCategoryColor } from '@/utils/chartUtils';
import BottomNav from '@/components/ui/bottom-nav';

type TransactionType = {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'investment';
  category: string;
  sourceCategory?: string;
};

const FutureTransactions = () => {
  const { 
    currentUser, 
    finances, 
    getFutureTransactions, 
    deleteTransaction,
    fetchTransactions
  } = useFinance();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    loadTransactions();
  }, [currentUser, finances]);

  const loadTransactions = async () => {
    await fetchTransactions();
    const futureTransactions = getFutureTransactions();
    
    const formattedTransactions = futureTransactions.map((t, index) => ({
      id: t.id || `temp-${Date.now()}-${Math.random()}-${index}`,
      date: t.date,
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category || 'other',
      sourceCategory: t.sourceCategory
    }));

    setTransactions(formattedTransactions);
  };

  const handleDeleteTransaction = async (id: string) => {
    setTransactionToDelete(null);
    try {
      await deleteTransaction(id);
      toast.success("Transação removida com sucesso");
      loadTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Erro ao remover transação");
    }
  };

  const getFilteredTransactions = () => {
    return transactions
      .filter(t => {
        if (activeTab === 'income' && t.type !== 'income') return false;
        if (activeTab === 'expense' && t.type !== 'expense') return false;
        if (activeTab === 'investment' && t.type !== 'investment') return false;

        if (categoryFilter && t.category !== categoryFilter) return false;

        if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const uniqueCategories = [...new Set(transactions.map(t => t.category))];

  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Transações Futuras</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            className="navbar-icon"
            onClick={() => navigate('/cashflow')}
          >
            <PieChart size={24} className="text-white" />
          </Button>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="mb-4">
          <Label htmlFor="search" className="text-white mb-1">Pesquisar:</Label>
          <Input
            id="search"
            placeholder="Pesquisar descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-finance-dark-card border-finance-dark-lighter text-white"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid grid-cols-4 bg-finance-dark-lighter">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Calendar size={14} />
              <span>Todos</span>
            </TabsTrigger>
            <TabsTrigger value="income" className="flex items-center gap-1">
              <DollarSign size={14} />
              <span>Entradas</span>
            </TabsTrigger>
            <TabsTrigger value="expense" className="flex items-center gap-1">
              <ShoppingCart size={14} />
              <span>Saídas</span>
            </TabsTrigger>
            <TabsTrigger value="investment" className="flex items-center gap-1">
              <BarChart size={14} />
              <span>Invest.</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {uniqueCategories.length > 0 && (
          <div className="mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-finance-dark-card text-white border-finance-dark-lighter">
                  <Filter size={16} className="mr-2" />
                  {categoryFilter ? `Categoria: ${categoryFilter}` : 'Filtrar por categoria'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setCategoryFilter(null)}>
                  Todas categorias
                </DropdownMenuItem>
                {uniqueCategories.map(category => (
                  <DropdownMenuItem 
                    key={category} 
                    onClick={() => setCategoryFilter(category)}
                  >
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="px-4 mb-24">
        <Card className="finance-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-finance-blue" />
            Transações Programadas
          </h2>

          {getFilteredTransactions().length > 0 ? (
            <div className="space-y-4">
              {getFilteredTransactions().map((transaction, index) => (
                <div key={`${transaction.id}-${index}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${
                      transaction.type === 'income' 
                        ? 'bg-green-500/20' 
                        : transaction.type === 'investment' 
                          ? 'bg-blue-500/20' 
                          : 'bg-red-500/20'
                    } flex items-center justify-center`}>
                      {transaction.type === 'income' ? 
                        <DollarSign size={18} className="text-green-400" /> : 
                        transaction.type === 'investment' ?
                        <BarChart size={18} className="text-blue-400" /> :
                        <ShoppingCart size={18} style={{ color: getCategoryColor(transaction.category) }} />
                      }
                    </div>
                    <div>
                      <p className="text-white">{transaction.description}</p>
                      <div className="flex text-xs space-x-2">
                        <span className="text-gray-400">
                          {format(new Date(transaction.date), 'dd/MM/yyyy')}
                        </span>
                        <span style={{ color: getCategoryColor(transaction.category) }}>
                          {transaction.category}
                        </span>
                        {transaction.sourceCategory && (
                          <span className="text-blue-400">
                            Fonte: {transaction.sourceCategory}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className={
                        transaction.type === 'income' 
                          ? 'text-green-400' 
                          : transaction.type === 'investment' 
                            ? 'text-blue-400' 
                            : 'text-red-400'
                      }>
                        {transaction.type === 'income' ? '+' : transaction.type === 'investment' ? '•' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          onClick={() => setTransactionToDelete(transaction.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-finance-dark-card border-finance-dark-lighter">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            {transaction.id.includes('-installment-') || transaction.id.includes('-recurring-') ? 
                              "Isso excluirá a transação original e todas as suas ocorrências futuras. Essa ação não pode ser desfeita." : 
                              "Tem certeza que deseja excluir esta transação? Essa ação não pode ser desfeita."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-finance-dark-lighter text-white border-finance-dark">Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-6">
              <p>Nenhuma transação encontrada</p>
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  className="finance-btn"
                  onClick={() => navigate('/add-income')}
                >
                  <Plus size={16} className="mr-1" />
                  Adicionar Entrada
                </Button>
                <Button
                  className="finance-btn-secondary"
                  onClick={() => navigate('/expenses')}
                >
                  <Plus size={16} className="mr-1" />
                  Adicionar Saída
                </Button>
              </div>
            </div>
          )}
        </Card>
        
        <div className="flex justify-center mt-4">
          <Button 
            className="finance-btn"
            onClick={() => navigate('/cashflow')}
          >
            <PieChart size={16} className="mr-1" />
            Ver Gráficos de Fluxo de Caixa
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default FutureTransactions;
