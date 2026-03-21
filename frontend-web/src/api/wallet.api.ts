import axiosInstance from './axiosInstance'
import type { CompanyWallet, WalletTransaction } from '@/types'

export const walletApi = {
  getMyWallet: () =>
    axiosInstance.get<CompanyWallet>('/wallet').then((r) => r.data),

  updateBankInfo: (data: { bankName: string; bankAccountNumber: string; bankAccountHolder: string }) =>
    axiosInstance.put<CompanyWallet>('/wallet/bank-info', data).then((r) => r.data),

  withdraw: (amount: number) =>
    axiosInstance.post<WalletTransaction>('/wallet/withdraw', { amount }).then((r) => r.data),

  getTransactions: (params?: { page?: number; size?: number }) =>
    axiosInstance.get<WalletTransaction[]>('/wallet/transactions', { params }).then((r) => r.data),

  getByCompanyAdmin: (companyId: string) =>
    axiosInstance.get<CompanyWallet>(`/wallet/admin/${companyId}`).then((r) => r.data),
}
