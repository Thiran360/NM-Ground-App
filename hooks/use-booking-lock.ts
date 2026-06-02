import { useState, useEffect, useCallback, useMemo } from "react";
import { useAdminStore } from "@/store/admin-store";

export type SlotStatus = "available" | "booked" | "locked" | "selected";

interface MockLockState {
  [key: string]: {
    status: SlotStatus;
    expiresAt?: number;
  };
}

export const useBookingLock = (groundId: string, dateKey: string) => {
  const [locks, setLocks] = useState<MockLockState>({});
  const { heldSlots, bookings } = useAdminStore();

  // Load real booked slots from the global store
  useEffect(() => {
    const initial: MockLockState = {};

    // Filter global bookings for this specific ground and date
    const relevantBookings = bookings.filter(
      (b) =>
        (b.groundId === groundId || b.ground_id === groundId) &&
        b.date === dateKey &&
        b.status === "Confirmed",
    );

    relevantBookings.forEach((booking) => {
      booking.slots.forEach((slotId: string) => {
        initial[`${groundId}-${slotId}`] = { status: "booked" };
      });
    });

    // Occasionally simulate someone else locking a slot (temporary locks)
    const timer = setTimeout(() => {
      setLocks((prev) => ({
        ...prev,
        [`${groundId}-99`]: { status: "locked", expiresAt: Date.now() + 30000 },
      }));
    }, 5000);

    setLocks(initial);
    return () => clearTimeout(timer);
  }, [groundId, dateKey, bookings]);

  // Merge local locks with global admin holds
  const mergedLocks = useMemo(() => {
    const final = { ...locks };
    heldSlots.forEach((hold) => {
      if (hold.groundId === groundId && hold.date === dateKey) {
        final[`${groundId}-${hold.slotId}`] = { status: "locked" };
      }
    });
    return final;
  }, [locks, heldSlots, groundId, dateKey]);

  const selectSlot = useCallback(
    (slotId: string) => {
      const key = `${groundId}-${slotId}`;
      setLocks((prev) => {
        const current = prev[key];

        // Check if Admin has held this slot
        const isAdminHeld = heldSlots.some(
          (h) =>
            h.groundId === groundId &&
            h.slotId === slotId &&
            h.date === dateKey,
        );

        if (
          current?.status === "booked" ||
          current?.status === "locked" ||
          isAdminHeld
        )
          return prev;

        // If already selected, toggle back to available
        if (current?.status === "selected") {
          const next = { ...prev };
          delete next[key];
          return next;
        }

        return {
          ...prev,
          [key]: { status: "selected" },
        };
      });
    },
    [groundId, heldSlots, dateKey],
  );

  return {
    locks: mergedLocks,
    selectSlot,
  };
};
