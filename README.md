# 🕒 TimeKeeper - Ứng Dụng Quản Lý Chấm Công & Thu Nhập Cá Nhân

**TimeKeeper** là một Progressive Web App (PWA) hiện đại, gọn nhẹ và tối ưu hóa trải nghiệm người dùng, giúp nhân viên làm ca, shipper, và những người làm việc tự do (freelancer) dễ dàng theo dõi thời gian làm việc, tính toán lương tự động và quản lý tài chính cá nhân theo thời gian thực. 

Ứng dụng sở hữu giao diện **Glassmorphism (kính mờ)** thời thượng, các hiệu ứng chuyển động mượt mà cùng hệ thống lưu trữ offline an toàn tuyệt đối.

---

## 🌟 Các Tính Năng Nổi Bật & Chi Tiết Nghiệp Vụ

### 1. Quản Lý Ca Làm Việc Linh Hoạt (Real-time & Manual)
*   **Chấm công thời gian thực (Real-time Clock-In/Out):**
    *   **Ca cố định (Fixed Shifts):** Định sẵn các ca tiêu chuẩn như Ca sáng, Ca chiều, Ca tối, Cả ngày, Bán thời gian. Hệ thống tự động quét thời gian hiện tại của thiết bị để gợi ý ca làm việc phù hợp nhất.
    *   **Ca tự do (Freestyle Shift):** Dành cho những ngày làm tăng ca hoặc khung giờ không cố định, cho phép ghi nhận thời gian linh hoạt.
    *   **Thanh tiến độ trực quan (Shift Progress Bar):** Hiển thị phần trăm thời gian đã trôi qua, hiển thị thời gian còn lại đến khi hết ca hoặc thời gian tăng ca (overtime) trực quan.
    *   **Thu nhập động:** Tiền lương tích lũy tăng dần theo thời gian thực trực tiếp trên màn hình chính dựa trên mức lương giờ được cấu hình.
*   **Chấm công thủ công linh hoạt (Manual Timekeeping):**
    *   **Chấm công bù (Past Shifts):** Bổ sung ca làm quên chưa chấm trong quá khứ.
    *   **Chấm công trước (Future Shifts):** Lên lịch trình làm việc trước cho các ngày tiếp theo.
    *   **Tùy chỉnh linh hoạt:** Tự do điều chỉnh ngày làm việc, giờ vào/ra và mức lương giờ riêng biệt cho từng ca thủ công.

### 2. Người Đồng Hành Ấm Áp (Companion Welcome System)
*   **Lời chào động:** Tích hợp hệ thống hàng chục lời thoại chào mừng ngẫu nhiên đầy năng lượng và ấm áp được chia theo 4 buổi trong ngày (Sáng, Trưa, Chiều, Tối) ngay khi người dùng nhấn "Vào Ca".
*   **Động lực khi ra ca:** Hiển thị những lời chúc ngủ ngon, lời khích lệ nghỉ ngơi xả hơi sau một ngày làm việc vất vả khi người dùng nhấn "Ra Ca".

### 3. Hệ Thống Đánh Giá Chất Lượng Ca Làm (Gamified Tick System)
*   Khuyến khích hiệu suất làm việc thông qua cơ chế tích lũy điểm thưởng/phạt:
    *   **Tick Tốt (Good Tick 👍):** Nhận được khi hoàn thành tốt công việc. Tích lũy đủ **3 Tick Tốt** liên tiếp sẽ tự động nhận thêm phần thưởng **100.000 ₫**.
    *   **Tick Xấu (Bad Tick 👎):** Bị đánh dấu khi đi muộn hoặc làm sai sót. Nhận đủ **3 Tick Xấu** sẽ bị trừ phạt **100.000 ₫** vào quỹ thu nhập.
    *   Mỗi lượt tick đều cho phép lưu lại **ghi chú lý do** cụ thể để đối chiếu sau này.

### 4. Ghi Nhận Thu Nhập Thêm (Bonus Tracking System)
*   **Preset tiện lợi:** Ghi nhận nhanh các khoản thưởng ngoài ca làm (ví dụ: thưởng doanh số, tiền ship nước, thưởng hỗ trợ cửa hàng...) chỉ bằng 1 chạm.
*   **Cấu hình linh hoạt:** Người dùng có thể tự do thêm mới, sửa tên, đổi emoji hoặc xóa các nút preset thưởng trực tiếp trong trang Cài đặt.
*   Hỗ trợ ghi kèm chú thích chi tiết cho từng khoản thưởng thêm để quản lý chi phí minh bạch.

