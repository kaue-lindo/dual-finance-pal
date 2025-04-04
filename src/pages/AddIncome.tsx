import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ArrowLeft, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useFinance } from '@/context/FinanceContext';
import { toast } from 'sonner';

const formSchema = z.object({
  description: z.string().min(1, { message: 'A descrição é obrigatória' }),
  amount: z.string().min(1, { message: 'O valor é obrigatório' }),
  date: z.date(),
  category: z.string().min(1, { message: 'A categoria é obrigatória' }),
  recurring: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

const AddIncome = () => {
  const { addIncome, getIncomeCategories } = useFinance();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const categories = getIncomeCategories();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: '',
      date: new Date(),
      category: 'salary',
      recurring: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      const amount = Number(values.amount);
      
      if (isNaN(amount) || amount <= 0) {
        toast.error('Valor inválido');
        setIsLoading(false);
        return;
      }
      
      await addIncome({
        description: values.description,
        amount: amount,
        date: values.date,
        category: values.category as any,
        recurring: values.recurring,
      });
      
      toast.success('Entrada adicionada com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error adding income:', error);
      toast.error('Erro ao adicionar entrada');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-finance-dark">
      {/* Header */}
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Adicionar Entrada</h1>
          <div className="w-9"></div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-6">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Descrição</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Salário" className="bg-finance-dark-card text-white border-finance-dark-lighter" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Valor (R$)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="0,00" 
                    className="bg-finance-dark-card text-white border-finance-dark-lighter" 
                    inputMode="decimal"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Data de recebimento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full flex justify-between items-center bg-finance-dark-card text-white border-finance-dark-lighter",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione a data</span>}
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
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Categoria</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-finance-dark-card text-white border-finance-dark-lighter">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
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
            control={form.control}
            name="recurring"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-4 rounded-lg bg-finance-dark-card border border-finance-dark-lighter">
                <div className="flex items-center gap-2">
                  <CalendarClock size={20} className="text-finance-blue" />
                  <FormLabel className="text-white !m-0">Entrada recorrente (mensal)</FormLabel>
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

          <Button type="submit" className="w-full finance-btn" disabled={isLoading}>
            {isLoading ? 'Adicionando...' : 'Adicionar Entrada'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default AddIncome;
