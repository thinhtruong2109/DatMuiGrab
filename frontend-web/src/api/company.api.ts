import axiosInstance from './axiosInstance'
import type { TransportCompany, CompanyEstimate } from '@/types'

export const companyApi = {
  getAll: (params?: { page?: number; size?: number }) =>
    axiosInstance.get<TransportCompany[]>('/companies', { params }).then((r) => r.data),

  getById: (id: string) =>
    axiosInstance.get<TransportCompany>(`/companies/${id}`).then((r) => r.data),

  getEstimates: (pickupLat: number, pickupLng: number, destLat: number, destLng: number) =>
    axiosInstance
      .get<CompanyEstimate[]>('/companies/estimate', {
        params: { pickupLat, pickupLng, destLat, destLng },
      })
      .then((r) => r.data),

  create: (data: Partial<TransportCompany>) =>
    axiosInstance.post<TransportCompany>('/companies', data).then((r) => r.data),

  update: (id: string, data: Partial<TransportCompany>) =>
    axiosInstance.put<TransportCompany>(`/companies/${id}`, data).then((r) => r.data),

  updatePrice: (id: string, pricePerKm: number) =>
    axiosInstance.put(`/companies/${id}/price`, { pricePerKm }).then((r) => r.data),

  // Admin
  getAllAdmin: (params?: { page?: number; size?: number }) =>
    axiosInstance.get<TransportCompany[]>('/companies/admin/all', { params }).then((r) => r.data),

  approve: (id: string) =>
    axiosInstance.put(`/companies/${id}/approve`).then((r) => r.data),

  suspend: (id: string, reason: string) =>
    axiosInstance.put(`/companies/${id}/suspend`, { reason }).then((r) => r.data),
}
