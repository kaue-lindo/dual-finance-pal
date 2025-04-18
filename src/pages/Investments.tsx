
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, TrendingUp, Check, AlertCircle } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import InvestmentCalculator from '@/components/InvestmentCalculator';
import BottomNav from '@/components/ui/bottom-nav';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const Investments = () => {
  const { currentUser, finances, deleteInvestment, finalizeInvestment } = useFinance();
  const navigate = useNavigate();
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; investmentId: string; type: 'delete' | 'finalize' }>({ 
    open: false, 
    investmentId: '', 
    type: 'delete' 
  });

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const userFinances = finances[currentUser.id];
  const investments = userFinances.investments || [];

  // Filter out finalized investments
  const activeInvestments = investments.filter(inv => !inv.isFinalized);
  const finalizedInvestments = investments.filter(inv => inv.isFinalized);

  const totalInvested = activeInvestments.reduce((sum, investment) => sum + investment.amount, 0);

  const calculateProjectedReturn = (investment: {
    amount: number;
    rate: number;
    period: 'monthly' | 'annual';
    isCompound?: boolean;
  }) => {
    const { amount, rate, period, isCompound } = investment;
    
    if (isCompound !== false) {
      const annualRate = period === 'monthly' ? (1 + rate / 100) ** 12 - 1 : rate / 100;
      return amount * (1 + annualRate);
    } else {
      const annualRate = period === 'monthly' ? rate * 12 / 100 : rate / 100;
      return amount * (1 + annualRate);
    }
  };

  const totalProjected = activeInvestments.reduce(
    (sum, investment) => sum + calculateProjectedReturn(investment),
    0
  );

  const handleDeleteInvestment = async (id: string) => {
    try {
      await deleteInvestment(id);
      setConfirmDialog({ open: false, investmentId: '', type: 'delete' });
    } catch (error) {
      console.error("Error deleting investment:", error);
      toast.error("Erro ao excluir investimento");
    }
  };

  const handleFinalizeInvestment = async (id: string) => {
    try {
      await finalizeInvestment(id);
      setConfirmDialog({ open: false, investmentId: '', type: 'finalize' });
    } catch (error) {
      console.error("Error finalizing investment:", error);
      toast.error("Erro ao finalizar investimento");
    }
  };

  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Investimentos</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="mt-6 px-4">
        <Card className="finance-card">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-finance-blue flex items-center justify-center">
                <TrendingUp size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Total Investido</h2>
                <p className="text-gray-400">Rendimento anual projetado</p>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-white">{formatCurrency(totalInvested)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Projeção Anual</p>
                <p className="text-lg font-bold text-green-500">
                  +{formatCurrency(totalProjected - totalInvested)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <InvestmentCalculator />

        {activeInvestments.length > 0 ? (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-white px-1 mb-3">Seus Investimentos Ativos</h2>
            {activeInvestments.map((investment) => (
              <Card key={investment.id} className="finance-card mb-3">
                <div className="flex justify-between">
                  <div className="max-w-[60%]">
                    <h3 className="text-white font-medium truncate">{investment.description}</h3>
                    <p className="text-gray-400 text-sm truncate">
                      {investment.period === 'monthly' ? 'Mensal' : 'Anual'} • {investment.rate}% • 
                      {investment.isCompound !== false ? ' Juros Compostos' : ' Juros Simples'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{formatCurrency(investment.amount)}</p>
                    <p className="text-green-500 text-sm">
                      +{formatCurrency(calculateProjectedReturn(investment) - investment.amount)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between mt-2 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    onClick={() => setConfirmDialog({ open: true, investmentId: investment.id, type: 'delete' })}
                  >
                    Remover
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
                    onClick={() => setConfirmDialog({ open: true, investmentId: investment.id, type: 'finalize' })}
                  >
                    <Check size={16} className="mr-1" />
                    Finalizar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-10 text-center">
            <p className="text-gray-400">Você ainda não tem investimentos ativos</p>
          </div>
        )}
        
        {finalizedInvestments.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-white px-1 mb-3">Investimentos Finalizados</h2>
            {finalizedInvestments.map((investment) => (
              <Card key={investment.id} className="finance-card mb-3 border-green-500/30">
                <div className="flex justify-between">
                  <div className="max-w-[60%]">
                    <div className="flex items-center">
                      <h3 className="text-white font-medium truncate mr-2">{investment.description}</h3>
                      <span className="bg-green-500/20 text-green-500 text-xs px-2 py-0.5 rounded-full">Finalizado</span>
                    </div>
                    <p className="text-gray-400 text-sm truncate">
                      {investment.period === 'monthly' ? 'Mensal' : 'Anual'} • {investment.rate}% • 
                      {investment.isCompound !== false ? ' Juros Compostos' : ' Juros Simples'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{formatCurrency(investment.amount)}</p>
                    {investment.finalizedDate && (
                      <p className="text-gray-400 text-xs">
                        Finalizado em: {new Date(investment.finalizedDate).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <Dialog 
        open={confirmDialog.open} 
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <DialogContent className="bg-finance-dark-card border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {confirmDialog.type === 'delete' ? 'Remover Investimento' : 'Finalizar Investimento'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {confirmDialog.type === 'delete' 
                ? 'Tem certeza que deseja remover este investimento? Esta ação não pode ser desfeita.'
                : 'Ao finalizar este investimento, o valor total (incluindo rendimentos) será adicionado ao seu saldo. Deseja continuar?'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialog({ open: false, investmentId: '', type: 'delete' })}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => confirmDialog.type === 'delete' 
                ? handleDeleteInvestment(confirmDialog.investmentId)
                : handleFinalizeInvestment(confirmDialog.investmentId)
              }
            >
              {confirmDialog.type === 'delete' ? 'Remover' : 'Finalizar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <BottomNav />
    </div>
  );
};

export default Investments;
