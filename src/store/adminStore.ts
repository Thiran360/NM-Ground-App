import { useState, useCallback } from 'react';
import { ENDPOINTS, API_HEADERS } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A robust global store for the Sports App.
 */



export interface User {
  id: string;
  name: string;
  role: 'user' | 'admin';
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
  user?: string;      // Added for backend compatibility
  player?: string;    // Added for backend compatibility
  date: string;
  slots: string[];
  isFullDay: boolean;
  fullDayType?: string;
  totalAmount: number;
  advancePaid: number;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
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

// Singleton state object
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
  private couponCode: string = 'SAVE20';
  private adminId: string = 'admin';
  private adminPassword: string = 'admin123';
  private alertState = {
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'warning' | 'info' | 'error',
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
        await AsyncStorage.setItem('nm_greens_session', JSON.stringify(session));
      } else {
        await AsyncStorage.removeItem('nm_greens_session');
      }
      
      // Save Admin Config
      const adminConfig = {
        id: this.adminId,
        password: this.adminPassword,
      };
      await AsyncStorage.setItem('nm_greens_admin_config', JSON.stringify(adminConfig));
    } catch (e) { console.error('Save session error:', e); }
  }

  async loadSession() {
    try {
      const adminData = await AsyncStorage.getItem('nm_greens_admin_config');
      if (adminData) {
        const config = JSON.parse(adminData);
        this.adminId = config.id || 'admin';
        this.adminPassword = config.password || 'admin123';
      }

      const data = await AsyncStorage.getItem('nm_greens_session');
      if (data) {
        const session = JSON.parse(data);
        this.currentUser = session.user;
        this.authToken = session.token;
        
        // Sync local variables with restored user data
        if (this.currentUser) {
          this.walletBalance = this.currentUser.walletBalance || 0;
          this.loyaltyPoints = this.currentUser.loyaltyPoints || 0;
        }
        
        // Refresh data once session is loaded
        this.fetchBookings();
        this.fetchProfile();
        this.fetchWallet();
      }
    } catch (e) { 
      console.error('Load session error:', e); 
    } finally {
      this.isInitialized = true;
      this.notify();
    }
  }

  // Auth methods
  login(role: 'user' | 'admin', name?: string, token?: string, userId?: string) {
    this.authToken = token || null;
    this.currentUser = {
      id: userId || (role === 'admin' ? 'admin-1' : 'user-123'),
      name: name || (role === 'admin' ? 'Arena Manager' : 'John Player'),
      role,
      walletBalance: this.walletBalance,
      loyaltyPoints: this.loyaltyPoints,
      accessToken: token,
    };
    
    // Automatically fetch data after login
    this.fetchBookings();
    this.fetchProfile();
    this.fetchWallet();
    
    this.saveSession();
    this.notify();
  }

  logout() {
    this.currentUser = null;
    this.authToken = null;
    this.bookings = [];
    this.heldSlots = [];
    this.saveSession();
    this.notify();
  }

  private getApiHeaders(extra = {}) {
    const headers: any = { ...API_HEADERS, ...extra };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  getUser() { return this.currentUser; }

  async fetchProfile() {
    try {
      console.log('Fetching profile from:', ENDPOINTS.user.profile);
      const response = await fetch(ENDPOINTS.user.profile, { headers: this.getApiHeaders() });
      if (response.ok) {
        const data = await response.json();
        console.log('Profile data received:', data);
        
        if (this.currentUser) {
          // Fix snake_case mapping for profile
          const serverPoints = data.loyalty_points ?? data.points ?? data.reward_points ?? data.loyaltyPoints;
          
          // Comprehensively check for Django name fields
          const first = data.first_name || data.user?.first_name || '';
          const last = data.last_name || data.user?.last_name || '';
          const combined = `${first} ${last}`.trim();
          
          const serverName = combined || data.full_name || data.name || data.user?.name || data.user?.full_name || data.username || data.user?.username;
          
          this.currentUser = { 
            ...this.currentUser, 
            ...data,
            name: serverName || this.currentUser.name,
            loyaltyPoints: serverPoints !== undefined ? Number(serverPoints) : this.currentUser.loyaltyPoints
          };
          
          if (serverPoints !== undefined) {
             this.loyaltyPoints = Number(serverPoints);
          }
          this.notify();
        }
      } else {
        console.error('Fetch profile failed:', response.status);
      }
    } catch (error) { console.error('Fetch profile error:', error); }
  }

  // Ground management
  async fetchGrounds() {
    try {
      console.log('Fetching grounds from:', ENDPOINTS.grounds);
      const response = await fetch(ENDPOINTS.grounds, { headers: this.getApiHeaders() });
      console.log('Fetch Grounds status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Grounds data received:', data);
        
        // Map backend 'image' to 'imageUrl' and provide fallbacks
        this.grounds = data.map((g: any) => ({
          ...g,
          type: g.type || (g.id === 'ground-a' ? 'International Cricket Ground' : 'Premium Match Ground'),
          rating: g.rating || (g.id === 'ground-a' ? 4.9 : 4.8),
          location: g.location || (g.id === 'ground-a' ? 'Main Arena, Gate 4' : 'A-Block Championship Area'),
          imageUrl: g.imageUrl || g.image || (
            g.id === 'ground-a' 
              ? require('@/assets/images/ground_a_premium.png') 
              : require('@/assets/images/ground_b_premium.png')
          )
        }));
        
        this.notify();
      } else {
        console.error('Fetch grounds failed:', response.status);
      }
    } catch (error) { console.error('Fetch grounds error:', error); }
  }

  getGrounds() { return this.grounds; }

  // Booking management
  async fetchBookings() {
    try {
      console.log('Fetching bookings from:', ENDPOINTS.bookings);
      const response = await fetch(ENDPOINTS.bookings, { headers: this.getApiHeaders() });
      console.log('Fetch bookings status:', response.status);
      const text = await response.text();
      console.log('Fetch bookings raw response:', text);
      
      if (response.ok) {
        const data = JSON.parse(text);
        
        // Handle different possible backend formats safely
        let rawBookings = [];
        if (Array.isArray(data)) {
          rawBookings = data;
        } else if (data && data.bookings && Array.isArray(data.bookings)) {
          rawBookings = data.bookings;
        } else if (data && data.data && Array.isArray(data.data)) {
          rawBookings = data.data;
        } else if (data && data.results && Array.isArray(data.results)) {
          rawBookings = data.results;
        } else {
          console.warn('Unexpected bookings format:', data);
        }

        // Map backend snake_case to frontend camelCase
        this.bookings = rawBookings.map((b: any) => ({
          ...b,
          id: b.id || b.booking_id || Math.random().toString(),
          totalAmount: b.total_amount !== undefined ? b.total_amount : (b.totalAmount || 0),
          advancePaid: b.advance_paid !== undefined ? b.advance_paid : (b.advancePaid || 0),
          isFullDay: b.is_full_day !== undefined ? b.is_full_day : (b.isFullDay || false),
          fullDayType: b.full_day_type || b.fullDayType,
          groundId: b.ground_id || b.groundId || b.ground || 'Unknown Ground',
          status: b.status || 'Confirmed',
          date: b.date || b.booking_date || new Date().toISOString(),
          slots: b.slots || b.time_slots || b.slot_ids || [],
        }));
        
        console.log('Parsed bookings count:', this.bookings.length);
        this.notify();
      } else {
        console.error('Fetch bookings failed with status:', response.status);
      }
    } catch (error) { 
      console.error('Fetch bookings error:', error); 
    }
  }

  async addBooking(booking: Booking) {
    // Local persistence (Static Mode)
    this.bookings.push(booking);
    
    // Award loyalty points for booking (10 points for every ₹100 spent)
    const pointsEarned = Math.floor(booking.advancePaid / 10);
    this.awardPoints(pointsEarned);
    
    this.notify();

    try {
      console.log('Attempting to save booking to backend:', ENDPOINTS.bookings);
      
      // Transform camelCase to snake_case for the Django backend
      const payload = {
        ground: booking.groundId || booking.ground_id, // Often django uses 'ground' as ForeignKey ID
        ground_id: booking.groundId || booking.ground_id,
        date: booking.date,
        time_slots: booking.slots,
        slots: booking.slots,
        is_full_day: booking.isFullDay,
        full_day_type: booking.fullDayType,
        total_amount: booking.totalAmount,
        advance_paid: booking.advancePaid,
        status: booking.status
      };
      
      console.log('Sending payload:', JSON.stringify(payload));

      const response = await fetch(ENDPOINTS.bookings, {
        method: 'POST',
        headers: this.getApiHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend booking sync failed (400):', errorText);
        this.showAlert('Booking Sync Failed', `Your booking was saved locally but failed to sync to the server: ${errorText.substring(0, 50)}`, 'warning');
      } else {
        const data = await response.json();
        console.log('Successfully created booking on server:', data);
        this.fetchBookings(); // Refresh bookings to get the real integer ID from backend
      }
      
    } catch (error) { 
      console.warn('Add booking background error:', error); 
    }
    
    return true; // Always return true for "Static Mode" success
  }

  getBookings() { return [...this.bookings]; }

  async cancelBooking(bookingId: string) {
    const index = this.bookings.findIndex(b => b.id === bookingId);
    if (index !== -1) {
      const booking = this.bookings[index];
      // Update status
      this.bookings[index] = { ...booking, status: 'Cancelled' };
      
      // Refund logic: 50% of advance paid
      const refundAmount = booking.advancePaid * 0.5;
      this.walletBalance += refundAmount;
      if (this.currentUser) {
        this.currentUser.walletBalance = this.walletBalance;
      }
      
      this.notify();
      
      try {
        // Optional backend sync
        fetch(`${ENDPOINTS.bookings}${bookingId}/`, {
          method: 'PATCH',
          headers: this.getApiHeaders(),
          body: JSON.stringify({ status: 'Cancelled' }),
        }).catch(e => console.warn('Backend cancel sync failed:', e));
      } catch (error) {
        console.warn('Cancel booking background error:', error);
      }
      
      return true;
    }
    return false;
  }

  // Admin specific
  async fetchAdminStats() {
    try {
      const response = await fetch(ENDPOINTS.admin.stats, { headers: this.getApiHeaders() });
      if (response.ok) {
        this.adminStats = await response.json();
        this.notify();
      }
    } catch (error) { console.error('Fetch admin stats error:', error); }
  }

  async fetchAdminPricing() {
    try {
      const response = await fetch(ENDPOINTS.admin.pricing, { headers: this.getApiHeaders() });
      if (response.ok) {
        const data = await response.json();
        this.basePrice = data.hourly || data.basePrice || this.basePrice;
        this.price12h = data.price12h || this.price12h;
        this.price24h = data.price24h || this.price24h;
        this.notify();
      }
    } catch (error) { console.error('Fetch admin pricing error:', error); }
  }

  async updateAdminPricing(pricing: any) {
    // Optimistic local update
    if (pricing.basePrice) this.basePrice = pricing.basePrice;
    if (pricing.price12h) this.price12h = pricing.price12h;
    if (pricing.price24h) this.price24h = pricing.price24h;
    this.notify();

    try {
      await fetch(ENDPOINTS.admin.pricing, {
        method: 'POST',
        headers: this.getApiHeaders(),
        body: JSON.stringify(pricing)
      });
    } catch (error) { console.error('Update pricing error:', error); }
  }


  async fetchAdminBookings() {
    try {
      const response = await fetch(ENDPOINTS.admin.bookings, { headers: this.getApiHeaders() });
      if (response.ok) {
        this.bookings = await response.json();
        this.notify();
      }
    } catch (error) { console.error('Fetch admin bookings error:', error); }
  }

  getAdminStats() { return this.adminStats; }

  // Wallet
  async fetchWallet() {
    try {
      console.log('Fetching wallet from:', ENDPOINTS.wallet);
      const response = await fetch(ENDPOINTS.wallet, { headers: this.getApiHeaders() });
      if (response.ok) {
        const data = await response.json();
        console.log('Wallet data received:', data);
        
        // Handle different possible backend field names
        const serverBalance = data.balance ?? data.wallet_balance ?? data.total_balance ?? data.amount ?? data.walletBalance;
        const serverPoints = data.points ?? data.loyalty_points ?? data.reward_points ?? data.loyaltyPoints;
        
        if (serverBalance !== undefined && serverBalance !== null) {
          this.walletBalance = Number(serverBalance);
          if (this.currentUser) this.currentUser.walletBalance = this.walletBalance;
        } else {
          console.warn('Could not find balance in response:', data);
        }

        if (serverPoints !== undefined && serverPoints !== null) {
          this.loyaltyPoints = Number(serverPoints);
          if (this.currentUser) this.currentUser.loyaltyPoints = this.loyaltyPoints;
        }

        this.notify();
      } else {
        const err = await response.text();
        console.error('Fetch wallet failed:', response.status, err);
      }
    } catch (error) { console.error('Fetch wallet error:', error); }
  }

  async topUpWallet(amount: number) {
    // Optimistic local update
    this.walletBalance += amount;
    if (this.currentUser) this.currentUser.walletBalance = this.walletBalance;
    
    // Award points for recharging: 10 points for every ₹100 added
    const pointsEarned = Math.floor(amount / 10);
    this.awardPoints(pointsEarned);
    
    this.notify();
    this.saveSession();

    try {
      console.log('Sending topup to server:', amount);
      const response = await fetch(ENDPOINTS.wallet, {
        method: 'POST',
        headers: this.getApiHeaders(),
        body: JSON.stringify({ amount, action: 'topup' })
      });
      if (response.ok) {
        await this.fetchWallet(); // Sync with server for definitive balance
        return true;
      } else {
        const errorText = await response.text();
        console.error('Wallet topup failed with status:', response.status, errorText);
        // We revert the optimistic update since it failed
        this.walletBalance -= amount;
        if (this.currentUser) {
          this.currentUser.walletBalance = this.walletBalance;
          // Also revert the points if the transaction fails
          this.currentUser.loyaltyPoints -= pointsEarned;
          this.loyaltyPoints = this.currentUser.loyaltyPoints;
        }
        this.notify();
        this.showAlert('Recharge Failed', `Server error: ${errorText.substring(0,50)}`, 'error');
      }
    } catch (error) { 
      console.error('Topup error:', error); 
    }
    return true; // Return true for UI to proceed
  }

  payFromWallet(amount: number) {
    if (this.currentUser) {
      this.currentUser.walletBalance -= amount;
      this.walletBalance = this.currentUser.walletBalance;
      this.notify();
      this.saveSession();
    }
  }

  awardPoints(points: number) {
    if (this.currentUser) {
      this.currentUser.loyaltyPoints = (this.currentUser.loyaltyPoints || 0) + points;
      this.loyaltyPoints = this.currentUser.loyaltyPoints;
      this.notify();
      this.saveSession();
    }
  }

  redeemPoints(points: number) {
    if (this.currentUser && this.currentUser.loyaltyPoints >= points) {
      this.currentUser.loyaltyPoints -= points;
      this.loyaltyPoints = this.currentUser.loyaltyPoints;
      this.notify();
    }
  }
  updateAdminCredentials(id: string, pass: string) {
    this.adminId = id;
    this.adminPassword = pass;
    this.saveSession();
    this.notify();
  }

  getAdminCredentials() {
    return { id: this.adminId, password: this.adminPassword };
  }

  // Coupon
  async validateCoupon(code: string) {
    try {
      const response = await fetch(ENDPOINTS.coupon.validate, {
        method: 'POST',
        headers: this.getApiHeaders(),
        body: JSON.stringify({ code })
      });
      if (response.ok) {
        const data = await response.json();
        this.couponPercentage = data.percentage;
        this.couponCode = code.toUpperCase();
        this.notify();
        return true;
      }
    } catch (error) { console.error('Coupon error:', error); }
    return false;
  }

  updateCoupon(code: string, percentage: number) {
    this.couponCode = code.toUpperCase();
    this.couponPercentage = percentage;
    this.notify();
  }

  // Slot management
  toggleHold(groundId: string, slotId: string, date: string) {
    const index = this.heldSlots.findIndex(h => h.groundId === groundId && h.slotId === slotId && h.date === date);
    if (index === -1) this.heldSlots.push({ groundId, slotId, date });
    else this.heldSlots.splice(index, 1);
    this.notify();
  }

  isHeld(groundId: string, slotId: string, date: string) {
    return this.heldSlots.some(h => h.groundId === groundId && h.slotId === slotId && h.date === date);
  }

  getHeldSlots() { return [...this.heldSlots]; }

  // Price management (Local)
  getBasePrice() { return this.basePrice; }
  setBasePrice(price: number) { this.basePrice = price; this.notify(); }
  getPrice12h() { return this.price12h; }
  setPrice12h(price: number) { this.price12h = price; this.notify(); }
  getPrice24h() { return this.price24h; }
  setPrice24h(price: number) { this.price24h = price; this.notify(); }

  getCouponPercentage() { return this.couponPercentage; }
  setCouponPercentage(p: number) { this.couponPercentage = p; this.notify(); }
  getCouponCode() { return this.couponCode; }
  setCouponCode(c: string) { this.couponCode = c.toUpperCase(); this.notify(); }

  // Alert Management
  getAlertState() { return { ...this.alertState }; }
  showAlert(title: string, message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') {
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

  private notify() { this.listeners.forEach(l => l()); }
  getIsInitialized() { return this.isInitialized; }
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

  useState(() => {
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
  });

  return {
    ...state,
    login: (role: 'user' | 'admin', name?: string, token?: string, userId?: string) => adminStore.login(role, name, token, userId),
    logout: () => adminStore.logout(),
    fetchProfile: () => adminStore.fetchProfile(),
    fetchBookings: () => adminStore.fetchBookings(),
    fetchGrounds: () => adminStore.fetchGrounds(),
    addBooking: (booking: Booking) => adminStore.addBooking(booking),
    cancelBooking: (bookingId: string) => adminStore.cancelBooking(bookingId),
    fetchAdminStats: () => adminStore.fetchAdminStats(),
    fetchAdminPricing: () => adminStore.fetchAdminPricing(),
    updateAdminPricing: (pricing: any) => adminStore.updateAdminPricing(pricing),
    toggleHold: (groundId: string, slotId: string, date: string) => adminStore.toggleHold(groundId, slotId, date),
    fetchWallet: () => adminStore.fetchWallet(),
    topUpWallet: (amount: number) => adminStore.topUpWallet(amount),
    payFromWallet: (amount: number) => adminStore.payFromWallet(amount),
    awardPoints: (points: number) => adminStore.awardPoints(points),
    redeemPoints: (points: number) => adminStore.redeemPoints(points),
    validateCoupon: (code: string) => adminStore.validateCoupon(code),
    updateCoupon: (code: string, percentage: number) => adminStore.updateCoupon(code, percentage),
    setBasePrice: (p: number) => adminStore.setBasePrice(p),
    setPrice12h: (p: number) => adminStore.setPrice12h(p),
    setPrice24h: (p: number) => adminStore.setPrice24h(p),
    setCouponPercentage: (p: number) => adminStore.setCouponPercentage(p),
    setCouponCode: (c: string) => adminStore.setCouponCode(c),
    updateAdminCredentials: (id: string, pass: string) => adminStore.updateAdminCredentials(id, pass),
    adminCredentials: adminStore.getAdminCredentials(),
    showAlert: (title: string, message: string, type: 'success' | 'warning' | 'info' | 'error') => adminStore.showAlert(title, message, type),
    hideAlert: () => adminStore.hideAlert(),
  };
};
