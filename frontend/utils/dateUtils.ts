/**
 * Utilities for handling dates and times in Nepal (UTC+5:45).
 */

/**
 * Returns a Date object representing the current moment.
 * Useful for consistent naming, though new Date() is identical.
 */
export const getNepalNow = (): Date => {
  return new Date();
};

/**
 * Parses a date string (YYYY-MM-DD or ISO) and a time string (e.g., "9:00 AM", "3:00 PM")
 * into a Date object representing that exact moment in time, correctly handled for Nepal timezone.
 */
export const parseNepalDateTime = (dateStr: string, timeStr?: string, endOfDay: boolean = false): Date => {
  // Normalize date: get the YYYY-MM-DD part as it appears in Nepal
  const normalizedDate = toNepaliDateStr(dateStr);

  if (!timeStr) {
    // If no time, assume start (or end) of day in Nepal
    const time = endOfDay ? "23:59:59" : "00:00:00";
    return new Date(`${normalizedDate}T${time}+05:45`);
  }

  // Parse "2:00 PM", "2:00PM", "2 PM", or "14:00"
  let hour: number = 0, minute: number = 0;
  const timeRegex = /(\d+)(?::(\d+))?\s*(AM|PM)?/i;
  const match = timeStr.match(timeRegex);

  if (match) {
    hour = parseInt(match[1]);
    minute = match[2] ? parseInt(match[2]) : 0;
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const isoStr = `${normalizedDate}T${pad(hour)}:${pad(minute)}:00+05:45`;
  
  return new Date(isoStr);
};

/**
 * Checks if a session at the given date and time is ready to be joined.
 * Returns true if the CURRENT universal time matches or exceeds the session start time in Nepal.
 */
export const isSessionActive = (dateStr: string, timeStr: string): boolean => {
  const now = new Date(); // Absolute current moment
  const sessionStart = parseNepalDateTime(dateStr, timeStr);
  return now >= sessionStart;
};

/**
 * Converts any date string or Date object to "YYYY-MM-DD" in Nepal timezone.
 */
export const toNepaliDateStr = (dateInput: string | Date): string => {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    return typeof dateInput === "string" ? dateInput.split('T')[0] : "";
  }
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(date);
  const comp: any = {};
  parts.forEach(({type, value}) => comp[type] = value);
  
  return `${comp.year}-${comp.month}-${comp.day}`;
};

/**
 * Returns a human-readable string representing the time remaining until a given date.
 */
export const getTimeRemaining = (expiryDate: string | Date | null): string => {
  if (!expiryDate) return "Never";
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 30) {
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  }
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;

  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
};
