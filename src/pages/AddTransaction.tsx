import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ArrowLeft, CalendarClock, TrendingUp, TrendingDown, RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFinance } from '@/context/FinanceContext';
import { toast } from 'sonner';
import { IncomeCategory } from '@/context/finance/types';

const incomeFormSchema = z.object({
  description: z.string().min(1, { message: 'A descrição é obrigatória' }),
  amount: z.string().min(1, { message: 'O valor é obrigatório' }),
  date: z.date(),
  category: z.string().min(1, { message: 'A categoria é obrigatória' }),
  recurring: z.boolean().default(false),
  recurrenceType: z.enum(['daily', 'weekly', 'monthly']).optional(),
  weekdays: z.array(z.number()).optional(),
  monthlyDay: z.number().optional(),
});

const expenseFormSchema = z.object({
  description: z.string().min(1, { message: 'A descrição é obrigatória' }),
  amount: z.string().min(1, { message: 'O valor é obrigatório' }),
  date: z.date(),
  category: z.string().min(1, { message: 'A categoria é obrigatória' }),
  recurring: z.boolean().default(false),
  recurrenceType: z.enum(['daily', 'weekly', 'monthly']).optional(),
  weekdays: z.array(z.number()).optional(),
  monthlyDay: z.number().optional(),
});

type IncomeFormValues = z.infer<typeof incomeFormSchema>;
type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

