export const format = {
  /**
   * Format currency with specified currency code
   * Always uses en-GB locale for UK-style formatting
   * @param amount - The amount to format
   * @param currencyCode - ISO currency code (default: 'GBP')
   * @returns Formatted currency string
   */
  currency(currencyCode: string = 'GBP') {
    return (amount: number): string => {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };
  },

  /**
   * Format ISO date string to localized date (en-GB format)
   * Handles ISO-8601 strings with timezone properly
   * @param isoString - ISO 8601 date string
   * @param formatType - 'short' (9 Nov 2025) or 'long' (9 November 2025) or 'iso' (2025-11-09)
   * @returns Formatted date string
   */
  date(isoString: string | undefined | null, formatType: 'short' | 'long' | 'iso' = 'short'): string {
    if (!isoString) return '—';
    
    const d = new Date(isoString);
    
    // Check for invalid date
    if (isNaN(d.getTime())) {
      console.warn('Invalid date string:', isoString);
      return '—';
    }

    if (formatType === 'iso') {
      return d.toISOString().split('T')[0];
    }

    if (formatType === 'long') {
      return d.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    // Short format - en-GB style (9 Nov 2025)
    return d.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  /**
   * Format number with locale-specific thousand separators (en-GB)
   */
  number(value: number, decimals: number = 0): string {
    return new Intl.NumberFormat('en-GB', {
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
export function currency(amount: number, currencyCode: string = 'GBP'): string {
  return format.currency(currencyCode)(amount);
}

export function currencyGBP(amount: number): string {
  return format.currency('GBP')(amount);
}

export function date(isoString: string | undefined | null, formatOption: 'short' | 'long' = 'short'): string {
  return format.date(isoString, formatOption);
}

export function formatDate(isoString: string | undefined | null): string {
  return format.date(isoString, 'short');
}

export function formatCurrency(amount: number, currencyCode: string = 'GBP'): string {
  return format.currency(currencyCode)(amount);
}
