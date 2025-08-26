export interface Currency {
  code: string;
  name: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
}

export const CURRENCIES: Record<string, Currency> = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  CHF: {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'Fr.',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  KRW: {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  MXN: {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: '$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  BRL: {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  KES: {
    code: 'KES',
    name: 'Kenyan Shilling',
    symbol: 'KES',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  HKD: {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  SEK: {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'kr',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  NOK: {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: 'kr',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  DKK: {
    code: 'DKK',
    name: 'Danish Krone',
    symbol: 'kr',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  PLN: {
    code: 'PLN',
    name: 'Polish Zloty',
    symbol: 'zł',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  THB: {
    code: 'THB',
    name: 'Thai Baht',
    symbol: '฿',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
};

export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  options: {
    showCurrencyCode?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const {
    showCurrencyCode = false,
    minimumFractionDigits = currency.decimalPlaces,
    maximumFractionDigits = currency.decimalPlaces,
  } = options;

  // Format the number with proper decimal places and separators
  const parts = amount.toFixed(maximumFractionDigits).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Add thousands separator
  let formattedInteger = '';
  for (let i = 0; i < integerPart.length; i++) {
    if (i > 0 && (integerPart.length - i) % 3 === 0) {
      formattedInteger += currency.thousandsSeparator;
    }
    formattedInteger += integerPart[i];
  }

  // Combine integer and decimal parts
  let formattedAmount = formattedInteger;
  if (decimalPart && parseInt(decimalPart) > 0) {
    formattedAmount += currency.decimalSeparator + decimalPart.slice(0, minimumFractionDigits);
  } else if (minimumFractionDigits > 0) {
    formattedAmount += currency.decimalSeparator + '0'.repeat(minimumFractionDigits);
  }

  // Add currency symbol
  let result = '';
  if (currency.symbolPosition === 'before') {
    result = currency.symbol + formattedAmount;
  } else {
    result = formattedAmount + ' ' + currency.symbol;
  }

  // Add currency code if requested
  if (showCurrencyCode) {
    result += ` ${currency.code}`;
  }

  return result;
}

// Legacy functions for backward compatibility
export const formatCurrencyWithDecimals = (amount: number, currencyCode: string = 'KES'): string => {
  return formatCurrency(amount, currencyCode, { minimumFractionDigits: 2 });
};

export function getCurrencySymbol(currencyCode: string = 'USD'): string {
  return CURRENCIES[currencyCode]?.symbol || '$';
}

export function getCurrencyName(currencyCode: string): string {
  return CURRENCIES[currencyCode]?.name || 'US Dollar';
}

export function getAllCurrencies(): Currency[] {
  return Object.values(CURRENCIES).sort((a, b) => a.name.localeCompare(b.name));
}

export function getCurrency(currencyCode: string): Currency | undefined {
  return CURRENCIES[currencyCode];
}

// Parse currency input (remove formatting and return number) - backward compatible
export const parseCurrency = (value: string, currencyCode: string = 'USD'): number => {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD;
  
  // Remove currency symbol and separators
  let cleanInput = value
    .replace(currency.symbol, '')
    .replace(new RegExp(`\\${currency.thousandsSeparator}`, 'g'), '')
    .replace(currency.decimalSeparator, '.')
    .trim();
  
  return parseFloat(cleanInput) || 0;
};