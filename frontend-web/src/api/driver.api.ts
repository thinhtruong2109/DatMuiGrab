import axiosInstance from './axiosInstance'
import type { Driver, DriverCompanyRegistration, DriverOnlineStatus, Ride } from '@/types'

export const driverApi = {
  getMe: () =>
    axiosInstance.get<Driver>('/drivers/me').then((r) => r.data),

  updateMe: (data: Partial<Driver>) =>
    axiosInstance.put<Driver>('/drivers/me', data).then((r) => r.data),

  setStatus: (status: DriverOnlineStatus) =>
    axiosInstance.put('/drivers/me/status', { status }).then((r) => r.data),

  getMyRides: () =>
    axiosInstance.get<Ride[]>('/drivers/me/rides').then((r) => r.data),

  getByCompany: (companyId: string, params?: { page?: number; size?: number }) =>
    axiosInstance.get<Driver[]>(`/drivers/company/${companyId}`, { params }).then((r) => r.data),

  ban: (driverId: string, reason: string) =>
    axiosInstance.put(`/drivers/${driverId}/ban`, { reason }).then((r) => r.data),

  // Registration
  register: (data: Partial<DriverCompanyRegistration> & { companyId: string }) =>
    axiosInstance.post<DriverCompanyRegistration>('/driver-registrations', data).then((r) => r.data),

  getMyRegistrations: (params?: { page?: number; size?: number }) =>
    axiosInstance.get<DriverCompanyRegistration[]>('/driver-registrations/me', { params }).then((r) => r.data),

  getPendingByCompany: (companyId: string, params?: { page?: number; size?: number }) =>
    axiosInstance
      .get<DriverCompanyRegistration[]>(`/driver-registrations/company/${companyId}/pending`, { params })
      .then((r) => r.data),

  approveRegistration: (id: string) =>
    axiosInstance.put(`/driver-registrations/${id}/approve`).then((r) => r.data),

  rejectRegistration: (id: string, note: string) =>
    axiosInstance.put(`/driver-registrations/${id}/reject`, { note }).then((r) => r.data),
}
