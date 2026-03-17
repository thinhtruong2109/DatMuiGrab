# Actors - Đất Mũi Grab

---

## **1. Guest (Khách vãng lai)**

### **Quyền hạn**
- Xem danh sách công ty vận tải đang hoạt động
- Xem giá cước của từng công ty vận tải
- Tìm kiếm và xem thông tin công ty vận tải

### **Giới hạn**
- Không thể đặt xe (bắt buộc đăng ký / đăng nhập)

---

## **2. Customer (Khách hàng đã đăng ký)**

### **Bao gồm tất cả quyền của Guest**

### **Chức năng đặt xe**
- Nhập điểm đi / điểm đến
- Xem giá ước tính theo từng công ty vận tải
- Chọn công ty vận tải ưa thích
- Xác nhận đặt xe — hệ thống tự động matching tài xế của công ty đó
- Theo dõi vị trí tài xế realtime trên bản đồ
- Chat với tài xế trong chuyến đi
- Xem số điện thoại tài xế để liên hệ trực tiếp
- Thanh toán sau khi hoàn thành chuyến

### **Sau chuyến đi**
- Đánh giá tài xế (1–5 sao)
- Xem lịch sử chuyến đi
- Xem chi tiết hóa đơn từng chuyến

### **Quản lý tài khoản**
- Quản lý thông tin cá nhân
- Đổi mật khẩu

---

## **3. Driver (Tài xế)**

### **Đăng ký & Onboarding**
- Tạo tài khoản tài xế
- Đăng ký tham gia ít nhất 1 công ty vận tải (có thể đăng ký nhiều công ty)
- Cung cấp thông tin cá nhân khi đăng ký công ty: CMND/CCCD, bằng lái xe, thông tin phương tiện, số điện thoại (bắt buộc)
- Chờ công ty vận tải phê duyệt (trạng thái **PENDING**)
- Sau khi được phê duyệt → hoàn thiện hồ sơ cá nhân

### **Vận hành hàng ngày**
- Bật / tắt trạng thái online (sẵn sàng nhận cuốc)
- Khi online → hiển thị cho tất cả các công ty mà tài xế đã được duyệt
- Nhận yêu cầu đặt xe theo cơ chế **first come first served**
- Xem thông tin chuyến đi (điểm đón, điểm đến, giá cước)
- Chấp nhận / từ chối chuyến đi
- Chat với khách hàng trong chuyến đi
- Cập nhật trạng thái chuyến: đang đến đón / đã đón khách / hoàn thành

### **Quản lý tài khoản**
- Xem điểm uy tín cá nhân
- Xem lịch sử chuyến đi và thu nhập
- Kháng cáo khi bị tạm hoãn tài khoản
- Quản lý thông tin cá nhân, phương tiện

---

## **4. Transport Company (Công ty vận tải)**

### **Onboarding**
- Đăng ký tài khoản công ty vận tải trên platform
- Chờ Admin hệ thống phê duyệt (trạng thái **PENDING**)
- Sau khi được Admin duyệt → bắt đầu thiết lập hệ thống

### **Quản lý tài xế**
- Xem danh sách tài xế đang chờ phê duyệt (**PENDING**)
- Phê duyệt / từ chối tài xế đăng ký chạy cho công ty
- Xem danh sách tài xế đang hoạt động
- Xem thông tin chi tiết từng tài xế (hồ sơ, điểm uy tín, lịch sử)

### **Quản lý giá cước**
- Thiết lập `giá_per_km` — có thể thay đổi realtime
- Công thức giá tự động:
  - Nếu quãng đường ≤ 2km: `price = giá_per_km × 2`
  - Nếu quãng đường > 2km: `price = giá_per_km × quãng_đường`
  - Phí hiển thị với khách = `price × 1.05` (đã bao gồm 5% phí sàn)
- Thiết lập tỉ lệ chia doanh thu giữa công ty và tài xế (tổng = 100% của 95% sau khi trừ phí sàn)

### **Quản lý kinh doanh**
- Xem báo cáo doanh thu theo ngày / tuần / tháng
- Xem thống kê số chuyến đi
- Xem danh sách và chi tiết từng chuyến đi của công ty
- Xem thu nhập tài xế

---

## **5. Admin (Quản trị viên hệ thống)**

### **Quyền cao nhất trong hệ thống**

### **Quản lý công ty vận tải**
- Xem danh sách công ty đang chờ phê duyệt
- Phê duyệt / từ chối công ty vận tải tham gia platform
- Tạm hoãn / kích hoạt lại tài khoản công ty
- Xem toàn bộ thông tin hoạt động của từng công ty

### **Quản lý tài xế**
- Ban tài xế trực tiếp (không cần thông qua công ty) khi có báo cáo vi phạm
- Xem xét và xử lý kháng cáo từ tài xế hoặc công ty vận tải
- Mở lại tài khoản tài xế bị tạm hoãn sau khi xem xét kháng cáo

### **Quản lý khách hàng**
- Xem danh sách toàn bộ khách hàng
- Ban / unban tài khoản khách hàng

### **Quản lý hệ thống**
- Cấu hình phí sàn (hiện tại cố định 5%)
- Xem toàn bộ báo cáo, thống kê doanh thu platform
- Xử lý tranh chấp, khiếu nại
- Quản lý nội dung hệ thống