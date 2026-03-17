import axiosInstance from './axiosInstance'
import type { Rating, CreateRatingRequest } from '@/types'

export const ratingApi = {
  create: (data: CreateRatingRequest) =>
    axiosInstance.post<Rating>('/ratings', data).then((r) => r.data),

  getByDriver: (driverId: string) =>
    axiosInstance.get<Rating[]>(`/ratings/driver/${driverId}`).then((r) => r.data),
}
