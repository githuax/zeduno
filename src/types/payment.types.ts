export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'cash' | 'digital_wallet' | 'bank_transfer' | 'gift_card';
  name: string;
  isEnabled: boolean;
  processingFee: number;
  icon: string;
  provider?: string;
  configuration?: Record<string, any>;
}

export interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  timestamp: Date;
  customerName?: string;
  description?: string;
  reference?: string;
  fees: TransactionFees;
  refunds?: Refund[];
}

export interface TransactionFees {
  processingFee: number;
  serviceFee: number;
  totalFees: number;
}

export interface Refund {
  id: string;
  amount: number;
  reason: string;
  timestamp: Date;
  processedBy: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  orderId: string;
  customerInfo: CustomerInfo;
  metadata?: Record<string, any>;
}

export interface CustomerInfo {
  name: string;
  email?: string;
  phone?: string;
  address?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentSettings {
  acceptedPaymentMethods: string[];
  currency: string;
  taxRate: number;
  tipOptions: number[];
  minimumAmount: number;
  maximumAmount: number;
  autoSettlement: boolean;
  requireSignature: boolean;
  requireReceipt: boolean;
}

export interface DailySettlement {
  date: string;
  totalTransactions: number;
  totalAmount: number;
  totalFees: number;
  netAmount: number;
  paymentBreakdown: PaymentBreakdown[];
  status: 'pending' | 'processing' | 'completed';
}

export interface PaymentBreakdown {
  paymentMethod: string;
  transactionCount: number;
  totalAmount: number;
  fees: number;
  netAmount: number;
}

export interface PaymentAnalytics {
  totalProcessed: number;
  transactionCount: number;
  averageTransaction: number;
  totalFees: number;
  netRevenue: number;
  paymentMethodStats: PaymentMethodStats[];
  declineRate: number;
  refundRate: number;
}

export interface PaymentMethodStats {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface PaymentProvider {
  id: string;
  name: string;
  isEnabled: boolean;
  apiKey?: string;
  secretKey?: string;
  webhookUrl?: string;
  supportedMethods: string[];
  fees: ProviderFees;
}

export interface ProviderFees {
  creditCard: number;
  debitCard: number;
  digitalWallet: number;
  bankTransfer: number;
}