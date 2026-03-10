/**
 * IST (Indian Standard Time) Timezone Utilities for Frontend
 *
 * Strategy (Option A): store timestamps as real instants (UTC) and format
 * for display using the IST calendar/clock (Asia/Kolkata).
 *
 * IMPORTANT: Do not "shift" Date objects by adding offsets.
 */

const IST_OFFSET_HOURS = 5;
const IST_OFFSET_MINUTES = 30;
const IST_OFFSET_MS = (IST_OFFSET_HOURS * 60 + IST_OFFSET_MINUTES) * 60 * 1000;

const IST_TIME_ZONE = 'Asia/Kolkata';

const toDateOrNull = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getISTParts = (date) => {
  const d = toDateOrNull(date);
  if (!d) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const map = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
};

/**
 * Get current instant. Naming kept for compatibility.
 * @returns {Date}
 */
export const getNowIST = () => new Date();

/**
 * Convert any date to IST
 * @param {Date|string|number} date - Date to convert
 * @returns {Date} Date converted to IST
 */
export const toIST = (date) => toDateOrNull(date) || new Date();

/**
 * Format IST date as ISO string (YYYY-MM-DD)
 * @param {Date} date - Date in IST (or will be converted)
 * @returns {string} ISO date string
 */
export const formatISTDate = (date) => {
  const parts = getISTParts(date);
  if (!parts) return '';
  const year = String(parts.year).padStart(4, '0');
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format IST time as HH:MM
 * @param {Date} date - Date in IST
 * @returns {string} Time string in HH:MM format
 */
export const formatISTTime = (date) => {
  const parts = getISTParts(date);
  if (!parts) return '';
  const hours = String(parts.hour).padStart(2, '0');
  const minutes = String(parts.minute).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Format date for display in IST locale
 * @param {Date|string} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatISTDisplay = (date, options = {}) => {
  const d = toDateOrNull(date);
  if (!d) return '';

  const defaultOptions = {
    timeZone: IST_TIME_ZONE,
    ...options,
  };

  return d.toLocaleString('en-IN', defaultOptions);
};

/**
 * Format date for display (short format)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date (e.g., "25 Dec 2025")
 */
export const formatISTDateDisplay = (date) => {
  return formatISTDisplay(date, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Format time for display in IST
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time (e.g., "14:30")
 */
export const formatISTTimeDisplay = (date) => {
  return formatISTDisplay(date, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Format time for display in IST (12-hour format)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
export const formatISTTime12Display = (date) => {
  return formatISTDisplay(date, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Get today's date string in IST (YYYY-MM-DD)
 * For use in date inputs
 * @returns {string} Today's date in IST
 */
export const getTodayIST = () => formatISTDate(getNowIST());

/**
 * Get current time string in IST (HH:MM)
 * @returns {string} Current time in IST
 */
export const getCurrentTimeIST = () => formatISTTime(getNowIST());

/**
 * Get current IST datetime for API calls
 * @returns {string} ISO-like datetime string with IST offset
 */
export const getISTDateTime = () => {
  const now = getNowIST();
  return `${formatISTDate(now)}T${formatISTTime(now)}:00+05:30`;
};

/**
 * Get IST year
 * @returns {number} Current year in IST
 */
export const getISTYear = () => getISTParts(new Date())?.year ?? new Date().getFullYear();

/**
 * Get IST month (0-indexed)
 * @returns {number} Current month in IST (0 = January)
 */
export const getISTMonth = () => {
  const parts = getISTParts(new Date());
  return parts ? parts.month - 1 : new Date().getMonth();
};

/**
 * Get IST date of month
 * @returns {number} Current date in IST
 */
export const getISTDateOfMonth = () => getISTParts(new Date())?.day ?? new Date().getDate();

/**
 * Parse a date string and return Date object
 * Assumes input is already in IST context
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Date} Date object
 */
export const parseISTDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  if ([year, month, day].some(n => Number.isNaN(n))) return new Date();
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - IST_OFFSET_MS);
};

/**
 * Get relative time string (e.g., "2 hours ago")
 * All calculations done in IST context
 * @param {Date|string} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTimeIST = (date) => {
  const d = toDateOrNull(date);
  if (!d) return '';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatISTDateDisplay(d);
};

export default {
  getNowIST,
  toIST,
  formatISTDate,
  formatISTTime,
  formatISTDisplay,
  formatISTDateDisplay,
  formatISTTimeDisplay,
  formatISTTime12Display,
  getTodayIST,
  getCurrentTimeIST,
  getISTDateTime,
  getISTYear,
  getISTMonth,
  getISTDateOfMonth,
  parseISTDate,
  getRelativeTimeIST,
  IST_OFFSET_MS,
};
