import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Transaction } from "@/types/payment.types";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  RefreshCw, 
  Eye, 
  Receipt,
  CreditCard
} from "lucide-react";

interface PaymentStatusCardProps {
  transaction: Transaction;
  onViewDetails?: () => void;
  onRefund?: () => void;
  onViewReceipt?: () => void;
}

export const PaymentStatusCard = ({ 
  transaction, 
  onViewDetails, 
  onRefund, 
  onViewReceipt 
}: PaymentStatusCardProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'refunded':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
      case 'processing':
        return 'secondary';
      case 'failed':
      case 'cancelled':
        return 'destructive';
      case 'refunded':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (date: Date) => date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-mono">{transaction.id}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <CreditCard className="h-4 w-4" />
              {transaction.paymentMethod.name} • Order #{transaction.orderId}
            </CardDescription>
          </div>
          <Badge variant={getStatusColor(transaction.status)} className="flex items-center gap-1">
            {getStatusIcon(transaction.status)}
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="text-xl font-bold">{formatCurrency(transaction.amount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="font-medium">{transaction.customerName || 'N/A'}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date:</span>
            <span>{formatDate(transaction.timestamp)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Processing Fee:</span>
            <span>{formatCurrency(transaction.fees.processingFee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Reference:</span>
            <span className="font-mono text-xs">{transaction.reference}</span>
          </div>
        </div>

        {transaction.refunds && transaction.refunds.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium text-blue-600">Refunded</p>
            <div className="text-sm text-muted-foreground">
              {transaction.refunds.map((refund, index) => (
                <div key={index} className="flex justify-between">
                  <span>{refund.reason}</span>
                  <span>{formatCurrency(refund.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails} className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Details
            </Button>
          )}
          
          {transaction.status === 'completed' && onRefund && (
            <Button variant="outline" size="sm" onClick={onRefund} className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Refund
            </Button>
          )}
          
          {(transaction.status === 'completed' || transaction.status === 'refunded') && onViewReceipt && (
            <Button variant="outline" size="sm" onClick={onViewReceipt} className="flex items-center gap-1">
              <Receipt className="h-3 w-3" />
              Receipt
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};