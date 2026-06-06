import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { isDateWithinBookingWindow, getWeekendPolicyMessage } from '@/utils/bookingUtils';
import { PolicyPopup } from '@/components/sports/policy-popup';
import { useAdminStore } from '@/store/adminStore';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

interface CalendarModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  initialDate: Date;
  bookedDates?: string[];
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function CalendarModal({ isVisible, onClose, onSelectDate, initialDate, bookedDates = [] }: CalendarModalProps) {
  const [viewDate, setViewDate] = useState(new Date(initialDate));
  const [policyMsg, setPolicyMsg] = useState<string | null>(null);
  const { user } = useAdminStore();
  const isAdmin = user?.role === 'admin';
  const brandGold = useThemeColor({}, 'brandGold');
  const cardBg = useThemeColor({}, 'cardBackground');
  const mutedColor = useThemeColor({}, 'muted');
  const textColor = useThemeColor({}, 'text');

  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    const startingDayIndex = firstDay.getDay();

    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Previous month filler
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = [];
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      prevMonthDays.push({
        day: prevMonthLastDay - i,
        month: month - 1,
        year: year,
        isCurrentMonth: false
      });
    }

    // Current month days
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true
      });
    }

    // Combined days
    const totalDays = [...prevMonthDays, ...currentMonthDays];

    // Next month filler to complete 6 rows (42 days)
    const nextMonthDaysNeeded = 42 - totalDays.length;
    for (let i = 1; i <= nextMonthDaysNeeded; i++) {
      totalDays.push({
        day: i,
        month: month + 1,
        year: year,
        isCurrentMonth: false
      });
    }

    return totalDays;
  }, [viewDate]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
    setViewDate(newDate);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDateSelect = (day: number, month: number, year: number) => {
    const selected = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selected < today) return;

    if (!isDateWithinBookingWindow(selected, isAdmin)) {
      const msg = getWeekendPolicyMessage(selected, isAdmin);
      if (msg) {
        setPolicyMsg(msg);
      }
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelectDate(selected);
    onClose();
  };

  const isToday = (day: number, month: number, year: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (day: number, month: number, year: number) => {
    return initialDate.getDate() === day && initialDate.getMonth() === month && initialDate.getFullYear() === year;
  };

  const isPast = (day: number, month: number, year: number) => {
    const d = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <ThemedView style={[styles.modalContent, { backgroundColor: '#000000', borderColor: brandGold + '30' }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <Ionicons name="chevron-back" size={24} color={brandGold} />
            </TouchableOpacity>
            <View style={styles.monthYear}>
              <ThemedText type="subtitle" style={{ color: brandGold }}>{MONTHS[viewDate.getMonth()]}</ThemedText>
              <ThemedText style={{ color: '#94A3B8' }}>{viewDate.getFullYear()}</ThemedText>
            </View>
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Ionicons name="chevron-forward" size={24} color={brandGold} />
            </TouchableOpacity>
          </View>

          {/* Days Label */}
          <View style={styles.daysRow}>
            {DAYS_OF_WEEK.map(day => (
              <ThemedText key={day} style={styles.dayLabel}>{day}</ThemedText>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.grid}>
            {calendarData.map((item, index) => {
              const dateObj = new Date(item.year, item.month, item.day);
              const isAllowed = isDateWithinBookingWindow(dateObj, isAdmin);
              const dateKey = dateObj.toISOString().split('T')[0];
              const isSoldOut = bookedDates.includes(dateKey);
              const disabled = isPast(item.day, item.month, item.year) || !item.isCurrentMonth || isSoldOut;
              const current = isToday(item.day, item.month, item.year);
              const selected = isSelected(item.day, item.month, item.year);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    selected && { backgroundColor: brandGold },
                    isSoldOut && { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#EF4444', borderWidth: 1 }
                  ]}
                  disabled={disabled}
                  onPress={() => handleDateSelect(item.day, item.month, item.year)}
                >
                  <ThemedText
                    style={[
                      styles.dayText,
                      !item.isCurrentMonth && { color: 'rgba(255,255,255,0.05)' },
                      (isPast(item.day, item.month, item.year)) && item.isCurrentMonth && { color: 'rgba(255,255,255,0.1)' },
                      (!isAllowed && !isPast(item.day, item.month, item.year) && item.isCurrentMonth && !isSoldOut) && { color: brandGold, opacity: 0.5 },
                      isSoldOut && { color: '#EF4444', fontWeight: 'bold' },
                      selected && { color: '#000', fontWeight: 'bold' },
                      current && !selected && { color: brandGold, fontWeight: 'bold' }
                    ]}
                  >
                    {item.day}
                  </ThemedText>
                  {(!isAllowed && !isPast(item.day, item.month, item.year) && item.isCurrentMonth && !isSoldOut) && (
                    <View style={styles.lockIconContainer}>
                      <Ionicons name="lock-closed" size={8} color={brandGold} />
                    </View>
                  )}
                  {isSoldOut && (
                    <View style={styles.lockIconContainer}>
                      <Ionicons name="close-circle" size={10} color="#EF4444" />
                    </View>
                  )}
                  {current && !selected && !isSoldOut && <View style={[styles.todayDot, { backgroundColor: brandGold }]} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer */}
          <TouchableOpacity style={[styles.closeButton, { borderColor: brandGold + '40' }]} onPress={onClose}>
            <ThemedText style={{ color: brandGold, fontWeight: 'bold' }}>Cancel</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </Pressable>

      <PolicyPopup 
        visible={!!policyMsg} 
        message={policyMsg || ''} 
        onClose={() => setPolicyMsg(null)} 
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  monthYear: {
    alignItems: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayLabel: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(128, 128, 128, 0.5)',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 10,
  },
  dayText: {
    fontSize: 14,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
  lockIconContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    opacity: 0.8,
  },
  closeButton: {
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  }
});