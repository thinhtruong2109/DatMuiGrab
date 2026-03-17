import axiosInstance from './axiosInstance'
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types'

export const authApi = {
  login: (data: LoginRequest) =>
    axiosInstance.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    axiosInstance.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  verifyEmail: (email: string, otp: string) =>
    axiosInstance.post('/auth/verify-email', { email, otp }).then((r) => r.data),

  resendOtp: (email: string) =>
    axiosInstance.post('/auth/resend-otp', { email }).then((r) => r.data),

  refreshToken: (refreshToken: string) =>
    axiosInstance.post<AuthResponse>('/auth/refresh-token', { refreshToken }).then((r) => r.data),

  logout: () => axiosInstance.post('/auth/logout'),
}
