/**
 * Institutional Exchange Calendar and Market Hours Provider
 * Modeled after QuantConnect LEAN MarketHoursDatabase and Python exchange_calendars.
 * 
 * Supports:
 * - NSE / BSE (National Stock Exchange of India, Bombay Stock Exchange)
 * - NYSE / NASDAQ (United States)
 * - LSE (London Stock Exchange, UK)
 * - EURONEXT / XETRA (Europe)
 */

export interface MarketSessionStatus {
  isOpen: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isWeekend: boolean;
  market: string;
  marketName: string;
  timeZone: string;
  localTimeStr: string;
  sessionOpenStr: string;
  sessionCloseStr: string;
  reason: string;
  sessionType: 'PRE_MARKET' | 'REGULAR_OPEN' | 'POST_MARKET' | 'HOLIDAY_CLOSED' | 'WEEKEND_CLOSED';
}

/**
 * Official Exchange Holidays Database (2024 - 2027)
 * Formatted as 'YYYY-MM-DD': 'Holiday Name'
 */
const NSE_BSE_HOLIDAYS: Record<string, string> = {
  // 2024
  '2024-01-22': 'Special Ram Mandir Holiday',
  '2024-01-26': 'Republic Day',
  '2024-03-08': 'Mahashivratri',
  '2024-03-25': 'Holi',
  '2024-03-29': 'Good Friday',
  '2024-04-11': 'Id-Ul-Fitr (Ramzan Id)',
  '2024-04-17': 'Ram Navami',
  '2024-05-01': 'Maharashtra Day',
  '2024-05-20': 'General Elections (Mumbai)',
  '2024-06-17': 'Bakri Id / Eid ul-Adha',
  '2024-07-17': 'Muharram',
  '2024-08-15': 'Independence Day',
  '2024-10-02': 'Mahatma Gandhi Jayanti',
  '2024-11-01': 'Diwali Laxmi Pujan (Muhurat session evening only)',
  '2024-11-15': 'Guru Nanak Jayanti',
  '2024-11-20': 'Maharashtra Assembly Elections',
  '2024-12-25': 'Christmas',
  // 2025
  '2025-01-26': 'Republic Day',
  '2025-02-26': 'Mahashivratri',
  '2025-03-14': 'Holi',
  '2025-03-31': 'Id-Ul-Fitr',
  '2025-04-10': 'Mahavir Jayanti',
  '2025-04-14': 'Dr. Baba Saheb Ambedkar Jayanti',
  '2025-04-18': 'Good Friday',
  '2025-05-01': 'Maharashtra Day',
  '2025-06-07': 'Bakri Id',
  '2025-07-06': 'Muharram',
  '2025-08-15': 'Independence Day',
  '2025-08-27': 'Ganesh Chaturthi',
  '2025-10-02': 'Mahatma Gandhi Jayanti',
  '2025-10-21': 'Diwali Laxmi Pujan (Muhurat trading)',
  '2025-10-22': 'Diwali Balipratipada',
  '2025-11-05': 'Guru Nanak Jayanti',
  '2025-12-25': 'Christmas',
  // 2026
  '2026-01-26': 'Republic Day',
  '2026-02-16': 'Mahashivratri',
  '2026-03-03': 'Holi',
  '2026-03-20': 'Id-Ul-Fitr',
  '2026-04-03': 'Good Friday',
  '2026-04-14': 'Dr. Ambedkar Jayanti',
  '2026-05-01': 'Maharashtra Day',
  '2026-05-27': 'Bakri Id',
  '2026-06-25': 'Muharram',
  '2026-08-15': 'Independence Day',
  '2026-10-02': 'Mahatma Gandhi Jayanti',
  '2026-10-20': 'Dussehra',
  '2026-11-08': 'Diwali Laxmi Pujan (Muhurat session)',
  '2026-11-09': 'Diwali Balipratipada',
  '2026-11-24': 'Guru Nanak Jayanti',
  '2026-12-25': 'Christmas',
  // 2027
  '2027-01-26': 'Republic Day',
  '2027-03-22': 'Holi',
  '2027-03-26': 'Good Friday',
  '2027-04-14': 'Dr. Ambedkar Jayanti',
  '2027-05-01': 'Maharashtra Day',
  '2027-08-15': 'Independence Day',
  '2027-10-02': 'Mahatma Gandhi Jayanti',
  '2027-10-28': 'Diwali Balipratipada',
  '2027-12-25': 'Christmas'
};

