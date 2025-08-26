import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Timer, 
  Users, 
  Package, 
  Truck,
  RefreshCw,
  Volume2,
  VolumeX
} from "lucide-react";
import { getApiUrl } from "@/config/api";
import { formatCurrency } from '@/utils/currency';

interface KitchenOrder {
  _id: string;
  orderNumber: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  status: 'confirmed' | 'preparing' | 'ready';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tableNumber?: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    customizations?: Array<{ name: string; value: string; }>;
    specialInstructions?: string;
    status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  }>;
  kitchenNotes?: string;
  estimatedTime?: string;
  preparationTime?: number;
  createdAt: string;
}

const KitchenDisplay: React.FC = () => {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);

  const fetchKitchenOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('orders/kitchen/orders'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newOrders = data.orders || [];
        
        // Play sound notification for new orders
        if (soundEnabled && newOrders.length > lastOrderCount && lastOrderCount > 0) {
          playNotificationSound();
        }
        
        setOrders(newOrders);
        setLastOrderCount(newOrders.length);
      }
    } catch (error) {
      console.error('Error fetching kitchen orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const playNotificationSound = () => {
    // Create a simple notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`orders/${orderId}/status`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, notes: `Status updated from kitchen` })
      });

      if (response.ok) {
        fetchKitchenOrders();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchKitchenOrders, 15000);
    
    return () => clearInterval(interval);
  }, [soundEnabled, lastOrderCount]);

  const getTimeElapsed = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 min ago';
    return `${diffMinutes} mins ago`;
  };

  const getTimeColor = (createdAt: string, preparationTime?: number) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    const maxTime = preparationTime || 30;
    
    if (diffMinutes > maxTime + 10) return 'text-red-600'; // Very late
    if (diffMinutes > maxTime) return 'text-orange-600'; // Late
    if (diffMinutes > maxTime * 0.8) return 'text-yellow-600'; // Warning
    return 'text-green-600'; // On time
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      normal: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      confirmed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      preparing: 'bg-orange-100 text-orange-800 border-orange-200',
      ready: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[status as keyof typeof colors] || colors.confirmed;
  };

  const getOrderTypeIcon = (orderType: string) => {
    switch (orderType) {
      case 'dine-in':
        return <Users className="h-4 w-4" />;
      case 'takeaway':
        return <Package className="h-4 w-4" />;
      case 'delivery':
        return <Truck className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const confirmedOrders = orders.filter(order => order.status === 'confirmed');
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  const readyOrders = orders.filter(order => order.status === 'ready');

  const KitchenOrderCard: React.FC<{ order: KitchenOrder }> = ({ order }) => (
    <Card className={`relative ${getStatusColor(order.status)} border-2 transition-all duration-300 hover:shadow-lg`}>
      {order.priority === 'urgent' && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1">
          <AlertTriangle className="h-3 w-3" />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-bold">{order.orderNumber}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                {getOrderTypeIcon(order.orderType)}
                <span className="capitalize">{order.orderType}</span>
              </div>
              {order.tableNumber && (
                <Badge variant="outline" className="text-xs">
                  Table {order.tableNumber}
                </Badge>
              )}
              {order.priority !== 'normal' && (
                <Badge className={`text-xs ${getPriorityColor(order.priority)}`}>
                  {order.priority.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-sm font-medium ${getTimeColor(order.createdAt, order.preparationTime)}`}>
              <Clock className="h-4 w-4 inline mr-1" />
              {getTimeElapsed(order.createdAt)}
            </div>
            {order.preparationTime && (
              <div className="text-xs text-gray-500">
                Est. {order.preparationTime} mins
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-3">
          <p className="font-medium text-gray-900">{order.customerName}</p>
        </div>

        <div className="space-y-2 mb-4">
          {order.items.map((item, index) => (
            <div key={index} className="bg-white bg-opacity-50 rounded p-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="font-medium text-gray-900">
                    {item.quantity}x {item.name}
                  </span>
                  
                  {item.customizations && item.customizations.length > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      {item.customizations.map((custom, idx) => (
                        <div key={idx}>• {custom.name}: {custom.value}</div>
                      ))}
                    </div>
                  )}
                  
                  {item.specialInstructions && (
                    <div className="text-xs text-red-600 mt-1 font-medium">
                      ⚠️ {item.specialInstructions}
                    </div>
                  )}
                </div>
                
                <Badge 
                  variant={item.status === 'ready' ? 'default' : 'secondary'}
                  className="text-xs ml-2"
                >
                  {item.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {order.kitchenNotes && (
          <div className="mb-4 p-2 bg-yellow-50 rounded text-sm">
            <strong>Kitchen Notes:</strong> {order.kitchenNotes}
          </div>
        )}

        <div className="flex gap-2">
          {order.status === 'confirmed' && (
            <Button
              className="flex-1"
              onClick={() => updateOrderStatus(order._id, 'preparing')}
            >
              Start Preparing
            </Button>
          )}
          
          {order.status === 'preparing' && (
            <Button
              className="flex-1"
              onClick={() => updateOrderStatus(order._id, 'ready')}
            >
              Mark Ready
            </Button>
          )}
          
          {order.status === 'ready' && (
            <div className="flex-1 text-center py-2">
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
              <div className="text-sm font-medium text-green-600">Ready for Pickup</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-white rounded-lg p-4 shadow">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Display System</h1>
          <p className="text-gray-600">Real-time order management for kitchen staff</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 mr-2" />
            ) : (
              <VolumeX className="h-4 w-4 mr-2" />
            )}
            Sound {soundEnabled ? 'On' : 'Off'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchKitchenOrders}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-700">{confirmedOrders.length}</div>
            <div className="text-sm text-yellow-600">New Orders</div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-700">{preparingOrders.length}</div>
            <div className="text-sm text-orange-600">Preparing</div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{readyOrders.length}</div>
            <div className="text-sm text-green-600">Ready</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading kitchen orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No pending orders in the kitchen right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* New Orders First */}
          {confirmedOrders
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((order) => (
              <KitchenOrderCard key={`confirmed-${order._id}`} order={order} />
            ))}
          
          {/* Preparing Orders */}
          {preparingOrders
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((order) => (
              <KitchenOrderCard key={`preparing-${order._id}`} order={order} />
            ))}
          
          {/* Ready Orders */}
          {readyOrders
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((order) => (
              <KitchenOrderCard key={`ready-${order._id}`} order={order} />
            ))}
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;