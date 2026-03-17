# Business Logic - Đất Mũi Grab

---

## **1. Tính giá cước**

### **Công thức**
```
distanceKm = tính từ OSRM API (đường thật, không phải đường chim bay)

Nếu distanceKm ≤ 2:
  basePrice = pricePerKm × 2

Nếu distanceKm > 2:
  basePrice = pricePerKm × distanceKm

platformFee = basePrice × 0.05
priceForCustomer = basePrice + platformFee = basePrice × 1.05
```

### **Khóa giá tại thời điểm đặt xe**
- Khi khách confirm đặt xe → hệ thống lưu `pricePerKmAtBooking` vào bảng Ride
- Dù công ty thay đổi `pricePerKm` sau đó → chuyến đang chạy vẫn tính theo giá đã khóa

### **Chia doanh thu sau chuyến**
```
totalPaid = priceForCustomer
platformRevenue = totalPaid × 0.05
companyPool = totalPaid × 0.95

driverRevenue = companyPool × (driverRevenuePercent / 100)
companyRevenue = companyPool × ((100 - driverRevenuePercent) / 100)
```

---

## **2. Matching tài xế**

### **Điều kiện tài xế hợp lệ**
- Thuộc công ty khách hàng đã chọn (`DriverCompanyRegistration.status = ACTIVE`)
- `Driver.onlineStatus = ONLINE`
- Tài khoản không bị ban (`User.status = ACTIVE`)
- Điểm uy tín ≥ 3.0 hoặc null (chưa có đánh giá)

### **Thuật toán tìm tài xế tối ưu**
1. Lấy tất cả tài xế hợp lệ từ Redis (key: `driver:location:{driverId}`)
2. Tính khoảng cách từng tài xế đến điểm đón (Haversine formula)
3. Sắp xếp: khoảng cách tăng dần → điểm uy tín giảm dần (nếu khoảng cách bằng nhau)
4. Gửi thông báo cho tài xế #1 qua WebSocket

### **Xử lý từ chối / timeout**
- Tài xế không phản hồi trong **30 giây** → chuyển sang tài xế #2
- Tài xế từ chối → chuyển sang tài xế #2
- Hết danh sách → trả về khách: `"Không tìm được tài xế, vui lòng thử lại"`

### **First come first served (tài xế nhiều công ty)**
- Khi tài xế được match → ngay lập tức set `onlineStatus = BUSY` trong Redis
- Nếu 2 công ty gửi request đến tài xế gần như đồng thời → request đến sau nhận phản hồi `DRIVER_UNAVAILABLE`
- Hệ thống dùng **Redis distributed lock** (`SETNX`) để đảm bảo atomic

---

## **3. Hệ thống điểm uy tín**

### **Quy tắc tính điểm**
```
Tài xế mới: reputationScore = null (khác 0)

Khi nhận đánh giá đầu tiên:
  reputationScore = stars (của đánh giá đó)
  totalRatings = 1

Khi nhận đánh giá tiếp theo:
  reputationScore = (reputationScore × totalRatings + stars) / (totalRatings + 1)
  totalRatings = totalRatings + 1

Làm tròn: 1 chữ số thập phân (VD: 4.7)
```

### **Cộng điểm thưởng theo quý**
- Chạy **Scheduled Job** vào ngày đầu tiên mỗi quý (1/1, 1/4, 1/7, 1/10)
- Điều kiện: tài xế phải có ít nhất 1 chuyến đi trong quý vừa rồi
- Logic:
```
newScore = min(reputationScore + 0.1, 5.0)
```

### **Tạm hoãn tự động**
- Sau mỗi lần cập nhật điểm: nếu `reputationScore < 3.0` → set `User.status = SUSPENDED`
- Tài xế bị SUSPENDED không thể bật ONLINE

### **Kháng cáo**
- Tài xế hoặc công ty gửi `POST /api/appeals`
- Admin xem xét và quyết định:
  - `APPROVED` → set `User.status = ACTIVE`, tài xế có thể chạy lại
  - `REJECTED` → giữ nguyên SUSPENDED

