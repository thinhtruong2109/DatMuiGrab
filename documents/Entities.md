# Entities - Đất Mũi Grab

---

## **1. User**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| id | UUID | Primary key |
| email | String | Email đăng nhập, unique |
| password | String | Mật khẩu đã hash |
| fullName | String | Họ tên đầy đủ |
| phoneNumber | String | Số điện thoại |
| role | Enum | `CUSTOMER`, `DRIVER`, `TRANSPORT_COMPANY`, `ADMIN` |
| status | Enum | `INACTIVE`, `ACTIVE`, `BANNED` |
| createdAt | DateTime | Thời gian tạo tài khoản |
| updatedAt | DateTime | Thời gian cập nhật |

---

## **2. TransportCompany**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| id | UUID | Primary key |
| userId | UUID | FK → User (role = TRANSPORT_COMPANY) |
| companyName | String | Tên công ty vận tải |
| licenseNumber | String | Số giấy phép kinh doanh |
| address | String | Địa chỉ văn phòng |
| description | String | Mô tả công ty |
| pricePerKm | Decimal | Giá per km hiện tại (realtime) |
| driverRevenuePercent | Decimal | % doanh thu tài xế nhận (0–100) |
| status | Enum | `PENDING`, `ACTIVE`, `SUSPENDED` |
| approvedAt | DateTime | Thời điểm Admin duyệt |
| createdAt | DateTime | |
| updatedAt | DateTime | |

> `companyRevenuePercent = 100 - driverRevenuePercent` (tính ngầm)

---

## **3. Driver**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| id | UUID | Primary key |
| userId | UUID | FK → User (role = DRIVER) |
| licenseNumber | String | Số bằng lái xe |
| idCardNumber | String | Số CMND/CCCD |
| phoneNumber | String | Số điện thoại (bắt buộc) |
| vehiclePlate | String | Biển số xe |
| vehicleType | String | Loại xe (xe máy, ô tô...) |
| vehicleModel | String | Hãng xe và model |
| reputationScore | Decimal | Điểm uy tín (null nếu chưa có đánh giá) |
| totalRatings | Integer | Tổng số lượt đánh giá |
| onlineStatus | Enum | `OFFLINE`, `ONLINE`, `BUSY` |
| currentLat | Decimal | Vĩ độ hiện tại |
| currentLng | Decimal | Kinh độ hiện tại |
| lastActiveAt | DateTime | Lần cuối online |
| createdAt | DateTime | |
| updatedAt | DateTime | |

---

## **4. DriverCompanyRegistration**

> Bảng trung gian: 1 tài xế có thể đăng ký nhiều công ty

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| id | UUID | Primary key |
| driverId | UUID | FK → Driver |
| companyId | UUID | FK → TransportCompany |
| status | Enum | `PENDING`, `ACTIVE`, `REJECTED`, `SUSPENDED` |
| appliedAt | DateTime | Thời điểm tài xế đăng ký |
| approvedAt | DateTime | Thời điểm công ty phê duyệt |
| note | String | Ghi chú từ công ty khi duyệt / từ chối |

---

## **5. Ride (Chuyến đi)**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| id | UUID | Primary key |
| customerId | UUID | FK → User (role = CUSTOMER) |
| driverId | UUID | FK → Driver |
| companyId | UUID | FK → TransportCompany |
| pickupLat | Decimal | Vĩ độ điểm đón |
| pickupLng | Decimal | Kinh độ điểm đón |
| pickupAddress | String | Địa chỉ điểm đón |
| destinationLat | Decimal | Vĩ độ điểm đến |
| destinationLng | Decimal | Kinh độ điểm đến |
| destinationAddress | String | Địa chỉ điểm đến |
| distanceKm | Decimal | Quãng đường (km) |
| estimatedPrice | Decimal | Giá ước tính khi đặt (đã bao gồm 5% phí sàn) |
| finalPrice | Decimal | Giá thực tế khi hoàn thành |
| platformFee | Decimal | 5% phí sàn platform nhận |
| companyRevenue | Decimal | Phần công ty nhận (sau trừ phí sàn × tỉ lệ) |
| driverRevenue | Decimal | Phần tài xế nhận |
| pricePerKmAtBooking | Decimal | giá_per_km tại thời điểm đặt (khóa giá) |
| status | Enum | `SEARCHING`, `MATCHED`, `DRIVER_ARRIVING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| cancelledBy | Enum | `CUSTOMER`, `DRIVER`, `SYSTEM` (nullable) |
| cancelReason | String | Lý do hủy (nullable) |
| startedAt | DateTime | Thời điểm bắt đầu chuyến |
| completedAt | DateTime | Thời điểm hoàn thành |
| createdAt | DateTime | Thời điểm đặt xe |

---

## **6. Payment**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| id | UUID | Primary key |
| rideId | UUID | FK → Ride |
| customerId | UUID | FK → User |
| amount | Decimal | Số tiền thanh toán |
| method | Enum | `VNPAY`, `MOMO`, `ZALOPAY`, `CASH` |
| status | Enum | `PENDING`, `SUCCESS`, `FAILED` |
| transactionCode | String | Mã giao dịch từ payment gateway |
| paidAt | DateTime | Thời điểm thanh toán thành công |
| createdAt | DateTime | |

---

## **7. Rating (Đánh giá)**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| id | UUID | Primary key |
| rideId | UUID | FK → Ride (unique — 1 chuyến 1 đánh giá) |
| customerId | UUID | FK → User |
| driverId | UUID | FK → Driver |
| stars | Integer | 1–5 sao |
| comment | String | Nhận xét (optional) |
| createdAt | DateTime | |

---

## **8. ChatMessage**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| id | UUID | Primary key |
| rideId | UUID | FK → Ride |
| senderId | UUID | FK → User (khách hoặc tài xế) |
| senderRole | Enum | `CUSTOMER`, `DRIVER` |
| message | String | Nội dung tin nhắn |
| sentAt | DateTime | Thời gian gửi |

---

## **9. ReputationAppeal (Kháng cáo điểm uy tín)**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| id | UUID | Primary key |
| driverId | UUID | FK → Driver |
| appealedBy | Enum | `DRIVER`, `COMPANY` |
| appealedByUserId | UUID | FK → User (người kháng cáo) |
| reason | String | Lý do kháng cáo |
| status | Enum | `PENDING`, `APPROVED`, `REJECTED` |
| adminNote | String | Ghi chú Admin sau xem xét |
| resolvedBy | UUID | FK → User (Admin xử lý) |
| createdAt | DateTime | |
| resolvedAt | DateTime | |

---

## **10. CompanyWallet (Ví công ty)**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| id | UUID | Primary key |
| companyId | UUID | FK → TransportCompany |
| balance | Decimal | Số dư hiện tại |
| totalEarned | Decimal | Tổng doanh thu từ trước đến nay |
| totalWithdrawn | Decimal | Tổng đã rút |
| bankName | String | Tên ngân hàng |
| bankAccountNumber | String | Số tài khoản ngân hàng |
| bankAccountHolder | String | Tên chủ tài khoản |
| updatedAt | DateTime | |

---

## **11. WalletTransaction**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| id | UUID | Primary key |
| walletId | UUID | FK → CompanyWallet |
| type | Enum | `REVENUE`, `WITHDRAWAL` |
| amount | Decimal | Số tiền |
| balanceAfter | Decimal | Số dư sau giao dịch |
| referenceId | UUID | FK → Ride hoặc null |
| description | String | Mô tả giao dịch |
| status | Enum | `SUCCESS`, `FAILED` |
| createdAt | DateTime | |