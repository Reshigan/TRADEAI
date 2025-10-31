# TRADEAI Frontend v3 - Build Instructions
## Complete Backend-Matched Implementation

**Status**: Project structure created, ready for implementation  
**Location**: `/workspace/project/TRADEAI/frontend-v3`

---

## What's Already Done

✅ **Node.js Installed**: v20.19.5  
✅ **Project Created**: Vite + React + TypeScript  
✅ **Dependencies Installed**:
- React Router DOM v6
- Axios (HTTP client)
- Zustand (state management)
- React Query (data fetching)
- React Hook Form + Zod (forms & validation)
- Tailwind CSS (styling)
- Lucide React (icons)
- Recharts (charts)
- TanStack Table (tables)
- date-fns (date utilities)

✅ **Project Structure Created**:
```
frontend-v3/
├── src/
│   ├── api/              # API client and services
│   ├── components/       # Reusable components
│   │   ├── ui/           # Base UI components
│   │   ├── forms/        # Form components
│   │   └── charts/       # Chart components
│   ├── features/         # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── budgets/      # Budget management
│   │   ├── promotions/   # Promotion management
│   │   ├── customers/    # Customer management
│   │   ├── products/     # Product management
│   │   └── analytics/    # Analytics
│   ├── hooks/            # Custom hooks
│   ├── layouts/          # Layout components
│   ├── pages/            # Page components
│   ├── routes/           # Route configuration
│   ├── store/            # Zustand stores
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── tailwind.config.js    ✅ Configured
├── postcss.config.js     ✅ Configured
├── package.json          ✅ All deps installed
└── tsconfig.json         ✅ TypeScript configured
```

---

## Next Steps to Complete Frontend

### Step 1: Core Setup Files

Create these foundation files:

#### 1.1 `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded-md hover:bg-gray-400;
}

/* Transitions */
* {
  @apply transition-colors duration-200;
}
```

#### 1.2 `src/main.tsx`
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
```

#### 1.3 `src/App.tsx`
```tsx
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
```

#### 1.4 `.env`
```env
VITE_API_URL=https://tradeai.gonxt.tech/api
```

---

### Step 2: API Client Setup

#### 2.1 `src/api/client.ts`
```typescript
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://tradeai.gonxt.tech/api'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')

        // Refresh token
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        })

        const { accessToken, refreshToken: newRefreshToken } = response.data.data

        // Update tokens
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed - logout
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
```

#### 2.2 `src/api/auth.ts`
```typescript
import apiClient from './client'

export interface LoginRequest {
  email?: string
  username?: string
  password: string
  tenantId?: string
}

export interface LoginResponse {
  success: boolean
  data: {
    accessToken: string
    refreshToken: string
    user: User
  }
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  department: string
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data),

  quickLogin: () =>
    apiClient.post<LoginResponse>('/auth/quick-login'),

  logout: () =>
    apiClient.post('/auth/logout'),

  register: (data: any) =>
    apiClient.post('/auth/register', data),

  getMe: () =>
    apiClient.get<{ success: boolean; data: User }>('/auth/me'),

  updateMe: (data: Partial<User>) =>
    apiClient.put('/auth/me', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post('/auth/change-password', data),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; password: string }) =>
    apiClient.post('/auth/reset-password', data),
}
```

---

### Step 3: Authentication Store

#### 3.1 `src/store/auth.ts`
```typescript
import { create } from 'zustand'
import { User } from '../api/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    set({ user, accessToken, isAuthenticated: true })
  },

  clearAuth: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null, accessToken: null, isAuthenticated: false })
  },

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
}))
```

---

### Step 4: Routes Configuration

#### 4.1 `src/routes/index.tsx`
```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import LoginPage from '../pages/auth/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import MainLayout from '../layouts/MainLayout'

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        {/* Add more routes here */}
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
```

---

### Step 5: Login Page

