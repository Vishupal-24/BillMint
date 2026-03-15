/**
 * IST timezone utilities
 *
 * Strategy (Option A): store real UTC instants in Mongo (Date),
 * and only format for display using the IST calendar (Asia/Kolkata).
 *
 * IMPORTANT: Do not "shift" Date objects by adding offsets.
 * Dates should represent actual instants; formatting handles timezone.
 */

const IST_OFFSET_HOURS = 5;
const IST_OFFSET_MINUTES = 30;
export const IST_OFFSET_MS = (IST_OFFSET_HOURS * 60 + IST_OFFSET_MINUTES) * 60 * 1000;
const IST_TIME_ZONE = "Asia/Kolkata";

const toDateOrNull = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getISTParts = (date) => {
  const d = toDateOrNull(date);
  if (!d) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const map = Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
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
 * Get IST calendar parts for a given instant.
 * @returns {{year:number, month:number, day:number} | null} where month is 0-indexed
 */
export const getISTCalendarParts = (date = new Date()) => {
  const parts = getISTParts(date);
  if (!parts) return null;
  return { year: parts.year, month: parts.month - 1, day: parts.day };
};

/**
 * Days in the IST month containing the given instant.
 */
export const getDaysInISTMonth = (date = new Date()) => {
  const parts = getISTCalendarParts(date);
  if (!parts) return new Date().getUTCDate();
  return new Date(Date.UTC(parts.year, parts.month + 1, 0)).getUTCDate();
};

/**
 * Start-of-month instant (IST midnight) for the IST month containing the given instant.
 */
export const getStartOfISTMonth = (date = new Date()) => {
  const parts = getISTCalendarParts(date);
  if (!parts) return new Date();
  return new Date(Date.UTC(parts.year, parts.month, 1, 0, 0, 0, 0) - IST_OFFSET_MS);
};

/**
 * Start-of-month instant (IST midnight) for N months ago relative to the given instant.
 * monthsAgo=0 => start of current IST month.
 */
export const getStartOfISTMonthMonthsAgo = (monthsAgo, date = new Date()) => {
  const parts = getISTCalendarParts(date);
  if (!parts) return new Date();
  const offset = Number(monthsAgo) || 0;
  return new Date(Date.UTC(parts.year, parts.month - offset, 1, 0, 0, 0, 0) - IST_OFFSET_MS);
};

/**
 * Current time (instant). Naming kept for compatibility.
 */
export const getNowIST = () => new Date();

/**
 * Back-compat: previously returned a shifted Date. Now it's a no-op (instant).
 */
export const toIST = (date) => toDateOrNull(date) || new Date();

/**
 * Normalize timestamp input for storage.
 *
 * Accepts:
 * - ISO strings (with timezone) => stored as that instant
 * - date-only strings (YYYY-MM-DD) => interpreted as IST midnight
 */
export const normalizeToIST = (input) => {
  if (!input) return new Date();

  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? new Date() : input;
  }

  if (typeof input === "number") {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    // Date-only: interpret as IST midnight
    const m = /^\d{4}-\d{2}-\d{2}$/.exec(trimmed);
    if (m) {
      const [yearStr, monthStr, dayStr] = trimmed.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr);
      const day = Number(dayStr);
      if ([year, month, day].some((n) => Number.isNaN(n))) return new Date();
      return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - IST_OFFSET_MS);
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  return new Date();
};

/**
 * Format as YYYY-MM-DD using IST calendar.
 */
export const formatISTDate = (date) => {
  const parts = getISTParts(date);
  if (!parts) return "";
  const yyyy = String(parts.year).padStart(4, "0");
  const mm = String(parts.month).padStart(2, "0");
  const dd = String(parts.day).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Format as HH:MM using IST clock.
 */
export const formatISTTime = (date) => {
  const parts = getISTParts(date);
  if (!parts) return "";
  const hh = String(parts.hour).padStart(2, "0");
  const mm = String(parts.minute).padStart(2, "0");
  return `${hh}:${mm}`;
};

/**
 * Full ISO-like datetime string in IST (for display only).
 */
export const formatISTDateTime = (date) => {
  const parts = getISTParts(date);
  if (!parts) return "";
  const yyyy = String(parts.year).padStart(4, "0");
  const mo = String(parts.month).padStart(2, "0");
  const dd = String(parts.day).padStart(2, "0");
  const hh = String(parts.hour).padStart(2, "0");
  const mi = String(parts.minute).padStart(2, "0");
  const ss = String(parts.second).padStart(2, "0");
  return `${yyyy}-${mo}-${dd}T${hh}:${mi}:${ss}+05:30`;
};

/**
 * Date ranges for analytics queries (all IST)
 */
export const getISTDateRanges = () => {
  const now = new Date();
  const nowParts = getISTParts(now);
  if (!nowParts) {
    return {
      now,
      startOfToday: now,
      startOfMonth: now,
      startOfLastMonth: now,
      endOfLastMonth: now,
      startOfYear: now,
      startOfWeek: now,
      startOfLastWeek: now,
      endOfLastWeek: now,
    };
  }

  const startOfToday = new Date(
    Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day, 0, 0, 0, 0) - IST_OFFSET_MS
  );
  const startOfMonth = new Date(Date.UTC(nowParts.year, nowParts.month - 1, 1, 0, 0, 0, 0) - IST_OFFSET_MS);
  const startOfLastMonth = new Date(
    Date.UTC(nowParts.year, nowParts.month - 2, 1, 0, 0, 0, 0) - IST_OFFSET_MS
  );
  const endOfLastMonth = new Date(startOfMonth.getTime() - 1);
  const startOfYear = new Date(Date.UTC(nowParts.year, 0, 1, 0, 0, 0, 0) - IST_OFFSET_MS);

  // Week starts Sunday in IST calendar
  const weekdayShort = new Intl.DateTimeFormat("en-US", { timeZone: IST_TIME_ZONE, weekday: "short" }).format(now);
  const weekdayIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[weekdayShort] ?? 0;
  const startOfWeek = new Date(startOfToday.getTime() - weekdayIndex * 86400000);
  const startOfLastWeek = new Date(startOfWeek.getTime() - 7 * 86400000);
  const endOfLastWeek = new Date(startOfWeek.getTime() - 1);
  
  return {
    now,
    startOfToday,
    startOfMonth,
    startOfLastMonth,
    endOfLastMonth,
    startOfYear,
    startOfWeek,
    startOfLastWeek,
    endOfLastWeek,
  };
};

/**
 * Get today's date string in IST (YYYY-MM-DD)
 * @returns {string} Today's date in IST
 */
export const getTodayIST = () => formatISTDate(getNowIST());

/**
 * Get current time string in IST (HH:MM)
 * @returns {string} Current time in IST
 */
export const getCurrentTimeIST = () => formatISTTime(getNowIST());

/**
 * Parse a date string and return IST Date
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Date} Date object in IST
 */
export const parseISTDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split("-").map(Number);
  if ([year, month, day].some((n) => Number.isNaN(n))) return new Date();
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - IST_OFFSET_MS);
};

export default {
  getNowIST,
  toIST,
  normalizeToIST,
  formatISTDate,
  formatISTTime,
  formatISTDateTime,
  getISTCalendarParts,
  getDaysInISTMonth,
  getStartOfISTMonth,
  getStartOfISTMonthMonthsAgo,
  getISTDateRanges,
  getTodayIST,
  getCurrentTimeIST,
  parseISTDate,
  IST_OFFSET_MS,
};
