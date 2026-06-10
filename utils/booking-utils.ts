/**
 * Refined Booking Policy Utilities
 *
 * Rules:
 * 1. Current Weekend slots: CANNOT be booked during weekdays (Mon-Fri).
 * 2. Next Weekend (N+1) slots: CAN ONLY be booked during the Current Weekend (Sat-Sun of Week N).
 * 3. Weekdays (Mon-Fri) are always bookable within the standard 30-day window.
 */

export function isDateWithinBookingWindow(
  date: Date,
  isAdmin: boolean = false,
): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Past dates are never bookable
  if (targetDate < today) return false;

  // Rule: Admin bypass (Admins can manage any future date)
  if (isAdmin) return true;

  const targetDay = targetDate.getDay();
  const isTargetWeekend = targetDay === 0 || targetDay === 6;

  // Rule: Weekdays follow standard rules
  if (!isTargetWeekend) return true;

  // Rule for Weekends:
  const todayDay = today.getDay();
  const isTodayWeekend = todayDay === 0 || todayDay === 6;

  // If today is a weekday (Mon-Fri), NO weekend can be booked.
  if (!isTodayWeekend) {
    return false;
  }

  // If today is a weekend, ONLY the NEXT weekend can be booked.
  // "Next Weekend" means the Saturday/Sunday of the follow-on calendar week.

  // 1. Find this week's Monday (to establish the calendar week baseline)
  // for Sat (6) and Sun (0), diff to Monday is -5 and -6 respectively.
  const diffToMonday = todayDay === 0 ? -6 : 1 - todayDay;
  const thisWeekMonday = new Date(today);
  thisWeekMonday.setDate(today.getDate() + diffToMonday);

  // 2. Identify Next Weekend (Week Monday + 12 & + 13)
  const nextSat = new Date(thisWeekMonday);
  nextSat.setDate(thisWeekMonday.getDate() + 12);
  const nextSun = new Date(thisWeekMonday);
  nextSun.setDate(thisWeekMonday.getDate() + 13);

  const isMatch =
    targetDate.toDateString() === nextSat.toDateString() ||
    targetDate.toDateString() === nextSun.toDateString();

  return isMatch;
}

export function getWeekendPolicyMessage(
  date: Date,
  isAdmin: boolean = false,
): string | null {
  if (isAdmin) return null;

  const today = new Date();
  const todayDay = today.getDay();
  const isTodayWeekend = todayDay === 0 || todayDay === 6;

  const targetDay = date.getDay();
  const isTargetWeekend = targetDay === 0 || targetDay === 6;

  if (!isTargetWeekend) return null;

  if (!isTodayWeekend) {
    return "Weekend booking window is closed during weekdays. Please book on Saturday or Sunday.";
  }

  if (!isDateWithinBookingWindow(date)) {
    return "You can only book for the upcoming NEXT weekend during the current weekend window.";
  }

  return "Next Weekend Pre-booking is OPEN!";
}

export function formatBookingId(id: any): string {
  if (!id || id === "N/A") return "NM-000";
  const strId = String(id).trim();
  if (/^\d+$/.test(strId)) {
    return `NM-${strId.padStart(3, "0")}`;
  }
  if (strId.toUpperCase().startsWith("NM-")) {
    return strId.toUpperCase();
  }
  return `NM-${strId.toUpperCase()}`;
}
