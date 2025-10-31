import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// User state
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'tradeai-auth',
    }
  )
);

// App state
interface AppState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: any[];
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',
      notifications: [],
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      addNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, notification],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'tradeai-app',
    }
  )
);

// Dashboard state
interface DashboardState {
  dateRange: { start: Date; end: Date } | null;
  selectedMetrics: string[];
  setDateRange: (range: { start: Date; end: Date } | null) => void;
  setSelectedMetrics: (metrics: string[]) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  dateRange: null,
  selectedMetrics: ['revenue', 'promotions', 'customers', 'products'],
  setDateRange: (dateRange) => set({ dateRange }),
  setSelectedMetrics: (selectedMetrics) => set({ selectedMetrics }),
}));

// Filter state (for lists)
interface FilterState {
  promotionFilters: {
    status?: string;
    search?: string;
    dateRange?: { start: Date; end: Date };
  };
  customerFilters: {
    search?: string;
    status?: string;
  };
  productFilters: {
    search?: string;
    category?: string;
  };
  setPromotionFilters: (filters: any) => void;
  setCustomerFilters: (filters: any) => void;
  setProductFilters: (filters: any) => void;
  clearFilters: (type: 'promotion' | 'customer' | 'product') => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  promotionFilters: {},
  customerFilters: {},
  productFilters: {},
  setPromotionFilters: (filters) => set({ promotionFilters: filters }),
  setCustomerFilters: (filters) => set({ customerFilters: filters }),
  setProductFilters: (filters) => set({ productFilters: filters }),
  clearFilters: (type) => {
    switch (type) {
      case 'promotion':
        set({ promotionFilters: {} });
        break;
      case 'customer':
        set({ customerFilters: {} });
        break;
      case 'product':
        set({ productFilters: {} });
        break;
    }
  },
}));
