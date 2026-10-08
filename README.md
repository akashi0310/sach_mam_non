# 🌸 Kho Học Liệu Mầm Non - Landing Page & Hệ Thống Phân Quyền Supabase

Dự án Landing Page và Nền tảng học liệu giáo dục mầm non chất lượng cao, kết hợp thẩm mỹ từ bản thiết kế mẫu và kiến trúc tương tác từ **[Education.com](https://www.education.com/)**, tích hợp hệ thống phân quyền vai trò người dùng đa tầng với **Supabase (RBAC - Role-Based Access Control)**.

**🌐 Website trực tuyến (Netlify):** [https://sach-mam-non.netlify.app/](https://sach-mam-non.netlify.app/)

---

## 🌟 1. Điểm nổi bật & Tính năng chính

### 🎨 Giao diện & Trải nghiệm người dùng (UI/UX)
- **Hero Banner sinh động:** Nhân vật bé mầm non dễ thương vẽ tranh mặt trời rực rỡ, khẩu hiệu *"Đa dạng – Sinh động – Dễ sử dụng"*, số liệu ấn tượng (+35.000 học liệu, 5.0⭐ đánh giá).
- **4 Trụ cột cam kết giá trị:** Thiết kế bởi họa sĩ mầm non, Phù hợp lứa tuổi, Dễ in ấn A4, Cập nhật thường xuyên.
- **6 Danh mục học liệu trực quan:** Tạo hình (Tô màu - Vẽ), Làm quen toán (123), Làm quen chữ cái (ABC), Thế giới xung quanh, Kỹ năng sống, Bộ chủ đề tổng hợp.
- **Bộ học liệu nổi bật:** Gói Tạo hình (3-4 tuổi), Gói Toán mầm non (4-5 tuổi), Bộ chủ đề động vật (3-5 tuổi), Bé khám phá thế giới (4-5 tuổi).
- **Thư viện Worksheet & Bộ lọc thông minh:** Lọc theo độ tuổi (2-3, 3-4, 4-5, 5-6, tiền tiểu học), chủ đề (động vật, thực vật, giao thông...), định dạng file, sắp xếp theo giá và độ phổ biến.

### 🖼️ Chi tiết học liệu chuẩn mẫu ("Vẽ bạn gấu Misa")
- Xem trước nhiều trang với thanh điều hướng ảnh (trang nét vẽ, trang hướng dẫn hình tròn - vuông - tam giác, trang màu mẫu).
- Đầy đủ thông số sư phạm: Độ tuổi, số trang, định dạng PDF chất lượng in, điểm đánh giá 5.0 (12 đánh giá).
- Nút tác vụ: **Thêm vào giỏ hàng**, **Mua ngay**, **Tải file PDF gốc bản quyền**, hoặc **Tải bản mẫu miễn phí**.

### 🛒 Giỏ hàng & Thanh toán thông minh (Cart & Checkout)
- Quản lý giỏ hàng trực tiếp: Thêm bớt số lượng (`- 1 +`), xóa học liệu.
- Hỗ trợ mã giảm giá Voucher:
  - Nhập `MAMNON2026`: Giảm ngay **20%**
  - Nhập `GIAOVIEN`: Giảm ngay **50%**
- Mô phỏng thanh toán quét mã **VietQR** tự động tạo mã QR theo số tiền đơn hàng và hoàn tất tức thì.
- Gợi ý sản phẩm liên quan: *"Bạn có thể thích thêm"*.

### 🚀 Mô hình tương tác chuẩn Education.com
1. **Trò chơi giáo dục tương tác (Interactive Mini-Game):** Trò chơi nhận biết hình khối (hình tròn, hình vuông, tam giác) cùng bạn gấu Misa, có âm thanh và hiệu ứng pháo hoa khi bé chọn đúng.
2. **Công cụ tự tạo bài tập (Worksheet Generator):** Nhập tên riêng của bé, chọn dạng bài tập (đếm quả táo, nối hình, luyện nét chữ O-Ô-Ơ) và bấm nút **In ra giấy A4** trực tiếp trên trình duyệt.
3. **Kho Kế hoạch bài dạy STEAM (Lesson Plans):** Dành riêng cho giáo viên mầm non với phương pháp 5E chuẩn Bộ GD&ĐT.
4. **Bảng giá thành viên (Pricing Plans):** Gói Miễn phí, Gói Phụ Huynh Pro và Gói Giáo Viên & Trường học.

---

## 🛡️ 2. Hệ thống Quản lý Phân quyền Supabase (RBAC)

Dự án được thiết kế chuẩn kiến trúc **Supabase Row-Level Security (RLS)** và quản trị vai trò linh hoạt:

### 👑 Các vai trò trong hệ thống (Roles Matrix):
| Vai trò | Mã Role | Quyền hạn chính |
| :--- | :--- | :--- |
| **Khách vãng lai** | `guest` | Xem danh mục, xem trước trang có watermark, tải tối đa 3 tài liệu miễn phí/tháng. |
| **Phụ huynh Pro** | `parent` | Tải không giới hạn mọi Worksheet PDF vector, sử dụng công cụ tạo bài tập, mua gói học liệu. |
| **Giáo viên mầm non** | `teacher` | Tải không giới hạn, truy cập trọn bộ **Giáo án STEAM 5E**, cấp quyền in ấn cho lớp học. |
| **Quản trị viên** | `admin` | Toàn quyền hệ thống: Thêm/Sửa/Xóa học liệu, cấp/hạ quyền người dùng, xem thống kê & mã giảm giá. |

### ⚡ Thanh công cụ thử nghiệm vai trò tức thì (Top RBAC Bar)
Trên cùng trang web có sẵn thanh điều khiển để bạn trải nghiệm ngay mọi vai trò:
- Bấm `👑 Admin`: Chuyển ngay sang tài khoản Quản trị viên, mở nút **🛡️ Quản lý Quyền**.
- Bấm `👩‍🏫 Giáo Viên`: Trải nghiệm tài khoản giáo viên với quyền tải giáo án và tài liệu không giới hạn.
- Bấm `💖 Phụ Huynh Pro`: Trải nghiệm tài khoản phụ huynh cao cấp.
- Bấm `👶 Khách`: Trải nghiệm tài khoản người dùng mới.
- Bấm `Supabase SQL`: Mở cửa sổ cấu hình dự án Supabase và sao chép mã nguồn cơ sở dữ liệu.

---

## 💻 3. Hướng dẫn cài đặt và khởi chạy dự án

### Yêu cầu hệ thống:
- Đã cài đặt **Node.js** (phiên bản 18+ trở lên).
- Trình duyệt hiện đại (Chrome, Edge, Firefox, Safari).

### Các bước khởi chạy:
```bash
# 1. Di chuyển vào thư mục dự án
cd "c:\Users\lapla\Desktop\codespace\bài con Mai"

# 2. Cài đặt các thư viện cần thiết
npm install

# 3. Chạy môi trường phát triển (Dev Server)
npm run dev
```

Mở trình duyệt và truy cập: **`http://localhost:5173/`**

### Lệnh đóng gói sản phẩm (Build Production):
```bash
npm run build
```
Thư mục xuất bản hoàn thiện sẽ nằm trong thư mục `dist/`.

---

## 🗄️ 4. Hướng dẫn kết nối cơ sở dữ liệu Supabase thật

Dự án đã tích hợp sẵn chế độ **Hybrid Mock Engine** hoạt động trơn tru ngay cả khi chưa kết nối Internet, đồng thời sẵn sàng 100% để kết nối với cơ sở dữ liệu Supabase trực tiếp của bạn:

### Bước 1: Tạo dự án trên Supabase
1. Truy cập [https://supabase.com](https://supabase.com) và tạo một Project mới (miễn phí).
2. Vào mục **SQL Editor** trong bảng điều khiển của Supabase.

### Bước 2: Thực thi script database
Mở file [schema.sql](file:///c:/Users/lapla/Desktop/codespace/bài con Mai/supabase/schema.sql) trong thư mục `supabase/` của dự án, sao chép toàn bộ nội dung và dán vào **SQL Editor** trên Supabase, sau đó nhấn **Run**.
Script này sẽ tự động:
- Tạo bảng `profiles`, `categories`, `materials`, `orders`, `order_items`, `permissions`, `role_permissions`.
- Kích hoạt **Row Level Security (RLS)** bảo mật dữ liệu.
- Thiết lập Trigger tự động tạo profile khi có người đăng ký tài khoản qua Supabase Auth.
- Nạp sẵn dữ liệu mẫu (Seed data).

### Bước 3: Điền URL và Anon Key
1. Trên giao diện website, bấm vào nút **Supabase SQL** trên thanh trên cùng (hoặc mở modal cài đặt).
2. Điền:
   - **SUPABASE PROJECT URL**: Lấy trong phần *Project Settings -> API* của Supabase.
   - **SUPABASE ANON KEY**: Lấy khóa *anon public key* của bạn.
3. Nhấn **Lưu cấu hình Supabase**. Website sẽ tự động chuyển sang giao tiếp trực tiếp với máy chủ Supabase thật!

---

## 📁 5. Cấu trúc thư mục dự án

```
bài con Mai/
├── index.html                   # Giao diện HTML5 chuẩn SEO & liên kết Google Fonts
├── package.json                 # Cấu hình dự án và dependencies (Vite, Supabase JS, Confetti)
├── vite.config.js               # Cấu hình máy chủ phát triển Vite
├── README.md                    # Hướng dẫn chi tiết sử dụng và quản trị
├── public/
│   └── assets/                  # Hình ảnh hoạt họa, mascot và worksheet chuẩn mẫu
│       ├── hero_girl.jpg        # Ảnh bé mầm non vẽ mặt trời rực rỡ
│       ├── misa_bear.jpg        # Tranh worksheet "Vẽ bạn gấu Misa"
│       └── animals_pack.jpg     # Bìa bộ sưu tập động vật
├── src/
│   ├── main.js                  # Bộ điều khiển chính, điều hướng sự kiện, modals, game & catalog
│   ├── data/
│   │   └── learningData.js      # Dữ liệu danh mục, worksheets, gói học liệu, bảng giá
│   ├── services/
│   │   └── supabase.js          # Khởi tạo Supabase client, quản lý Auth và ma trận quyền RBAC
│   └── styles/
│       └── main.css             # Hệ thống CSS Vanilla phong cách hiện đại, responsive, hiệu ứng đẹp
└── supabase/
    └── schema.sql               # Script PostgreSQL khởi tạo database và chính sách RLS cho Supabase
```

---

## 🔒 6. Bảo mật & Tài khoản thử nghiệm (Security & Test Accounts)

> [!NOTE]
> **Hoàn toàn an toàn khi đưa lên GitHub:**
> - Dự án **KHÔNG chứa bất kỳ mật khẩu thật, thẻ ngân hàng hay khóa bí mật thật nào**.
> - Các email hiển thị trên web chỉ là **dữ liệu mẫu giả lập (Mock Data)** được lưu trong bộ nhớ máy khách (LocalStorage) phục vụ việc trải nghiệm giao diện.
> - Tệp [.gitignore](file:///c:/Users/lapla/Desktop/codespace/bài con Mai/.gitignore) đã tự động chặn tệp `.env`, đảm bảo các khóa Supabase bí mật thật (nếu bạn có) sẽ không bao giờ bị lộ ra ngoài.

### Cách trải nghiệm các vai trò:
Bạn không cần gõ mật khẩu, chỉ cần bấm trực tiếp vào các nút chuyển vai trò có sẵn trên thanh trên cùng của website:
- **👑 Admin:** Trải nghiệm quyền Quản trị viên (quản lý học liệu, phân quyền).
- **👩‍🏫 Giáo Viên:** Trải nghiệm quyền Giáo viên mầm non (tải giáo án STEAM, học liệu lớp học).
- **💖 Phụ Huynh Pro:** Trải nghiệm quyền thành viên VIP.
- **👶 Khách:** Trải nghiệm giao diện người dùng mới.

---

Chúc bạn có những trải nghiệm tuyệt vời cùng **Kho Học Liệu Mầm Non**! ✨

