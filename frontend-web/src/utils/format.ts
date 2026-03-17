export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))

export const formatDistance = (km: number) =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`

export const rideStatusLabel: Record<string, string> = {
  SEARCHING: 'Đang tìm tài xế',
  MATCHED: 'Đã ghép tài xế',
  DRIVER_ARRIVING: 'Tài xế đang đến',
  IN_PROGRESS: 'Đang di chuyển',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

export const rideStatusColor: Record<string, 'default' | 'warning' | 'info' | 'primary' | 'success' | 'error'> = {
  SEARCHING: 'warning',
  MATCHED: 'info',
  DRIVER_ARRIVING: 'primary',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'error',
}

export const companyStatusLabel: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  ACTIVE: 'Hoạt động',
  SUSPENDED: 'Tạm hoãn',
}

export const driverStatusLabel: Record<string, string> = {
  OFFLINE: 'Ngoại tuyến',
  ONLINE: 'Trực tuyến',
  BUSY: 'Đang chạy',
}
