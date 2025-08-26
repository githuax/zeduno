import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Transaction, 
  PaymentMethod, 
  PaymentIntent, 
  PaymentSettings, 
  DailySettlement, 
  PaymentAnalytics,
  PaymentProvider,
  Refund
} from '@/types/payment.types';

// Mock data generators
const generateMockPaymentMethods = (): PaymentMethod[] => [
  {
    id: '1',
    type: 'credit_card',
    name: 'Credit Card',
    isEnabled: true,
    processingFee: 2.9,
    icon: 'credit-card',
    provider: 'Stripe'
  },
  {
    id: '2',
    type: 'debit_card',
    name: 'Debit Card',
    isEnabled: true,
    processingFee: 1.5,
    icon: 'credit-card',
    provider: 'Square'
  },
  {
    id: '3',
    type: 'cash',
    name: 'Cash',
    isEnabled: true,
    processingFee: 0,
    icon: 'banknote',
    provider: 'In-house'
  },
  {
    id: '4',
    type: 'digital_wallet',
    name: 'Digital Wallet',
    isEnabled: true,
    processingFee: 2.1,
    icon: 'smartphone',
    provider: 'PayPal'
  },
  {
    id: '5',
    type: 'bank_transfer',
    name: 'Bank Transfer',
    isEnabled: false,
    processingFee: 0.8,
    icon: 'building-2',
    provider: 'ACH'
  },
  {
    id: '6',
    type: 'gift_card',
    name: 'Gift Card',
    isEnabled: true,
    processingFee: 0,
    icon: 'gift',
    provider: 'In-house'
  }
];

const generateMockTransactions = (): Transaction[] => {
  const paymentMethods = generateMockPaymentMethods();
  const statuses: Transaction['status'][] = ['completed', 'completed', 'completed', 'completed', 'pending', 'failed'];
  
  return Array.from({ length: 50 }, (_, i) => {
    const amount = Math.floor(Math.random() * 150) + 15;
    const processingFee = amount * (Math.random() * 0.03);
    const serviceFee = 0.30;
    
    return {
      id: `txn_${String(i + 1).padStart(6, '0')}`,
      orderId: `ord_${String(i + 1).padStart(4, '0')}`,
      amount,
      currency: 'USD',
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
      customerName: `Customer ${i + 1}`,
      description: `Order payment #${i + 1}`,
      reference: `ref_${Date.now() + i}`,
      fees: {
        processingFee,
        serviceFee,
        totalFees: processingFee + serviceFee
      }
    };
  });
};

const generateMockPaymentAnalytics = (): PaymentAnalytics => {
  const transactions = generateMockTransactions();
  const completedTransactions = transactions.filter(t => t.status === 'completed');
  
  const totalProcessed = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalFees = completedTransactions.reduce((sum, t) => sum + t.fees.totalFees, 0);
  
  const paymentMethodStats = generateMockPaymentMethods().map(method => {
    const methodTransactions = completedTransactions.filter(t => t.paymentMethod.type === method.type);
    const amount = methodTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      method: method.name,
      count: methodTransactions.length,
      amount,
      percentage: totalProcessed > 0 ? (amount / totalProcessed) * 100 : 0
    };
  });

  return {
    totalProcessed,
    transactionCount: completedTransactions.length,
    averageTransaction: completedTransactions.length > 0 ? totalProcessed / completedTransactions.length : 0,
    totalFees,
    netRevenue: totalProcessed - totalFees,
    paymentMethodStats,
    declineRate: 2.3,
    refundRate: 1.1
  };
};

const generateMockSettings = (): PaymentSettings => ({
  acceptedPaymentMethods: ['credit_card', 'debit_card', 'cash', 'digital_wallet'],
  currency: 'USD',
  taxRate: 8.5,
  tipOptions: [15, 18, 20, 25],
  minimumAmount: 1,
  maximumAmount: 5000,
  autoSettlement: true,
  requireSignature: true,
  requireReceipt: true
});

