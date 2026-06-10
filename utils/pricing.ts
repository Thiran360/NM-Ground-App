export interface PricingResult {
  basePrice: number;
  finalPrice: number;
  isWeekend: boolean;
  surcharge: number;
}

export const getSlotPrice = (
  date: Date,
  isFullDay: boolean = false,
  fullDayType: "12h" | "24h" = "12h",
  config?: { 
    hourly?: number; price12h?: number; price24h?: number;
    weekendHourly?: number; weekendPrice12h?: number; weekendPrice24h?: number;
  },
): PricingResult => {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6; // Sunday or Saturday

  let basePrice = config?.hourly ?? 1200;
  
  if (isWeekend && config?.weekendHourly !== undefined) {
    basePrice = config.weekendHourly;
  } else if (isWeekend) {
    basePrice = basePrice * 1.3; // Fallback
  }

  let finalPrice = basePrice;

  if (isFullDay) {
    if (fullDayType === "24h") {
      finalPrice = (isWeekend && config?.weekendPrice24h !== undefined) 
        ? config.weekendPrice24h 
        : (config?.price24h ?? 10000);
      basePrice = config?.price24h ?? 10000;
    } else {
      finalPrice = (isWeekend && config?.weekendPrice12h !== undefined) 
        ? config.weekendPrice12h 
        : (config?.price12h ?? 6000);
      basePrice = config?.price12h ?? 6000;
    }
  }

  const surcharge = isWeekend ? (finalPrice - basePrice) : 0;

  return {
    basePrice,
    finalPrice,
    isWeekend,
    surcharge,
  };
};

export const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 || 12;
  const ampm = i < 12 ? "AM" : "PM";
  const nextHour = (i + 1) % 12 || 12;
  const nextAmpm = i + 1 < 12 || i + 1 === 24 ? "AM" : "PM";

  return {
    id: String(i + 1),
    label: `${hour} ${ampm} – ${nextHour} ${nextAmpm}`,
    startTime: i,
    duration: 1,
    category:
      i < 6 ? "Night" : i < 12 ? "Morning" : i < 18 ? "Afternoon" : "Evening",
  };
});

export const getDynamicTimeSlots = (date: Date) => {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;

  if (isWeekend) {
    return [
      {
        id: "weekend-m",
        label: "Morning 8 AM – 12 PM",
        startTime: 8,
        duration: 4,
        category: "Morning",
      },
      {
        id: "weekend-a",
        label: "Afternoon 1 PM – 5 PM",
        startTime: 13,
        duration: 4,
        category: "Afternoon",
      },
      {
        id: "weekend-e",
        label: "Evening 6 PM – 10 PM",
        startTime: 18,
        duration: 4,
        category: "Evening",
      },
    ];
  }

  return TIME_SLOTS;
};