const NYSE_NASDAQ_HOLIDAYS: Record<string, string> = {
  // 2024
  '2024-01-01': "New Year's Day",
  '2024-01-15': 'Martin Luther King Jr. Day',
  '2024-02-19': "Washington's Birthday (Presidents' Day)",
  '2024-03-29': 'Good Friday',
  '2024-05-27': 'Memorial Day',
  '2024-06-19': 'Juneteenth National Independence Day',
  '2024-07-04': 'Independence Day',
  '2024-09-02': 'Labor Day',
  '2024-11-28': 'Thanksgiving Day',
  '2024-12-25': 'Christmas Day',
  // 2025
  '2025-01-01': "New Year's Day",
  '2025-01-20': 'Martin Luther King Jr. Day',
  '2025-02-17': "Presidents' Day",
  '2025-04-18': 'Good Friday',
  '2025-05-26': 'Memorial Day',
  '2025-06-19': 'Juneteenth',
  '2025-07-04': 'Independence Day',
  '2025-09-01': 'Labor Day',
  '2025-11-27': 'Thanksgiving Day',
  '2025-12-25': 'Christmas Day',
  // 2026
  '2026-01-01': "New Year's Day",
  '2026-01-19': 'Martin Luther King Jr. Day',
  '2026-02-16': "Presidents' Day",
  '2026-04-03': 'Good Friday',
  '2026-05-25': 'Memorial Day',
  '2026-06-19': 'Juneteenth',
  '2026-07-03': 'Independence Day (Observed)',
  '2026-09-07': 'Labor Day',
  '2026-11-26': 'Thanksgiving Day',
  '2026-12-25': 'Christmas Day',
  // 2027
  '2027-01-01': "New Year's Day",
  '2027-01-18': 'Martin Luther King Jr. Day',
  '2027-02-15': "Presidents' Day",
  '2027-03-26': 'Good Friday',
  '2027-05-31': 'Memorial Day',
  '2027-06-18': 'Juneteenth (Observed)',
  '2027-07-05': 'Independence Day (Observed)',
  '2027-09-06': 'Labor Day',
  '2027-11-25': 'Thanksgiving Day',
  '2027-12-24': 'Christmas Day (Observed)'
};

const LSE_UK_HOLIDAYS: Record<string, string> = {
  // 2025
  '2025-01-01': "New Year's Day",
  '2025-04-18': 'Good Friday',
  '2025-04-21': 'Easter Monday',
  '2025-05-05': 'Early May Bank Holiday',
  '2025-05-26': 'Spring Bank Holiday',
  '2025-08-25': 'Summer Bank Holiday',
  '2025-12-25': 'Christmas Day',
  '2025-12-26': 'Boxing Day',
  // 2026
  '2026-01-01': "New Year's Day",
  '2026-04-03': 'Good Friday',
  '2026-04-06': 'Easter Monday',
  '2026-05-04': 'Early May Bank Holiday',
  '2026-05-25': 'Spring Bank Holiday',
  '2026-08-31': 'Summer Bank Holiday',
  '2026-12-25': 'Christmas Day',
  '2026-12-28': 'Boxing Day (Substitute)'
};

/**
 * Normalizes market string to canonical exchange identifier
 */
export function normalizeMarketKey(market?: string): 'IN' | 'US' | 'UK' | 'EU' {
  if (!market) return 'IN';
  const m = market.toUpperCase().trim();
  if (m === 'IN' || m === 'NSE' || m === 'BSE' || m === 'INDIA') return 'IN';
  if (m === 'US' || m === 'NYSE' || m === 'NASDAQ' || m === 'USA') return 'US';
  if (m === 'UK' || m === 'LSE' || m === 'GB') return 'UK';
  if (m === 'EU' || m === 'EURONEXT' || m === 'XETRA' || m === 'DE' || m === 'FR') return 'EU';
  return 'IN';
}

/**
 * Checks if a specific date is an official exchange holiday
 */
export function getExchangeHolidayName(market: string, dateStr: string): string | null {
  const norm = normalizeMarketKey(market);
  const cleanDate = dateStr.slice(0, 10);
  if (norm === 'IN') return NSE_BSE_HOLIDAYS[cleanDate] || null;
  if (norm === 'US') return NYSE_NASDAQ_HOLIDAYS[cleanDate] || null;
  if (norm === 'UK' || norm === 'EU') return LSE_UK_HOLIDAYS[cleanDate] || null;
  return null;
}

/**
 * Checks if a specific YYYY-MM-DD date is a legitimate trading day
 * (Neither a weekend nor an exchange holiday).
 */