### 5. Thống Kê Trực Quan & Lịch Sử Thông Minh
*   **Lịch sử gộp theo ngày:** Nhóm toàn bộ dữ liệu chấm công, thưởng thêm và đánh giá Tick của từng ngày vào một thẻ (card) duy nhất, giúp giao diện gọn gàng và dễ theo dõi.
*   **Bộ lọc lịch sử đa năng:** Lọc dữ liệu theo Tuần này, Tháng này, Tháng trước hoặc Tất cả thời gian. Hỗ trợ chuyển đổi nhanh các tab phân loại (Tất cả, Ca làm, Thưởng thêm, Tick).
*   **Biểu đồ thu nhập Canvas:** Biểu đồ cột tự động vẽ trên HTML5 Canvas hiển thị xu hướng thu nhập dao động trực quan theo tuần, tháng hoặc năm.
*   **Báo cáo averages:** Tự động tính toán tổng giờ làm, số ca, tiền thưởng phát sinh, mức thu nhập trung bình mỗi ngày và trung bình mỗi ca làm việc.

---

## 🛠️ Công Nghệ Phát Triển & Kiến Trúc Thiết Kế

Ứng dụng hướng tới hiệu năng cực hạn và độ nhẹ tối đa bằng cách sử dụng công nghệ web thuần túy (**Vanilla Stack**) không phụ thuộc thư viện nặng nề:

*   **HTML5 Semantic:** Cấu trúc giao diện chuẩn SEO và dễ dàng mở rộng.
*   **Vanilla CSS3 & Modern UI/UX:**
    *   Thiết kế theo xu hướng **Glassmorphism** sang trọng với các lớp nền kính mờ mịt, viền trong suốt và các đốm sáng chuyển động chậm (Animated Background Orbs) phía sau.
    *   Sử dụng CSS Variables giúp quản lý đồng bộ bảng màu tối (Dark Mode) dựa trên hệ màu HSL mượt mà.
    *   Các micro-animations như hiệu ứng sóng gợn (Ripple effect) khi nhấn nút, các hiệu ứng trượt màn hình nhẹ nhàng mang lại cảm giác ứng dụng cao cấp.
*   **Vanilla JavaScript (ES6+):** Xử lý logic tính toán thời gian, quản lý trạng thái ứng dụng (state management) và thao tác DOM trực tiếp.
*   **HTML5 LocalStorage (Offline-First):** Lưu trữ toàn bộ dữ liệu trực tiếp trên thiết bị của người dùng. Không cần máy chủ, đảm bảo tốc độ phản hồi tức thì và sự riêng tư tuyệt đối cho dữ liệu của bạn.
*   **Service Worker (PWA):** Cho phép ứng dụng tải tài nguyên offline, gửi thông báo đẩy tại trình duyệt (Welcome & Summary) và cài đặt trực tiếp lên điện thoại dưới dạng ứng dụng độc lập (standalone application).

---

## 🚀 Hướng Dẫn Khởi Chạy Cục Bộ (Local Development)

### Cách 1: Sử dụng Extension "Live Server" trên VS Code (Khuyên dùng)
1.  Tải mã nguồn dự án về máy tính.
2.  Mở thư mục dự án bằng **Visual Studio Code**.
3.  Cài đặt extension **Live Server** (do Ritwick Dey phát triển).
4.  Nhấp chuột phải vào file [index.html](file:///d:/Code/University/CS462/TimeKeeper/index.html) và chọn **Open with Live Server** (hoặc nhấn nút **Go Live** ở thanh trạng thái bên dưới).
5.  Ứng dụng sẽ chạy tại địa chỉ mặc định: `http://127.0.0.1:5500`

### Cách 2: Sử dụng NodeJS để chạy Local Server
Nếu máy tính của bạn đã cài đặt Node.js, bạn có thể chạy máy chủ cục bộ bằng cách mở Terminal tại thư mục dự án và gõ lệnh:
```bash
npx http-server -p 8080
```
Sau đó, truy cập ứng dụng trên trình duyệt qua địa chỉ: `http://127.0.0.1:8080`

---

## 🌐 Hướng Dẫn Triển Khai Lên Vercel (Hosting Miễn Phí)

Vì đây là ứng dụng tĩnh (Static Web App), bạn có thể đưa ứng dụng lên **Vercel** miễn phí để truy cập nhanh trên điện thoại mọi lúc mọi nơi:

1.  Đẩy mã nguồn dự án lên một kho lưu trữ Git trực tuyến (ví dụ: **GitHub**).
2.  Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard).
3.  Bấm nút **Add New** -> **Project**.
4.  Liên kết với tài khoản GitHub của bạn và chọn kho lưu trữ chứa dự án này.
5.  Giữ nguyên các thiết lập mặc định và nhấn **Deploy**.
6.  Sau vài giây, bạn sẽ nhận được một tên miền dạng `https://ten-du-an.vercel.app` để sử dụng trực tiếp trên điện thoại.

> [!NOTE]
> Do ứng dụng sử dụng bộ nhớ `LocalStorage` trên trình duyệt thiết bị, dữ liệu sẽ được lưu riêng trên từng thiết bị (không tự động đồng bộ giữa điện thoại và máy tính). Hãy sử dụng cố định một thiết bị hoặc trình duyệt để lưu giữ lịch sử chấm công liên tục.

---

*Chúc bạn quản lý thời gian làm việc và tối ưu hóa thu nhập hiệu quả cùng TimeKeeper!*