const AddTransaction = () => {
  const { addIncome, addExpense, getIncomeCategories, getExpenseCategories } = useFinance();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('income');
  const [isLoading, setIsLoading] = useState(false);
  
  const incomeCategories = getIncomeCategories();
  const expenseCategories = getExpenseCategories();

  const incomeForm = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      description: '',
      amount: '',
      date: new Date(),
      category: 'salary',
      recurring: false,
      recurrenceType: 'monthly',
      weekdays: [],
      monthlyDay: 1,
    },
  });

  const expenseForm = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: '',
      amount: '',
      date: new Date(),
      category: 'food',
      recurring: false,
      recurrenceType: 'monthly',
      weekdays: [],
      monthlyDay: 1,
    },
  });

  const onSubmitIncome = async (data: IncomeFormValues) => {
    setIsLoading(true);
    try {
      const amount = parseFloat(data.amount.replace(',', '.'));
      
      if (isNaN(amount)) {
        toast.error('Valor inválido');
        return;
      }
      
      await addIncome({
        description: data.description,
        amount,
        date: data.date,
        category: data.category as IncomeCategory,
        recurring: data.recurring ? {
          type: data.recurrenceType || 'monthly',
          days: data.recurrenceType === 'weekly' ? data.weekdays : 
                data.recurrenceType === 'monthly' ? [data.monthlyDay || 1] : undefined
        } : undefined
      });
      
      toast.success('Entrada adicionada com sucesso!');
      navigate('/transactions');
    } catch (error) {
      console.error('Error adding income:', error);
      toast.error('Erro ao adicionar entrada');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitExpense = async (data: ExpenseFormValues) => {
    setIsLoading(true);
    try {
      const amount = parseFloat(data.amount.replace(',', '.'));
      
      if (isNaN(amount)) {
        toast.error('Valor inválido');
        return;
      }
      
      await addExpense({
        description: data.description,
        amount,
        date: data.date,
        category: data.category,
        recurring: data.recurring ? {
          type: data.recurrenceType || 'monthly',
          days: data.recurrenceType === 'weekly' ? data.weekdays : 
                data.recurrenceType === 'monthly' ? [data.monthlyDay || 1] : undefined
        } : undefined
      });
      
      toast.success('Despesa adicionada com sucesso!');
      navigate('/transactions');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Erro ao adicionar despesa');
    } finally {
      setIsLoading(false);
    }
  };

  const weekdays = [
    { id: 0, label: 'Dom' },
    { id: 1, label: 'Seg' },
    { id: 2, label: 'Ter' },
    { id: 3, label: 'Qua' },
    { id: 4, label: 'Qui' },
    { id: 5, label: 'Sex' },
    { id: 6, label: 'Sáb' },
  ];

  return (
    <div className="min-h-screen bg-finance-dark p-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2" 
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Button>
        <h1 className="text-2xl font-bold text-white">Adicionar Transação</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="income" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Entrada</span>
          </TabsTrigger>
          <TabsTrigger value="expense" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            <span>Despesa</span>
          </TabsTrigger>
        </TabsList>

        {/* Formulário de Entrada */}
        <TabsContent value="income" className="mt-4">
          <Form {...incomeForm}>
            <form onSubmit={incomeForm.handleSubmit(onSubmitIncome)} className="space-y-6">
              <FormField
                control={incomeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Descrição</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Salário" 
                        className="bg-finance-dark-card border-finance-dark-lighter text-white"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={incomeForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Valor (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 1000,00" 
                        className="bg-finance-dark-card border-finance-dark-lighter text-white"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={incomeForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-white">Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal bg-finance-dark-card border-finance-dark-lighter text-white",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={incomeForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Categoria</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-finance-dark-card border-finance-dark-lighter text-white">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-finance-dark-card border-finance-dark-lighter text-white">
                        {incomeCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={incomeForm.control}
                name="recurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-finance-dark-lighter p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-white">Recorrente</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {incomeForm.watch('recurring') && (
                <FormField
                  control={incomeForm.control}
                  name="recurrenceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Tipo de Recorrência</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="daily" id="income-daily" />
                            </FormControl>
                            <FormLabel className="font-normal text-white" htmlFor="income-daily">
                              <div className="flex items-center">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Diário
                              </div>
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="weekly" id="income-weekly" />
                            </FormControl>
                            <FormLabel className="font-normal text-white" htmlFor="income-weekly">
                              <div className="flex items-center">
                                <CalendarClock className="h-4 w-4 mr-2" />
                                Semanal
                              </div>
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="monthly" id="income-monthly" />
                            </FormControl>
                            <FormLabel className="font-normal text-white" htmlFor="income-monthly">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                Mensal
                              </div>
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {incomeForm.watch('recurring') && incomeForm.watch('recurrenceType') === 'weekly' && (
                <FormField
                  control={incomeForm.control}
                  name="weekdays"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-white">Dias da Semana</FormLabel>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {weekdays.map((day) => (
                          <FormField
                            key={day.id}
                            control={incomeForm.control}
                            name="weekdays"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={day.id}
                                  className="flex flex-row items-start space-x-2"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(day.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value || [], day.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== day.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-white font-normal">
                                    {day.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {incomeForm.watch('recurring') && incomeForm.watch('recurrenceType') === 'monthly' && (
                <FormField
                  control={incomeForm.control}
                  name="monthlyDay"
                  render={({ field }) => {
                    // Usar o dia da data selecionada automaticamente
                    const selectedDate = incomeForm.watch('date');
                    const dayOfMonth = selectedDate.getDate();
                    
                    // Atualizar o valor do campo para o dia da data selecionada
                    React.useEffect(() => {
                      field.onChange(dayOfMonth);
                    }, [dayOfMonth, field]);
                    
                    return (
                      <FormItem>
                        <FormLabel className="text-white">Dia do Mês</FormLabel>
                        <div className="space-y-2">
                          <div className="text-white bg-finance-dark-card border border-finance-dark-lighter rounded-md p-3">
                            Será usado o dia {dayOfMonth} de cada mês (mesmo dia da data selecionada)
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-finance-blue hover:bg-finance-blue/90"
                disabled={isLoading}
              >
                {isLoading ? 'Adicionando...' : 'Adicionar Entrada'}
              </Button>
            </form>
          </Form>
        </TabsContent>

        {/* Formulário de Despesa */}
        <TabsContent value="expense" className="mt-4">
          <Form {...expenseForm}>
            <form onSubmit={expenseForm.handleSubmit(onSubmitExpense)} className="space-y-6">
              <FormField
                control={expenseForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Descrição</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Aluguel" 
                        className="bg-finance-dark-card border-finance-dark-lighter text-white"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={expenseForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Valor (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 1000,00" 
                        className="bg-finance-dark-card border-finance-dark-lighter text-white"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={expenseForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-white">Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal bg-finance-dark-card border-finance-dark-lighter text-white",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={expenseForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Categoria</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-finance-dark-card border-finance-dark-lighter text-white">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-finance-dark-card border-finance-dark-lighter text-white">
                        {expenseCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={expenseForm.control}
                name="recurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-finance-dark-lighter p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-white">Recorrente</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {expenseForm.watch('recurring') && (
                <FormField
                  control={expenseForm.control}
                  name="recurrenceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Tipo de Recorrência</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="daily" id="daily" />
                            </FormControl>
                            <FormLabel className="font-normal text-white" htmlFor="daily">
                              <div className="flex items-center">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Diário
                              </div>
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="weekly" id="weekly" />
                            </FormControl>
                            <FormLabel className="font-normal text-white" htmlFor="weekly">
                              <div className="flex items-center">
                                <CalendarClock className="h-4 w-4 mr-2" />
                                Semanal
                              </div>
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="monthly" id="monthly" />
                            </FormControl>
                            <FormLabel className="font-normal text-white" htmlFor="monthly">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                Mensal
                              </div>
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {expenseForm.watch('recurring') && expenseForm.watch('recurrenceType') === 'weekly' && (
                <FormField
                  control={expenseForm.control}
                  name="weekdays"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-white">Dias da Semana</FormLabel>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {weekdays.map((day) => (
                          <FormField
                            key={day.id}
                            control={expenseForm.control}
                            name="weekdays"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={day.id}
                                  className="flex flex-row items-start space-x-2"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(day.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value || [], day.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== day.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-white font-normal">
                                    {day.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {expenseForm.watch('recurring') && expenseForm.watch('recurrenceType') === 'monthly' && (
                <FormField
                  control={expenseForm.control}
                  name="monthlyDay"
                  render={({ field }) => {
                    // Usar o dia da data selecionada automaticamente
                    const selectedDate = expenseForm.watch('date');
                    const dayOfMonth = selectedDate.getDate();
                    
                    // Atualizar o valor do campo para o dia da data selecionada
                    React.useEffect(() => {
                      field.onChange(dayOfMonth);
                    }, [dayOfMonth, field]);
                    
                    return (
                      <FormItem>
                        <FormLabel className="text-white">Dia do Mês</FormLabel>
                        <div className="space-y-2">
                          <div className="text-white bg-finance-dark-card border border-finance-dark-lighter rounded-md p-3">
                            Será usado o dia {dayOfMonth} de cada mês (mesmo dia da data selecionada)
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-finance-blue hover:bg-finance-blue/90"
                disabled={isLoading}
              >
                {isLoading ? 'Adicionando...' : 'Adicionar Despesa'}
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddTransaction;
