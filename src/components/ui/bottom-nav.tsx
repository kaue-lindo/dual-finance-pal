
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CreditCard, PiggyBank, Settings, Plus, ArrowUpDown, Calculator, Users } from 'lucide-react';

interface BottomNavProps {
  currentPath: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPath }) => {
  const navigate = useNavigate();
  
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Função para verificar se o caminho atual corresponde à rota
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return currentPath === '/dashboard';
    }
    if (path === '/transactions') {
      return currentPath === '/transactions' || 
             currentPath === '/add-income' || 
             currentPath === '/expenses' || 
             currentPath === '/add-transaction' ||
             currentPath === '/future-transactions' ||
             currentPath === '/all-transactions';
    }
    if (path === '/investments') {
      return currentPath === '/investments' || currentPath === '/investment-returns';
    }
    if (path === '/cashflow') {
      return currentPath === '/cashflow' || 
             currentPath === '/future-graphs' ||
             currentPath === '/simulator';
    }
    if (path === '/settings') {
      return currentPath === '/settings';
    }
    if (path === '/compare') {
      return currentPath === '/compare';
    }
    return currentPath === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-finance-dark-card py-3 shadow-lg border-t border-finance-dark-lighter z-50">
      <div className="flex justify-around items-center">
        {/* Início */}
        <button 
          className="flex flex-col items-center justify-center px-2 transition-all duration-200 hover:scale-110"
          onClick={() => handleNavigation('/dashboard')}
        >
          <div className="relative">
            <Home className={`w-6 h-6 transition-colors duration-200 ${isActive('/dashboard') ? 'text-finance-blue' : 'text-white'}`} />
            {isActive('/dashboard') && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-finance-blue rounded-full" />
            )}
          </div>
          <span className={`text-xs mt-1 transition-colors duration-200 ${isActive('/dashboard') ? 'text-finance-blue font-medium' : 'text-white'}`}>Início</span>
        </button>
        
        {/* Comparar */}
        <button 
          className="flex flex-col items-center justify-center px-2 transition-all duration-200 hover:scale-110"
          onClick={() => handleNavigation('/compare')}
        >
          <div className="relative">
            <Users className={`w-6 h-6 transition-colors duration-200 ${isActive('/compare') ? 'text-finance-blue' : 'text-white'}`} />
            {isActive('/compare') && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-finance-blue rounded-full" />
            )}
          </div>
          <span className={`text-xs mt-1 transition-colors duration-200 ${isActive('/compare') ? 'text-finance-blue font-medium' : 'text-white'}`}>Comparar</span>
        </button>
        
        {/* Transações */}
        <button 
          className="flex flex-col items-center justify-center px-2 transition-all duration-200 hover:scale-110"
          onClick={() => handleNavigation('/transactions')}
        >
          <div className="relative">
            <CreditCard className={`w-6 h-6 transition-colors duration-200 ${isActive('/transactions') ? 'text-finance-blue' : 'text-white'}`} />
            {isActive('/transactions') && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-finance-blue rounded-full" />
            )}
          </div>
          <span className={`text-xs mt-1 transition-colors duration-200 ${isActive('/transactions') ? 'text-finance-blue font-medium' : 'text-white'}`}>Transações</span>
        </button>
        
        {/* Botão Adicionar no centro */}
        <button 
          className="flex flex-col items-center justify-center px-2 relative transition-all duration-200 hover:scale-105"
          onClick={() => handleNavigation('/add-transaction')}
        >
          <div className="w-12 h-12 rounded-full bg-finance-blue flex items-center justify-center -mt-5 shadow-lg hover:shadow-finance-blue/50 transition-shadow duration-200">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs mt-1 text-white">Adicionar</span>
        </button>
        
        {/* Investimentos */}
        <button 
          className="flex flex-col items-center justify-center px-2 transition-all duration-200 hover:scale-110"
          onClick={() => handleNavigation('/investments')}
        >
          <div className="relative">
            <PiggyBank className={`w-6 h-6 transition-colors duration-200 ${isActive('/investments') ? 'text-finance-blue' : 'text-white'}`} />
            {isActive('/investments') && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-finance-blue rounded-full" />
            )}
          </div>
          <span className={`text-xs mt-1 transition-colors duration-200 ${isActive('/investments') ? 'text-finance-blue font-medium' : 'text-white'}`}>Investir</span>
        </button>
        
        {/* Fluxo */}
        <button 
          className="flex flex-col items-center justify-center px-2 transition-all duration-200 hover:scale-110"
          onClick={() => handleNavigation('/cashflow')}
        >
          <div className="relative">
            <ArrowUpDown className={`w-6 h-6 transition-colors duration-200 ${isActive('/cashflow') ? 'text-finance-blue' : 'text-white'}`} />
            {isActive('/cashflow') && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-finance-blue rounded-full" />
            )}
          </div>
          <span className={`text-xs mt-1 transition-colors duration-200 ${isActive('/cashflow') ? 'text-finance-blue font-medium' : 'text-white'}`}>Fluxo</span>
        </button>
        
        {/* Configurações */}
        <button 
          className="flex flex-col items-center justify-center px-2 transition-all duration-200 hover:scale-110"
          onClick={() => handleNavigation('/settings')}
        >
          <div className="relative">
            <Settings className={`w-6 h-6 transition-colors duration-200 ${isActive('/settings') ? 'text-finance-blue' : 'text-white'}`} />
            {isActive('/settings') && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-finance-blue rounded-full" />
            )}
          </div>
          <span className={`text-xs mt-1 transition-colors duration-200 ${isActive('/settings') ? 'text-finance-blue font-medium' : 'text-white'}`}>Config.</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
