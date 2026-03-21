import axiosInstance from './axiosInstance'
import type { ChatMessage } from '@/types'

export const chatApi = {
  getMessagesByRide: (rideId: string, params?: { page?: number; size?: number }) =>
    axiosInstance.get<ChatMessage[]>(`/chat/${rideId}/messages`, { params }).then((r) => r.data),
}