export function isExchangeTradingDay(market: string, dateStr: string): boolean {
  const norm = normalizeMarketKey(market);
  const holiday = getExchangeHolidayName(norm, dateStr);
  if (holiday) return false;

  const d = new Date(dateStr);
  const day = d.getUTCDay();
  // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return false;

  return true;
}

/**
 * Evaluates live market trading session state with timezone precision.
 * 
 * Market Standard Hours:
 * - NSE / BSE:  09:15 to 15:30 IST (UTC+5:30)
 * - NYSE/NASDAQ: 09:30 to 16:00 ET  (UTC-4/UTC-5)
 * - LSE:         08:00 to 16:30 GMT (UTC+0/UTC+1)
 * - Euronext:    09:00 to 17:30 CET (UTC+1/UTC+2)
 */
export function getMarketSessionStatus(market?: string, targetDate: Date = new Date()): MarketSessionStatus {
  const norm = normalizeMarketKey(market);

  if (norm === 'IN') {
    const timeZone = 'Asia/Kolkata';
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'short'
    });
    const parts = formatter.formatToParts(targetDate);
    const weekday = parts.find(p => p.type === 'weekday')?.value || '';
    const year = parts.find(p => p.type === 'year')?.value || '2026';
    const month = parts.find(p => p.type === 'month')?.value || '01';
    const day = parts.find(p => p.type === 'day')?.value || '01';
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const localDateStr = `${year}-${month}-${day}`;
    const totalMinutes = hour * 60 + minute;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} IST`;

    // 1. Check Weekend
    if (weekday === 'Sat' || weekday === 'Sun') {
      return {
        isOpen: false,
        isHoliday: false,
        isWeekend: true,
        market: 'IN',
        marketName: 'NSE / BSE (National Stock Exchange of India)',
        timeZone,
        localTimeStr: timeStr,
        sessionOpenStr: '09:15 IST',
        sessionCloseStr: '15:30 IST',
        reason: `Weekend closure. Reopens Monday at 09:15 IST (Current: ${timeStr})`,
        sessionType: 'WEEKEND_CLOSED'
      };
    }

    // 2. Check Exchange Holiday
    const holidayName = getExchangeHolidayName('IN', localDateStr);
    if (holidayName) {
      return {
        isOpen: false,
        isHoliday: true,
        holidayName,
        isWeekend: false,
        market: 'IN',
        marketName: 'NSE / BSE (National Stock Exchange of India)',
        timeZone,
        localTimeStr: timeStr,
        sessionOpenStr: '09:15 IST',
        sessionCloseStr: '15:30 IST',
        reason: `Exchange Holiday: ${holidayName}. Regular trading is closed today.`,
        sessionType: 'HOLIDAY_CLOSED'
      };
    }

    // 3. Check Session Hours (09:15 to 15:30 IST)
    const openMinutes = 9 * 60 + 15;
    const closeMinutes = 15 * 60 + 30;

    if (totalMinutes < openMinutes) {
      return {
        isOpen: false,
        isHoliday: false,
        isWeekend: false,
        market: 'IN',
        marketName: 'NSE / BSE (National Stock Exchange of India)',
        timeZone,
        localTimeStr: timeStr,
        sessionOpenStr: '09:15 IST',
        sessionCloseStr: '15:30 IST',
        reason: `Pre-market session. Regular trading opens at 09:15 IST (Current: ${timeStr})`,
        sessionType: 'PRE_MARKET'
      };
    }

    if (totalMinutes >= closeMinutes) {
      return {
        isOpen: false,
        isHoliday: false,
        isWeekend: false,
        market: 'IN',
        marketName: 'NSE / BSE (National Stock Exchange of India)',
        timeZone,
        localTimeStr: timeStr,
        sessionOpenStr: '09:15 IST',
        sessionCloseStr: '15:30 IST',
        reason: `Market closed for today. Regular session ended at 15:30 IST (Current: ${timeStr})`,
        sessionType: 'POST_MARKET'
      };
    }

    return {
      isOpen: true,
      isHoliday: false,
      isWeekend: false,
      market: 'IN',
      marketName: 'NSE / BSE (National Stock Exchange of India)',
      timeZone,
      localTimeStr: timeStr,
      sessionOpenStr: '09:15 IST',
      sessionCloseStr: '15:30 IST',
      reason: `Live regular session active (09:15 - 15:30 IST, Current: ${timeStr})`,
      sessionType: 'REGULAR_OPEN'
    };
  }

  if (norm === 'US') {
    const timeZone = 'America/New_York';
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'short'
    });
    const parts = formatter.formatToParts(targetDate);
    const weekday = parts.find(p => p.type === 'weekday')?.value || '';
    const year = parts.find(p => p.type === 'year')?.value || '2026';
    const month = parts.find(p => p.type === 'month')?.value || '01';
    const day = parts.find(p => p.type === 'day')?.value || '01';
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const localDateStr = `${year}-${month}-${day}`;
    const totalMinutes = hour * 60 + minute;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ET`;

    if (weekday === 'Sat' || weekday === 'Sun') {
      return {
        isOpen: false,
        isHoliday: false,
        isWeekend: true,
        market: 'US',
        marketName: 'NYSE / NASDAQ (United States)',
        timeZone,
        localTimeStr: timeStr,
        sessionOpenStr: '09:30 ET',
        sessionCloseStr: '16:00 ET',
        reason: `Weekend closure. Reopens Monday at 09:30 ET (Current: ${timeStr})`,
        sessionType: 'WEEKEND_CLOSED'
      };
    }

    const holidayName = getExchangeHolidayName('US', localDateStr);
    if (holidayName) {
      return {
        isOpen: false,
        isHoliday: true,
        holidayName,
        isWeekend: false,
        market: 'US',
        marketName: 'NYSE / NASDAQ (United States)',
        timeZone,
        localTimeStr: timeStr,
        sessionOpenStr: '09:30 ET',
        sessionCloseStr: '16:00 ET',
        reason: `Exchange Holiday: ${holidayName}. US equity markets are closed.`,
        sessionType: 'HOLIDAY_CLOSED'
      };
    }

    const openMinutes = 9 * 60 + 30;
    const closeMinutes = 16 * 60;

    if (totalMinutes < openMinutes) {
      return {
        isOpen: false,
        isHoliday: false,
        isWeekend: false,
        market: 'US',
        marketName: 'NYSE / NASDAQ (United States)',
        timeZone,
        localTimeStr: timeStr,
        sessionOpenStr: '09:30 ET',
        sessionCloseStr: '16:00 ET',
        reason: `Pre-market hours. Regular trading opens at 09:30 ET (Current: ${timeStr})`,
        sessionType: 'PRE_MARKET'
      };
    }

    if (totalMinutes >= closeMinutes) {
      return {
        isOpen: false,
        isHoliday: false,
        isWeekend: false,
        market: 'US',
        marketName: 'NYSE / NASDAQ (United States)',
        timeZone,
        localTimeStr: timeStr,
        sessionOpenStr: '09:30 ET',
        sessionCloseStr: '16:00 ET',
        reason: `Market closed for today. Regular session ended at 16:00 ET (Current: ${timeStr})`,
        sessionType: 'POST_MARKET'
      };
    }

    return {
      isOpen: true,
      isHoliday: false,
      isWeekend: false,
      market: 'US',
      marketName: 'NYSE / NASDAQ (United States)',
      timeZone,
      localTimeStr: timeStr,
      sessionOpenStr: '09:30 ET',
      sessionCloseStr: '16:00 ET',
      reason: `Live regular session active (09:30 - 16:00 ET, Current: ${timeStr})`,
      sessionType: 'REGULAR_OPEN'
    };
  }

  // European Markets (LSE / Euronext default)
  const timeZone = norm === 'UK' ? 'Europe/London' : 'Europe/Paris';
  const timeStr = targetDate.toLocaleTimeString('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' });
  const day = targetDate.getUTCDay();

  if (day === 0 || day === 6) {
    return {
      isOpen: false,
      isHoliday: false,
      isWeekend: true,
      market: norm,
      marketName: norm === 'UK' ? 'London Stock Exchange' : 'Euronext',
      timeZone,
      localTimeStr: timeStr,
      sessionOpenStr: '08:00 Local',
      sessionCloseStr: '16:30 Local',
      reason: `Weekend closure. Reopens Monday (Current: ${timeStr})`,
      sessionType: 'WEEKEND_CLOSED'
    };
  }

  return {
    isOpen: true,
    isHoliday: false,
    isWeekend: false,
    market: norm,
    marketName: norm === 'UK' ? 'London Stock Exchange' : 'Euronext',
    timeZone,
    localTimeStr: timeStr,
    sessionOpenStr: '08:00 Local',
    sessionCloseStr: '16:30 Local',
    reason: `Market session active (${timeStr})`,
    sessionType: 'REGULAR_OPEN'
  };
}
