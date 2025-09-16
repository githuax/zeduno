import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  RefreshCw, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowLeft,
  Receipt
} from "lucide-react";
import { useState } from 'react';
import { DateRange } from "react-day-picker";
import { useNavigate } from "react-router-dom";

import Header from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTransactions, useRefundTransaction } from "@/hooks/usePayments";

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  const { data: transactions, isLoading, refetch } = useTransactions({
    status: statusFilter === 'all' ? undefined : statusFilter,
    startDate: dateRange?.from,
    endDate: dateRange?.to
  });
  
  const refundTransaction = useRefundTransaction();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'outline';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'secondary';
      case 'refunded':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (date: Date) => date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

  const filteredTransactions = transactions?.filter(transaction => {
    const matchesSearch = 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleRefund = async (transactionId: string, amount: number) => {
    try {
      await refundTransaction.mutateAsync({
        transactionId,
        amount,
        reason: 'Customer refund request'
      });
      refetch();
    } catch (error) {
      console.error('Refund failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/payments")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Payments
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
              <p className="text-muted-foreground">
                View and manage all payment transactions
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {transactions?.filter(t => t.status === 'completed').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {transactions?.filter(t => t.status === 'pending').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {transactions?.filter(t => t.status === 'failed').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by ID, order, customer, or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>

              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions ({filteredTransactions?.length || 0})</CardTitle>
            <CardDescription>Complete list of payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions?.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm">
                      {transaction.id}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {transaction.orderId}
                    </TableCell>
                    <TableCell>{transaction.customerName || 'N/A'}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {transaction.paymentMethod.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(transaction.status)} className="flex items-center gap-1 w-fit">
                        {getStatusIcon(transaction.status)}
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(transaction.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedTransaction(transaction)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Transaction Details</DialogTitle>
                              <DialogDescription>
                                Complete information for transaction {selectedTransaction?.id}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedTransaction && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <div>
                                      <h3 className="font-medium mb-2">Transaction Info</h3>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">ID:</span>
                                          <span className="font-mono">{selectedTransaction.id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Order ID:</span>
                                          <span className="font-mono">{selectedTransaction.orderId}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Reference:</span>
                                          <span className="font-mono">{selectedTransaction.reference}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Status:</span>
                                          <Badge variant={getStatusColor(selectedTransaction.status)}>
                                            {selectedTransaction.status}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <h3 className="font-medium mb-2">Customer Info</h3>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Name:</span>
                                          <span>{selectedTransaction.customerName || 'N/A'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <div>
                                      <h3 className="font-medium mb-2">Payment Details</h3>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Method:</span>
                                          <span>{selectedTransaction.paymentMethod.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Provider:</span>
                                          <span>{selectedTransaction.paymentMethod.provider}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Currency:</span>
                                          <span>{selectedTransaction.currency}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Date:</span>
                                          <span>{formatDate(selectedTransaction.timestamp)}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <h3 className="font-medium mb-2">Amount Breakdown</h3>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Subtotal:</span>
                                          <span>{formatCurrency(selectedTransaction.amount - selectedTransaction.fees.totalFees)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Processing Fee:</span>
                                          <span>{formatCurrency(selectedTransaction.fees.processingFee)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Service Fee:</span>
                                          <span>{formatCurrency(selectedTransaction.fees.serviceFee)}</span>
                                        </div>
                                        <div className="flex justify-between font-medium border-t pt-2">
                                          <span>Total:</span>
                                          <span>{formatCurrency(selectedTransaction.amount)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {selectedTransaction.status === 'completed' && (
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      className="flex items-center gap-2"
                                      onClick={() => handleRefund(selectedTransaction.id, selectedTransaction.amount)}
                                      disabled={refundTransaction.isPending}
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                      Process Refund
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      className="flex items-center gap-2"
                                    >
                                      <Receipt className="h-4 w-4" />
                                      View Receipt
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TransactionHistory;