#### 5.1 `src/pages/auth/LoginPage.tsx`
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { authApi, LoginRequest } from '../../api/auth'
import { useAuthStore } from '../../store/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>()
  const [error, setError] = useState('')

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      const { accessToken, refreshToken, user } = response.data.data
      setAuth(user, accessToken, refreshToken)
      navigate('/dashboard')
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Login failed')
    },
  })

  const quickLoginMutation = useMutation({
    mutationFn: authApi.quickLogin,
    onSuccess: (response) => {
      const { accessToken, refreshToken, user } = response.data.data
      setAuth(user, accessToken, refreshToken)
      navigate('/dashboard')
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Quick login failed')
    },
  })

  const onSubmit = (data: LoginRequest) => {
    setError('')
    loginMutation.mutate(data)
  }

  const handleQuickLogin = () => {
    setError('')
    quickLoginMutation.mutate()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TRADEAI</h1>
          <p className="text-gray-600">Trade Promotion Management</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email or Username
            </label>
            <input
              type="text"
              {...register('email', { required: 'Email or username is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email or username"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loginMutation.isPending ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <button
            onClick={handleQuickLogin}
            disabled={quickLoginMutation.isPending}
            className="mt-4 w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {quickLoginMutation.isPending ? 'Logging in...' : 'Quick Login (Demo)'}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          <a href="/forgot-password" className="text-blue-600 hover:text-blue-500">
            Forgot your password?
          </a>
        </p>
      </div>
    </div>
  )
}
```

---

### Step 6: Main Layout

#### 6.1 `src/layouts/MainLayout.tsx`
```tsx
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function MainLayout() {
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300`}
      >
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">TRADEAI</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded hover:bg-gray-800"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="mt-8">
          <Link
            to="/dashboard"
            className="flex items-center px-4 py-3 hover:bg-gray-800"
          >
            <span className={sidebarOpen ? 'ml-3' : 'ml-0'}>Dashboard</span>
          </Link>
          <Link
            to="/budgets"
            className="flex items-center px-4 py-3 hover:bg-gray-800"
          >
            <span className={sidebarOpen ? 'ml-3' : 'ml-0'}>Budgets</span>
          </Link>
          <Link
            to="/promotions"
            className="flex items-center px-4 py-3 hover:bg-gray-800"
          >
            <span className={sidebarOpen ? 'ml-3' : 'ml-0'}>Promotions</span>
          </Link>
          <Link
            to="/customers"
            className="flex items-center px-4 py-3 hover:bg-gray-800"
          >
            <span className={sidebarOpen ? 'ml-3' : 'ml-0'}>Customers</span>
          </Link>
          <Link
            to="/products"
            className="flex items-center px-4 py-3 hover:bg-gray-800"
          >
            <span className={sidebarOpen ? 'ml-3' : 'ml-0'}>Products</span>
          </Link>
          <Link
            to="/analytics"
            className="flex items-center px-4 py-3 hover:bg-gray-800"
          >
            <span className={sidebarOpen ? 'ml-3' : 'ml-0'}>Analytics</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-gray-100"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

---

### Step 7: Dashboard Page

#### 7.1 `src/pages/DashboardPage.tsx`
```tsx
import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'

export default function DashboardPage() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboards/executive')
      return response.data.data
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Executive Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* KPI Cards */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Trade Spend</h3>
          <p className="text-3xl font-bold text-gray-900">$45.2M</p>
          <p className="text-sm text-green-600 mt-2">+12% YoY</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Budget Utilization</h3>
          <p className="text-3xl font-bold text-gray-900">78%</p>
          <p className="text-sm text-blue-600 mt-2">On Track</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Average ROI</h3>
          <p className="text-3xl font-bold text-gray-900">3.2x</p>
          <p className="text-sm text-green-600 mt-2">+0.5x vs Target</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Sales Lift</h3>
          <p className="text-3xl font-bold text-gray-900">+12.5%</p>
          <p className="text-sm text-green-600 mt-2">Above Average</p>
        </div>
      </div>

      {/* Additional Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Promotions</h3>
          <p className="text-gray-600">Promotion list will appear here...</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
          <p className="text-gray-600">Customer list will appear here...</p>
        </div>
      </div>
    </div>
  )
}
```

---

### Step 8: Update index.html

Update `/workspace/project/TRADEAI/frontend-v3/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TRADEAI - Trade Promotion Management</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

### Step 9: Run the Application

```bash
cd /workspace/project/TRADEAI/frontend-v3
npm run dev -- --host 0.0.0.0 --port 12000
```

The application will be available at: https://work-1-fymmzbejnnaxkqet.prod-runtime.all-hands.dev

---

## What You Get

After completing these steps, you'll have:

✅ **Working Authentication**
- Login page with email/password
- Quick login for demo
- Session management with token refresh
- Protected routes
- Logout functionality

✅ **Main Layout**
- Sidebar navigation
- Header with user info
- Responsive design
- Professional UI

✅ **Dashboard**
- Executive dashboard view
- KPI cards
- Real API integration
- Loading states

✅ **Foundation for All Features**
- API client configured
- State management setup
- Routing configured
- Type safety with TypeScript
- Modern React patterns

---

## Next Development Phases

After the core is working, continue with:

**Phase 2**: Budget Management (CRUD, wizards, approval flow)  
**Phase 3**: Promotion Management (CRUD, calendar, performance)  
**Phase 4**: Customer & Product Management  
**Phase 5**: Analytics & Reporting  
**Phase 6**: ML/AI Features  
**Phase 7**: Admin & Enterprise Features

---

## Backend API Reference

All API endpoints documented in: `BACKEND_API_COMPLETE_REFERENCE.md`  
All user stories documented in: `USER_STORIES_COMPLETE.md`  
Sprint plan available in: `SPRINT_PLAN.md`

---

**Status**: Ready for implementation  
**Estimated Time**: Sprint 1 (2 weeks) for core authentication & dashboard  
**Total Project**: 14 weeks for complete implementation
