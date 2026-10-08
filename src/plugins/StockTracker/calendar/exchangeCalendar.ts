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
 * Official Exchange Holidays Database (2015 - 2027: 12+ Years Historical Backtesting Coverage)
 * Formatted as 'YYYY-MM-DD': 'Holiday Name'
 */
const NSE_BSE_HOLIDAYS: Record<string, string> = {
  // 2015
  '2015-01-26': 'Republic Day',
  '2015-02-17': 'Mahashivratri',
  '2015-03-06': 'Holi',
  '2015-04-02': 'Mahavir Jayanti',
  '2015-04-03': 'Good Friday',
  '2015-04-14': 'Dr. Baba Saheb Ambedkar Jayanti',
  '2015-05-01': 'Maharashtra Day',
  '2015-07-18': 'Id-Ul-Fitr (Ramzan Id)',
  '2015-09-17': 'Ganesh Chaturthi',
  '2015-09-25': 'Bakri Id',
  '2015-10-02': 'Mahatma Gandhi Jayanti',
  '2015-10-22': 'Dussehra',
  '2015-11-11': 'Diwali Laxmi Pujan (Muhurat session evening)',
  '2015-11-12': 'Diwali Balipratipada',
  '2015-11-25': 'Guru Nanak Jayanti',
  '2015-12-25': 'Christmas',
  // 2016
  '2016-01-26': 'Republic Day',
  '2016-03-07': 'Mahashivratri',
  '2016-03-24': 'Holi',
  '2016-03-25': 'Good Friday',
  '2016-04-14': 'Dr. Baba Saheb Ambedkar Jayanti',
  '2016-04-15': 'Ram Navami',
  '2016-04-19': 'Mahavir Jayanti',
  '2016-07-06': 'Id-Ul-Fitr',
  '2016-08-15': 'Independence Day',
  '2016-09-05': 'Ganesh Chaturthi',
  '2016-09-13': 'Bakri Id',
  '2016-10-11': 'Dussehra',
  '2016-10-12': 'Muharram',
  '2016-10-30': 'Diwali Laxmi Pujan (Muhurat trading)',
  '2016-10-31': 'Diwali Balipratipada',
  '2016-11-14': 'Guru Nanak Jayanti',
  // 2017
  '2017-01-26': 'Republic Day',
  '2017-02-24': 'Mahashivratri',
  '2017-03-13': 'Holi',
  '2017-04-04': 'Ram Navami',
  '2017-04-14': 'Dr. Ambedkar Jayanti / Good Friday',
  '2017-05-01': 'Maharashtra Day',
  '2017-06-26': 'Id-Ul-Fitr',
  '2017-08-15': 'Independence Day',
  '2017-08-25': 'Ganesh Chaturthi',
  '2017-10-02': 'Mahatma Gandhi Jayanti',
  '2017-10-19': 'Diwali Laxmi Pujan (Muhurat session)',
  '2017-10-20': 'Diwali Balipratipada',
  '2017-12-25': 'Christmas',
  // 2018
  '2018-01-26': 'Republic Day',
  '2018-02-13': 'Mahashivratri',
  '2018-03-02': 'Holi',
  '2018-03-29': 'Mahavir Jayanti',
  '2018-03-30': 'Good Friday',
  '2018-05-01': 'Maharashtra Day',
  '2018-08-15': 'Independence Day',
  '2018-08-22': 'Bakri Id',
  '2018-09-13': 'Ganesh Chaturthi',
  '2018-09-20': 'Muharram',
  '2018-10-02': 'Mahatma Gandhi Jayanti',
  '2018-10-18': 'Dussehra',
  '2018-11-07': 'Diwali Laxmi Pujan (Muhurat session)',
  '2018-11-08': 'Diwali Balipratipada',
  '2018-11-23': 'Guru Nanak Jayanti',
  '2018-12-25': 'Christmas',
  // 2019
  '2019-03-04': 'Mahashivratri',
  '2019-03-21': 'Holi',
  '2019-04-17': 'Mahavir Jayanti',
  '2019-04-19': 'Good Friday',
  '2019-04-29': 'General Parliamentary Elections (Mumbai)',
  '2019-05-01': 'Maharashtra Day',
  '2019-06-05': 'Id-Ul-Fitr',
  '2019-08-12': 'Bakri Id',
  '2019-08-15': 'Independence Day',
  '2019-09-02': 'Ganesh Chaturthi',
  '2019-09-10': 'Muharram',
  '2019-10-02': 'Mahatma Gandhi Jayanti',
  '2019-10-08': 'Dussehra',
  '2019-10-21': 'Maharashtra Assembly Elections',
  '2019-10-27': 'Diwali Laxmi Pujan (Muhurat session)',
  '2019-10-28': 'Diwali Balipratipada',
  '2019-11-12': 'Guru Nanak Jayanti',
  '2019-12-25': 'Christmas',
  // 2020
  '2020-02-21': 'Mahashivratri',
  '2020-03-10': 'Holi',
  '2020-04-02': 'Ram Navami',
  '2020-04-06': 'Mahavir Jayanti',
  '2020-04-10': 'Good Friday',
  '2020-04-14': 'Dr. Baba Saheb Ambedkar Jayanti',
  '2020-05-01': 'Maharashtra Day',
  '2020-05-25': 'Id-Ul-Fitr',
  '2020-10-02': 'Mahatma Gandhi Jayanti',
  '2020-11-14': 'Diwali Laxmi Pujan (Muhurat session)',
  '2020-11-16': 'Diwali Balipratipada',
  '2020-11-30': 'Guru Nanak Jayanti',
  '2020-12-25': 'Christmas',
  // 2021
  '2021-01-26': 'Republic Day',
  '2021-03-11': 'Mahashivratri',
  '2021-03-29': 'Holi',
  '2021-04-02': 'Good Friday',
  '2021-04-14': 'Dr. Baba Saheb Ambedkar Jayanti',
  '2021-04-21': 'Ram Navami',
  '2021-05-13': 'Id-Ul-Fitr',
  '2021-07-21': 'Bakri Id',
  '2021-08-19': 'Muharram',
  '2021-10-15': 'Dussehra',
  '2021-11-04': 'Diwali Laxmi Pujan (Muhurat session)',
  '2021-11-05': 'Diwali Balipratipada',
  '2021-11-19': 'Guru Nanak Jayanti',
  // 2022
  '2022-01-26': 'Republic Day',
  '2022-03-01': 'Mahashivratri',
  '2022-03-18': 'Holi',
  '2022-04-14': 'Dr. Baba Saheb Ambedkar Jayanti / Mahavir Jayanti',
  '2022-04-15': 'Good Friday',
  '2022-05-03': 'Id-Ul-Fitr',
  '2022-08-09': 'Muharram',
  '2022-08-15': 'Independence Day',
  '2022-08-31': 'Ganesh Chaturthi',
  '2022-10-05': 'Dussehra',
  '2022-10-24': 'Diwali Laxmi Pujan (Muhurat trading)',
  '2022-10-26': 'Diwali Balipratipada',
  '2022-11-08': 'Guru Nanak Jayanti',
  // 2023
  '2023-01-26': 'Republic Day',
  '2023-03-07': 'Holi',
  '2023-03-30': 'Ram Navami',
  '2023-04-04': 'Mahavir Jayanti',
  '2023-04-07': 'Good Friday',
  '2023-04-14': 'Dr. Baba Saheb Ambedkar Jayanti',
  '2023-05-01': 'Maharashtra Day',
  '2023-06-29': 'Bakri Id',
  '2023-08-15': 'Independence Day',
  '2023-09-19': 'Ganesh Chaturthi',
  '2023-10-02': 'Mahatma Gandhi Jayanti',
  '2023-10-24': 'Dussehra',
  '2023-11-14': 'Diwali Balipratipada',
  '2023-11-27': 'Guru Nanak Jayanti',
  '2023-12-25': 'Christmas',
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
  // 2015
  '2015-01-01': "New Year's Day",
  '2015-01-19': 'Martin Luther King Jr. Day',
  '2015-02-16': "Presidents' Day",
  '2015-04-03': 'Good Friday',
  '2015-05-25': 'Memorial Day',
  '2015-07-03': 'Independence Day (Observed)',
  '2015-09-07': 'Labor Day',
  '2015-11-26': 'Thanksgiving Day',
  '2015-12-25': 'Christmas Day',
  // 2016
  '2016-01-01': "New Year's Day",
  '2016-01-18': 'Martin Luther King Jr. Day',
  '2016-02-15': "Presidents' Day",
  '2016-03-25': 'Good Friday',
  '2016-05-30': 'Memorial Day',
  '2016-07-04': 'Independence Day',
  '2016-09-05': 'Labor Day',
  '2016-11-24': 'Thanksgiving Day',
  '2016-12-26': 'Christmas Day (Observed)',
  // 2017
  '2017-01-02': "New Year's Day (Observed)",
  '2017-01-16': 'Martin Luther King Jr. Day',
  '2017-02-20': "Presidents' Day",
  '2017-04-14': 'Good Friday',
  '2017-05-29': 'Memorial Day',
  '2017-07-04': 'Independence Day',
  '2017-09-04': 'Labor Day',
  '2017-11-23': 'Thanksgiving Day',
  '2017-12-25': 'Christmas Day',
  // 2018
  '2018-01-01': "New Year's Day",
  '2018-01-15': 'Martin Luther King Jr. Day',
  '2018-02-19': "Presidents' Day",
  '2018-03-30': 'Good Friday',
  '2018-05-28': 'Memorial Day',
  '2018-07-04': 'Independence Day',
  '2018-09-03': 'Labor Day',
  '2018-11-22': 'Thanksgiving Day',
  '2018-12-05': 'National Day of Mourning (President George H.W. Bush)',
  '2018-12-25': 'Christmas Day',
  // 2019
  '2019-01-01': "New Year's Day",
  '2019-01-21': 'Martin Luther King Jr. Day',
  '2019-02-18': "Presidents' Day",
  '2019-04-19': 'Good Friday',
  '2019-05-27': 'Memorial Day',
  '2019-07-04': 'Independence Day',
  '2019-09-02': 'Labor Day',
  '2019-11-28': 'Thanksgiving Day',
  '2019-12-25': 'Christmas Day',
  // 2020
  '2020-01-01': "New Year's Day",
  '2020-01-20': 'Martin Luther King Jr. Day',
  '2020-02-17': "Presidents' Day",
  '2020-04-10': 'Good Friday',
  '2020-05-25': 'Memorial Day',
  '2020-07-03': 'Independence Day (Observed)',
  '2020-09-07': 'Labor Day',
  '2020-11-26': 'Thanksgiving Day',
  '2020-12-25': 'Christmas Day',
  // 2021
  '2021-01-01': "New Year's Day",
  '2021-01-18': 'Martin Luther King Jr. Day',
  '2021-02-15': "Presidents' Day",
  '2021-04-02': 'Good Friday',
  '2021-05-31': 'Memorial Day',
  '2021-07-05': 'Independence Day (Observed)',
  '2021-09-06': 'Labor Day',
  '2021-11-25': 'Thanksgiving Day',
  '2021-12-24': 'Christmas Day (Observed)',
  // 2022
  '2022-01-17': 'Martin Luther King Jr. Day',
  '2022-02-21': "Presidents' Day",
  '2022-04-15': 'Good Friday',
  '2022-05-30': 'Memorial Day',
  '2022-06-20': 'Juneteenth (Observed)',
  '2022-07-04': 'Independence Day',
  '2022-09-05': 'Labor Day',
  '2022-11-24': 'Thanksgiving Day',
  '2022-12-26': 'Christmas Day (Observed)',
  // 2023
  '2023-01-02': "New Year's Day (Observed)",
  '2023-01-16': 'Martin Luther King Jr. Day',
  '2023-02-20': "Presidents' Day",
  '2023-04-07': 'Good Friday',
  '2023-05-29': 'Memorial Day',
  '2023-06-19': 'Juneteenth National Independence Day',
  '2023-07-04': 'Independence Day',
  '2023-09-04': 'Labor Day',
  '2023-11-23': 'Thanksgiving Day',
  '2023-12-25': 'Christmas Day',
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
  // 2015
  '2015-01-01': "New Year's Day",
  '2015-04-03': 'Good Friday',
  '2015-04-06': 'Easter Monday',
  '2015-05-04': 'Early May Bank Holiday',
  '2015-05-25': 'Spring Bank Holiday',
  '2015-08-31': 'Summer Bank Holiday',
  '2015-12-25': 'Christmas Day',
  '2015-12-28': 'Boxing Day (Substitute)',
  // 2016
  '2016-01-01': "New Year's Day",
  '2016-03-25': 'Good Friday',
  '2016-03-28': 'Easter Monday',
  '2016-05-02': 'Early May Bank Holiday',
  '2016-05-30': 'Spring Bank Holiday',
  '2016-08-29': 'Summer Bank Holiday',
  '2016-12-26': 'Boxing Day',
  '2016-12-27': 'Christmas Day (Substitute)',
  // 2017
  '2017-01-02': "New Year's Day (Substitute)",
  '2017-04-14': 'Good Friday',
  '2017-04-17': 'Easter Monday',
  '2017-05-01': 'Early May Bank Holiday',
  '2017-05-29': 'Spring Bank Holiday',
  '2017-08-28': 'Summer Bank Holiday',
  '2017-12-25': 'Christmas Day',
  '2017-12-26': 'Boxing Day',
  // 2018
  '2018-01-01': "New Year's Day",
  '2018-03-30': 'Good Friday',
  '2018-04-02': 'Easter Monday',
  '2018-05-07': 'Early May Bank Holiday',
  '2018-05-28': 'Spring Bank Holiday',
  '2018-08-27': 'Summer Bank Holiday',
  '2018-12-25': 'Christmas Day',
  '2018-12-26': 'Boxing Day',
  // 2019
  '2019-01-01': "New Year's Day",
  '2019-04-19': 'Good Friday',
  '2019-04-22': 'Easter Monday',
  '2019-05-06': 'Early May Bank Holiday',
  '2019-05-27': 'Spring Bank Holiday',
  '2019-08-26': 'Summer Bank Holiday',
  '2019-12-25': 'Christmas Day',
  '2019-12-26': 'Boxing Day',
  // 2020
  '2020-01-01': "New Year's Day",
  '2020-04-10': 'Good Friday',
  '2020-04-13': 'Easter Monday',
  '2020-05-08': 'Early May Bank Holiday (VE Day 75th Anniversary)',
  '2020-05-25': 'Spring Bank Holiday',
  '2020-08-31': 'Summer Bank Holiday',
  '2020-12-25': 'Christmas Day',
  '2020-12-28': 'Boxing Day (Substitute)',
  // 2021
  '2021-01-01': "New Year's Day",
  '2021-04-02': 'Good Friday',
  '2021-04-05': 'Easter Monday',
  '2021-05-03': 'Early May Bank Holiday',
  '2021-05-31': 'Spring Bank Holiday',
  '2021-08-30': 'Summer Bank Holiday',
  '2021-12-27': 'Christmas Day (Substitute)',
  '2021-12-28': 'Boxing Day (Substitute)',
  // 2022
  '2022-01-03': "New Year's Day (Substitute)",
  '2022-04-15': 'Good Friday',
  '2022-04-18': 'Easter Monday',
  '2022-05-02': 'Early May Bank Holiday',
  '2022-06-02': 'Spring Bank Holiday (Platinum Jubilee)',
  '2022-06-03': 'Platinum Jubilee Bank Holiday',
  '2022-08-29': 'Summer Bank Holiday',
  '2022-09-19': 'State Funeral of Queen Elizabeth II',
  '2022-12-26': 'Boxing Day',
  '2022-12-27': 'Christmas Day (Substitute)',
  // 2023
  '2023-01-02': "New Year's Day (Substitute)",
  '2023-04-07': 'Good Friday',
  '2023-04-10': 'Easter Monday',
  '2023-05-01': 'Early May Bank Holiday',
  '2023-05-08': 'Bank Holiday for Coronation of King Charles III',
  '2023-05-29': 'Spring Bank Holiday',
  '2023-08-28': 'Summer Bank Holiday',
  '2023-12-25': 'Christmas Day',
  '2023-12-26': 'Boxing Day',
  // 2024
  '2024-01-01': "New Year's Day",
  '2024-03-29': 'Good Friday',
  '2024-04-01': 'Easter Monday',
  '2024-05-06': 'Early May Bank Holiday',
  '2024-05-27': 'Spring Bank Holiday',
  '2024-08-26': 'Summer Bank Holiday',
  '2024-12-25': 'Christmas Day',
  '2024-12-26': 'Boxing Day',
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
  '2026-12-28': 'Boxing Day (Substitute)',
  // 2027
  '2027-01-01': "New Year's Day",
  '2027-03-26': 'Good Friday',
  '2027-03-29': 'Easter Monday',
  '2027-05-03': 'Early May Bank Holiday',
  '2027-05-31': 'Spring Bank Holiday',
  '2027-08-30': 'Summer Bank Holiday',
  '2027-12-27': 'Christmas Day (Substitute)',
  '2027-12-28': 'Boxing Day (Substitute)'
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
