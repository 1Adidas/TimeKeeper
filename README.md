# 🕒 Ứng Dụng Quản Lý Chấm Công và Thu Nhập Cá Nhân (Timekeeping App v2)

Một ứng dụng web gọn nhẹ, trực quan và hiện đại giúp người dùng quản lý ca làm việc, tính toán lương tự động, theo dõi các khoản thưởng/phạt và quản lý tài chính cá nhân theo thời gian thực.

---

## 🌟 Công Dụng và Tính Năng Nổi Bật

Ứng dụng được thiết kế nhằm giúp người dùng cá nhân (đặc biệt là nhân viên làm ca, shipper, nhân viên bán thời gian) dễ dàng kiểm soát thời gian làm việc và nguồn thu nhập của mình:

### 1. Quản Lý Ca Làm Việc Linh Hoạt
*   **Ca Làm Định Sẵn (Fixed Shifts):** Hỗ trợ các ca làm chuẩn (Ví dụ: Ca Sáng `6:00 -> 12:00`, Ca Chiều `12:00 -> 18:00`, Ca Tối `18:00 -> 24:00`). Tự động kiểm tra thời gian thực tế để hiển thị ca làm phù hợp.
*   **Vào Ca Tự Do (Freestyle Shift):** Cho phép người dùng linh hoạt tự nhập giờ bắt đầu và kết thúc khi làm việc ngoài giờ hoặc ca không cố định.

### 2. Tính Lương Tự Động & Chính Xác
*   Tự động tính toán số giờ làm việc thực tế và quy đổi ra thành tiền dựa trên cấu hình lương theo giờ.
*   Cập nhật thu nhập tức thì ngay khi kết thúc ca làm.

### 3. Hệ Thống Thưởng / Phạt & Quản Lý Chi Tiêu
*   **Thu nhập thêm / Thưởng:** Ghi nhận tiền thưởng từ các hoạt động như ship nước, doanh số, hỗ trợ... kèm ngày giờ và nội dung chi tiết.
*   **Chi tiêu / Mua sắm tại chỗ:** Ghi lại các chi phí phát sinh khi làm việc (ví dụ: mua bánh mì, nước uống) để trừ trực tiếp vào tổng thu nhập.

### 4. Hệ Thống Đánh Giá Tích Cực (Tick System)
*   Cho phép đánh giá chất lượng ca làm việc bằng hệ thống Tick:
    *   **Tick Tốt (Good Tick ✅):** Tích lũy đủ **3 lần liên tiếp** sẽ nhận thêm phần thưởng đặc biệt trị giá **100.000đ**.
    *   **Tick Xấu (Bad Tick ❌):** Bị đánh dấu **3 lần** sẽ bị trừ phạt **100.000đ**.
*   Hiển thị tiến trình (milestones) trực quan giúp người dùng theo dõi và cố gắng trong công việc.

### 5. Thống Kê & Lịch Sử Chi Tiết
*   **Lịch sử gộp thông minh:** Nhóm toàn bộ ca làm, khoản thưởng, chi phí mua sắm và các đánh giá Tick theo từng ngày cụ thể để dễ dàng quản lý.
*   **Bộ lọc & Thống kê:** Xem chi tiết thu nhập, tiền thưởng thêm, tiền chi tiêu và tổng thu nhập thực tế theo ngày, tuần, hoặc tháng.
*   **Tính năng thu gọn/mở rộng:** Giúp giao diện lịch sử gọn gàng, có thể xem nhanh hoặc mở rộng để xem chi tiết từng giao dịch.

---

## 🛠️ Công Nghệ Sử Dụng

Dự án được xây dựng hoàn toàn bằng các công nghệ web cơ bản, tối ưu hóa hiệu năng và không phụ thuộc vào thư viện bên ngoài phức tạp:

*   **HTML5:** Định trúc giao diện ngữ nghĩa (Semantic HTML), đảm bảo SEO và cấu trúc trang rõ ràng.
*   **CSS3 (Vanilla CSS):**
    *   Sử dụng CSS Variables để quản lý hệ thống màu sắc đồng bộ (Dark mode & Modern HSL colors).
    *   Bố cục linh hoạt với CSS Flexbox & CSS Grid giúp hiển thị responsive tốt trên cả điện thoại di động và máy tính.
    *   Hiệu ứng chuyển động (transition & keyframe animation) mượt mà cho các nút bấm và hộp thoại.
*   **JavaScript (ES6+):** Xử lý logic nghiệp vụ, tính toán thời gian, quản lý trạng thái ứng dụng (state management) và tương tác DOM trực tiếp.
*   **HTML5 LocalStorage:** Lưu trữ toàn bộ dữ liệu ca làm, lương, lịch sử và cấu hình trực tiếp trên trình duyệt của người dùng. Không cần kết nối cơ sở dữ liệu server, đảm bảo tính riêng tư tuyệt đối cho dữ liệu cá nhân.

---

## 🚀 Hướng Dẫn Sử Dụng & Chạy Cục Bộ (Local)

Vì dự án sử dụng Vanilla HTML/JS nên việc khởi chạy cực kỳ đơn giản và nhanh chóng.

### Cách 1: Sử dụng Extension "Live Server" trên VS Code (Khuyên dùng)
1. Tải toàn bộ mã nguồn của dự án về máy tính của bạn.
2. Mở thư mục dự án bằng trình soạn thảo **Visual Studio Code**.
3. Cài đặt tiện ích mở rộng (Extension) **Live Server** (của tác giả Ritwick Dey).
4. Click chuột phải vào file `index.html` và chọn **Open with Live Server** (hoặc nhấn nút `Go Live` ở góc dưới cùng bên phải VS Code).
5. Ứng dụng sẽ tự động mở trên trình duyệt tại địa chỉ mặc định `http://127.0.0.1:5500`.

### Cách 2: Sử dụng HTTP Server chạy bằng Node.js / npm
Nếu bạn đã cài đặt Node.js trên máy, bạn có thể khởi chạy server cục bộ bằng cách mở terminal tại thư mục dự án và chạy lệnh:
```bash
npx http-server -p 8081
```
Sau đó truy cập trình duyệt theo địa chỉ: `http://127.0.0.1:8081`

### Các bước thao tác cơ bản trên ứng dụng:
1.  **Thiết lập lương:** Nhập số tiền lương mỗi giờ của bạn tại phần cài đặt cấu hình ban đầu.
2.  **Vào ca:** 
    *   Chọn ca tương ứng với khung giờ hiện tại hoặc bấm **Mở rộng** để hiển thị các ca khác. Nhấn **Vào ca**.
    *   Nếu làm ca ngoài giờ, chọn mục **Ca tự do**, nhập giờ bắt đầu/kết thúc và bấm **Vào ca**.
3.  **Hết ca:** Khi hoàn thành công việc, bấm **Hết ca** để hệ thống tự động cộng tiền và lưu vào lịch sử.
4.  **Thêm Thưởng/Chi Tiêu:** Sử dụng biểu mẫu nhập để ghi nhận phần thưởng (như ship nước, thưởng doanh số...) hoặc chi tiêu cá nhân (như mua bánh mì) trong ngày.
5.  **Theo dõi tiến độ:** Tích chọn chất lượng ca làm (Tốt/Xấu) để tích lũy cột mốc nhận thưởng 100.000đ.
6.  **Xem báo cáo:** Chuyển qua tab **Lịch sử** & **Thống kê** để xem chi tiết tình hình tài chính của bạn.

---

*Chúc bạn quản lý thời gian và tài chính hiệu quả với ứng dụng này!*
