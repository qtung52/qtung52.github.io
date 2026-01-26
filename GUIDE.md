# 🚀 Getting Started - Hướng Dẫn Sử Dụng

## 📖 Mục Lục
1. [Cài Đặt](#cài-đặt)
2. [Sử Dụng Cơ Bản](#sử-dụng-cơ-bản)
3. [Sử Dụng Nâng Cao](#sử-dụng-nâng-cao)
4. [FAQ](#faq)

---

## Cài Đặt

### Yêu Cầu Hệ Thống
- ✅ Trình duyệt hiện đại (Chrome, Firefox, Safari, Edge)
- ✅ JavaScript được bật
- ✅ Không cần cài đặt thêm gì

### Cách Chạy

**Option 1: Mở trực tiếp từ file**
```bash
# Windows
start index.html

# Mac/Linux
open index.html
```

**Option 2: Sử dụng web server (khuyến nghị)**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx http-server

# PHP
php -S localhost:8000
```

Sau đó mở: `http://localhost:8000`

---

## Sử Dụng Cơ Bản

### 1️⃣ Kiểm Tra URL Bài Báo

**Các Bước:**
1. Scroll lên phần "🔗 Kiểm Tra Đường Dẫn Bài Báo"
2. Copy-paste URL của bài báo vào ô input
   ```
   Ví dụ: https://vnexpress.net/tin-tuc/123
   ```
3. Nhấn nút "Kiểm Tra URL" hoặc bấm **Enter**
4. Xem kết quả phân tích

**Kết Quả Nhận Được:**
- ✅ Điểm tin cậy (0-100)
- 📌 Độ tin cậy của nguồn
- 🔗 Cấu trúc URL
- 🔐 Tín hiệu bảo mật
- ⚠️ Mẫu phát hiện
- 💡 Khuyến nghị cụ thể

---

### 2️⃣ Kiểm Tra Nội Dung Bài Báo

**Các Bước:**
1. Scroll đến phần "📝 Kiểm Tra Nội Dung Bài Báo"
2. Copy toàn bộ nội dung bài viết (hoặc phần quan trọng)
   - Tối thiểu 50 ký tự
   - Tối đa: không giới hạn
3. Dán vào ô textarea
4. Nhấn "Phân Tích Nội Dung" hoặc bấm **Ctrl+Enter**
5. Xem chi tiết phân tích

**Kết Quả Nhận Được:**
- 📊 Số từ và ký tự
- ⚠️ Số cảnh báo phát hiện
- ✅ Điểm tích cực
- ⚠️ Các cảnh báo
- 💡 Kết luận

---

### 3️⃣ Xóa Dữ Liệu

**Nút Clear (🗑️)**
- Xóa tất cả input fields
- Xóa tất cả kết quả
- Công cụ sẵn sàng cho phân tích mới

---

## Sử Dụng Nâng Cao

### Phím Tắt (Keyboard Shortcuts)

| Phím | Hành Động |
|------|-----------|
| **Enter** (trong ô URL) | Gửi kiểm tra URL |
| **Ctrl+Enter** (trong ô content) | Gửi kiểm tra nội dung |
| **Tab** | Di chuyển giữa các fields |

---

### Hiểu Kết Quả Điểm

#### Thang Điểm Tin Cậy

```
100 ████████████████████ RẤT ĐÁNG TIN CẬY ✅
75-99 ██████████████░░░░░░ ĐÁNG TIN CẬY ✅
50-74 ██████████░░░░░░░░░░ CẦN KIỂM TRA ⚠️
25-49 █████░░░░░░░░░░░░░░░ ĐỀ PHÒNG 🚨
0-24  ░░░░░░░░░░░░░░░░░░░░ KHÔNG TIN 🚫
```

#### Các Thành Phần Điểm

**URL Analysis:**
- **Độ Tin Cậy Nguồn** (-40 → +40)
  - +40: Trong whitelist
  - -50: Trong blacklist
  - +15: Tên miền có từ khóa chính thức
  - -35: Dấu hiệu giả mạo

- **Cấu Trúc URL** (-35 → +35)
  - +3: Tên miền bình thường
  - -5 → -20: Có dấu hiệu lạ

- **Tín Hiệu Bảo Mật** (-15 → +15)
  - +12: Có HTTPS
  - -15: Không HTTPS
  - -30: Dùng IP address

- **Mẫu URL** (-20 → +20)
  - -25: Redirect chain
  - -15: URL shortener
  - -10: Quá nhiều tracking
  - -5 → -8: Archive/aggregator

**Content Analysis:**
- **Độ Dài** (-20 → +5)
- **Từ Khóa Cảnh Báo** (mỗi từ -8)
- **Từ Khóa Chính Thức** (mỗi từ +4)
- **Dấu Hiệu Cảm Xúc** (-10 → -18)
- **Liên Kết** (±5)
- **Số Liệu** (±3)

---

### Ví Dụ Thực Tế

#### ✅ URL Đáng Tin Cậy
```
URL: https://vnexpress.net/tin-tuc/...
✓ HTTPS
✓ Trong whitelist (vnexpress.net)
✓ Tên miền chính thức
Kết quả: 78/100 - ✅ Đáng Tin Cậy
```

#### ⚠️ URL Cần Kiểm Tra
```
URL: https://theguardian.news.info-today.com/...
✓ HTTPS
✗ Tên miền khác thường (giả mạo)
✗ Nhiều dấu gạch ngang
Kết quả: 42/100 - ⚠️ Cần Kiểm Tra
```

#### 🚫 URL Không Tin
```
URL: http://news-exposed.site/...
✗ Không HTTPS
✗ Tên miền đáng ngờ (exposed, news)
✗ Dùng IP address
✗ URL shortener
Kết quả: 15/100 - 🚫 Không Tin
```

---

## FAQ

### ❓ Công cụ này hoạt động như thế nào?

Công cụ phân tích:
1. **URL:** Kiểm tra cấu trúc, bảo mật, mẫu đáng ngờ
2. **Nội dung:** Phân tích từ khóa, cảm xúc, nguồn tham khảo
3. **Điểm số:** Kết hợp tất cả để cho điểm 0-100
4. **Khuyến nghị:** Đưa ra lời khuyên cụ thể

---

### ❓ Độ chính xác bao nhiêu %?

- **Không phải 100%** - Không công cụ nào hoàn hảo
- Hiệu quả nhất khi kết hợp với:
  - ✅ Xác minh từ nhiều nguồn
  - ✅ Đọc bài báo đầy đủ
  - ✅ Check tác giả
  - ✅ Tìm bài báo tương tự

---

### ❓ Dữ liệu của tôi có được lưu không?

**KHÔNG!**
- ✅ Tất cả phân tích xảy ra phía client
- ✅ Không gửi dữ liệu lên server
- ✅ Không lưu lịch sử tìm kiếm
- ✅ Không có cookies hoặc tracking

---

### ❓ Tôi không thấy nút Clear ở đâu?

Nút Clear (🗑️) nằm cạnh nút "Kiểm Tra URL" trong phần đầu tiên.

---

### ❓ Làm sao để kiểm tra bài báo bằng tiếng Anh?

Không vấn đề! Công cụ hỗ trợ:
- ✅ Tiếng Việt
- ✅ Tiếng Anh
- ✅ Bất kỳ ngôn ngữ nào

Phân tích sẽ tự động điều chỉnh dựa trên nội dung.

---

### ❓ Công cụ này có phí không?

**HOÀN TOÀN MIỄN PHÍ!**
- ✅ Không có quảng cáo
- ✅ Không có subscription
- ✅ Mã nguồn mở

---

### ❓ Làm sao phát triển/cải tiến công cụ?

Xin mời:
1. Fork repo
2. Tạo branch mới
3. Thực hiện thay đổi
4. Pull request

---

## 💡 Mẹo & Thủ Thuật

### 1. Phân Tích Toàn Diện
```
1. Kiểm tra URL
2. Kiểm tra nội dung
3. Xem nhận xét từ cộng đồng
4. Tìm bài báo tương tự từ nguồn khác
```

### 2. Sắp Xếp Độ Ưu Tiên
- Tin gấp: Kiểm tra URL trước
- Tin cổ điển: Kiểm tra nội dung chi tiết
- Tin quan trọng: Xác minh cả URL + nội dung

### 3. Sử Dụng Keyboard Shortcut
- Nhanh: Enter + Ctrl+Enter
- Tiết kiệm thời gian khi kiểm tra nhiều bài

---

## 📞 Liên Hệ & Hỗ Trợ

- **Email:** [support email]
- **GitHub:** [github repo]
- **Issues:** [github issues]

---

**Hạnh phúc kiểm tra tin! 🎉**
