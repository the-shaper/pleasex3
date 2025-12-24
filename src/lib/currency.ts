/**
 * Currency detection and conversion utilities for multi-currency payment support.
 * 
 * This module handles:
 * 1. Detecting user's preferred currency based on timezone/locale
 * 2. Mapping countries to their primary currencies
 * 3. Providing exchange rates for USD conversion
 */

// Supported currencies for payment processing
export type SupportedCurrency = "usd" | "mxn" | "eur" | "gbp" | "cad" | "aud" | "jpy" | "brl";

export interface CurrencyInfo {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  // Approximate exchange rate from USD (updated periodically)
  // In production, fetch real-time rates from an API
  usdRate: number;
}

// Currency definitions with approximate USD exchange rates
// These are fallback rates - production should fetch real-time rates
export const CURRENCIES: Record<SupportedCurrency, CurrencyInfo> = {
  usd: { code: "usd", symbol: "$", name: "US Dollar", usdRate: 1 },
  mxn: { code: "mxn", symbol: "$", name: "Mexican Peso", usdRate: 17.5 }, // ~17.5 MXN per USD
  eur: { code: "eur", symbol: "€", name: "Euro", usdRate: 0.92 },
  gbp: { code: "gbp", symbol: "£", name: "British Pound", usdRate: 0.79 },
  cad: { code: "cad", symbol: "$", name: "Canadian Dollar", usdRate: 1.36 },
  aud: { code: "aud", symbol: "$", name: "Australian Dollar", usdRate: 1.57 },
  jpy: { code: "jpy", symbol: "¥", name: "Japanese Yen", usdRate: 157 },
  brl: { code: "brl", symbol: "R$", name: "Brazilian Real", usdRate: 6.2 },
};

// Timezone to country mapping (most common timezones)
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  // Mexico
  "America/Mexico_City": "MX",
  "America/Cancun": "MX",
  "America/Monterrey": "MX",
  "America/Tijuana": "MX",
  "America/Chihuahua": "MX",
  "America/Mazatlan": "MX",
  "America/Hermosillo": "MX",
  "America/Merida": "MX",
  // USA
  "America/New_York": "US",
  "America/Los_Angeles": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Phoenix": "US",
  "America/Anchorage": "US",
  "Pacific/Honolulu": "US",
  // Canada
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Edmonton": "CA",
  "America/Winnipeg": "CA",
  "America/Halifax": "CA",
  // Europe
  "Europe/London": "GB",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Vienna": "AT",
  "Europe/Zurich": "CH",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI",
  "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ",
  "Europe/Dublin": "IE",
  "Europe/Lisbon": "PT",
  "Europe/Athens": "GR",
  // Australia
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Brisbane": "AU",
  "Australia/Perth": "AU",
  "Australia/Adelaide": "AU",
  // Japan
  "Asia/Tokyo": "JP",
  // Brazil
  "America/Sao_Paulo": "BR",
  "America/Rio_Branco": "BR",
  "America/Manaus": "BR",
  "America/Recife": "BR",
};

// Country to currency mapping
const COUNTRY_TO_CURRENCY: Record<string, SupportedCurrency> = {
  // Americas
  US: "usd",
  MX: "mxn",
  CA: "cad",
  BR: "brl",
  // Europe (Eurozone)
  FR: "eur",
  DE: "eur",
  ES: "eur",
  IT: "eur",
  NL: "eur",
  BE: "eur",
  AT: "eur",
  FI: "eur",
  PT: "eur",
  GR: "eur",
  IE: "eur",
  // Europe (Non-Eurozone)
  GB: "gbp",
  CH: "eur", // Switzerland uses CHF but we'll use EUR for simplicity
  SE: "eur", // Sweden uses SEK but we'll use EUR for simplicity
  NO: "eur", // Norway uses NOK but we'll use EUR for simplicity
  DK: "eur", // Denmark uses DKK but we'll use EUR for simplicity
  PL: "eur", // Poland uses PLN but we'll use EUR for simplicity
  CZ: "eur", // Czech uses CZK but we'll use EUR for simplicity
  // Asia-Pacific
  JP: "jpy",
  AU: "aud",
};

/**
 * Detect the user's preferred currency based on their browser timezone.
 * Falls back to USD if detection fails.
 */
export function detectUserCurrency(): SupportedCurrency {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const country = TIMEZONE_TO_COUNTRY[timezone];
    
    if (country) {
      const currency = COUNTRY_TO_CURRENCY[country];
      if (currency && CURRENCIES[currency]) {
        return currency;
      }
    }
    
    // Fallback: try to detect from browser language
    const lang = navigator.language || (navigator as any).userLanguage || "en-US";
    const langCountry = lang.split("-")[1]?.toUpperCase();
    
    if (langCountry) {
      const currency = COUNTRY_TO_CURRENCY[langCountry];
      if (currency && CURRENCIES[currency]) {
        return currency;
      }
    }
  } catch {
    // Ignore detection errors
  }
  
  return "usd"; // Default fallback
}

/**
 * Get the user's detected country code based on timezone.
 */
export function detectUserCountry(): string | null {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_TO_COUNTRY[timezone] || null;
  } catch {
    return null;
  }
}

/**
 * Convert USD cents to target currency cents.
 * Uses fallback rates - production should use real-time rates.
 */
export function convertUsdToLocalCents(usdCents: number, targetCurrency: SupportedCurrency): number {
  const rate = CURRENCIES[targetCurrency]?.usdRate || 1;
  return Math.round(usdCents * rate);
}

/**
 * Convert local currency cents back to USD cents (for display purposes).
 */
export function convertLocalToUsdCents(localCents: number, sourceCurrency: SupportedCurrency): number {
  const rate = CURRENCIES[sourceCurrency]?.usdRate || 1;
  return Math.round(localCents / rate);
}

/**
 * Format an amount in cents as a currency string.
 */
export function formatCurrency(cents: number, currency: SupportedCurrency): string {
  const info = CURRENCIES[currency];
  const amount = cents / 100;
  
  // Use Intl.NumberFormat for proper locale-aware formatting
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: currency === "jpy" ? 0 : 2,
      maximumFractionDigits: currency === "jpy" ? 0 : 2,
    }).format(amount);
  } catch {
    // Fallback formatting
    return `${info?.symbol || "$"}${amount.toFixed(currency === "jpy" ? 0 : 2)}`;
  }
}

/**
 * Get currency info for a given currency code.
 */
export function getCurrencyInfo(currency: SupportedCurrency): CurrencyInfo {
  return CURRENCIES[currency] || CURRENCIES.usd;
}

/**
 * Check if a currency is supported for payment processing.
 */
export function isSupportedCurrency(currency: string): currency is SupportedCurrency {
  return currency in CURRENCIES;
}

