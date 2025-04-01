import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FinanceProvider, useFinance } from "@/context/FinanceContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddIncome from "./pages/AddIncome";
import Expenses from "./pages/Expenses";
import Investments from "./pages/Investments";
import Simulator from "./pages/Simulator";
import NotFound from "./pages/NotFound";
import AllTransactions from './pages/AllTransactions';
import Settings from './pages/Settings';
import Transactions from './pages/Transactions';
import CashFlow from './pages/CashFlow';
import InvestmentReturns from './pages/InvestmentReturns';
import UserComparison from './pages/UserComparison';
import AddTransaction from './pages/AddTransaction';
import { SimulationPage } from './pages/SimulationPage';
import { useEffect } from "react";

const queryClient = new QueryClient();

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, selectedProfile, loading } = useFinance();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-finance-dark">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-finance-blue"></div>
    </div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!selectedProfile) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// App Routes component to use useFinance hook
const AppRoutes = () => {
  const { isAuthenticated, selectedProfile } = useFinance();
  
  // Redirect to dashboard if already authenticated and profile selected
  useEffect(() => {
    if (isAuthenticated && selectedProfile && window.location.pathname === '/login') {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated, selectedProfile]);
  
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/transactions" element={
        <ProtectedRoute>
          <Transactions />
        </ProtectedRoute>
      } />
      
      <Route path="/add-income" element={
        <ProtectedRoute>
          <AddIncome />
        </ProtectedRoute>
      } />
      
      <Route path="/add-transaction" element={
        <ProtectedRoute>
          <AddTransaction />
        </ProtectedRoute>
      } />
      
      <Route path="/expenses" element={
        <ProtectedRoute>
          <Expenses />
        </ProtectedRoute>
      } />
      
      <Route path="/investments" element={
        <ProtectedRoute>
          <Investments />
        </ProtectedRoute>
      } />
      
      <Route path="/simulator" element={
        <ProtectedRoute>
          <Simulator />
        </ProtectedRoute>
      } />
      
      <Route path="/simulation-page" element={
        <ProtectedRoute>
          <SimulationPage />
        </ProtectedRoute>
      } />
      
      <Route path="/all-transactions" element={
        <ProtectedRoute>
          <AllTransactions />
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      
      <Route path="/cashflow" element={
        <ProtectedRoute>
          <CashFlow />
        </ProtectedRoute>
      } />
      
      <Route path="/investment-returns" element={
        <ProtectedRoute>
          <InvestmentReturns />
        </ProtectedRoute>
      } />
      
      <Route path="/user-comparison" element={
        <ProtectedRoute>
          <UserComparison />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FinanceProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </FinanceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
