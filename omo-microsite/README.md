# Microsite OMO Matic — Vẽ Tết Trao Xuân

Website **thật, chạy bằng Python** và hoàn toàn **không cần cài thêm thư viện**. Dự án phục vụ bài tập môn truyền thông số; **không trực thuộc OMO/Unilever**. Các nội dung, hình ảnh sản phẩm và lời kêu gọi là minh họa, **không phải chương trình ưu đãi chính thức**.

## Chức năng

- Website responsive: giới thiệu chiến dịch, cách tham gia, các dòng OMO Matic minh họa.
- Vẽ áo dài Tết trực tiếp trên web (chuột hoặc cảm ứng): đổi màu, chỉnh nét, tẩy, hoàn tác, xóa và tải PNG.
- Form gửi tranh có tên hiển thị, lời chúc và ô đồng ý đăng công khai.
- Lưu tranh lên server và hiển thị lại trong thư viện cộng đồng.
- API: `GET /api/artworks`, `POST /api/artworks`, `GET /uploads/<id>.png`.
- SQLite để lưu thông tin, PNG để lưu hình vẽ. Không cần database ngoài.

## Cách chạy website

1. Tải và giải nén `omo-microsite.zip`.
2. Cài **Python 3.10+** (nếu máy chưa có) từ https://www.python.org/downloads/.
3. Mở Terminal (macOS/Linux) hoặc CMD/PowerShell (Windows) ngay trong thư mục chứa `app.py`.
4. **Windows**: nhấp đôi `CHAY_WEBSITE_WINDOWS.bat`, hoặc chạy bằng lệnh dưới đây. **macOS/Linux**: chạy `./RUN_MAC_LINUX.sh`.

```bash
python app.py
```

5. Mở Chrome/Edge vào **http://127.0.0.1:5000**.

**Không cần `pip install` và không cần cài Flask.** Tắt web bằng tổ hợp `Ctrl+C`.

Để mở bằng điện thoại trong cùng Wi-Fi, tìm IP nội bộ của máy tính rồi vào `http://IP-CUA-MAY:5000`. Nếu không truy cập được, kiểm tra tường lửa của máy tính.

## Đưa website lên Internet

1. Đăng toàn bộ thư mục này thành repository GitHub.
2. Tại [Render](https://render.com/), chọn **New → Blueprint**, kết nối repository có file `render.yaml`.
3. Render tạo web và cấp link dạng `https://...onrender.com`.

**Lưu ý triển khai:** bản demo dùng HTTP server Python tích hợp để dễ chạy trên máy và trình diễn học tập, **chưa được harden cho lưu lượng thực tế**. Render free có thể xóa dữ liệu trên ổ local sau redeploy/restart. Nếu phục vụ công khai lâu dài, cần chạy sau reverse proxy, giới hạn tần suất gửi tranh, kiểm duyệt nội dung và dùng dịch vụ lưu dữ liệu bền vững (S3 / Cloudinary + database). Biến môi trường `OMO_DATA_DIR` có thể trỏ tới một thư mục được gắn persistent disk nếu host hỗ trợ.

## Cấu trúc

```text
omo-microsite/
├── app.py                    # Python HTTP server, API và SQLite
├── templates/index.html      # cấu trúc website
├── static/css/style.css      # giao diện responsive
├── static/js/main.js         # canvas, trình vẽ, tải PNG, gửi form
├── static/img/hero-scene.svg # hình minh họa vector
├── render.yaml               # gợi ý cấu hình triển khai
└── data/                     # tự sinh SQLite và các ảnh PNG đã gửi
```

## Hành trình chuyển đổi mẫu cho bài tập

**Nhận biết chiến dịch → Tìm hiểu cách tham gia → Vẽ áo dài → Viết lời chúc → Gửi tranh → Xem và chia sẻ.**

- CTA chính: **Bắt đầu sáng tạo**.
- CTA thứ cấp: **Gửi tác phẩm**, **Tải tranh PNG về máy**.
- KPI gợi ý: số lượt vào trang, lượt nhấn CTA, số lượt gửi tranh, số lượt tải PNG (cần tích hợp công cụ analytics nếu muốn đo số thực).
