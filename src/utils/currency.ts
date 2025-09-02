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
  KES: {
    code: 'KES',
    name: 'Kenyan Shilling',
    symbol: 'KSh',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  UGX: {
    code: 'UGX',
    name: 'Ugandan Shilling',
    symbol: 'USh',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  TZS: {
    code: 'TZS',
    name: 'Tanzanian Shilling',
    symbol: 'TSh',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  RWF: {
    code: 'RWF',
    name: 'Rwandan Franc',
    symbol: 'RWF',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  BIF: {
    code: 'BIF',
    name: 'Burundian Franc',
    symbol: 'FBu',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  CDF: {
    code: 'CDF',
    name: 'Congolese Franc',
    symbol: 'FC',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  SSP: {
    code: 'SSP',
    name: 'South Sudanese Pound',
    symbol: 'SS£',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
};

export function formatCurrency(
  amount: number,
  currencyCode: string = 'KES',
  options: {
    showCurrencyCode?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.KES;
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

export function getCurrencySymbol(currencyCode: string = 'KES'): string {
  return CURRENCIES[currencyCode]?.symbol || 'KSh';
}

export function getCurrencyName(currencyCode: string): string {
  return CURRENCIES[currencyCode]?.name || 'Kenyan Shilling';
}

export function getAllCurrencies(): Currency[] {
  return Object.values(CURRENCIES).sort((a, b) => a.name.localeCompare(b.name));
}

export function getCurrency(currencyCode: string): Currency | undefined {
  return CURRENCIES[currencyCode];
}

// Parse currency input (remove formatting and return number) - backward compatible
export const parseCurrency = (value: string, currencyCode: string = 'KES'): number => {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.KES;
  
  // Remove currency symbol and separators
  let cleanInput = value
    .replace(currency.symbol, '')
    .replace(new RegExp(`\\${currency.thousandsSeparator}`, 'g'), '')
    .replace(currency.decimalSeparator, '.')
    .trim();
  
  return parseFloat(cleanInput) || 0;
};