---

## **4. Trạng thái chuyến đi (Ride State Machine)**

```
SEARCHING → MATCHED → DRIVER_ARRIVING → IN_PROGRESS → COMPLETED
     ↓           ↓            ↓               ↓
  CANCELLED   CANCELLED   CANCELLED       (không hủy được)
```

### **Quy tắc chuyển trạng thái**
| Từ | Sang | Ai trigger |
|---|---|---|
| SEARCHING | MATCHED | System (khi tài xế accept) |
| SEARCHING | CANCELLED | Customer / System (timeout) |
| MATCHED | DRIVER_ARRIVING | Driver |
| MATCHED | CANCELLED | Customer / Driver |
| DRIVER_ARRIVING | IN_PROGRESS | Driver (đã đón khách) |
| DRIVER_ARRIVING | CANCELLED | Customer / Driver |
| IN_PROGRESS | COMPLETED | Driver |

### **Khi chuyến COMPLETED**
1. Tính `finalPrice`, `platformFee`, `companyRevenue`, `driverRevenue`
2. Set `Driver.onlineStatus = ONLINE` (tài xế sẵn sàng nhận cuốc tiếp)
3. Cộng `companyRevenue` vào `CompanyWallet.balance`
4. Ghi `WalletTransaction` type = REVENUE
5. Mở khóa thanh toán cho khách
6. Mở khóa đánh giá cho khách

---

## **5. Onboarding công ty vận tải**

### **Flow**
```
Công ty đăng ký (PENDING)
    → Admin xem xét hồ sơ
    → APPROVED: công ty bắt đầu hoạt động
    → REJECTED: thông báo lý do
```

### **Điều kiện Admin duyệt**
- Giấy phép kinh doanh vận tải hợp lệ
- Thông tin công ty đầy đủ
- (Các điều kiện cụ thể do Admin tự quyết định)

---

## **6. Onboarding tài xế**

### **Flow đăng ký vào công ty**
```
Tài xế tạo tài khoản (ACTIVE)
    → Đăng ký công ty, nộp hồ sơ (PENDING)
    → Tài xế đến văn phòng ký hợp đồng lao động
    → Công ty phê duyệt (ACTIVE tại công ty đó)
    → Tài xế hoàn thiện profile
    → Tài xế có thể bật ONLINE
```

### **Tài xế đăng ký nhiều công ty**
- Mỗi công ty là 1 bản ghi `DriverCompanyRegistration` độc lập
- Trạng thái tại mỗi công ty độc lập nhau
- Tài xế bị ban bởi Admin → bị vô hiệu hóa toàn bộ, dù đang ACTIVE ở nhiều công ty

---

## **7. Realtime Location**

### **Lưu vị trí vào Redis**
```
Key: driver:location:{driverId}
Value: { "lat": 10.7769, "lng": 106.7009, "updatedAt": "..." }
TTL: 30 giây (nếu tài xế mất kết nối thì tự expire)
```

### **Tìm tài xế gần nhất**
- Dùng **Redis GEO** (`GEOADD`, `GEODIST`, `GEORADIUS`) để query tài xế trong bán kính X km
- Nếu không có tài xế trong bán kính → mở rộng bán kính dần (5km → 10km → 15km)

### **Relay vị trí cho khách**
```
Tài xế gửi → /app/location/{rideId}
Backend lưu Redis + broadcast → /topic/ride/{rideId}/location
Khách subscribe → nhận tọa độ → cập nhật marker Leaflet
```

---

## **8. Scheduled Jobs**

| Job | Lịch chạy | Mô tả |
|-----|-----------|-------|
| `QuarterlyReputationBonus` | 0 0 1 1,4,7,10 * | Cộng 0.1 điểm uy tín cho tài xế đủ điều kiện |
| `DriverLocationCleanup` | Mỗi 1 phút | Xóa Redis key tài xế không ping trong 30 giây, set OFFLINE |
| `SuspendLowRatingDrivers` | Sau mỗi lần update điểm | Tự động SUSPENDED nếu điểm < 3.0 |