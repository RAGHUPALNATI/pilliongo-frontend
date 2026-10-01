import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const LOCATIONS = [
  'LPU University Main Gate',
  'LPU Gate 2 (Back Gate)',
  'Green Valley Main Gate',
  'Law Gate',
  'Butani Colony',
  'Jazzy Properties',
  'Hardaspur',
  'Meheru',
  'Cheharu',
  'Rama Mandi',
  'Deep Nagar',
  'Model Town, Phagwara',
  'Phagwara Bus Stand',
  'Jalandhar City',
  'Jalandhar Bus Stand',
  'Jalandhar Cantt Railway Station',
  'PAU Chowk, Jalandhar',
  'Nakodar Chowk',
  'Kapurthala City',
  'Adampur',
  'Goraya',
  'Begowal',
  'Mehatpur',
  'Bhogpur',
  'Banga',
  'Nawanshahr (SBS Nagar)',
  'Ladowal Toll Plaza',
];

// Backend-driven location list — the source of truth is the
// known_locations table (seeded with the list above, and grown whenever an
// admin adds a destination fare or approves a location request). LOCATIONS
// above stays as the safe default: used for the very first render before
// this resolves, and as a fallback if the request fails (e.g. offline).
export const locationAPI = {
  getAll: async () => {
    try {
      const res = await apiClient.get('/locations');
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (err) {
      console.error('Error fetching locations, using defaults:', err);
    }
    return LOCATIONS;
  },
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format error messages from backend
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      let message = typeof data === 'string' ? data : (data?.message || data?.error);

      // A 401 on a request that already carried a token means the session
      // itself is dead (expired/invalid JWT) — show a message that says
      // that plainly, distinct from the backend's own "wrong password"
      // message (which comes through as `message` above via a 400, not
      // this 401 branch at all).
      const isSessionExpiry = status === 401 && typeof window !== 'undefined' && !!localStorage.getItem('token');

      if (!message) {
        if (status === 401) {
          message = 'Invalid email or password or session expired';
        } else if (status === 403) {
          message = 'Access denied. You do not have permission for this action.';
        } else if (status === 400) {
          message = 'Bad Request. Please check your submitted details.';
        } else if (status >= 500) {
          message = 'Server error occurred. Please try again later.';
        } else {
          message = 'An unexpected error occurred.';
        }
      }

      // 401 means the JWT is missing/invalid/expired — the backend never
      // returns 401 for a wrong login password (AuthService.login() throws
      // a RuntimeException for that, which maps to 400), so this only ever
      // fires for a dead session on an already-authenticated request.
      // Clear it and send the user back to /login instead of leaving them
      // stuck on a page where every action keeps failing with the same
      // "session expired" toast.
      if (status === 401 && typeof window !== 'undefined') {
        if (isSessionExpiry) {
          message = 'Session expired, please login again.';
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('pilliongo_token');
        localStorage.removeItem('pilliongo_user');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }

      return Promise.reject(new Error(message));
    } else if (error.request) {
      return Promise.reject(new Error('Unable to connect to server. Please ensure backend is running.'));
    }
    return Promise.reject(error);
  }
);

// Normalize ride objects so UI property names match backend response fields bi-directionally
const normalizeRide = (ride) => {
  if (!ride) return ride;
  const fareVal = ride.fare ?? ride.farePerSeat ?? 45;
  const timeVal = ride.time || ride.scheduledTime;
  const dateVal = ride.departureDate || ride.scheduledDate;
  const noteVal = ride.note || ride.notes || ride.description;
  const plateVal = ride.vehicleNumber || ride.vehiclePlate;

  return {
    ...ride,
    fromLocation: ride.fromLocation || ride.pickupLocation,
    pickupLocation: ride.pickupLocation || ride.fromLocation,
    toLocation: ride.toLocation || ride.destination,
    destination: ride.destination || ride.toLocation,
    note: noteVal,
    notes: noteVal,
    description: noteVal,
    time: timeVal,
    scheduledTime: timeVal,
    departureDate: dateVal,
    scheduledDate: dateVal,
    fare: fareVal,
    farePerSeat: fareVal,
    budgetFare: ride.budgetFare || ride.fare || 0,
    vehicleNumber: plateVal,
    vehiclePlate: plateVal,
    // Real seat counts from the backend (driver offers only). Falls back to
    // total - booked, then to 1 for rides saved before multi-seat existed.
    seatsTotal: ride.seatsTotal ?? 1,
    seatsBooked: ride.seatsBooked ?? 0,
    seatsAvailable:
      ride.seatsAvailable ??
      (ride.seatsTotal != null ? Math.max(0, ride.seatsTotal - (ride.seatsBooked || 0)) : 1),
    seatCount: ride.seatCount ?? 1,
  };
};

