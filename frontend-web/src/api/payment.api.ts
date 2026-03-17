import axiosInstance from './axiosInstance'
import type { Payment, PaymentMethod } from '@/types'

export const paymentApi = {
  pay: (rideId: string, method: PaymentMethod) =>
    axiosInstance.post<Payment>('/payments', { rideId, method }).then((r) => r.data),

  getByRide: (rideId: string) =>
    axiosInstance.get<Payment>(`/payments/ride/${rideId}`).then((r) => r.data),
}
