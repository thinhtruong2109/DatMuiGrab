import axiosInstance from './axiosInstance'
import type { Ride, BookRideRequest, RideStatus } from '@/types'

export const rideApi = {
  book: (data: BookRideRequest) =>
    axiosInstance.post<Ride>('/rides', data).then((r) => r.data),

  getById: (id: string) =>
    axiosInstance.get<Ride>(`/rides/${id}`).then((r) => r.data),

  cancel: (id: string, reason: string) =>
    axiosInstance.put(`/rides/${id}/cancel`, { reason }).then((r) => r.data),

  updateStatus: (id: string, status: RideStatus) =>
    axiosInstance.put(`/rides/${id}/status`, { status }).then((r) => r.data),

  getMyRides: (params?: { page?: number; size?: number }) =>
    axiosInstance.get<Ride[]>('/rides/my-rides', { params }).then((r) => r.data),

  getByCompany: (companyId: string, params?: { page?: number; size?: number }) =>
    axiosInstance.get<Ride[]>(`/rides/company/${companyId}`, { params }).then((r) => r.data),

  getDriverPendingRide: () =>
    axiosInstance
      .get<Ride>('/rides/driver/pending', {
        validateStatus: (status) => status === 200 || status === 204,
      })
      .then((r) => (r.status === 204 ? null : r.data)),
}