// ----------------------------------------------------
// AUTH API
// ----------------------------------------------------
export const authAPI = {
  login: async (credentials) => {
    const payload = typeof credentials === 'object' ? credentials : { email: arguments[0], password: arguments[1] };
    const res = await apiClient.post('/auth/login', {
      email: payload.email,
      password: payload.password,
    });
    if (res.data?.token && typeof window !== 'undefined') {
      localStorage.setItem('token', res.data.token);
    }
    return res.data;
  },

  register: async (userData) => {
    let payload = userData;
    if (typeof userData === 'object') {
      payload = {
        fullName: userData.fullName || userData.name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        role: (userData.role || 'RIDER').toUpperCase(),
        studentId: userData.studentId,
        vehicleType: userData.vehicleType,
        vehicleModel: userData.vehicleModel,
        vehiclePlate: userData.vehiclePlate || userData.vehicleNumber || userData.bikeNumber,
      };
    }
    const res = await apiClient.post('/auth/register', payload);
    return res.data;
  },

  verifyOtp: async (email, otp) => {
    const payload = typeof email === 'object' ? email : { email, otp };
    const res = await apiClient.post('/auth/verify-otp', payload);
    return res.data;
  },

  resendOtp: async (email) => {
    const payload = typeof email === 'object' ? email : { email };
    const res = await apiClient.post('/auth/resend-otp', payload);
    return res.data;
  },

  updateProfile: async (profileData) => {
    const res = await apiClient.put('/auth/profile', profileData);
    return res.data;
  },

  // ----- Forgot password (3-step: email -> OTP -> new password) -----
  forgotPassword: async (email) => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  verifyResetOtp: async (email, otp) => {
    const res = await apiClient.post('/auth/verify-reset-otp', { email, otp });
    return res.data; // { message, resetToken }
  },

  resetPassword: async (email, resetToken, newPassword, confirmPassword) => {
    const res = await apiClient.post('/auth/reset-password', {
      email,
      resetToken,
      newPassword,
      confirmPassword,
    });
    return res.data;
  },
};

const formatToIsoTime = (timeStr) => {
  if (!timeStr) return null;
  if (typeof timeStr !== 'string') return timeStr;
  const cleaned = timeStr.trim();
  if (!cleaned) return null;

  // Match 12-hour or 24-hour time format with optional AM/PM
  const match = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const seconds = match[3] || '00';
    const ampm = match[4] ? match[4].toLowerCase() : null;

    if (ampm === 'pm' && hours < 12) {
      hours += 12;
    } else if (ampm === 'am' && hours === 12) {
      hours = 0;
    }

    const hh = String(hours).padStart(2, '0');
    return `${hh}:${minutes}:${seconds}`;
  }

  return cleaned;
};