// Custom hooks
export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No auth token found, using mock data');
        return generateMockPaymentMethods();
      }

      try {
        const response = await fetch('http://localhost:5000/api/payments/methods', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          console.error('Payment methods API failed:', response.status, response.statusText);
          // Fallback to mock data if API fails
          return generateMockPaymentMethods();
        }
        
        const data = await response.json();
        console.log('Payment methods from API:', data);
        
        // If the API returns an array, use it directly
        if (Array.isArray(data)) {
          return data;
        }
        
        // If no payment methods are returned or empty array, show mock data as fallback
        if (!data || (Array.isArray(data) && data.length === 0)) {
          console.log('No payment methods configured, showing mock data');
          return generateMockPaymentMethods();
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        // Fallback to mock data on network error
        return generateMockPaymentMethods();
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

export const useTransactions = (filters?: { status?: string; startDate?: Date; endDate?: Date }) => {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => {
      let transactions = generateMockTransactions();
      
      if (filters?.status) {
        transactions = transactions.filter(t => t.status === filters.status);
      }
      
      if (filters?.startDate) {
        transactions = transactions.filter(t => t.timestamp >= filters.startDate!);
      }
      
      if (filters?.endDate) {
        transactions = transactions.filter(t => t.timestamp <= filters.endDate!);
      }
      
      return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    },
    refetchInterval: 30000,
    staleTime: 15000
  });
};

export const usePaymentAnalytics = () => {
  return useQuery({
    queryKey: ['payment-analytics'],
    queryFn: () => generateMockPaymentAnalytics(),
    refetchInterval: 60000,
    staleTime: 30000
  });
};

export const usePaymentSettings = () => {
  return useQuery({
    queryKey: ['payment-settings'],
    queryFn: () => generateMockSettings(),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });
};

export const useProcessPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paymentIntent: PaymentIntent) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success/failure (90% success rate)
      const success = Math.random() > 0.1;
      
      if (!success) {
        throw new Error('Payment failed. Please try again.');
      }
      
      return {
        id: `txn_${Date.now()}`,
        status: 'completed',
        amount: paymentIntent.amount,
        timestamp: new Date()
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['payment-analytics'] });
    }
  });
};

export const useRefundTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ transactionId, amount, reason }: { transactionId: string; amount: number; reason: string }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        id: `ref_${Date.now()}`,
        amount,
        reason,
        timestamp: new Date(),
        processedBy: 'Current User',
        status: 'completed' as const
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['payment-analytics'] });
    }
  });
};

export const useUpdatePaymentSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Partial<PaymentSettings>) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-settings'] });
    }
  });
};

export const useTogglePaymentMethod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ methodId, enabled }: { methodId: string; enabled: boolean }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { methodId, enabled };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    }
  });
};

export const useDailySettlement = (date: string) => {
  return useQuery({
    queryKey: ['daily-settlement', date],
    queryFn: () => {
      const transactions = generateMockTransactions().filter(t => 
        t.timestamp.toDateString() === new Date(date).toDateString() && 
        t.status === 'completed'
      );
      
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const totalFees = transactions.reduce((sum, t) => sum + t.fees.totalFees, 0);
      
      const paymentBreakdown = generateMockPaymentMethods().map(method => {
        const methodTransactions = transactions.filter(t => t.paymentMethod.type === method.type);
        const amount = methodTransactions.reduce((sum, t) => sum + t.amount, 0);
        const fees = methodTransactions.reduce((sum, t) => sum + t.fees.totalFees, 0);
        
        return {
          paymentMethod: method.name,
          transactionCount: methodTransactions.length,
          totalAmount: amount,
          fees,
          netAmount: amount - fees
        };
      }).filter(breakdown => breakdown.transactionCount > 0);
      
      const settlement: DailySettlement = {
        date,
        totalTransactions: transactions.length,
        totalAmount,
        totalFees,
        netAmount: totalAmount - totalFees,
        paymentBreakdown,
        status: 'completed'
      };
      
      return settlement;
    },
    staleTime: 5 * 60 * 1000
  });
};