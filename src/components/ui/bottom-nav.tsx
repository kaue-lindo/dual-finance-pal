import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Users, ArrowUpDown, Plus, TrendingUp, Calculator, Settings } from 'lucide-react';

const BottomNav = ({ currentPath }: { currentPath: string }) => {
  const navigate = useNavigate();
  
  return (
    <nav className="glass-nav fixed bottom-0 left-0 right-0 h-16 bg-finance-dark-card border-t border-gray-800 flex justify-around items-center z-50">
      <button
        onClick={() => navigate('/dashboard')}
        className={`flex flex-col items-center justify-center w-full h-full ${
          currentPath === '/dashboard' ? 'text-finance-blue' : 'text-gray-400'
        }`}
      >
        <Home size={20} />
        <span className="text-xs mt-1">Início</span>
      </button>
      
      <button
        onClick={() => navigate('/user-comparison')}
        className={`flex flex-col items-center justify-center w-full h-full ${
          currentPath === '/user-comparison' ? 'text-finance-blue' : 'text-gray-400'
        }`}
      >
        <Users size={20} />
        <span className="text-xs mt-1">Comparar</span>
      </button>

      <button
        onClick={() => navigate('/transactions')}
        className={`flex flex-col items-center justify-center w-full h-full ${
          ['/transactions', '/expenses', '/cashflow'].includes(currentPath) ? 'text-finance-blue' : 'text-gray-400'
        }`}
      >
        <ArrowUpDown size={20} />
        <span className="text-xs mt-1">Transações</span>
      </button>
      
      <button
        onClick={() => navigate('/add-transaction')}
        className={`flex flex-col items-center justify-center w-full h-full ${
          currentPath === '/add-transaction' ? 'text-finance-blue' : 'text-gray-400'
        }`}
      >
        <Plus size={20} className="bg-finance-blue text-white p-1 rounded-full" />
        <span className="text-xs mt-1">Adicionar</span>
      </button>
      
      <button
        onClick={() => navigate('/investments')}
        className={`flex flex-col items-center justify-center w-full h-full ${
          currentPath === '/investments' ? 'text-finance-blue' : 'text-gray-400'
        }`}
      >
        <TrendingUp size={20} />
        <span className="text-xs mt-1">Investir</span>
      </button>
      
      <button
        onClick={() => navigate('/simulator')}
        className={`flex flex-col items-center justify-center w-full h-full ${
          currentPath === '/simulator' ? 'text-finance-blue' : 'text-gray-400'
        }`}
      >
        <Calculator size={20} />
        <span className="text-xs mt-1">Fluxo</span>
      </button>
      
      <button
        onClick={() => navigate('/settings')}
        className={`flex flex-col items-center justify-center w-full h-full ${
          currentPath === '/settings' ? 'text-finance-blue' : 'text-gray-400'
        }`}
      >
        <Settings size={20} />
        <span className="text-xs mt-1">Config</span>
      </button>
    </nav>
  );
};

export default BottomNav;
