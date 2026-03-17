// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'CUSTOMER' | 'DRIVER' | 'TRANSPORT_COMPANY' | 'ADMIN'
export type UserStatus = 'INACTIVE' | 'ACTIVE' | 'BANNED' | 'SUSPENDED'
export type DriverOnlineStatus = 'OFFLINE' | 'ONLINE' | 'BUSY'
export type CompanyStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED'
export type RegistrationStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED'
export type RideStatus =
  | 'SEARCHING'
  | 'MATCHED'
  | 'DRIVER_ARRIVING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
export type PaymentMethod = 'VNPAY' | 'MOMO' | 'ZALOPAY' | 'CASH'
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED'
export type AppealStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type WalletTransactionType = 'REVENUE' | 'WITHDRAWAL'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  phoneNumber?: string
  role: UserRole
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  fullName: string
  phoneNumber?: string
  role: UserRole
  status: UserStatus
  createdAt: string
}

// ─── Transport Company ────────────────────────────────────────────────────────

export interface TransportCompany {
  id: string
  userId: string
  companyName: string
  licenseNumber: string
  address: string
  description?: string
  pricePerKm: number
  driverRevenuePercent: number
  status: CompanyStatus
  approvedAt?: string
  createdAt: string
}

export interface CompanyEstimate {
  companyId: string
  companyName: string
  pricePerKm: number
  distanceKm: number
  estimatedPrice: number
  estimatedPriceDisplay: string
}

// ─── Driver ───────────────────────────────────────────────────────────────────

export interface Driver {
  id: string
  userId: string
  fullName: string
  phoneNumber: string
  licenseNumber: string
  idCardNumber: string
  vehiclePlate: string
  vehicleType: string
  vehicleModel: string
  reputationScore: number | null
  totalRatings: number
  onlineStatus: DriverOnlineStatus
  currentLat?: number
  currentLng?: number
}

export interface DriverCompanyRegistration {
  id: string
  driverId: string
  companyId: string
  companyName: string
  status: RegistrationStatus
  appliedAt: string
  approvedAt?: string
  note?: string
}

// ─── Ride ─────────────────────────────────────────────────────────────────────

export interface Ride {
  id: string
  customerId: string
  customerName: string
  driverId?: string
  driverName?: string
  driverPhone?: string
  driverVehiclePlate?: string
  companyId: string
  companyName: string
  pickupLat: number
  pickupLng: number
  pickupAddress: string
  destinationLat: number
  destinationLng: number
  destinationAddress: string
  distanceKm: number
  estimatedPrice: number
  finalPrice?: number
  platformFee?: number
  companyRevenue?: number
  driverRevenue?: number
  status: RideStatus
  cancelledBy?: string
  cancelReason?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
}

export interface BookRideRequest {
  companyId: string
  pickupLat: number
  pickupLng: number
  pickupAddress: string
  destinationLat: number
  destinationLng: number
  destinationAddress: string
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface Payment {
  id: string
  rideId: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  transactionCode?: string
  paidAt?: string
  createdAt: string
}

// ─── Rating ───────────────────────────────────────────────────────────────────

export interface Rating {
  id: string
  rideId: string
  customerId: string
  driverId: string
  stars: number
  comment?: string
  createdAt: string
}

export interface CreateRatingRequest {
  rideId: string
  stars: number
  comment?: string
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  rideId: string
  senderId: string
  senderRole: 'CUSTOMER' | 'DRIVER'
  message: string
  sentAt: string
}

// ─── Appeal ───────────────────────────────────────────────────────────────────

export interface Appeal {
  id: string
  driverId: string
  driverName: string
  appealedBy: 'DRIVER' | 'COMPANY'
  appealedByUserId: string
  reason: string
  status: AppealStatus
  adminNote?: string
  createdAt: string
  resolvedAt?: string
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export interface CompanyWallet {
  id: string
  companyId: string
  balance: number
  totalEarned: number
  totalWithdrawn: number
  bankName?: string
  bankAccountNumber?: string
  bankAccountHolder?: string
  updatedAt: string
}

export interface WalletTransaction {
  id: string
  walletId: string
  type: WalletTransactionType
  amount: number
  balanceAfter: number
  referenceId?: string
  description: string
  status: string
  createdAt: string
}

// ─── Location ─────────────────────────────────────────────────────────────────

export interface LocationPayload {
  lat: number
  lng: number
}

// ─── API Response wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}
