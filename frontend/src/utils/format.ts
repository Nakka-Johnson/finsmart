export const format = {
  /**
   * Format currency with specified currency code
   * @param amount - The amount to format
   * @param currencyCode - ISO currency code (e.g., 'GBP', 'USD', 'EUR')
   * @returns Formatted currency string
   */
  currency(currencyCode: string = 'GBP') {
    return (amount: number): string => {
      const locale = currencyCode === 'GBP' ? 'en-GB' : 'en-US';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };
  },

  /**
   * Format ISO date string to localized date
   * @param isoString - ISO 8601 date string
   * @param formatType - 'short' (Nov 9, 2025) or 'long' (November 9, 2025) or 'iso' (2025-11-09)
   * @returns Formatted date string
   */
  date(isoString: string, formatType: 'short' | 'long' | 'iso' = 'short'): string {
    const d = new Date(isoString);

    if (formatType === 'iso') {
      return d.toISOString().split('T')[0];
    }

    if (formatType === 'long') {
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  /**
   * Format number with locale-specific thousand separators
   */
  number(value: number, decimals: number = 0): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  },

  /**
   * Format percentage
   */
  percent(value: number, decimals: number = 1): string {
    return `${(value * 100).toFixed(decimals)}%`;
  },
};

// Legacy exports for backwards compatibility
export function currency(amount: number, currencyCode: string = 'USD'): string {
  return format.currency(currencyCode)(amount);
}

export function currencyGBP(amount: number): string {
  return format.currency('GBP')(amount);
}

export function date(isoString: string, formatOption: 'short' | 'long' = 'short'): string {
  return format.date(isoString, formatOption);
}

export function formatDate(isoString: string): string {
  return format.date(isoString, 'short');
}

export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  return format.currency(currencyCode)(amount);
}
