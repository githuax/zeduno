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
  VolumeX,
  Wifi,
  WifiOff
} from "lucide-react";
import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getApiUrl } from "@/config/api";
import { useTenant } from "@/contexts/TenantContext";
import { useKitchenUpdates, KitchenOrderUpdate } from "@/hooks/useSocket";
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
  const { context } = useTenant();
  const tenant = context?.tenant;
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
  const [updateErrors, setUpdateErrors] = useState<Map<string, string>>(new Map());
  const [successMessages, setSuccessMessages] = useState<Map<string, string>>(new Map());
  const [retryAttempts, setRetryAttempts] = useState<Map<string, number>>(new Map());
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number>(0);
  const [keyboardNavigationEnabled, setKeyboardNavigationEnabled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Convert WebSocket order format to KitchenOrder format
  const convertWsOrderToKitchenOrder = useCallback((wsOrder: KitchenOrderUpdate): KitchenOrder => {
    return {
      _id: wsOrder.orderId,
      orderNumber: wsOrder.orderNumber,
      orderType: wsOrder.orderType,
      status: wsOrder.status,
      priority: wsOrder.priority,
      tableNumber: wsOrder.tableNumber,
      customerName: wsOrder.customerName,
      items: wsOrder.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        customizations: item.customizations,
        specialInstructions: item.specialInstructions,
        status: item.status
      })),
      kitchenNotes: wsOrder.kitchenNotes,
      preparationTime: wsOrder.preparationTime,
      createdAt: wsOrder.createdAt
    };
  }, []);

  // Handle new order sound notification
  function handleNewOrderSound(order: KitchenOrderUpdate) {
    if (soundEnabled && order.action === 'new') {
      playNotificationSound(order.priority);
    }
  }

  // WebSocket integration
  const { 
    orders: wsOrders, 
    connected: wsConnected, 
    lastUpdate,
    setOrders: setWsOrders 
  } = useKitchenUpdates(tenant?.id || '', handleNewOrderSound);

  // Update orders when WebSocket orders change
  useEffect(() => {
    if (wsOrders.length > 0) {
      const convertedOrders = wsOrders
        .filter(wsOrder => ['confirmed', 'preparing', 'ready'].includes(wsOrder.status))
        .map(convertWsOrderToKitchenOrder);
      setOrders(convertedOrders);
      setIsLoading(false);
    }
  }, [wsOrders, convertWsOrderToKitchenOrder]);

  // Keyboard navigation for quick status updates
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!keyboardNavigationEnabled || orders.length === 0) return;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          setSelectedOrderIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedOrderIndex(prev => Math.min(orders.length - 1, prev + 1));
          break;
        case ' ': // Spacebar
        case 'Enter':
          event.preventDefault();
          const selectedOrder = orders[selectedOrderIndex];
          if (selectedOrder) {
            if (selectedOrder.status === 'confirmed') {
              updateOrderStatus(selectedOrder._id, 'preparing');
            } else if (selectedOrder.status === 'preparing') {
              updateOrderStatus(selectedOrder._id, 'ready');
            }
          }
          break;
        case 'Escape':
          setKeyboardNavigationEnabled(false);
          setSelectedOrderIndex(0);
          break;
        case 'k': // Enable keyboard navigation
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setKeyboardNavigationEnabled(true);
            setSelectedOrderIndex(0);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardNavigationEnabled, orders, selectedOrderIndex, updateOrderStatus]);

  // Auto-scroll selected order into view
  useEffect(() => {
    if (keyboardNavigationEnabled && orders.length > 0) {
      const orderCards = containerRef.current?.querySelectorAll('[data-order-index]');
      const selectedCard = orderCards?.[selectedOrderIndex];
      if (selectedCard) {
        selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedOrderIndex, keyboardNavigationEnabled]);

  // Handle real-time updates
  useEffect(() => {
    if (lastUpdate) {
      console.log('🍳 Processing real-time kitchen update:', lastUpdate);
      
      // Play sound for new orders (priority-based)
      if (lastUpdate.action === 'new' && soundEnabled) {
        playNotificationSound(lastUpdate.priority);
      }
    }
  }, [lastUpdate, soundEnabled, playNotificationSound]);

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

  const playNotificationSound = useCallback((priority: string = 'normal') => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Different sounds for different priorities
      const soundConfig = {
        urgent: { frequency: 1000, duration: 0.8, volume: 0.4, pulses: 3 },
        high: { frequency: 900, duration: 0.6, volume: 0.35, pulses: 2 },
        normal: { frequency: 800, duration: 0.5, volume: 0.3, pulses: 1 },
        low: { frequency: 700, duration: 0.4, volume: 0.25, pulses: 1 }
      };
      
      const config = soundConfig[priority as keyof typeof soundConfig] || soundConfig.normal;
      
      for (let i = 0; i < config.pulses; i++) {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = config.frequency;
          oscillator.type = 'sine';
          
          const startTime = audioContext.currentTime + (i * 0.2);
          gainNode.gain.setValueAtTime(config.volume, startTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + config.duration);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + config.duration);
        }, i * 200);
      }
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, [soundEnabled]);

  const updateOrderStatus = async (orderId: string, newStatus: string, isRetry = false) => {
    // Prevent multiple simultaneous updates for the same order
    if (updatingOrders.has(orderId)) {
      console.log('Update already in progress for order:', orderId);
      return;
    }

    try {
      // Mark order as updating
      setUpdatingOrders(prev => new Set([...prev, orderId]));
      
      // Clear any previous messages for this order
      setUpdateErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.delete(orderId);
        return newErrors;
      });
      setSuccessMessages(prev => {
        const newMessages = new Map(prev);
        newMessages.delete(orderId);
        return newMessages;
      });

      // Store original status for rollback
      const originalOrder = orders.find(order => order._id === orderId);
      if (!originalOrder) {
        throw new Error('Order not found for status update');
      }
      const originalStatus = originalOrder.status;

      // Optimistic update - update UI immediately with loading state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus as any }
            : order
        )
      );

      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`orders/${orderId}/status`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus, 
          notes: `Status updated from kitchen at ${new Date().toLocaleTimeString()}${isRetry ? ' (retry)' : ''}` 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Failed to update order status (${response.status})`;
        throw new Error(errorMessage);
      }

      const updatedOrderData = await response.json();
      const updatedOrder = updatedOrderData.order || updatedOrderData;
      
      console.log('✅ Order status updated successfully:', {
        orderId,
        newStatus,
        orderNumber: updatedOrder.orderNumber || originalOrder.orderNumber
      });

      // Show success message
      setSuccessMessages(prev => {
        const newMessages = new Map(prev);
        const statusText = newStatus === 'preparing' ? 'started preparing' : newStatus === 'ready' ? 'marked as ready' : `updated to ${newStatus}`;
        newMessages.set(orderId, `Order ${statusText} successfully!`);
        return newMessages;
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessages(prev => {
          const newMessages = new Map(prev);
          newMessages.delete(orderId);
          return newMessages;
        });
      }, 3000);

      // Reset retry attempts on success
      setRetryAttempts(prev => {
        const newAttempts = new Map(prev);
        newAttempts.delete(orderId);
        return newAttempts;
      });

      // If WebSocket is not connected, update the order with server response
      if (!wsConnected && updatedOrder) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, ...updatedOrder }
              : order
          )
        );
      }
      // If WebSocket is connected, the real-time update will handle the correct state
      
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      
      const currentAttempts = retryAttempts.get(orderId) || 0;
      const maxRetries = 2;
      
      if (currentAttempts < maxRetries && !isRetry) {
        // Increment retry attempts
        setRetryAttempts(prev => {
          const newAttempts = new Map(prev);
          newAttempts.set(orderId, currentAttempts + 1);
          return newAttempts;
        });
        
        // Retry with exponential backoff
        const retryDelay = Math.pow(2, currentAttempts) * 1000; // 1s, 2s, 4s...
        console.log(`🔄 Retrying status update in ${retryDelay}ms (attempt ${currentAttempts + 1}/${maxRetries})`);
        
        setTimeout(() => {
          updateOrderStatus(orderId, newStatus, true);
        }, retryDelay);
        
        // Show retry message
        setUpdateErrors(prev => {
          const newErrors = new Map(prev);
          newErrors.set(orderId, `Update failed, retrying... (${currentAttempts + 1}/${maxRetries})`);
          return newErrors;
        });
        
        return; // Don't revert optimistic update during retry
      }
      
      // Store final error for display
      setUpdateErrors(prev => {
        const newErrors = new Map(prev);
        const errorMessage = error instanceof Error ? error.message : 'Update failed';
        newErrors.set(orderId, `${errorMessage} (after ${currentAttempts + 1} attempts)`);
        return newErrors;
      });

      // Clear error after 10 seconds
      setTimeout(() => {
        setUpdateErrors(prev => {
          const newErrors = new Map(prev);
          newErrors.delete(orderId);
          return newErrors;
        });
        setRetryAttempts(prev => {
          const newAttempts = new Map(prev);
          newAttempts.delete(orderId);
          return newAttempts;
        });
      }, 10000);

      // Revert optimistic update on final error
      const originalOrder = orders.find(order => order._id === orderId);
      if (originalOrder) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? originalOrder
              : order
          )
        );
      } else if (!wsConnected) {
        // Fallback: refresh from API if WebSocket not connected
        fetchKitchenOrders();
      }
    } finally {
      // Remove updating state
      setUpdatingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    // Initial load from API when WebSocket is not connected or empty
    if (!wsConnected || wsOrders.length === 0) {
      fetchKitchenOrders();
    }
    
    // Fallback polling only when WebSocket is disconnected
    let interval: NodeJS.Timeout | null = null;
    if (!wsConnected) {
      console.log('🍳 WebSocket disconnected, falling back to polling');
      interval = setInterval(fetchKitchenOrders, 15000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [wsConnected, wsOrders.length]);

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

  const KitchenOrderCard: React.FC<{ order: KitchenOrder; index: number; isSelected: boolean }> = ({ order, index, isSelected }) => (
    <Card 
      className={`relative ${getStatusColor(order.status)} border-2 transition-all duration-300 hover:shadow-lg ${
        isSelected ? 'ring-4 ring-blue-500 shadow-lg transform scale-105' : ''
      }`}
      data-order-index={index}
    >
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
                      {item.customizations.filter(custom => custom && custom.option).map((custom, idx) => (
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

        {/* Success Display */}
        {successMessages.has(order._id) && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>{successMessages.get(order._id)}</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {updateErrors.has(order._id) && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{updateErrors.get(order._id)}</span>
              {retryAttempts.has(order._id) && (
                <RefreshCw className="h-4 w-4 animate-spin ml-auto" />
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {order.status === 'confirmed' && (
            <Button
              className="flex-1"
              onClick={() => updateOrderStatus(order._id, 'preparing')}
              disabled={updatingOrders.has(order._id)}
            >
              {updatingOrders.has(order._id) ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                'Start Preparing'
              )}
            </Button>
          )}
          
          {order.status === 'preparing' && (
            <Button
              className="flex-1"
              onClick={() => updateOrderStatus(order._id, 'ready')}
              disabled={updatingOrders.has(order._id)}
            >
              {updatingOrders.has(order._id) ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Marking Ready...
                </>
              ) : (
                'Mark Ready'
              )}
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
          <p className="text-gray-600">
            {wsConnected ? 'Real-time order management' : 'Fallback polling mode'} for kitchen staff
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* WebSocket Connection Status */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
            wsConnected 
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {wsConnected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {wsConnected ? 'Live' : 'Offline'}
          </div>
          
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
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              {wsConnected 
                ? `Connected • ${orders.length} orders`
                : `Last updated: ${new Date().toLocaleTimeString()}`
              }
            </span>
            
            <div className="flex items-center gap-1">
              {keyboardNavigationEnabled && (
                <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                  Navigation: ↑↓ Select • Enter/Space: Update • Esc: Exit
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setKeyboardNavigationEnabled(!keyboardNavigationEnabled);
                  if (!keyboardNavigationEnabled) setSelectedOrderIndex(0);
                }}
                className="text-xs px-2"
              >
                ⌨️ {keyboardNavigationEnabled ? 'Exit' : 'Keyboard'}
              </Button>
            </div>
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
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* New Orders First */}
          {confirmedOrders
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((order, localIndex) => {
              const globalIndex = localIndex;
              return (
                <KitchenOrderCard 
                  key={`confirmed-${order._id}`} 
                  order={order} 
                  index={globalIndex}
                  isSelected={keyboardNavigationEnabled && selectedOrderIndex === globalIndex}
                />
              );
            })}
          
          {/* Preparing Orders */}
          {preparingOrders
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((order, localIndex) => {
              const globalIndex = confirmedOrders.length + localIndex;
              return (
                <KitchenOrderCard 
                  key={`preparing-${order._id}`} 
                  order={order} 
                  index={globalIndex}
                  isSelected={keyboardNavigationEnabled && selectedOrderIndex === globalIndex}
                />
              );
            })}
          
          {/* Ready Orders */}
          {readyOrders
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((order, localIndex) => {
              const globalIndex = confirmedOrders.length + preparingOrders.length + localIndex;
              return (
                <KitchenOrderCard 
                  key={`ready-${order._id}`} 
                  order={order} 
                  index={globalIndex}
                  isSelected={keyboardNavigationEnabled && selectedOrderIndex === globalIndex}
                />
              );
            })}
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;