// ----------------------------------------------------
// RIDES API
// ----------------------------------------------------
export const ridesAPI = {
  createRide: async (rideData) => {
    let payload = rideData;
    if (typeof rideData === 'object') {
      const rawTime = rideData.scheduledTime || rideData.time || null;
      payload = {
        pickupLocation: rideData.pickupLocation || rideData.fromLocation,
        destination: rideData.destination || rideData.toLocation,
        rideType: (rideData.rideType || 'INSTANT').toUpperCase(),
        scheduledDate: rideData.scheduledDate || rideData.departureDate || null,
        scheduledTime: formatToIsoTime(rawTime),
        description: rideData.description || rideData.note || null,
      };
    }
    const res = await apiClient.post('/rides', payload);
    return normalizeRide(res.data);
  },

  getAvailableRides: async () => {
    const res = await apiClient.get('/rides/available');
    return Array.isArray(res.data) ? res.data.map(normalizeRide) : [];
  },

  // Live fare preview for a pickup/destination pair — same fixed-fare-zone
  // + distance logic a real ride would get charged, just without posting
  // anything. Used by the request/offer forms to show a price up front.
  getFareEstimate: async (from, to) => {
    const res = await apiClient.get('/rides/fare-estimate', { params: { from, to } });
    return res.data;
  },

  getPlannedRides: async () => {
    const res = await apiClient.get('/rides/planned');
    return Array.isArray(res.data) ? res.data.map(normalizeRide) : [];
  },

  acceptRide: async (rideId) => {
    const res = await apiClient.put(`/rides/${rideId}/accept`);
    return normalizeRide(res.data);
  },

  startRide: async (rideId) => {
    const res = await apiClient.put(`/rides/${rideId}/start`);
    return normalizeRide(res.data);
  },

  completeRide: async (rideId) => {
    const res = await apiClient.put(`/rides/${rideId}/complete`);
    return normalizeRide(res.data);
  },

  cancelRide: async (rideId) => {
    const res = await apiClient.delete(`/rides/${rideId}`);
    return res.data;
  },

  // Cash settlement confirmation — either rider or driver on the ride can
  // mark it once they've paid/been paid in person.
  markAsPaid: async (rideId) => {
    const res = await apiClient.put(`/rides/${rideId}/mark-paid`);
    return normalizeRide(res.data);
  },

  getRideHistory: async () => {
    const res = await apiClient.get('/rides/history');
    return Array.isArray(res.data) ? res.data.map(normalizeRide) : [];
  },

  getRideById: async (rideId) => {
    const res = await apiClient.get(`/rides/${rideId}`);
    return normalizeRide(res.data);
  },

  // RIDER — live location ping while on an active ride, the reverse
  // direction of driverAPI.updateLocation. Lets the driver see roughly
  // where to find the rider on the ride status page.
  updateRiderLocation: async (rideId, lat, lng) => {
    const res = await apiClient.put(`/rides/${rideId}/rider-location`, { lat, lng });
    return res.data;
  },

  offerPlannedRide: async (routeData) => {
    let payload = routeData;
    if (typeof routeData === 'object') {
      const rawTime = routeData.scheduledTime || routeData.time || null;
      payload = {
        pickupLocation: routeData.pickupLocation || routeData.fromLocation,
        destination: routeData.destination || routeData.toLocation,
        rideType: 'PLANNED',
        scheduledDate: routeData.scheduledDate || routeData.departureDate || null,
        scheduledTime: formatToIsoTime(rawTime),
        description: routeData.description || routeData.notes || routeData.note || null,
        vehicleId: routeData.vehicleId ? Number(routeData.vehicleId) : null,
        seats: Number(routeData.seats || routeData.seatsAvailable || 1),
      };
    }
    const res = await apiClient.post('/rides/offer', payload);
    return normalizeRide(res.data);
  },

  bookDriverOffer: async (rideId, seats = 1) => {
    const res = await apiClient.put(`/rides/${rideId}/book`, null, { params: { seats } });
    return normalizeRide(res.data);
  },

  offerInstantRide: async (rideData) => {
    let payload = rideData;
    if (typeof rideData === 'object') {
      payload = {
        pickupLocation: rideData.pickupLocation || rideData.fromLocation,
        destination: rideData.destination || rideData.toLocation,
        rideType: 'INSTANT',
        description: rideData.description || rideData.notes || rideData.note || null,
        vehicleId: rideData.vehicleId ? Number(rideData.vehicleId) : null,
      };
    }
    const res = await apiClient.post('/rides/offer-instant', payload);
    return normalizeRide(res.data);
  },

  getInstantOffers: async () => {
    const res = await apiClient.get('/rides/instant-offers');
    return Array.isArray(res.data) ? res.data.map(normalizeRide) : [];
  },

  // UI backward-compatibility helpers
  getPlannedRoutes: async () => {
    return ridesAPI.getPlannedRides();
  },

  getRiderPlannedRequests: async () => {
    return ridesAPI.getPlannedRides();
  },

  publishPlannedRoute: async (routeData) => {
    return ridesAPI.offerPlannedRide(routeData);
  },

  publishRiderPlannedRequest: async (requestData) => {
    return ridesAPI.createRide({
      ...requestData,
      rideType: 'PLANNED',
    });
  },
};

