import { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * A robust global store for the Sports App.
 * Now operating in purely local storage (Offline Mode).
 */

export interface User {
  id: string;
  name: string;
  role: "user" | "admin";
  walletBalance: number;
  loyaltyPoints: number;
  accessToken?: string;
}

export interface AdminHold {
  groundId: string;
  slotId: string;
  date: string;
}

export interface Booking {
  id: string;
  groundId: string;
  ground?: string;
  ground_id?: string;
  user?: string;
  player?: string;
  date: string;
  slots: string[];
  isFullDay: boolean;
  fullDayType?: string;
  totalAmount: number;
  advancePaid: number;
  status: "Confirmed" | "Completed" | "Cancelled";
}

export interface Ground {
  id: string;
  name: string;
  type: string;
  imageUrl: string | number;
  price_per_hour: number;
  rating?: number;
  location?: string;
}

const DEFAULT_GROUNDS: Ground[] = [
  {
    id: "ground-a",
    name: "NM Greens - Ground A",
    type: "International Cricket Ground",
    price_per_hour: 1200,
    rating: 4.9,
    location: "Main Arena, Gate 4",
    imageUrl: require("@/assets/images/ground_a_premium.png"),
  },
  {
    id: "ground-b",
    name: "NM Greens - Ground B",
    type: "Premium Match Ground",
    price_per_hour: 1000,
    rating: 4.8,
    location: "A-Block Championship Area",
    imageUrl: require("@/assets/images/ground_b_premium.png"),
  },
];

class AdminStore {
  private static instance: AdminStore;
  private currentUser: User | null = null;
  private authToken: string | null = null;
  private heldSlots: AdminHold[] = [];
  private basePrice: number = 1200;
  private price12h: number = 6000;
  private price24h: number = 10000;
  private walletBalance: number = 500;
  private loyaltyPoints: number = 0;
  private bookings: Booking[] = [];
  private grounds: Ground[] = [];
  private adminStats: any = null;
  private couponPercentage: number = 20;
  private couponCode: string = "SAVE20";
  private adminId: string = "admin@nm.com";
  private adminPassword: string = "admin123";
  private alertState = {
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "warning" | "info" | "error",
  };
  private isInitialized: boolean = false;
  private listeners: Set<() => void> = new Set();

  private constructor() {}

  static getInstance() {
    if (!AdminStore.instance) {
      AdminStore.instance = new AdminStore();
      AdminStore.instance.loadSession();
    }
    return AdminStore.instance;
  }

  // Persistence
  async saveSession() {
    try {
      if (this.currentUser) {
        const session = {
          user: this.currentUser,
          token: this.authToken,
        };
        await AsyncStorage.setItem(
          "nm_greens_session",
          JSON.stringify(session),
        );
      } else {
        await AsyncStorage.removeItem("nm_greens_session");
      }

      const appData = {
        walletBalance: this.walletBalance,
        loyaltyPoints: this.loyaltyPoints,
        bookings: this.bookings,
        basePrice: this.basePrice,
        price12h: this.price12h,
        price24h: this.price24h,
        heldSlots: this.heldSlots,
        couponCode: this.couponCode,
        couponPercentage: this.couponPercentage,
      };
      await AsyncStorage.setItem("nm_greens_app_data", JSON.stringify(appData));
    } catch (e) {
      console.error("Save session error:", e);
    }
  }

  async loadSession() {
    try {
      const data = await AsyncStorage.getItem("nm_greens_session");
      if (data) {
        const session = JSON.parse(data);
        this.currentUser = session.user;
        this.authToken = session.token;
      }

      // Patch user name from nm_user if the stored name looks like an email (fallback case)
      if (this.currentUser) {
        const nmUserStr = await AsyncStorage.getItem("nm_user");
        if (nmUserStr) {
          const nmUser = JSON.parse(nmUserStr);
          const storedName = this.currentUser.name ?? "";
          const isEmailFallback = storedName.includes("@") || storedName === "";
          const realName = nmUser.full_name ?? nmUser.name ?? "";
          if (isEmailFallback && realName && !realName.includes("@")) {
            this.currentUser.name = realName;
          }
        }
      }

      const appDataStr = await AsyncStorage.getItem("nm_greens_app_data");
      if (appDataStr) {
        const appData = JSON.parse(appDataStr);
        this.walletBalance = appData.walletBalance ?? 500;
        this.loyaltyPoints = appData.loyaltyPoints ?? 0;
        this.bookings = appData.bookings || [];
        this.basePrice = appData.basePrice ?? 1200;
        this.price12h = appData.price12h ?? 6000;
        this.price24h = appData.price24h ?? 10000;
        this.heldSlots = appData.heldSlots || [];
        this.couponCode = appData.couponCode ?? "SAVE20";
        this.couponPercentage = appData.couponPercentage ?? 20;

        if (this.currentUser) {
          this.currentUser.walletBalance = this.walletBalance;
          this.currentUser.loyaltyPoints = this.loyaltyPoints;
        }
      }

      this.grounds = DEFAULT_GROUNDS;

      this.computeAdminStats();
    } catch (e) {
      console.error("Load session error:", e);
    } finally {
      this.isInitialized = true;
      this.notify();
    }
  }

  // Auth methods
  login(
    role: "user" | "admin",
    name?: string,
    token?: string,
    userId?: string,
  ) {
    this.authToken = token || null;
    this.currentUser = {
      id: userId || (role === "admin" ? "admin-1" : "user-123"),
      name: name || (role === "admin" ? "Arena Manager" : "John Player"),
      role,
      walletBalance: this.walletBalance,
      loyaltyPoints: this.loyaltyPoints,
      accessToken: token,
    };
    this.saveSession();
    this.notify();
  }

  logout() {
    this.currentUser = null;
    this.authToken = null;
    this.saveSession();
    this.notify();
  }

  getUser() {
    return this.currentUser;
  }

  async fetchProfile() {
    if (!this.currentUser) {
      this.notify();
      return;
    }

    try {
      const userId = this.currentUser.id;
      const token = this.authToken;

      const response = await fetch(
        `https://refined-alone-causing.ngrok-free.dev/booking/user/${userId}/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token ? { Authorization: `Token ${token}` } : {}),
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Support common name fields from the API response
        const fetchedName =
          data.full_name ??
          data.name ??
          data.username ??
          data.first_name ??
          null;

        if (fetchedName && typeof fetchedName === "string" && fetchedName.trim()) {
          this.currentUser.name = fetchedName.trim();
          await this.saveSession();
        }
      }
    } catch (e) {
      // Network failure — keep existing name silently
      console.warn("fetchProfile: could not reach server", e);
    }

    this.notify();
  }

  // Ground management
  async fetchGrounds() {
    if (this.grounds.length === 0) {
      this.grounds = DEFAULT_GROUNDS;
    }
    this.notify();
  }

  getGrounds() {
    return this.grounds;
  }

  // Booking management
  async fetchBookings() {
    // Local mode: bookings are already loaded from AsyncStorage
    this.notify();
  }

  async addBooking(booking: Booking) {
    this.bookings.push(booking);

    const pointsEarned = Math.floor(booking.advancePaid / 10);
    this.awardPoints(pointsEarned);

    this.computeAdminStats();
    this.saveSession();
    this.notify();
    return true;
  }

  getBookings() {
    return [...this.bookings];
  }

  async cancelBooking(bookingId: string) {
    const index = this.bookings.findIndex((b) => b.id === bookingId);
    if (index !== -1) {
      const booking = this.bookings[index];
      this.bookings[index] = { ...booking, status: "Cancelled" };

      const refundAmount = booking.advancePaid * 0.5;
      this.walletBalance += refundAmount;
      if (this.currentUser) {
        this.currentUser.walletBalance = this.walletBalance;
      }

      this.computeAdminStats();
      this.saveSession();
      this.notify();
      return true;
    }
    return false;
  }

  // Admin specific
  computeAdminStats() {
    const totalBookings = this.bookings.length;
    const completedBookings = this.bookings.filter(
      (b) => b.status === "Completed",
    ).length;
    const revenue = this.bookings
      .filter((b) => b.status !== "Cancelled")
      .reduce((acc, b) => acc + b.totalAmount, 0);

    this.adminStats = {
      totalBookings,
      completedBookings,
      revenue,
      activeUsers: 1, // Mock value
    };
  }

  async fetchAdminStats() {
    this.computeAdminStats();
    this.notify();
  }

  async fetchAdminPricing() {
    this.notify();
  }

  async updateAdminPricing(pricing: any) {
    if (pricing.basePrice) this.basePrice = pricing.basePrice;
    if (pricing.price12h) this.price12h = pricing.price12h;
    if (pricing.price24h) this.price24h = pricing.price24h;

    this.saveSession();
    this.notify();
  }

  async fetchAdminBookings() {
    this.notify();
  }

  getAdminStats() {
    return this.adminStats;
  }

  // Wallet
  async fetchWallet() {
    this.notify();
  }

  async topUpWallet(amount: number) {
    this.walletBalance += amount;
    if (this.currentUser) this.currentUser.walletBalance = this.walletBalance;

    const pointsEarned = Math.floor(amount / 10);
    this.awardPoints(pointsEarned);

    this.saveSession();
    this.notify();
    return true;
  }

  payFromWallet(amount: number) {
    if (this.currentUser) {
      this.currentUser.walletBalance -= amount;
      this.walletBalance = this.currentUser.walletBalance;
      this.saveSession();
      this.notify();
    }
  }

  awardPoints(points: number) {
    if (this.currentUser) {
      this.currentUser.loyaltyPoints =
        (this.currentUser.loyaltyPoints || 0) + points;
      this.loyaltyPoints = this.currentUser.loyaltyPoints;
      this.saveSession();
      this.notify();
    }
  }

  redeemPoints(points: number) {
    if (this.currentUser && this.currentUser.loyaltyPoints >= points) {
      this.currentUser.loyaltyPoints -= points;
      this.loyaltyPoints = this.currentUser.loyaltyPoints;
      this.saveSession();
      this.notify();
    }
  }

  updateAdminCredentials(id: string, pass: string) {
    this.adminId = id;
    this.adminPassword = pass;
    this.notify();
  }

  getAdminCredentials() {
    return { id: this.adminId, password: this.adminPassword };
  }

  // Coupon
  async validateCoupon(code: string) {
    if (code.toUpperCase() === "SAVE20" || code.toUpperCase() === "WELCOME10") {
      this.couponCode = code.toUpperCase();
      this.couponPercentage = code.toUpperCase() === "SAVE20" ? 20 : 10;
      this.saveSession();
      this.notify();
      return true;
    }
    return false;
  }

  updateCoupon(code: string, percentage: number) {
    this.couponCode = code.toUpperCase();
    this.couponPercentage = percentage;
    this.saveSession();
    this.notify();
  }

  // Slot management
  toggleHold(groundId: string, slotId: string, date: string) {
    const index = this.heldSlots.findIndex(
      (h) => h.groundId === groundId && h.slotId === slotId && h.date === date,
    );
    if (index === -1) this.heldSlots.push({ groundId, slotId, date });
    else this.heldSlots.splice(index, 1);
    this.saveSession();
    this.notify();
  }

  isHeld(groundId: string, slotId: string, date: string) {
    return this.heldSlots.some(
      (h) => h.groundId === groundId && h.slotId === slotId && h.date === date,
    );
  }

  getHeldSlots() {
    return [...this.heldSlots];
  }

  // Price management (Local)
  getBasePrice() {
    return this.basePrice;
  }
  setBasePrice(price: number) {
    this.basePrice = price;
    this.saveSession();
    this.notify();
  }
  getPrice12h() {
    return this.price12h;
  }
  setPrice12h(price: number) {
    this.price12h = price;
    this.saveSession();
    this.notify();
  }
  getPrice24h() {
    return this.price24h;
  }
  setPrice24h(price: number) {
    this.price24h = price;
    this.saveSession();
    this.notify();
  }

  getCouponPercentage() {
    return this.couponPercentage;
  }
  setCouponPercentage(p: number) {
    this.couponPercentage = p;
    this.saveSession();
    this.notify();
  }
  getCouponCode() {
    return this.couponCode;
  }
  setCouponCode(c: string) {
    this.couponCode = c.toUpperCase();
    this.saveSession();
    this.notify();
  }

  // Alert Management
  getAlertState() {
    return { ...this.alertState };
  }
  showAlert(
    title: string,
    message: string,
    type: "success" | "warning" | "info" | "error" = "info",
  ) {
    this.alertState = { visible: true, title, message, type };
    this.notify();
  }
  hideAlert() {
    this.alertState = { ...this.alertState, visible: false };
    this.notify();
  }

  // React Subscription
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
  getIsInitialized() {
    return this.isInitialized;
  }
}

export const adminStore = AdminStore.getInstance();

export const useAdminStore = () => {
  const [state, setState] = useState({
    user: adminStore.getUser(),
    heldSlots: adminStore.getHeldSlots(),
    basePrice: adminStore.getBasePrice(),
    price12h: adminStore.getPrice12h(),
    price24h: adminStore.getPrice24h(),
    bookings: adminStore.getBookings(),
    grounds: adminStore.getGrounds(),
    adminStats: adminStore.getAdminStats(),
    couponPercentage: adminStore.getCouponPercentage(),
    couponCode: adminStore.getCouponCode(),
    alertConfig: adminStore.getAlertState(),
    isInitialized: adminStore.getIsInitialized(),
  });

  useEffect(() => {
    return adminStore.subscribe(() => {
      setState({
        user: adminStore.getUser(),
        heldSlots: adminStore.getHeldSlots(),
        basePrice: adminStore.getBasePrice(),
        price12h: adminStore.getPrice12h(),
        price24h: adminStore.getPrice24h(),
        bookings: adminStore.getBookings(),
        grounds: adminStore.getGrounds(),
        adminStats: adminStore.getAdminStats(),
        couponPercentage: adminStore.getCouponPercentage(),
        couponCode: adminStore.getCouponCode(),
        alertConfig: adminStore.getAlertState(),
        isInitialized: adminStore.getIsInitialized(),
      });
    });
  }, []);

  return {
    ...state,
    login: (
      role: "user" | "admin",
      name?: string,
      token?: string,
      userId?: string,
    ) => adminStore.login(role, name, token, userId),
    logout: () => adminStore.logout(),
    fetchProfile: () => adminStore.fetchProfile(),
    fetchBookings: () => adminStore.fetchBookings(),
    fetchGrounds: () => adminStore.fetchGrounds(),
    addBooking: (booking: Booking) => adminStore.addBooking(booking),
    cancelBooking: (bookingId: string) => adminStore.cancelBooking(bookingId),
    fetchAdminStats: () => adminStore.fetchAdminStats(),
    fetchAdminPricing: () => adminStore.fetchAdminPricing(),
    updateAdminPricing: (pricing: any) =>
      adminStore.updateAdminPricing(pricing),
    toggleHold: (groundId: string, slotId: string, date: string) =>
      adminStore.toggleHold(groundId, slotId, date),
    fetchWallet: () => adminStore.fetchWallet(),
    topUpWallet: (amount: number) => adminStore.topUpWallet(amount),
    payFromWallet: (amount: number) => adminStore.payFromWallet(amount),
    awardPoints: (points: number) => adminStore.awardPoints(points),
    redeemPoints: (points: number) => adminStore.redeemPoints(points),
    validateCoupon: (code: string) => adminStore.validateCoupon(code),
    updateCoupon: (code: string, percentage: number) =>
      adminStore.updateCoupon(code, percentage),
    setBasePrice: (p: number) => adminStore.setBasePrice(p),
    setPrice12h: (p: number) => adminStore.setPrice12h(p),
    setPrice24h: (p: number) => adminStore.setPrice24h(p),
    setCouponPercentage: (p: number) => adminStore.setCouponPercentage(p),
    setCouponCode: (c: string) => adminStore.setCouponCode(c),
    updateAdminCredentials: (id: string, pass: string) =>
      adminStore.updateAdminCredentials(id, pass),
    adminCredentials: adminStore.getAdminCredentials(),
    showAlert: (
      title: string,
      message: string,
      type: "success" | "warning" | "info" | "error",
    ) => adminStore.showAlert(title, message, type),
    hideAlert: () => adminStore.hideAlert(),
  };
};
