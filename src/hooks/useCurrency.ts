import { useTenant } from '@/contexts/TenantContext';
import { formatCurrency, getCurrency, getCurrencySymbol, parseCurrency, Currency, getAllCurrencies } from '@/utils/currency';

export function useCurrency() {
  const { context } = useTenant();
  
  // Get current tenant's currency or default to USD
  const currencyCode = context?.tenant?.settings?.currency || 'KES';
  
  return {
    currencyCode,
    currency: getCurrency(currencyCode),
    
    // Format amount with tenant's currency
    format: (amount: number, options?: {
      showCurrencyCode?: boolean;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    }) => formatCurrency(amount, currencyCode, options),
    
    // Get currency symbol
    symbol: getCurrencySymbol(currencyCode),
    
    // Parse formatted currency string to number
    parse: (value: string) => parseCurrency(value, currencyCode),
    
    // Get all available currencies for selection
    getAllCurrencies,
    
    // Check if currency uses decimals
    hasDecimals: () => {
      const currency = getCurrency(currencyCode);
      return currency ? currency.decimalPlaces > 0 : true;
    },
    
    // Format with decimals (useful for prices)
    formatWithDecimals: (amount: number) => formatCurrency(amount, currencyCode, { 
      minimumFractionDigits: getCurrency(currencyCode)?.decimalPlaces || 2 
    }),
    
    // Format without decimals (useful for large amounts)
    formatWhole: (amount: number) => formatCurrency(amount, currencyCode, { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }),
  };
}