// ----------------------------------------------------
// DRIVER API
// ----------------------------------------------------
export const driverAPI = {
  toggleAvailability: async (available) => {
    const payload = typeof available === 'object' ? available : { available };
    const res = await apiClient.put('/driver/availability', payload);
    return res.data;
  },

  getEarnings: async () => {
    const res = await apiClient.get('/driver/earnings');
    return res.data;
  },

  // Live location ping while on an active ride — overwrites the driver's
  // current position server-side, never logged/appended.
  updateLocation: async (lat, lng) => {
    const res = await apiClient.put('/driver/location', { lat, lng });
    return res.data;
  },
};

// ----------------------------------------------------
// VEHICLE API (a driver can own more than one vehicle; they pick which
// one to use each time they offer a ride)
// ----------------------------------------------------
export const vehicleAPI = {
  getMyVehicles: async () => {
    const res = await apiClient.get('/driver/vehicles');
    return Array.isArray(res.data) ? res.data : [];
  },

  addVehicle: async (vehicleType, vehicleModel, vehiclePlate) => {
    const res = await apiClient.post('/driver/vehicles', {
      vehicleType,
      vehicleModel,
      vehiclePlate,
    });
    return res.data;
  },

  deleteVehicle: async (id) => {
    const res = await apiClient.delete(`/driver/vehicles/${id}`);
    return res.data;
  },

  setPrimary: async (id) => {
    const res = await apiClient.put(`/driver/vehicles/${id}/primary`);
    return res.data;
  },
};

// ----------------------------------------------------
// ADMIN API
// ----------------------------------------------------
export const adminAPI = {
  getAllUsers: async () => {
    const res = await apiClient.get('/admin/users');
    return Array.isArray(res.data)
      ? res.data.map((u) => ({
          ...u,
          name: u.fullName || u.name || (u.email ? u.email.split('@')[0] : 'User'),
          status: u.status || (u.active === false ? 'Suspended' : 'Active'),
        }))
      : [];
  },

  getUserById: async (id) => {
    const res = await apiClient.get(`/admin/users/${id}`);
    return res.data;
  },

  suspendUser: async (id) => {
    const res = await apiClient.put(`/admin/users/${id}/suspend`);
    return res.data;
  },

  activateUser: async (id) => {
    const res = await apiClient.put(`/admin/users/${id}/activate`);
    return res.data;
  },

  // Hard delete — wipes the account and everything tied to it (rides,
  // vehicles, support messages, location requests). Irreversible.
  deleteUser: async (id) => {
    const res = await apiClient.delete(`/admin/users/${id}`);
    return res.data;
  },

  toggleUserStatus: async (userId) => {
    const users = await adminAPI.getAllUsers();
    const target = users.find((u) => String(u.id) === String(userId));
    if (!target) throw new Error('User not found');

    if (target.status === 'Active' || target.active === true) {
      await adminAPI.suspendUser(userId);
      return { status: 'Suspended' };
    } else {
      await adminAPI.activateUser(userId);
      return { status: 'Active' };
    }
  },

  getAllRides: async () => {
    const res = await apiClient.get('/admin/rides');
    return Array.isArray(res.data) ? res.data.map(normalizeRide) : [];
  },

  getDestinations: async () => {
    const res = await apiClient.get('/admin/destinations');
    return Array.isArray(res.data) ? res.data : [];
  },

  addDestination: async (data) => {
    const res = await apiClient.post('/admin/destinations', data);
    return res.data;
  },

  updateDestination: async (id, data) => {
    const res = await apiClient.put(`/admin/destinations/${id}`, data);
    return res.data;
  },

  deleteDestination: async (id) => {
    const res = await apiClient.delete(`/admin/destinations/${id}`);
    return res.data;
  },

  // All Locations (master list) — separate from the fare-rule table above.
  // This is what every pickup/destination dropdown in the app actually
  // reads from.
  getKnownLocations: async () => {
    const res = await apiClient.get('/admin/known-locations');
    return Array.isArray(res.data) ? res.data : [];
  },

  renameKnownLocation: async (id, name) => {
    const res = await apiClient.put(`/admin/known-locations/${id}`, { name });
    return res.data;
  },

  deleteKnownLocation: async (id) => {
    const res = await apiClient.delete(`/admin/known-locations/${id}`);
    return res.data;
  },

  getAnalytics: async () => {
    const res = await apiClient.get('/admin/analytics');
    return res.data;
  },

  // Backward-compatibility helpers for Admin UI
  getSystemStats: async () => {
    return adminAPI.getAnalytics();
  },

  // Calls the dedicated admin override endpoint (PUT /admin/rides/{id}/status)
  // instead of the rider/driver-scoped completeRide()/cancelRide() — those
  // reject an admin's identity with "Access denied" since admin is never
  // the rider or driver on someone else's ride.
  overrideRideStatus: async (rideId, newStatus) => {
    const res = await apiClient.put(`/admin/rides/${rideId}/status`, { status: newStatus });
    return res.data;
  },

  getDriverEarnings: async () => {
    const res = await apiClient.get('/admin/driver-earnings');
    return Array.isArray(res.data) ? res.data : [];
  },

  getSupportMessages: async () => {
    const res = await apiClient.get('/admin/support');
    return Array.isArray(res.data) ? res.data : [];
  },

  replySupportMessage: async (id, reply) => {
    const res = await apiClient.put(`/admin/support/${id}/reply`, { reply });
    return res.data;
  },

  deleteSupportMessage: async (id) => {
    const res = await apiClient.delete(`/admin/support/${id}`);
    return res.data;
  },

  getLocationRequests: async () => {
    const res = await apiClient.get('/admin/location-requests');
    return Array.isArray(res.data) ? res.data : [];
  },

  approveLocationRequest: async (id, fare) => {
    const res = await apiClient.put(`/admin/location-requests/${id}/approve`, fare != null ? { fare } : {});
    return res.data;
  },

  rejectLocationRequest: async (id, reason) => {
    const res = await apiClient.put(`/admin/location-requests/${id}/reject`, { reason });
    return res.data;
  },

  // SOS ALERTS
  getSosAlerts: async () => {
    const res = await apiClient.get('/admin/sos');
    return Array.isArray(res.data) ? res.data : [];
  },

  resolveSosAlert: async (id) => {
    const res = await apiClient.put(`/admin/sos/${id}/resolve`);
    return res.data;
  },
};

