# Đất Mũi Grab - Idea Overview

---

## **1. Mô hình platform**

### **Tổng quan**
- Đất Mũi Grab là **nền tảng trung gian** kết nối nhiều công ty vận tải với khách hàng
- Mỗi công ty vận tải hoạt động **độc lập**, có tài xế riêng, không chia sẻ tài xế với công ty khác
- Khách hàng có quyền **lựa chọn công ty** trước khi đặt xe
- Hệ thống thu **5% phí sàn** trên mỗi chuyến đi

### **Các bên tham gia**
- **Platform (Đất Mũi Grab):** Cung cấp hạ tầng, thu phí sàn, quản lý vận hành
- **Công ty vận tải:** Đăng ký vào platform, quản lý tài xế, tự quyết định giá cước và tỉ lệ chia doanh thu
- **Tài xế:** Đăng ký dưới ít nhất 1 công ty, nhận cuốc xe, có thể thuộc nhiều công ty
- **Khách hàng:** Chọn công ty, đặt xe, theo dõi realtime, đánh giá tài xế

---

## **2. Luồng đặt xe (Booking Flow)**

1. Khách hàng nhập **điểm đi** và **điểm đến**
2. Hệ thống tính quãng đường (OSRM API)
3. Hiển thị **danh sách công ty vận tải** kèm giá ước tính của từng công ty
4. Khách hàng **chọn công ty** ưa thích
5. Hệ thống tìm **tài xế tối ưu** thuộc công ty đó (gần nhất, đang online)
6. Tài xế nhận thông báo — **chấp nhận hoặc từ chối**
7. Nếu từ chối → hệ thống tìm tài xế tiếp theo
8. Khi tài xế chấp nhận → trạng thái tài xế chuyển thành **BUSY** (ẩn khỏi tất cả công ty)
9. Khách hàng **theo dõi tài xế realtime** trên bản đồ
10. Hoàn thành chuyến → khách **thanh toán và đánh giá**

---

## **3. Quản lý tài xế**

### **Trạng thái tài xế**
- **OFFLINE:** Không sẵn sàng nhận cuốc
- **ONLINE:** Sẵn sàng, hiển thị cho tất cả công ty đã đăng ký
- **BUSY:** Đang thực hiện chuyến đi, ẩn khỏi hệ thống matching

### **Tài xế đăng ký nhiều công ty**
- 1 tài xế có thể đăng ký ≥ 1 công ty vận tải
- Khi **ONLINE** → hiển thị cho tất cả các công ty đã được duyệt
- Khi được match với khách → trạng thái chuyển **BUSY** ngay lập tức
- Cơ chế **first come first served** — công ty nào match trước thì tài xế chạy cho công ty đó

### **Flow onboarding tài xế**
1. Tài xế tạo tài khoản
2. Chọn công ty vận tải muốn đăng ký
3. Điền thông tin: CMND/CCCD, bằng lái xe, thông tin xe, **số điện thoại (bắt buộc)**
4. Trạng thái **PENDING** — chờ công ty phê duyệt
5. Tài xế tới văn phòng ký hợp đồng lao động với công ty
6. Công ty phê duyệt → tài khoản tài xế **ACTIVE** tại công ty đó
7. Hoàn thiện hồ sơ cá nhân

---

## **4. Hệ thống giá cước**

### **Công thức tính giá**
```
Nếu quãng đường X ≤ 2km:
  price = giá_per_km × 2

Nếu quãng đường X > 2km:
  price = giá_per_km × X

Giá hiển thị với khách = price × 1.05
```

### **Phí sàn**
- Platform thu **5% cố định** trên giá hiển thị với khách
- Ví dụ: khách trả 20.000đ → Platform nhận 1.000đ → Công ty + Tài xế nhận 19.000đ

### **Chia doanh thu nội bộ (Công ty quyết định)**
- Tỉ lệ chia giữa công ty vận tải và tài xế do **công ty tự thiết lập**
- Tổng = 100% của phần 95% còn lại sau phí sàn

### **Điều chỉnh giá realtime**
- Công ty có thể thay đổi `giá_per_km` bất kỳ lúc nào
- Giá áp dụng cho khách là **giá tại thời điểm đặt xe** (khóa giá khi confirm)

---

## **5. Hệ thống điểm uy tín tài xế**

### **Điểm khởi đầu**
- Tài xế mới: điểm = **null** (chưa có đánh giá)
- Khác hoàn toàn với 0 điểm

