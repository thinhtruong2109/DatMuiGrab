# API Routes - Đất Mũi Grab

> **Base URL:** `http://localhost:8080`
>
> **Content-Type:** `application/json`
>
> **Authentication:** Các API cần xác thực phải gửi JWT token trong header:
> ```
> Authorization: Bearer <access_token>
> ```

---

## Mục lục

1. [Authentication](#1-authentication)
2. [Users](#2-users)
3. [Transport Companies](#3-transport-companies)
4. [Drivers](#4-drivers)
5. [Driver Company Registration](#5-driver-company-registration)
6. [Rides](#6-rides)
7. [Payments](#7-payments)
8. [Ratings](#8-ratings)
9. [Chat](#9-chat)
10. [Reputation Appeals](#10-reputation-appeals)
11. [Company Wallet](#11-company-wallet)
12. [WebSocket](#12-websocket)

---

## 1. Authentication

### 1.1. Đăng ký tài khoản

| | |
|---|---|
| **URL** | `POST /api/auth/register` |
| **Mô tả** | Tạo tài khoản mới. User nhận OTP qua email để xác thực |
| **Authorization** | ❌ Không cần |

**Request Body:**
```json
{
  "email": "user@example.com",       // ✅ Bắt buộc
  "password": "Password123",          // ✅ Bắt buộc, tối thiểu 8 ký tự
  "fullName": "Nguyen Van A",         // ✅ Bắt buộc
  "phoneNumber": "0901234567",        // ✅ Bắt buộc với DRIVER
  "role": "CUSTOMER"                  // ✅ Bắt buộc: CUSTOMER | DRIVER | TRANSPORT_COMPANY
}
```

---

### 1.2. Xác nhận email (OTP)

| | |
|---|---|
| **URL** | `POST /api/auth/verify-email` |
| **Mô tả** | Xác nhận email bằng OTP 6 số. Chuyển user sang `ACTIVE` |
| **Authorization** | ❌ Không cần |

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

---

### 1.3. Gửi lại OTP

| | |
|---|---|
| **URL** | `POST /api/auth/resend-otp` |
| **Authorization** | ❌ Không cần |

**Request Body:**
```json
{ "email": "user@example.com" }
```

---

### 1.4. Đăng nhập

| | |
|---|---|
| **URL** | `POST /api/auth/login` |
| **Authorization** | ❌ Không cần |

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response:** `accessToken`, `refreshToken`, thông tin user

---

### 1.5. Làm mới token

| | |
|---|---|
| **URL** | `POST /api/auth/refresh-token` |
| **Authorization** | ❌ Không cần |

**Request Body:**
```json
{ "refreshToken": "eyJhbGciOi..." }
```

---

### 1.6. Đăng xuất

| | |
|---|---|
| **URL** | `POST /api/auth/logout` |
| **Authorization** | ❌ Không cần |

---

## 2. Users

### 2.1. Xem profile cá nhân

| | |
|---|---|
| **URL** | `GET /api/users/me` |
| **Authorization** | ✅ Any |

---

### 2.2. Cập nhật profile

| | |
|---|---|
| **URL** | `PUT /api/users/me` |
| **Authorization** | ✅ Any |

**Request Body:**
```json
{
  "fullName": "Nguyen Van B",
  "phoneNumber": "0909876543"
}
```

---

### 2.3. Đổi mật khẩu

| | |
|---|---|
| **URL** | `PUT /api/users/me/password` |
| **Authorization** | ✅ Any |

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

---

### 2.4. Lấy tất cả users (Admin)

| | |
|---|---|
| **URL** | `GET /api/users` |
| **Authorization** | ✅ `ADMIN` |

---

### 2.5. Ban user (Admin)

| | |
|---|---|
| **URL** | `PUT /api/users/{userId}/ban` |
| **Authorization** | ✅ `ADMIN` |

---

### 2.6. Unban user (Admin)

| | |
|---|---|
| **URL** | `PUT /api/users/{userId}/unban` |
| **Authorization** | ✅ `ADMIN` |

---

## 3. Transport Companies

### 3.1. Lấy danh sách công ty đang hoạt động (Public)

| | |
|---|---|
| **URL** | `GET /api/companies` |
| **Mô tả** | Trả về danh sách công ty ACTIVE kèm `pricePerKm` hiện tại |
| **Authorization** | ❌ Không cần |

---

### 3.2. Xem chi tiết công ty (Public)

| | |
|---|---|
| **URL** | `GET /api/companies/{companyId}` |
| **Authorization** | ❌ Không cần |

---

### 3.3. Lấy giá ước tính theo công ty

| | |
|---|---|
| **URL** | `GET /api/companies/estimate` |
| **Mô tả** | Trả về danh sách công ty kèm giá ước tính cho quãng đường |
| **Authorization** | ❌ Không cần |

**Query Params:**
```
pickupLat=10.7769&pickupLng=106.7009&destLat=10.7600&destLng=106.6800
```

**Response:**
```json
[
  {
    "companyId": "uuid",
    "companyName": "Mai Linh Cà Mau",
    "pricePerKm": 15000,
    "distanceKm": 3.4,
    "estimatedPrice": 53550,
    "estimatedPriceDisplay": "53.550đ (đã bao gồm phí)"
  }
]
```

---

### 3.4. Đăng ký công ty mới

| | |
|---|---|
| **URL** | `POST /api/companies` |
| **Mô tả** | Công ty đăng ký vào platform. Trạng thái ban đầu = PENDING |
| **Authorization** | ✅ `TRANSPORT_COMPANY` |

**Request Body:**
```json
{
  "companyName": "Mai Linh Cà Mau",
  "licenseNumber": "123/GP-VTKD",
  "address": "123 Đường Lý Thường Kiệt, TP Cà Mau",
  "description": "Công ty vận tải uy tín tại Cà Mau",
  "pricePerKm": 15000,
  "driverRevenuePercent": 75
}
```

---

### 3.5. Cập nhật thông tin công ty

| | |
|---|---|
| **URL** | `PUT /api/companies/{companyId}` |
| **Authorization** | ✅ `TRANSPORT_COMPANY` (chủ sở hữu) |

---

### 3.6. Cập nhật giá per km (Realtime)

| | |
|---|---|
| **URL** | `PUT /api/companies/{companyId}/price` |
| **Mô tả** | Cập nhật giá cước realtime |
| **Authorization** | ✅ `TRANSPORT_COMPANY` (chủ sở hữu) |

**Request Body:**
```json
{ "pricePerKm": 18000 }
```

---

### 3.7. Lấy danh sách tất cả công ty (Admin)

| | |
|---|---|
| **URL** | `GET /api/companies/admin/all` |
| **Authorization** | ✅ `ADMIN` |

---

### 3.8. Phê duyệt công ty (Admin)

| | |
|---|---|
| **URL** | `PUT /api/companies/{companyId}/approve` |
| **Authorization** | ✅ `ADMIN` |

---

### 3.9. Từ chối / Tạm hoãn công ty (Admin)

| | |
|---|---|
| **URL** | `PUT /api/companies/{companyId}/suspend` |
| **Authorization** | ✅ `ADMIN` |

**Request Body:**
```json
{ "reason": "Giấy phép kinh doanh không hợp lệ" }
```

---

## 4. Drivers

### 4.1. Lấy profile tài xế của mình

| | |
|---|---|
| **URL** | `GET /api/drivers/me` |
| **Authorization** | ✅ `DRIVER` |

---

### 4.2. Cập nhật thông tin tài xế

| | |
|---|---|
| **URL** | `PUT /api/drivers/me` |
| **Mô tả** | Cập nhật thông tin cá nhân, phương tiện |
| **Authorization** | ✅ `DRIVER` |

**Request Body:**
```json
{
  "licenseNumber": "012345678901",
  "idCardNumber": "079123456789",
  "vehiclePlate": "69A1-12345",
  "vehicleType": "Xe máy",
  "vehicleModel": "Honda Wave Alpha"
}
```

---

### 4.3. Bật / Tắt trạng thái online

| | |
|---|---|
| **URL** | `PUT /api/drivers/me/status` |
| **Mô tả** | Tài xế bật ONLINE → hiển thị cho tất cả công ty đã được duyệt |
| **Authorization** | ✅ `DRIVER` |

**Request Body:**
```json
{ "status": "ONLINE" }
```

> Các giá trị hợp lệ: `ONLINE`, `OFFLINE`. Trạng thái `BUSY` do hệ thống tự set.

---

### 4.4. Xem lịch sử chuyến đi của tài xế

| | |
|---|---|
| **URL** | `GET /api/drivers/me/rides` |
| **Authorization** | ✅ `DRIVER` |

---

### 4.5. Lấy danh sách tài xế của công ty

| | |
|---|---|
| **URL** | `GET /api/drivers/company/{companyId}` |
| **Authorization** | ✅ `TRANSPORT_COMPANY` (chủ sở hữu) / `ADMIN` |

---

### 4.6. Ban tài xế (Admin)

| | |
|---|---|
| **URL** | `PUT /api/drivers/{driverId}/ban` |
| **Mô tả** | Admin ban trực tiếp, không cần thông qua công ty |
| **Authorization** | ✅ `ADMIN` |

**Request Body:**
```json
{ "reason": "Nhận báo cáo lái xe nguy hiểm" }
```

---

## 5. Driver Company Registration

### 5.1. Tài xế đăng ký vào công ty

| | |
|---|---|
| **URL** | `POST /api/driver-registrations` |
| **Mô tả** | Tài xế nộp hồ sơ vào công ty. Trạng thái = PENDING |
| **Authorization** | ✅ `DRIVER` |

**Request Body:**
```json
{
  "companyId": "uuid-cong-ty",
  "licenseNumber": "012345678901",
  "idCardNumber": "079123456789",
  "phoneNumber": "0901234567",
  "vehiclePlate": "69A1-12345",
  "vehicleType": "Xe máy",
  "vehicleModel": "Honda Wave Alpha"
}
```

---

### 5.2. Xem danh sách đăng ký của tài xế

| | |
|---|---|
| **URL** | `GET /api/driver-registrations/me` |
| **Mô tả** | Tài xế xem tất cả công ty mình đã đăng ký và trạng thái |
| **Authorization** | ✅ `DRIVER` |

---

### 5.3. Lấy danh sách tài xế PENDING của công ty

| | |
|---|---|
| **URL** | `GET /api/driver-registrations/company/{companyId}/pending` |
| **Authorization** | ✅ `TRANSPORT_COMPANY` (chủ sở hữu) |

---

### 5.4. Phê duyệt tài xế

| | |
|---|---|
| **URL** | `PUT /api/driver-registrations/{registrationId}/approve` |
| **Authorization** | ✅ `TRANSPORT_COMPANY` (chủ sở hữu) |

---

### 5.5. Từ chối tài xế

| | |
|---|---|
| **URL** | `PUT /api/driver-registrations/{registrationId}/reject` |
| **Authorization** | ✅ `TRANSPORT_COMPANY` (chủ sở hữu) |

**Request Body:**
```json
{ "note": "Hồ sơ không đầy đủ" }
```

---

## 6. Rides

### 6.1. Đặt xe

| | |
|---|---|
| **URL** | `POST /api/rides` |
| **Mô tả** | Khách đặt xe với công ty đã chọn. Hệ thống tìm tài xế tối ưu |
| **Authorization** | ✅ `CUSTOMER` |

**Request Body:**
```json
{
  "companyId": "uuid-cong-ty",
  "pickupLat": 10.7769,
  "pickupLng": 106.7009,
  "pickupAddress": "123 Đường Lý Thường Kiệt, TP Cà Mau",
  "destinationLat": 10.7600,
  "destinationLng": 106.6800,
  "destinationAddress": "Bến xe Cà Mau"
}
```

**Response:**
```json
{
  "rideId": "uuid",
  "status": "SEARCHING",
  "estimatedPrice": 53550,
  "distanceKm": 3.4
}
```

---

### 6.2. Xem chi tiết chuyến đi

| | |
|---|---|
| **URL** | `GET /api/rides/{rideId}` |
| **Authorization** | ✅ Any (khách / tài xế / công ty / admin liên quan) |

---

### 6.3. Khách hủy chuyến

| | |
|---|---|
| **URL** | `PUT /api/rides/{rideId}/cancel` |
| **Authorization** | ✅ `CUSTOMER` |

**Request Body:**
```json
{ "reason": "Đổi ý không đi nữa" }
```

---

### 6.4. Tài xế cập nhật trạng thái chuyến

| | |
|---|---|
| **URL** | `PUT /api/rides/{rideId}/status` |
| **Mô tả** | Tài xế cập nhật: đang đến đón / đã đón / hoàn thành |
| **Authorization** | ✅ `DRIVER` |

**Request Body:**
```json
{ "status": "DRIVER_ARRIVING" }
```

> Các giá trị tài xế được phép set: `DRIVER_ARRIVING`, `IN_PROGRESS`, `COMPLETED`

---

### 6.5. Xem lịch sử chuyến đi của khách

| | |
|---|---|
| **URL** | `GET /api/rides/my-rides` |
| **Authorization** | ✅ `CUSTOMER` |

---

### 6.6. Xem tất cả chuyến đi của công ty

| | |
|---|---|
| **URL** | `GET /api/rides/company/{companyId}` |
| **Authorization** | ✅ `TRANSPORT_COMPANY` (chủ sở hữu) / `ADMIN` |

---

## 7. Payments

### 7.1. Thanh toán chuyến đi

| | |
|---|---|
| **URL** | `POST /api/payments` |
| **Authorization** | ✅ `CUSTOMER` |

**Request Body:**
```json
{
  "rideId": "uuid",
  "method": "VNPAY"
}
```

---

### 7.2. Xem trạng thái thanh toán

| | |
|---|---|
| **URL** | `GET /api/payments/ride/{rideId}` |
| **Authorization** | ✅ Any (liên quan) |

---

### 7.3. Webhook callback từ payment gateway

| | |
|---|---|
| **URL** | `POST /api/payments/webhook/{gateway}` |
| **Authorization** | ❌ Không cần (xác thực bằng signature) |

---

## 8. Ratings

### 8.1. Đánh giá tài xế sau chuyến

| | |
|---|---|
| **URL** | `POST /api/ratings` |
| **Mô tả** | Chỉ được đánh giá khi chuyến đã COMPLETED, mỗi chuyến 1 lần |
| **Authorization** | ✅ `CUSTOMER` |

**Request Body:**
```json
{
  "rideId": "uuid",
  "stars": 5,
  "comment": "Tài xế chạy ổn, thân thiện"
}
```

---

### 8.2. Xem đánh giá của tài xế

| | |
|---|---|
| **URL** | `GET /api/ratings/driver/{driverId}` |
| **Authorization** | ❌ Không cần |

---

## 9. Chat

### 9.1. Lấy lịch sử tin nhắn của chuyến

| | |
|---|---|
| **URL** | `GET /api/chat/{rideId}/messages` |
| **Mô tả** | Lấy toàn bộ tin nhắn của chuyến đi |
| **Authorization** | ✅ `CUSTOMER` / `DRIVER` (thuộc chuyến) |

---

> ⚡ **Gửi và nhận tin nhắn realtime qua WebSocket** — xem mục 12

---

## 10. Reputation Appeals

### 10.1. Tạo kháng cáo

| | |
|---|---|
| **URL** | `POST /api/appeals` |
| **Mô tả** | Tài xế hoặc công ty kháng cáo khi tài xế bị tạm hoãn |
| **Authorization** | ✅ `DRIVER` / `TRANSPORT_COMPANY` |

**Request Body:**
```json
{
  "driverId": "uuid",
  "reason": "Điểm thấp do khách cố tình đánh giá sai"
}
```

---

### 10.2. Xem danh sách kháng cáo (Admin)

| | |
|---|---|
| **URL** | `GET /api/appeals` |
| **Authorization** | ✅ `ADMIN` |

---

### 10.3. Xử lý kháng cáo (Admin)

| | |
|---|---|
| **URL** | `PUT /api/appeals/{appealId}/resolve` |
| **Authorization** | ✅ `ADMIN` |

**Request Body:**
```json
{
  "status": "APPROVED",
  "adminNote": "Đã xem xét, tài xế được mở lại tài khoản"
}
```

---

## 11. Company Wallet

### 11.1. Xem thông tin ví công ty

| | |
|---|---|
| **URL** | `GET /api/wallet` |
| **Authorization** | ✅ `TRANSPORT_COMPANY` |

---

### 11.2. Cập nhật thông tin ngân hàng

| | |
|---|---|
| **URL** | `PUT /api/wallet/bank-info` |
| **Authorization** | ✅ `TRANSPORT_COMPANY` |

**Request Body:**
```json
{
  "bankName": "Vietcombank",
  "bankAccountNumber": "1234567890",
  "bankAccountHolder": "NGUYEN VAN A"
}
```

---

### 11.3. Yêu cầu rút tiền

| | |
|---|---|
| **URL** | `POST /api/wallet/withdraw` |
| **Authorization** | ✅ `TRANSPORT_COMPANY` |

**Request Body:**
```json
{ "amount": 5000000 }
```

---

### 11.4. Lịch sử giao dịch ví

| | |
|---|---|
| **URL** | `GET /api/wallet/transactions` |
| **Authorization** | ✅ `TRANSPORT_COMPANY` |

---

### 11.5. Xem ví của công ty bất kỳ (Admin)

| | |
|---|---|
| **URL** | `GET /api/wallet/admin/{companyId}` |
| **Authorization** | ✅ `ADMIN` |

---

## 12. WebSocket

> **Endpoint:** `ws://localhost:8080/ws`
> **Protocol:** STOMP over SockJS

### 12.1. Tài xế gửi vị trí realtime

```
SEND /app/location/{rideId}
Body: { "lat": 10.7769, "lng": 106.7009 }
```

---

### 12.2. Khách subscribe nhận vị trí tài xế

```
SUBSCRIBE /topic/ride/{rideId}/location
```

---

### 12.3. Gửi tin nhắn chat

```
SEND /app/chat/{rideId}
Body: { "message": "Tôi đang ở cổng trường" }
```

---

### 12.4. Subscribe nhận tin nhắn chat

```
SUBSCRIBE /topic/ride/{rideId}/chat
```

---

### 12.5. Subscribe nhận cập nhật trạng thái chuyến

```
SUBSCRIBE /topic/ride/{rideId}/status
```

---

### 12.6. Tài xế subscribe nhận yêu cầu đặt xe mới

```
SUBSCRIBE /topic/driver/{driverId}/new-ride
```

---

## Tổng hợp nhanh

| # | Method | URL | Auth | Role |
|---|--------|-----|------|------|
| 1 | POST | `/api/auth/register` | ❌ | — |
| 2 | POST | `/api/auth/verify-email` | ❌ | — |
| 3 | POST | `/api/auth/resend-otp` | ❌ | — |
| 4 | POST | `/api/auth/login` | ❌ | — |
| 5 | POST | `/api/auth/refresh-token` | ❌ | — |
| 6 | POST | `/api/auth/logout` | ❌ | — |
| 7 | GET | `/api/users/me` | ✅ | Any |
| 8 | PUT | `/api/users/me` | ✅ | Any |
| 9 | PUT | `/api/users/me/password` | ✅ | Any |
| 10 | GET | `/api/users` | ✅ | ADMIN |
| 11 | PUT | `/api/users/{userId}/ban` | ✅ | ADMIN |
| 12 | PUT | `/api/users/{userId}/unban` | ✅ | ADMIN |
| 13 | GET | `/api/companies` | ❌ | — |
| 14 | GET | `/api/companies/{companyId}` | ❌ | — |
| 15 | GET | `/api/companies/estimate` | ❌ | — |
| 16 | POST | `/api/companies` | ✅ | TRANSPORT_COMPANY |
| 17 | PUT | `/api/companies/{companyId}` | ✅ | TRANSPORT_COMPANY |
| 18 | PUT | `/api/companies/{companyId}/price` | ✅ | TRANSPORT_COMPANY |
| 19 | GET | `/api/companies/admin/all` | ✅ | ADMIN |
| 20 | PUT | `/api/companies/{companyId}/approve` | ✅ | ADMIN |
| 21 | PUT | `/api/companies/{companyId}/suspend` | ✅ | ADMIN |
| 22 | GET | `/api/drivers/me` | ✅ | DRIVER |
| 23 | PUT | `/api/drivers/me` | ✅ | DRIVER |
| 24 | PUT | `/api/drivers/me/status` | ✅ | DRIVER |
| 25 | GET | `/api/drivers/me/rides` | ✅ | DRIVER |
| 26 | GET | `/api/drivers/company/{companyId}` | ✅ | TRANSPORT_COMPANY/ADMIN |
| 27 | PUT | `/api/drivers/{driverId}/ban` | ✅ | ADMIN |
| 28 | POST | `/api/driver-registrations` | ✅ | DRIVER |
| 29 | GET | `/api/driver-registrations/me` | ✅ | DRIVER |
| 30 | GET | `/api/driver-registrations/company/{companyId}/pending` | ✅ | TRANSPORT_COMPANY |
| 31 | PUT | `/api/driver-registrations/{id}/approve` | ✅ | TRANSPORT_COMPANY |
| 32 | PUT | `/api/driver-registrations/{id}/reject` | ✅ | TRANSPORT_COMPANY |
| 33 | POST | `/api/rides` | ✅ | CUSTOMER |
| 34 | GET | `/api/rides/{rideId}` | ✅ | Any |
| 35 | PUT | `/api/rides/{rideId}/cancel` | ✅ | CUSTOMER |
| 36 | PUT | `/api/rides/{rideId}/status` | ✅ | DRIVER |
| 37 | GET | `/api/rides/my-rides` | ✅ | CUSTOMER |
| 38 | GET | `/api/rides/company/{companyId}` | ✅ | TRANSPORT_COMPANY/ADMIN |
| 39 | POST | `/api/payments` | ✅ | CUSTOMER |
| 40 | GET | `/api/payments/ride/{rideId}` | ✅ | Any |
| 41 | POST | `/api/payments/webhook/{gateway}` | ❌ | — |
| 42 | POST | `/api/ratings` | ✅ | CUSTOMER |
| 43 | GET | `/api/ratings/driver/{driverId}` | ❌ | — |
| 44 | GET | `/api/chat/{rideId}/messages` | ✅ | CUSTOMER/DRIVER |
| 45 | POST | `/api/appeals` | ✅ | DRIVER/TRANSPORT_COMPANY |
| 46 | GET | `/api/appeals` | ✅ | ADMIN |
| 47 | PUT | `/api/appeals/{appealId}/resolve` | ✅ | ADMIN |
| 48 | GET | `/api/wallet` | ✅ | TRANSPORT_COMPANY |
| 49 | PUT | `/api/wallet/bank-info` | ✅ | TRANSPORT_COMPANY |
| 50 | POST | `/api/wallet/withdraw` | ✅ | TRANSPORT_COMPANY |
| 51 | GET | `/api/wallet/transactions` | ✅ | TRANSPORT_COMPANY |
| 52 | GET | `/api/wallet/admin/{companyId}` | ✅ | ADMIN |