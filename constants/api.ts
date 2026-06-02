export const BASE_URL = "https://refined-alone-causing.ngrok-free.dev";

export const ENDPOINTS = {
  auth: {
    register: `${BASE_URL}/auth/register/`,
    login: `${BASE_URL}/auth/login/`,
    refresh: `${BASE_URL}/auth/token/refresh/`,
    signup: `${BASE_URL}/booking/signup/`,
    userLogin: `${BASE_URL}/booking/login/`,
  },
  user: {
    profile: `${BASE_URL}/user/profile/`,
  },
  grounds: `${BASE_URL}/grounds/`,
  bookings: `${BASE_URL}/bookings/`,
  wallet: `${BASE_URL}/wallet/`,
  coupon: {
    validate: `${BASE_URL}/coupon/validate/`,
  },
  admin: {
    pricing: `${BASE_URL}/admin/pricing/`,
    bookings: `${BASE_URL}/admin/bookings/`,
    stats: `${BASE_URL}/admin/stats/`,
  },
};

export const API_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};
