import axiosInstance from './axiosInstance'
import type { Appeal, AppealStatus } from '@/types'

export const appealApi = {
  create: (driverId: string, reason: string) =>
    axiosInstance.post<Appeal>('/appeals', { driverId, reason }).then((r) => r.data),

  getAll: () =>
    axiosInstance.get<Appeal[]>('/appeals').then((r) => r.data),

  resolve: (id: string, status: AppealStatus, adminNote: string) =>
    axiosInstance.put(`/appeals/${id}/resolve`, { status, adminNote }).then((r) => r.data),
}


// test jenkins
