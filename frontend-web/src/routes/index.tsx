import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/routes/ProtectedRoute'

// Auth
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'

// Layouts
import CustomerLayout from '@/components/layout/CustomerLayout'
import DashboardLayout from '@/components/layout/DashboardLayout'

// Customer pages
import BookRidePage from '@/pages/customer/BookRidePage'
import RideTrackingPage from '@/pages/customer/RideTrackingPage'
import RideHistoryPage from '@/pages/customer/RideHistoryPage'
import CustomerProfilePage from '@/pages/customer/CustomerProfilePage'

// Driver pages
import DriverDashboard from '@/pages/driver/DriverDashboard'
import DriverRidePage from '@/pages/driver/DriverRidePage'
import DriverRegistrationsPage from '@/pages/driver/DriverRegistrationsPage'
import DriverProfilePage from '@/pages/driver/DriverProfilePage'
import DriverAppealsPage from '@/pages/driver/DriverAppealsPage'

// Company pages
import CompanyDashboard from '@/pages/company/CompanyDashboard'
import CompanyDriversPage from '@/pages/company/CompanyDriversPage'
import CompanyRidesPage from '@/pages/company/CompanyRidesPage'
import CompanyWalletPage from '@/pages/company/CompanyWalletPage'
import CompanySettingsPage from '@/pages/company/CompanySettingsPage'

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminCompaniesPage from '@/pages/admin/AdminCompaniesPage'
import AdminDriversPage from '@/pages/admin/AdminDriversPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminAppealsPage from '@/pages/admin/AdminAppealsPage'
import AdminWalletsPage from '@/pages/admin/AdminWalletsPage'

// Driver nav config
import DashboardIcon from '@mui/icons-material/Dashboard'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import AssignmentIcon from '@mui/icons-material/Assignment'
import PersonIcon from '@mui/icons-material/Person'
import BusinessIcon from '@mui/icons-material/Business'
import PeopleIcon from '@mui/icons-material/People'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import SettingsIcon from '@mui/icons-material/Settings'
import GavelIcon from '@mui/icons-material/Gavel'

const driverNavItems = [
  { label: 'Tổng quan', path: '/driver', icon: <DashboardIcon fontSize="small" /> },
  { label: 'Chuyến hiện tại', path: '/driver/ride', icon: <DirectionsCarIcon fontSize="small" /> },
  { label: 'Đăng ký công ty', path: '/driver/registrations', icon: <AssignmentIcon fontSize="small" /> },
  { label: 'Kháng cáo', path: '/driver/appeals', icon: <GavelIcon fontSize="small" /> },
  { label: 'Hồ sơ', path: '/driver/profile', icon: <PersonIcon fontSize="small" /> },
]

const companyNavItems = [
  { label: 'Tổng quan', path: '/company', icon: <DashboardIcon fontSize="small" /> },
  { label: 'Tài xế', path: '/company/drivers', icon: <PeopleIcon fontSize="small" /> },
  { label: 'Chuyến đi', path: '/company/rides', icon: <DirectionsCarIcon fontSize="small" /> },
  { label: 'Ví & Doanh thu', path: '/company/wallet', icon: <AccountBalanceWalletIcon fontSize="small" /> },
  { label: 'Cài đặt', path: '/company/settings', icon: <SettingsIcon fontSize="small" /> },
]

const adminNavItems = [
  { label: 'Tổng quan', path: '/admin', icon: <DashboardIcon fontSize="small" /> },
  { label: 'Công ty vận tải', path: '/admin/companies', icon: <BusinessIcon fontSize="small" /> },
  { label: 'Tài xế', path: '/admin/drivers', icon: <DirectionsCarIcon fontSize="small" /> },
  { label: 'Người dùng', path: '/admin/users', icon: <PeopleIcon fontSize="small" /> },
  { label: 'Kháng cáo', path: '/admin/appeals', icon: <GavelIcon fontSize="small" /> },
  { label: 'Ví công ty', path: '/admin/wallets', icon: <AccountBalanceWalletIcon fontSize="small" /> },
]

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },

  // Customer
  {
    path: '/customer',
    element: (
      <ProtectedRoute roles={['CUSTOMER']}>
        <CustomerLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/customer/book" replace /> },
      { path: 'book', element: <BookRidePage /> },
      { path: 'ride/:rideId', element: <RideTrackingPage /> },
      { path: 'history', element: <RideHistoryPage /> },
      { path: 'profile', element: <CustomerProfilePage /> },
    ],
  },

  // Driver
  {
    path: '/driver',
    element: (
      <ProtectedRoute roles={['DRIVER']}>
        <DashboardLayout
          navItems={driverNavItems}
          title="Tài xế"
          roleColor="#00A651"
          roleLabel="Cổng tài xế"
        />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DriverDashboard /> },
      { path: 'ride', element: <DriverRidePage /> },
      { path: 'registrations', element: <DriverRegistrationsPage /> },
      { path: 'appeals', element: <DriverAppealsPage /> },
      { path: 'profile', element: <DriverProfilePage /> },
    ],
  },

  // Company
  {
    path: '/company',
    element: (
      <ProtectedRoute roles={['TRANSPORT_COMPANY']}>
        <DashboardLayout
          navItems={companyNavItems}
          title="Công ty vận tải"
          roleColor="#3B82F6"
          roleLabel="Cổng công ty"
        />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <CompanyDashboard /> },
      { path: 'drivers', element: <CompanyDriversPage /> },
      { path: 'rides', element: <CompanyRidesPage /> },
      { path: 'wallet', element: <CompanyWalletPage /> },
      { path: 'settings', element: <CompanySettingsPage /> },
    ],
  },

  // Admin
  {
    path: '/admin',
    element: (
      <ProtectedRoute roles={['ADMIN']}>
        <DashboardLayout
          navItems={adminNavItems}
          title="Admin"
          roleColor="#8B5CF6"
          roleLabel="Quản trị hệ thống"
        />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'companies', element: <AdminCompaniesPage /> },
      { path: 'drivers', element: <AdminDriversPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'appeals', element: <AdminAppealsPage /> },
      { path: 'wallets', element: <AdminWalletsPage /> },
    ],
  },
])
