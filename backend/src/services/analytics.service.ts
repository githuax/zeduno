import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { MenuItem } from '../models/MenuItem';
import { User } from '../models/User';
import { PaymentTransaction } from '../models/PaymentTransaction';
import { Branch } from '../models/Branch';
import { Category } from '../models/Category';
import { Tenant } from '../models/Tenant';
import {
  ReportFilters,
  SalesReportData,
  SalesMetrics,
  SalesByPeriod,
  SalesByBranch,
  SalesByPaymentMethod,
  MenuPerformanceReportData,
  MenuItemMetrics,
  CategoryMetrics,
  CustomerAnalyticsReportData,
  CustomerMetrics,
  CustomerSegment,
  CustomerBehavior,
  FinancialSummaryReportData,
  FinancialMetrics,
  PaymentMethodBreakdown,
  StaffPerformanceReportData,
  StaffMetrics,
  BranchPerformanceReportData,
  BranchMetrics
} from '../types/report.types';

export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Generate Sales Analytics Report Data
   */
  public async generateSalesAnalytics(filters: ReportFilters): Promise<SalesReportData> {
    const matchConditions = this.buildMatchConditions(filters);

    // Get summary metrics
    const summary = await this.getSalesMetrics(matchConditions);

    // Get sales by period
    const byPeriod = await this.getSalesByPeriod(matchConditions, filters.period || 'daily');

    // Get sales by branch
    const byBranch = await this.getSalesByBranch(matchConditions);

    // Get sales by payment method
    const byPaymentMethod = await this.getSalesByPaymentMethod(matchConditions);

    // Get sales by order type
    const byOrderType = await this.getSalesByOrderType(matchConditions);

    // Get top performing hours
    const topPerformingHours = await this.getTopPerformingHours(matchConditions);

    return {
      summary,
      byPeriod,
      byBranch,
      byPaymentMethod,
      byOrderType,
      topPerformingHours,
      filters,
      generatedAt: new Date()
    };
  }

  /**
   * Generate Menu Performance Analytics Report Data
   */
  public async generateMenuPerformanceAnalytics(filters: ReportFilters): Promise<MenuPerformanceReportData> {
    const matchConditions = this.buildMatchConditions(filters);

    // Get top performing items
    const topPerformingItems = await this.getTopPerformingMenuItems(matchConditions, 50);

    // Get underperforming items
    const underperformingItems = await this.getUnderperformingMenuItems(matchConditions, 20);

    // Get category performance
    const categoryPerformance = await this.getCategoryPerformance(matchConditions);

    // Get items by category
    const itemsByCategory = await this.getItemsByCategory(matchConditions);

    // Get stock alerts
    const stockAlerts = await this.getStockAlerts(filters.tenantId);

    // Generate summary
    const summary = {
      totalMenuItems: await MenuItem.countDocuments({ tenantId: filters.tenantId, isActive: true }),
      totalCategories: categoryPerformance.length,
      totalOrderedItems: topPerformingItems.reduce((sum, item) => sum + item.totalOrdered, 0),
      topSellingItem: topPerformingItems[0] || null,
      leastSellingItem: underperformingItems[underperformingItems.length - 1] || null,
      mostProfitableCategory: categoryPerformance[0] || null,
    };

    return {
      summary,
      topPerformingItems,
      underperformingItems,
      categoryPerformance,
      itemsByCategory,
      stockAlerts,
      filters,
      generatedAt: new Date()
    };
  }

  /**
   * Generate Customer Analytics Report Data
   */
  public async generateCustomerAnalytics(filters: ReportFilters): Promise<CustomerAnalyticsReportData> {
    const matchConditions = this.buildMatchConditions(filters);

    // Get customer metrics
    const summary = await this.getCustomerMetrics(matchConditions, filters);

    // Get customer segments
    const segments = await this.getCustomerSegments(matchConditions);

    // Get customer behavior
    const behavior = await this.getCustomerBehavior(matchConditions);

    // Get top customers
    const topCustomers = await this.getTopCustomers(matchConditions, 20);

    // Get customer feedback
    const customerFeedback = await this.getCustomerFeedback(matchConditions);

    return {
      summary,
      segments,
      behavior,
      topCustomers,
      customerFeedback,
      filters,
      generatedAt: new Date()
    };
  }

  /**
   * Generate Financial Summary Report Data
   */
  public async generateFinancialSummary(filters: ReportFilters): Promise<FinancialSummaryReportData> {
    const matchConditions = this.buildMatchConditions(filters);

    // Get financial metrics
    const summary = await this.getFinancialMetrics(matchConditions);

    // Get financial data by period
    const byPeriod = await this.getFinancialByPeriod(matchConditions, filters.period || 'daily');

    // Get financial data by branch
    const byBranch = await this.getFinancialByBranch(matchConditions);

    // Get payment method breakdown
    const paymentMethods = await this.getPaymentMethodBreakdown(matchConditions);

    // Get tax breakdown
    const taxBreakdown = await this.getTaxBreakdown(matchConditions);

    // Get discount analysis
    const discountAnalysis = await this.getDiscountAnalysis(matchConditions);

    return {
      summary,
      byPeriod,
      byBranch,
      paymentMethods,
      taxBreakdown,
      discountAnalysis,
      filters,
      generatedAt: new Date()
    };
  }

  /**
   * Generate Staff Performance Report Data
   */
  public async generateStaffPerformance(filters: ReportFilters): Promise<StaffPerformanceReportData> {
    const matchConditions = this.buildMatchConditions(filters);

    // Get staff performance metrics
    const staffPerformance = await this.getStaffPerformanceMetrics(matchConditions);

    // Get performance by branch
    const performanceByBranch = await this.getStaffPerformanceByBranch(matchConditions);

    // Get performance by role
    const performanceByRole = await this.getStaffPerformanceByRole(matchConditions);

    // Generate summary
    const summary = {
      totalStaff: await User.countDocuments({ 
        tenantId: filters.tenantId, 
        role: { $in: ['admin', 'manager', 'staff'] }, 
        isActive: true 
      }),
      activeStaff: staffPerformance.length,
      avgOrdersPerStaff: staffPerformance.reduce((sum, staff) => sum + staff.ordersProcessed, 0) / Math.max(staffPerformance.length, 1),
      avgRevenuePerStaff: staffPerformance.reduce((sum, staff) => sum + staff.totalRevenue, 0) / Math.max(staffPerformance.length, 1),
      topPerformer: staffPerformance[0] || null,
    };

    return {
      summary,
      staffPerformance,
      performanceByBranch,
      performanceByRole,
      filters,
      generatedAt: new Date()
    };
  }

  /**
   * Generate Branch Performance Report Data
   */
  public async generateBranchPerformance(filters: ReportFilters): Promise<BranchPerformanceReportData> {
    const matchConditions = this.buildMatchConditions(filters);

    // Get branch performance metrics
    const branchPerformance = await this.getBranchPerformanceMetrics(matchConditions);

    // Get performance comparison
    const performanceComparison = await this.getBranchPerformanceComparison(matchConditions);

    // Get regional analysis (if applicable)
    const regionalAnalysis = await this.getRegionalAnalysis(matchConditions);

    // Calculate totals for summary
    const totalRevenue = branchPerformance.reduce((sum, branch) => sum + branch.totalRevenue, 0);
    const avgRevenuePerBranch = totalRevenue / Math.max(branchPerformance.length, 1);

    // Find top performing and fastest growing branches
    const topPerformingBranch = [...branchPerformance].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
    const fastestGrowingBranch = [...branchPerformance].sort((a, b) => b.growthRate - a.growthRate)[0];

    const summary = {
      totalBranches: await Branch.countDocuments({ tenantId: filters.tenantId, isActive: true }),
      activeBranches: branchPerformance.length,
      totalRevenue,
      avgRevenuePerBranch,
      topPerformingBranch: topPerformingBranch || null,
      fastestGrowingBranch: fastestGrowingBranch || null,
    };

    return {
      summary,
      branchPerformance,
      performanceComparison,
      regionalAnalysis,
      filters,
      generatedAt: new Date()
    };
  }

  // Helper methods for building match conditions
  private buildMatchConditions(filters: ReportFilters): any {
    const conditions: any = {
      tenantId: new mongoose.Types.ObjectId(filters.tenantId),
      createdAt: {
        $gte: filters.startDate,
        $lte: filters.endDate
      }
    };

    if (filters.branchId) {
      conditions.branchId = new mongoose.Types.ObjectId(filters.branchId);
    }

    if (filters.branchIds && filters.branchIds.length > 0) {
      conditions.branchId = { 
        $in: filters.branchIds.map(id => new mongoose.Types.ObjectId(id)) 
      };
    }

    if (filters.orderType) {
      conditions.orderType = filters.orderType;
    }

    if (filters.paymentMethod) {
      conditions.paymentMethod = filters.paymentMethod;
    }

    if (filters.status && filters.status.length > 0) {
      conditions.status = { $in: filters.status };
    } else {
      // Default to successful orders
      conditions.status = { $in: ['completed', 'delivered'] };
    }

    return conditions;
  }

  // Sales Analytics Helper Methods
  private async getSalesMetrics(matchConditions: any): Promise<SalesMetrics> {
    const pipeline = [
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalItems: { $sum: { $size: '$items' } },
          totalTax: { $sum: '$tax' },
          totalServiceCharge: { $sum: '$serviceCharge' },
          totalTip: { $sum: '$tip' },
          totalDiscount: { $sum: { $ifNull: ['$discount.value', 0] } },
          completedOrders: {
            $sum: { $cond: [{ $in: ['$status', ['completed', 'delivered']] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          refundedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
          }
        }
      }
    ];

    const result = await Order.aggregate(pipeline);
    const data = result[0] || {};

    // Get unique customers count
    const uniqueCustomers = await Order.distinct('customerId', matchConditions);

    return {
      totalOrders: data.totalOrders || 0,
      totalRevenue: data.totalRevenue || 0,
      avgOrderValue: data.totalOrders ? (data.totalRevenue || 0) / data.totalOrders : 0,
      totalItems: data.totalItems || 0,
      totalCustomers: uniqueCustomers.filter(id => id).length,
      completedOrders: data.completedOrders || 0,
      cancelledOrders: data.cancelledOrders || 0,
      refundedOrders: data.refundedOrders || 0,
      grossRevenue: data.totalRevenue || 0,
      netRevenue: (data.totalRevenue || 0) - (data.totalTax || 0),
      taxAmount: data.totalTax || 0,
      discountAmount: data.totalDiscount || 0,
      tipAmount: data.totalTip || 0,
      serviceChargeAmount: data.totalServiceCharge || 0
    };
  }

  private async getSalesByPeriod(matchConditions: any, period: string): Promise<SalesByPeriod[]> {
    let groupBy: any;
    let dateFormat: string;

    switch (period) {
      case 'hourly':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
        dateFormat = '%Y-%m-%d %H:00';
        break;
      case 'daily':
        groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        groupBy = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        dateFormat = 'Week %U, %Y';
        break;
      case 'monthly':
        groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        dateFormat = '%Y-%m';
        break;
      default:
        groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        dateFormat = '%Y-%m-%d';
    }

    const pipeline = [
      { $match: matchConditions },
      {
        $group: {
          _id: groupBy,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalItems: { $sum: { $size: '$items' } },
          date: { $first: '$createdAt' },
          completedOrders: {
            $sum: { $cond: [{ $in: ['$status', ['completed', 'delivered']] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          refundedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
          },
          grossRevenue: { $sum: '$total' },
          netRevenue: { $sum: { $subtract: ['$total', '$tax'] } },
          taxAmount: { $sum: '$tax' },
          discountAmount: { $sum: { $ifNull: ['$discount.value', 0] } },
          tipAmount: { $sum: '$tip' },
          serviceChargeAmount: { $sum: '$serviceCharge' },
          totalCustomers: { $addToSet: '$customerId' }
        }
      },
      { $sort: { '_id': 1 as 1 } }
    ];

    const results = await Order.aggregate(pipeline);

    return results.map(item => ({
      period: typeof item._id === 'string' ? item._id : JSON.stringify(item._id),
      date: item.date,
      formattedDate: this.formatPeriodDate(item._id, period),
      totalOrders: item.totalOrders,
      totalRevenue: item.totalRevenue,
      avgOrderValue: item.totalOrders ? item.totalRevenue / item.totalOrders : 0,
      totalItems: item.totalItems,
      totalCustomers: item.totalCustomers.filter((id: any) => id).length,
      completedOrders: item.completedOrders,
      cancelledOrders: item.cancelledOrders,
      refundedOrders: item.refundedOrders,
      grossRevenue: item.grossRevenue,
      netRevenue: item.netRevenue,
      taxAmount: item.taxAmount,
      discountAmount: item.discountAmount,
      tipAmount: item.tipAmount,
      serviceChargeAmount: item.serviceChargeAmount
    }));
  }

  private async getSalesByBranch(matchConditions: any): Promise<SalesByBranch[]> {
    const pipeline = [
      { $match: matchConditions },
      {
        $group: {
          _id: '$branchId',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalItems: { $sum: { $size: '$items' } },
          completedOrders: {
            $sum: { $cond: [{ $in: ['$status', ['completed', 'delivered']] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          refundedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
          },
          grossRevenue: { $sum: '$total' },
          netRevenue: { $sum: { $subtract: ['$total', '$tax'] } },
          taxAmount: { $sum: '$tax' },
          discountAmount: { $sum: { $ifNull: ['$discount.value', 0] } },
          tipAmount: { $sum: '$tip' },
          serviceChargeAmount: { $sum: '$serviceCharge' },
          totalCustomers: { $addToSet: '$customerId' }
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branch'
        }
      },
      { $unwind: '$branch' },
      { $sort: { totalRevenue: -1 as -1 } }
    ];

    const results = await Order.aggregate(pipeline);

    return results.map(item => ({
      branchId: item._id.toString(),
      branchName: item.branch.name,
      branchCode: item.branch.code,
      totalOrders: item.totalOrders,
      totalRevenue: item.totalRevenue,
      avgOrderValue: item.totalOrders ? item.totalRevenue / item.totalOrders : 0,
      totalItems: item.totalItems,
      totalCustomers: item.totalCustomers.filter((id: any) => id).length,
      completedOrders: item.completedOrders,
      cancelledOrders: item.cancelledOrders,
      refundedOrders: item.refundedOrders,
      grossRevenue: item.grossRevenue,
      netRevenue: item.netRevenue,
      taxAmount: item.taxAmount,
      discountAmount: item.discountAmount,
      tipAmount: item.tipAmount,
      serviceChargeAmount: item.serviceChargeAmount
    }));
  }

  private async getSalesByPaymentMethod(matchConditions: any): Promise<SalesByPaymentMethod[]> {
    const pipeline = [
      { $match: matchConditions },
      {
        $group: {
          _id: '$paymentMethod',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalItems: { $sum: { $size: '$items' } },
          completedOrders: {
            $sum: { $cond: [{ $in: ['$status', ['completed', 'delivered']] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          refundedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
          },
          grossRevenue: { $sum: '$total' },
          netRevenue: { $sum: { $subtract: ['$total', '$tax'] } },
          taxAmount: { $sum: '$tax' },
          discountAmount: { $sum: { $ifNull: ['$discount.value', 0] } },
          tipAmount: { $sum: '$tip' },
          serviceChargeAmount: { $sum: '$serviceCharge' },
          totalCustomers: { $addToSet: '$customerId' }
        }
      },
      { $sort: { totalRevenue: -1 as -1 } }
    ];

    const results = await Order.aggregate(pipeline);
    const totalRevenue = results.reduce((sum, item) => sum + item.totalRevenue, 0);

    return results.map(item => ({
      paymentMethod: item._id || 'Unknown',
      percentage: totalRevenue > 0 ? (item.totalRevenue / totalRevenue) * 100 : 0,
      totalOrders: item.totalOrders,
      totalRevenue: item.totalRevenue,
      avgOrderValue: item.totalOrders ? item.totalRevenue / item.totalOrders : 0,
      totalItems: item.totalItems,
      totalCustomers: item.totalCustomers.filter((id: any) => id).length,
      completedOrders: item.completedOrders,
      cancelledOrders: item.cancelledOrders,
      refundedOrders: item.refundedOrders,
      grossRevenue: item.grossRevenue,
      netRevenue: item.netRevenue,
      taxAmount: item.taxAmount,
      discountAmount: item.discountAmount,
      tipAmount: item.tipAmount,
      serviceChargeAmount: item.serviceChargeAmount
    }));
  }

  private async getSalesByOrderType(matchConditions: any): Promise<any[]> {
    const pipeline = [
      { $match: matchConditions },
      {
        $group: {
          _id: '$orderType',
          orders: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      }
    ];

    const results = await Order.aggregate(pipeline);
    const totalRevenue = results.reduce((sum, item) => sum + item.revenue, 0);

    return results.map(item => ({
      orderType: item._id,
      orders: item.orders,
      revenue: item.revenue,
      percentage: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0
    }));
  }

  private async getTopPerformingHours(matchConditions: any): Promise<any[]> {
    const pipeline = [
      { $match: matchConditions },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { revenue: -1 as -1 } },
      { $limit: 10 }
    ];

    const results = await Order.aggregate(pipeline);

    return results.map(item => ({
      hour: item._id,
      orders: item.orders,
      revenue: item.revenue
    }));
  }

  // Menu Performance Helper Methods
  private async getTopPerformingMenuItems(matchConditions: any, limit: number): Promise<MenuItemMetrics[]> {
    const pipeline = [
      { $match: matchConditions },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          totalOrdered: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          avgPrice: { $avg: '$items.price' },
          lastOrdered: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: '_id',
          as: 'menuItem'
        }
      },
      { $unwind: '$menuItem' },
      {
        $lookup: {
          from: 'categories',
          localField: 'menuItem.categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      { $sort: { totalOrdered: -1 as -1 } },
      { $limit: limit }
    ];

    const results = await Order.aggregate(pipeline);

    return results.map(item => ({
      itemId: item._id.toString(),
      itemName: item.menuItem.name,
      categoryName: item.category.name,
      totalOrdered: item.totalOrdered,
      totalRevenue: item.totalRevenue,
      avgPrice: item.avgPrice,
      popularity: item.menuItem.popularity || 0,
      lastOrdered: item.lastOrdered
    }));
  }

  private async getUnderperformingMenuItems(matchConditions: any, limit: number): Promise<MenuItemMetrics[]> {
    // Get all menu items
    const allItems = await MenuItem.find({ isActive: true }).populate('categoryId');
    
    // Get ordered items
    const orderedItems = await this.getTopPerformingMenuItems(matchConditions, 1000);
    const orderedItemIds = new Set(orderedItems.map(item => item.itemId));

    // Find items that weren't ordered or had very low orders
    const underperforming = allItems
      .filter(item => !orderedItemIds.has(item._id.toString()))
      .slice(0, limit)
      .map(item => ({
        itemId: item._id.toString(),
        itemName: item.name,
        categoryName: (item.categoryId as any)?.name || 'Unknown',
        totalOrdered: 0,
        totalRevenue: 0,
        avgPrice: item.price,
        popularity: item.popularity || 0
      }));

    return underperforming;
  }

  private async getCategoryPerformance(matchConditions: any): Promise<CategoryMetrics[]> {
    const pipeline = [
      { $match: matchConditions },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'items.menuItem',
          foreignField: '_id',
          as: 'menuItem'
        }
      },
      { $unwind: '$menuItem' },
      {
        $group: {
          _id: '$menuItem.categoryId',
          totalOrdered: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          avgItemsPerOrder: { $avg: '$items.quantity' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      { $sort: { totalRevenue: -1 as -1 } }
    ];

    const results = await Order.aggregate(pipeline);

    return results.map(item => ({
      categoryId: item._id.toString(),
      categoryName: item.category.name,
      totalItems: 0, // This would need a separate query
      totalOrdered: item.totalOrdered,
      totalRevenue: item.totalRevenue,
      avgItemsPerOrder: item.avgItemsPerOrder,
      popularityScore: item.totalOrdered // Simple popularity metric
    }));
  }

  private async getItemsByCategory(matchConditions: any): Promise<any[]> {
    const categories = await this.getCategoryPerformance(matchConditions);
    const result = [];

    for (const category of categories) {
      const items = await this.getTopPerformingMenuItems({
        ...matchConditions,
        'items.menuItem': { $in: await this.getMenuItemIdsByCategory(category.categoryId) }
      }, 50);

      result.push({
        categoryName: category.categoryName,
        items: items.filter(item => item.categoryName === category.categoryName)
      });
    }

    return result;
  }

  private async getMenuItemIdsByCategory(categoryId: string): Promise<mongoose.Types.ObjectId[]> {
    const items = await MenuItem.find({ 
      categoryId: new mongoose.Types.ObjectId(categoryId), 
      isActive: true 
    });
    return items.map(item => item._id);
  }

  private async getStockAlerts(tenantId: string): Promise<any[]> {
    const lowStockItems = await MenuItem.find({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      trackInventory: true,
      $expr: { $lte: ['$amount', '$minStockLevel'] },
      isActive: true
    });

    return lowStockItems.map(item => ({
      itemId: item._id.toString(),
      itemName: item.name,
      currentStock: item.amount,
      minStockLevel: item.minStockLevel || 0,
      status: item.amount === 0 ? 'out' : 'low'
    }));
  }

  // Customer Analytics Helper Methods
  private async getCustomerMetrics(matchConditions: any, filters: ReportFilters): Promise<CustomerMetrics> {
    const uniqueCustomers = await Order.distinct('customerId', matchConditions);
    const totalCustomers = uniqueCustomers.filter(id => id).length;

    // Get previous period for comparison
    const previousPeriodStart = new Date(filters.startDate);
    const previousPeriodEnd = new Date(filters.endDate);
    const periodDiff = previousPeriodEnd.getTime() - previousPeriodStart.getTime();
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDiff);
    previousPeriodEnd.setTime(previousPeriodEnd.getTime() - periodDiff);

    const previousCustomers = await Order.distinct('customerId', {
      ...matchConditions,
      createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd }
    });

    const newCustomers = uniqueCustomers.filter(id => 
      id && !previousCustomers.includes(id)
    ).length;

    const returningCustomers = totalCustomers - newCustomers;

    const customerOrderStats = await Order.aggregate([
      { $match: matchConditions },
      { $match: { customerId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$customerId',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$total' }
        }
      },
      {
        $group: {
          _id: null,
          avgOrdersPerCustomer: { $avg: '$orderCount' },
          avgRevenuePerCustomer: { $avg: '$totalSpent' }
        }
      }
    ]);

    const stats = customerOrderStats[0] || {};

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      avgOrdersPerCustomer: stats.avgOrdersPerCustomer || 0,
      avgRevenuePerCustomer: stats.avgRevenuePerCustomer || 0,
      customerRetentionRate: totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0,
      churnRate: totalCustomers > 0 ? (newCustomers / totalCustomers) * 100 : 0
    };
  }

  private async getCustomerSegments(matchConditions: any): Promise<CustomerSegment[]> {
    const pipeline = [
      { $match: matchConditions },
      { $match: { customerId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$customerId',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$total' }
        }
      },
      {
        $addFields: {
          segment: {
            $switch: {
              branches: [
                { case: { $gte: ['$totalSpent', 1000] }, then: 'VIP' },
                { case: { $gte: ['$totalSpent', 500] }, then: 'Premium' },
                { case: { $gte: ['$totalSpent', 200] }, then: 'Regular' },
                { case: { $gte: ['$orderCount', 5] }, then: 'Frequent' }
              ],
              default: 'New'
            }
          }
        }
      },
      {
        $group: {
          _id: '$segment',
          customerCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalSpent' },
          avgOrderValue: { $avg: { $divide: ['$totalSpent', '$orderCount'] } }
        }
      }
    ];

    const results = await Order.aggregate(pipeline);
    const totalRevenue = results.reduce((sum, segment) => sum + segment.totalRevenue, 0);

    return results.map(segment => ({
      segment: segment._id,
      customerCount: segment.customerCount,
      totalRevenue: segment.totalRevenue,
      avgOrderValue: segment.avgOrderValue,
      percentage: totalRevenue > 0 ? (segment.totalRevenue / totalRevenue) * 100 : 0
    }));
  }

  private async getCustomerBehavior(matchConditions: any): Promise<CustomerBehavior> {
    // Preferred order types
    const orderTypePreference = await Order.aggregate([
      { $match: matchConditions },
      { $match: { customerId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$orderType',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalOrderTypeOrders = orderTypePreference.reduce((sum, item) => sum + item.count, 0);

    const preferredOrderType = orderTypePreference.map(item => ({
      type: item._id,
      count: item.count,
      percentage: totalOrderTypeOrders > 0 ? (item.count / totalOrderTypeOrders) * 100 : 0
    }));

    // Preferred payment methods
    const paymentMethodPreference = await Order.aggregate([
      { $match: matchConditions },
      { $match: { customerId: { $exists: true, $ne: null }, paymentMethod: { $exists: true } } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalPaymentOrders = paymentMethodPreference.reduce((sum, item) => sum + item.count, 0);

    const preferredPaymentMethod = paymentMethodPreference.map(item => ({
      method: item._id,
      count: item.count,
      percentage: totalPaymentOrders > 0 ? (item.count / totalPaymentOrders) * 100 : 0
    }));

    // Average order time
    const avgOrderTime = await Order.aggregate([
      { $match: matchConditions },
      { $match: { customerId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 as 1 } }
    ]);

    return {
      preferredOrderType,
      preferredPaymentMethod,
      orderFrequency: [], // Would need more complex analysis
      avgOrderTime: avgOrderTime.map(item => ({
        hour: item._id,
        orderCount: item.orderCount
      }))
    };
  }

  private async getTopCustomers(matchConditions: any, limit: number): Promise<any[]> {
    const pipeline = [
      { $match: matchConditions },
      { $match: { customerId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$customerId',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          lastOrderDate: { $max: '$createdAt' },
          customerName: { $first: '$customerName' }
        }
      },
      {
        $addFields: {
          avgOrderValue: { $divide: ['$totalSpent', '$totalOrders'] }
        }
      },
      { $sort: { totalSpent: -1 as -1 } },
      { $limit: limit }
    ];

    const results = await Order.aggregate(pipeline);

    return results.map(customer => ({
      customerId: customer._id ? customer._id.toString() : 'unknown',
      customerName: customer.customerName || 'Unknown Customer',
      totalOrders: customer.totalOrders,
      totalSpent: customer.totalSpent,
      avgOrderValue: customer.avgOrderValue,
      lastOrderDate: customer.lastOrderDate
    }));
  }

  private async getCustomerFeedback(matchConditions: any): Promise<any> {
    const feedbackStats = await Order.aggregate([
      { $match: { ...matchConditions, rating: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingCounts: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (feedbackStats.length === 0) {
      return {
        avgRating: 0,
        totalReviews: 0,
        ratingDistribution: []
      };
    }

    const stats = feedbackStats[0];
    const ratingCounts = [1, 2, 3, 4, 5].map(rating => {
      const count = stats.ratingCounts.filter((r: number) => r === rating).length;
      return {
        rating,
        count,
        percentage: stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
      };
    });

    return {
      avgRating: stats.avgRating,
      totalReviews: stats.totalReviews,
      ratingDistribution: ratingCounts
    };
  }

  // Financial Summary Helper Methods
  private async getFinancialMetrics(matchConditions: any): Promise<FinancialMetrics> {
    const pipeline = [
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          grossRevenue: { $sum: '$total' },
          totalTax: { $sum: '$tax' },
          totalDiscounts: { $sum: { $ifNull: ['$discount.value', 0] } },
          totalTips: { $sum: '$tip' },
          totalServiceCharges: { $sum: '$serviceCharge' },
          totalTransactions: { $sum: 1 }
        }
      }
    ];

    const result = await Order.aggregate(pipeline);
    const data = result[0] || {};

    // Get refunds
    const refunds = await Order.aggregate([
      { $match: { ...matchConditions, status: 'refunded' } },
      {
        $group: {
          _id: null,
          totalRefunds: { $sum: '$total' }
        }
      }
    ]);

    const totalRefunds = refunds[0]?.totalRefunds || 0;
    const grossRevenue = data.grossRevenue || 0;
    const netRevenue = grossRevenue - (data.totalTax || 0);
    const operatingRevenue = netRevenue - totalRefunds;

    return {
      grossRevenue,
      netRevenue,
      totalTax: data.totalTax || 0,
      totalDiscounts: data.totalDiscounts || 0,
      totalTips: data.totalTips || 0,
      totalServiceCharges: data.totalServiceCharges || 0,
      totalRefunds,
      operatingRevenue,
      avgTransactionValue: data.totalTransactions > 0 ? grossRevenue / data.totalTransactions : 0,
      totalTransactions: data.totalTransactions || 0
    };
  }

  private async getFinancialByPeriod(matchConditions: any, period: string): Promise<any[]> {
    // Similar to getSalesByPeriod but focused on financial metrics
    const salesByPeriod = await this.getSalesByPeriod(matchConditions, period);
    
    return salesByPeriod.map(period => ({
      period: period.period,
      date: period.date,
      grossRevenue: period.grossRevenue,
      netRevenue: period.netRevenue,
      totalTax: period.taxAmount,
      totalDiscounts: period.discountAmount,
      totalTips: period.tipAmount,
      totalServiceCharges: period.serviceChargeAmount,
      totalRefunds: 0, // Would need separate calculation
      operatingRevenue: period.netRevenue,
      avgTransactionValue: period.avgOrderValue,
      totalTransactions: period.totalOrders
    }));
  }

  private async getFinancialByBranch(matchConditions: any): Promise<any[]> {
    const salesByBranch = await this.getSalesByBranch(matchConditions);
    const totalRevenue = salesByBranch.reduce((sum, branch) => sum + branch.totalRevenue, 0);

    return salesByBranch.map(branch => ({
      branchId: branch.branchId,
      branchName: branch.branchName,
      metrics: {
        grossRevenue: branch.grossRevenue,
        netRevenue: branch.netRevenue,
        totalTax: branch.taxAmount,
        totalDiscounts: branch.discountAmount,
        totalTips: branch.tipAmount,
        totalServiceCharges: branch.serviceChargeAmount,
        totalRefunds: 0,
        operatingRevenue: branch.netRevenue,
        avgTransactionValue: branch.avgOrderValue,
        totalTransactions: branch.totalOrders
      },
      contribution: totalRevenue > 0 ? (branch.totalRevenue / totalRevenue) * 100 : 0
    }));
  }

  private async getPaymentMethodBreakdown(matchConditions: any): Promise<PaymentMethodBreakdown[]> {
    // Get successful transactions
    const successfulTransactions = await PaymentTransaction.aggregate([
      {
        $match: {
          tenantId: matchConditions.tenantId,
          initiatedAt: {
            $gte: matchConditions.createdAt.$gte,
            $lte: matchConditions.createdAt.$lte
          }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          totalTransactions: { $sum: 1 },
          successfulTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failedTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const totalAmount = successfulTransactions.reduce((sum, item) => sum + item.totalAmount, 0);

    return successfulTransactions.map(item => ({
      paymentMethod: item._id,
      transactionCount: item.totalTransactions,
      totalAmount: item.totalAmount,
      percentage: totalAmount > 0 ? (item.totalAmount / totalAmount) * 100 : 0,
      avgTransactionValue: item.totalTransactions > 0 ? item.totalAmount / item.totalTransactions : 0,
      successRate: item.totalTransactions > 0 ? (item.successfulTransactions / item.totalTransactions) * 100 : 0,
      failureRate: item.totalTransactions > 0 ? (item.failedTransactions / item.totalTransactions) * 100 : 0
    }));
  }

  private async getTaxBreakdown(matchConditions: any): Promise<any[]> {
    const taxData = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$taxRate',
          amount: { $sum: '$tax' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    const totalTax = taxData.reduce((sum, item) => sum + item.amount, 0);

    return taxData.map(item => ({
      taxType: `${item._id || 0}% Tax`,
      amount: item.amount,
      percentage: totalTax > 0 ? (item.amount / totalTax) * 100 : 0
    }));
  }

  private async getDiscountAnalysis(matchConditions: any): Promise<any[]> {
    const discountData = await Order.aggregate([
      { $match: { ...matchConditions, discount: { $exists: true } } },
      {
        $group: {
          _id: '$discount.type',
          totalDiscount: { $sum: '$discount.value' },
          orderCount: { $sum: 1 },
          avgDiscountPerOrder: { $avg: '$discount.value' }
        }
      }
    ]);

    return discountData.map(item => ({
      discountType: item._id || 'Unknown',
      totalDiscount: item.totalDiscount,
      orderCount: item.orderCount,
      avgDiscountPerOrder: item.avgDiscountPerOrder
    }));
  }

  // Staff Performance Helper Methods
  private async getStaffPerformanceMetrics(matchConditions: any): Promise<StaffMetrics[]> {
    const pipeline = [
      { $match: matchConditions },
      {
        $group: {
          _id: '$staffId',
          ordersProcessed: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          avgProcessingTime: { $avg: '$preparationTime' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staff'
        }
      },
      { $unwind: '$staff' },
      {
        $lookup: {
          from: 'branches',
          localField: 'staff.currentBranch',
          foreignField: '_id',
          as: 'branch'
        }
      },
      { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
      { $sort: { totalRevenue: -1 as -1 } }
    ];

    const results = await Order.aggregate(pipeline);

    return results.map(item => ({
      staffId: item._id.toString(),
      staffName: `${item.staff.firstName} ${item.staff.lastName}`,
      role: item.staff.role,
      branchName: item.branch?.name || 'Unassigned',
      ordersProcessed: item.ordersProcessed,
      totalRevenue: item.totalRevenue,
      avgOrderValue: item.ordersProcessed > 0 ? item.totalRevenue / item.ordersProcessed : 0,
      avgProcessingTime: item.avgProcessingTime || 0,
      productivity: item.ordersProcessed // Simple productivity metric
    }));
  }

  private async getStaffPerformanceByBranch(matchConditions: any): Promise<any[]> {
    const pipeline = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'users',
          localField: 'staffId',
          foreignField: '_id',
          as: 'staff'
        }
      },
      { $unwind: '$staff' },
      {
        $group: {
          _id: '$staff.currentBranch',
          totalOrders: { $sum: 1 },
          staffIds: { $addToSet: '$staffId' }
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branch'
        }
      },
      { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } }
    ];

    const results = await Order.aggregate(pipeline);

    return results.map(item => ({
      branchId: item._id ? item._id.toString() : 'unassigned',
      branchName: item.branch?.name || 'Unassigned',
      staffCount: item.staffIds.length,
      totalOrders: item.totalOrders,
      avgPerformance: item.staffIds.length > 0 ? item.totalOrders / item.staffIds.length : 0
    }));
  }

  private async getStaffPerformanceByRole(matchConditions: any): Promise<any[]> {
    const pipeline = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'users',
          localField: 'staffId',
          foreignField: '_id',
          as: 'staff'
        }
      },
      { $unwind: '$staff' },
      {
        $group: {
          _id: '$staff.role',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          staffIds: { $addToSet: '$staffId' }
        }
      }
    ];

    const results = await Order.aggregate(pipeline);

    return results.map(item => ({
      role: item._id,
      staffCount: item.staffIds.length,
      avgOrdersProcessed: item.staffIds.length > 0 ? item.totalOrders / item.staffIds.length : 0,
      avgRevenue: item.staffIds.length > 0 ? item.totalRevenue / item.staffIds.length : 0
    }));
  }

  // Branch Performance Helper Methods
  private async getBranchPerformanceMetrics(matchConditions: any): Promise<BranchMetrics[]> {
    const salesByBranch = await this.getSalesByBranch(matchConditions);

    // Get staff count for each branch
    const branchStaffCounts = await User.aggregate([
      {
        $match: {
          tenantId: matchConditions.tenantId,
          isActive: true,
          currentBranch: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$currentBranch',
          staffCount: { $sum: 1 }
        }
      }
    ]);

    const staffCountMap = new Map(
      branchStaffCounts.map(item => [item._id.toString(), item.staffCount])
    );

    // Calculate market share
    const totalRevenue = salesByBranch.reduce((sum, branch) => sum + branch.totalRevenue, 0);

    return salesByBranch.map(branch => ({
      branchId: branch.branchId,
      branchName: branch.branchName,
      branchCode: branch.branchCode,
      totalOrders: branch.totalOrders,
      totalRevenue: branch.totalRevenue,
      avgOrderValue: branch.avgOrderValue,
      totalItems: branch.totalItems,
      totalCustomers: branch.totalCustomers,
      completedOrders: branch.completedOrders,
      cancelledOrders: branch.cancelledOrders,
      refundedOrders: branch.refundedOrders,
      grossRevenue: branch.grossRevenue,
      netRevenue: branch.netRevenue,
      taxAmount: branch.taxAmount,
      discountAmount: branch.discountAmount,
      tipAmount: branch.tipAmount,
      serviceChargeAmount: branch.serviceChargeAmount,
      staffCount: staffCountMap.get(branch.branchId) || 0,
      avgOrderProcessingTime: 30, // Would need actual calculation
      marketShare: totalRevenue > 0 ? (branch.totalRevenue / totalRevenue) * 100 : 0,
      growthRate: 0 // Would need historical data comparison
    }));
  }

  private async getBranchPerformanceComparison(matchConditions: any): Promise<any[]> {
    const branchMetrics = await this.getBranchPerformanceMetrics(matchConditions);

    const metrics = ['totalRevenue', 'totalOrders', 'avgOrderValue', 'totalCustomers'];

    return metrics.map(metric => ({
      metric: metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      branches: branchMetrics
        .sort((a, b) => (b as any)[metric] - (a as any)[metric])
        .map((branch, index) => ({
          branchId: branch.branchId,
          branchName: branch.branchName,
          value: (branch as any)[metric],
          rank: index + 1
        }))
    }));
  }

  private async getRegionalAnalysis(matchConditions: any): Promise<any[]> {
    // This would require geographic data in branches
    // For now, return empty array
    return [];
  }

  // Utility methods
  private formatPeriodDate(period: any, periodType: string): string {
    if (typeof period === 'string') {
      return period;
    }

    if (periodType === 'weekly' && period.year && period.week) {
      return `Week ${period.week}, ${period.year}`;
    }

    if (periodType === 'hourly' && period.year && period.month && period.day && period.hour !== undefined) {
      const date = new Date(period.year, period.month - 1, period.day, period.hour);
      return date.toLocaleDateString() + ' ' + period.hour + ':00';
    }

    return JSON.stringify(period);
  }
}

export default AnalyticsService.getInstance();