// ----------------------------------------------------
// SUPPORT API — in-app help messages (users can also just email
// pilliongo.app@gmail.com directly; this is the trackable alternative)
// ----------------------------------------------------
export const supportAPI = {
  submitMessage: async (subject, message) => {
    const res = await apiClient.post('/support', { subject, message });
    return res.data;
  },

  getMyMessages: async () => {
    const res = await apiClient.get('/support/my');
    return Array.isArray(res.data) ? res.data : [];
  },
};

// ----------------------------------------------------
// LOCATION REQUEST API — ask the developer for a brand-new fixed-fare route
// ----------------------------------------------------
export const locationRequestAPI = {
  submitRequest: async (fromLocation, toLocation, suggestedFare, notes) => {
    const res = await apiClient.post('/location-requests', {
      fromLocation,
      toLocation,
      suggestedFare,
      notes,
    });
    return res.data;
  },

  getMyRequests: async () => {
    const res = await apiClient.get('/location-requests/my');
    return Array.isArray(res.data) ? res.data : [];
  },
};

// ----------------------------------------------------
// NOTIFICATION API — in-app notification center. Only written server-side
// at real events (ride accepted/started/completed, support reply, etc),
// never on a poll, so reading it often here is cheap.
// ----------------------------------------------------
export const notificationAPI = {
  getAll: async () => {
    const res = await apiClient.get('/notifications');
    return Array.isArray(res.data) ? res.data : [];
  },

  getUnreadCount: async () => {
    const res = await apiClient.get('/notifications/unread-count');
    return res.data?.unread ?? 0;
  },

  markRead: async (id) => {
    const res = await apiClient.put(`/notifications/${id}/read`);
    return res.data;
  },

  markAllRead: async () => {
    const res = await apiClient.put('/notifications/read-all');
    return res.data;
  },
};

// ----------------------------------------------------
// SOS API — one-tap emergency alert during an active ride, notifies every
// admin immediately.
// ----------------------------------------------------
export const sosAPI = {
  trigger: async ({ rideId, lat, lng, message } = {}) => {
    const res = await apiClient.post('/sos', { rideId, lat, lng, message });
    return res.data;
  },
};

export default apiClient;

