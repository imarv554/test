// Exchange rate utilities using CoinGecko API
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export interface ExchangeRates {
  avaxToUsd: number;
  ccdToUsd: number;
  lastUpdated: number;
}

// Cache for exchange rates (5 minute cache)
let rateCache: ExchangeRates | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch current exchange rates from CoinGecko
 */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
  // Return cached rates if still valid
  if (rateCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return rateCache;
  }

  try {
    // Fetch both AVAX and CCD prices in USD from CoinGecko
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=avalanche-2,concordium&vs_currencies=usd&include_24hr_change=false`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract prices with fallbacks
    const avaxPrice = data['avalanche-2']?.usd || 30; // Fallback ~$30 AVAX
    const ccdPrice = data['concordium']?.usd || 0.10; // Fallback ~$0.10 CCD
    
    const rates: ExchangeRates = {
      avaxToUsd: avaxPrice,
      ccdToUsd: ccdPrice,
      lastUpdated: Date.now(),
    };
    
    // Update cache
    rateCache = rates;
    cacheTimestamp = Date.now();
    
    console.log('Exchange rates updated:', {
      AVAX: `$${avaxPrice.toFixed(2)}`,
      CCD: `$${ccdPrice.toFixed(4)}`,
      timestamp: new Date().toISOString()
    });
    
    return rates;
    
  } catch (error) {
    console.error('Failed to fetch exchange rates from CoinGecko:', error);
    
    // Return cached rates if available
    if (rateCache) {
      console.warn('Using cached exchange rates due to API failure');
      return rateCache;
    }
    
    // Fallback to reasonable default rates
    console.warn('Using fallback exchange rates');
    const fallbackRates: ExchangeRates = {
      avaxToUsd: 30,    // ~$30 AVAX
      ccdToUsd: 0.10,   // ~$0.10 CCD
      lastUpdated: Date.now(),
    };
    
    rateCache = fallbackRates;
    cacheTimestamp = Date.now();
    
    return fallbackRates;
  }
}

/**
 * Convert USD amount to AVAX
 */
export async function convertUsdToAvax(usdAmount: number): Promise<number> {
  const rates = await fetchExchangeRates();
  return usdAmount / rates.avaxToUsd;
}

/**
 * Convert USD amount to CCD
 */
export async function convertUsdToCcd(usdAmount: number): Promise<number> {
  const rates = await fetchExchangeRates();
  return usdAmount / rates.ccdToUsd;
}

/**
 * Convert AVAX amount to USD
 */
export async function convertAvaxToUsd(avaxAmount: number): Promise<number> {
  const rates = await fetchExchangeRates();
  return avaxAmount * rates.avaxToUsd;
}

/**
 * Convert CCD amount to USD
 */
export async function convertCcdToUsd(ccdAmount: number): Promise<number> {
  const rates = await fetchExchangeRates();
  return ccdAmount * rates.ccdToUsd;
}

/**
 * Format price in different currencies
 */
export function formatCryptoPrice(amount: number, currency: 'AVAX' | 'CCD' | 'USD'): string {
  switch (currency) {
    case 'AVAX':
      return `${amount.toFixed(6)} AVAX`;
    case 'CCD':
      return `${amount.toFixed(2)} CCD`;
    case 'USD':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    default:
      return `${amount}`;
  }
}

/**
 * Get cached rates without making API call
 */
export function getCachedRates(): ExchangeRates | null {
  if (rateCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return rateCache;
  }
  return null;
}