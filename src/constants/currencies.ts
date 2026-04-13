export interface Currency {
  code: string
  symbol: string
  name: string
}

export const CURRENCIES: Currency[] = [
  { code: 'EUR', symbol: '\u20AC', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '\u00A3', name: 'British Pound' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'RSD', symbol: 'din', name: 'Serbian Dinar' },
  { code: 'JPY', symbol: '\u00A5', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'TRY', symbol: '\u20BA', name: 'Turkish Lira' },
  { code: 'THB', symbol: '\u0E3F', name: 'Thai Baht' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'CZK', symbol: 'K\u010D', name: 'Czech Koruna' },
  { code: 'PLN', symbol: 'z\u0142', name: 'Polish Zloty' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'INR', symbol: '\u20B9', name: 'Indian Rupee' },
  { code: 'CNY', symbol: '\u00A5', name: 'Chinese Yuan' },
  { code: 'KRW', symbol: '\u20A9', name: 'Korean Won' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
]

export const CURRENCY_MAP = new Map(CURRENCIES.map((c) => [c.code, c]))

export const DEFAULT_CURRENCY = 'EUR'