### **Cách tính điểm**
- Khách hàng đánh giá sau mỗi chuyến: **1–5 sao**
- Điểm uy tín = **trung bình cộng** tất cả đánh giá
- Ví dụ: tài xế có 4.8 điểm, nhận thêm 1 đánh giá 4 sao → tính lại trung bình

### **Cộng điểm thưởng**
- Sau mỗi **quý hoạt động** (3 tháng): cộng thêm **0.1 điểm** vào điểm hiện tại
- Tối đa 5.0 điểm (không vượt quá 5.0)

### **Tạm hoãn tài khoản**
- Tài xế có điểm uy tín **< 3.0** → tự động tạm hoãn tài khoản
- Tài xế hoặc công ty vận tải có thể **kháng cáo** lên Admin
- Admin xem xét và quyết định mở lại hoặc giữ nguyên

---

## **6. Matching tài xế**

### **Tiêu chí tìm tài xế tối ưu**
- Tài xế phải thuộc công ty khách hàng đã chọn
- Trạng thái **ONLINE** (không BUSY, không OFFLINE)
- **Gần nhất** với điểm đón của khách (tính theo khoảng cách thực tế)
- Ưu tiên tài xế có **điểm uy tín cao hơn** nếu khoảng cách tương đương

### **Xử lý từ chối**
- Tài xế từ chối → hệ thống chuyển sang tài xế tiếp theo trong danh sách
- Nếu không có tài xế nào → thông báo khách hàng thử lại sau

### **Timeout**
- Tài xế không phản hồi trong **X giây** → tự động chuyển sang tài xế tiếp theo

---

## **7. Realtime & Bản đồ**

### **Công nghệ**
- **WebSocket (STOMP)** cho realtime location
- **Leaflet.js + OpenStreetMap** cho hiển thị bản đồ (miễn phí)
- **OSRM API** cho tính toán lộ trình và quãng đường

### **Luồng realtime**
- Tài xế gửi tọa độ GPS mỗi 3 giây qua WebSocket
- Backend lưu vị trí vào **Redis** (tìm tài xế gần nhất)
- Backend relay tọa độ tới khách hàng đang theo dõi chuyến
- Frontend cập nhật marker tài xế mượt mà trên bản đồ

---

## **8. Chat & Liên hệ**

### **Chat trong chuyến**
- Khách và tài xế có thể nhắn tin realtime qua WebSocket (STOMP)
- Chat chỉ khả dụng khi chuyến đang diễn ra

### **Liên hệ qua điện thoại**
- Số điện thoại tài xế hiển thị với khách sau khi match thành công
- Tài xế bắt buộc đăng ký số điện thoại khi onboarding

---

## **9. Thanh toán**

### **Payment Gateway**
- VNPay
- Momo
- ZaloPay

### **Trạng thái thanh toán**
- **PENDING**
- **SUCCESS**
- **FAILED**

### **Dòng tiền**
- Khách thanh toán → Platform nhận toàn bộ
- Platform giữ lại 5% phí sàn
- 95% còn lại chuyển vào ví công ty vận tải
- Công ty tự chia cho tài xế theo tỉ lệ đã cấu hình

---

## **10. Quản lý công ty vận tải**

### **Onboarding công ty**
- Công ty đăng ký tài khoản trên platform
- Cung cấp thông tin pháp lý, giấy phép kinh doanh vận tải
- Admin xem xét và phê duyệt
- Sau khi được duyệt → thiết lập giá cước, tỉ lệ chia doanh thu, bắt đầu tuyển tài xế

### **Độc lập hoạt động**
- Mỗi công ty có **pool tài xế riêng**
- Công ty A không thể thấy hay dùng tài xế của công ty B
- Khách hàng thấy tất cả công ty nhưng chỉ được match với tài xế của công ty mình chọn

---

## **11. Báo cáo & Thống kê**

### **Công ty vận tải**
- Doanh thu theo ngày / tuần / tháng
- Số chuyến đi hoàn thành / hủy
- Thống kê tài xế (số lượng, điểm uy tín trung bình, hoạt động)
- Thu nhập từng tài xế

### **Admin platform**
- Tổng doanh thu platform (5% phí sàn)
- Số công ty vận tải đang hoạt động
- Số tài xế toàn hệ thống
- Số chuyến đi toàn hệ thống
- Báo cáo vi phạm, kháng cáo