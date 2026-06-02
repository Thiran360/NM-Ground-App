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
  config?: { hourly?: number; price12h?: number; price24h?: number },
): PricingResult => {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6; // Sunday or Saturday

  let basePrice = config?.hourly ?? 1200;

  if (isFullDay) {
    if (fullDayType === "24h") {
      basePrice = config?.price24h ?? 10000;
    } else {
      basePrice = config?.price12h ?? 6000;
    }
  }

  const surchargeMultiplier = isWeekend ? 1.3 : 1.0;
  const finalPrice = Math.round(basePrice * surchargeMultiplier);

  return {
    basePrice,
    finalPrice,
    isWeekend,
    surcharge: finalPrice - basePrice,
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
