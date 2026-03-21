import axiosInstance from './axiosInstance'
import type { User } from '@/types'

export const userApi = {
  getMe: () =>
    axiosInstance.get<User>('/users/me').then((r) => r.data),

  updateMe: (data: Partial<Pick<User, 'fullName' | 'phoneNumber'>>) =>
    axiosInstance.put<User>('/users/me', data).then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    axiosInstance.put('/users/me/password', { currentPassword, newPassword }).then((r) => r.data),

  getAll: (params?: { page?: number; size?: number }) =>
    axiosInstance.get<User[]>('/users', { params }).then((r) => r.data),

  ban: (userId: string) =>
    axiosInstance.put(`/users/${userId}/ban`).then((r) => r.data),

  unban: (userId: string) =>
    axiosInstance.put(`/users/${userId}/unban`).then((r) => r.data),
}
