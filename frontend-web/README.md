# Đất Mũi Grab — Frontend

React + TypeScript + MUI v5 frontend cho nền tảng vận tải Đất Mũi Grab.

## Stack

- **Vite** + React 18 + TypeScript
- **MUI v5** — UI components
- **Zustand** — State management
- **React Query** — Data fetching & caching
- **React Router v6** — Routing
- **Leaflet + react-leaflet** — Bản đồ OpenStreetMap (miễn phí)
- **STOMP.js + SockJS** — WebSocket realtime
- **Axios** — HTTP client

## Cài đặt

```bash
npm install
npm run dev
```

Frontend chạy tại `http://localhost:3000`  
Backend Spring Boot cần chạy tại `http://localhost:8080`

## Cấu trúc thư mục

```
src/
├── api/          # Axios API calls (auth, company, driver, ride, ...)
├── components/
│   ├── common/   # LoadingScreen, PageHeader, StatCard, EmptyState
│   └── layout/   # CustomerLayout, DashboardLayout
├── hooks/        # useWebSocket, useGeolocation
├── pages/
│   ├── auth/     # Login, Register, VerifyEmail
│   ├── customer/ # BookRide (map), RideTracking, History, Profile
│   ├── driver/   # Dashboard, RidePage, Registrations, Profile
│   ├── company/  # Dashboard, Drivers, Rides, Wallet, Settings
│   └── admin/    # Dashboard, Companies, Drivers, Users, Appeals
├── routes/       # React Router config
├── store/        # Zustand stores (auth, ride, chat)
├── theme/        # MUI theme (màu xanh lá Đất Mũi)
├── types/        # TypeScript interfaces
└── utils/        # format currency, date, status labels
```

## Tính năng theo từng vai trò

### Customer
- Đặt xe: chọn điểm đón/đến trên bản đồ, xem giá ước tính từng công ty
- Theo dõi tài xế realtime trên bản đồ
- Chat với tài xế trong chuyến
- Đánh giá và thanh toán sau chuyến
- Lịch sử chuyến đi

### Driver
- Bật/tắt trạng thái online
- Nhận và xử lý chuyến đi realtime
- Gửi vị trí GPS tự động qua WebSocket
- Đăng ký nhiều công ty vận tải
- Xem điểm uy tín

### Transport Company
- Quản lý tài xế, phê duyệt hồ sơ
- Cập nhật giá cước realtime
- Xem doanh thu, quản lý ví
- Cài đặt tỉ lệ chia doanh thu

### Admin
- Phê duyệt công ty vận tải
- Ban tài xế vi phạm
- Xử lý kháng cáo
- Quản lý toàn bộ người dùng
