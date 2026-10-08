# CLAUDE.md

Hướng dẫn làm việc cho Claude Code (và người đóng góp khác) trong repo này.

## Tổng quan

Trang web tĩnh (vanilla HTML/CSS/JS, không framework, không build step) phục vụ ôn tập
MLN111 chuyên đề **Cơ sở hạ tầng & Kiến trúc thượng tầng** (quy luật CSHT – KTTT). Deploy qua GitHub Pages (xem `CNAME`).
Chỉ cần mở `index.html` hoặc serve file tĩnh để chạy, không cần `npm install`/build.

## Cấu trúc file

- `index.html` — toàn bộ layout trang: masthead, hero, hàng số liệu, ô tìm kiếm + progress,
  lưới bài học, khu vực trắc nghiệm, footer marquee, modal xem chi tiết/tóm tắt.
- `style.css` — toàn bộ style, chia theo khối có comment (TOKENS, BASE, MASTHEAD, HERO, ...).
  Dark mode bằng class `.dark` trên `body` (chỉ override biến màu). Responsive: tablet 900px,
  mobile 576px.
- `script.js` — toàn bộ logic: fetch `lessons.json`, render thẻ bài học, modal, tìm kiếm,
  theo dõi tiến độ học (`localStorage`), chấm trắc nghiệm, toggle dark mode.
- `quizData.js` — mảng câu hỏi trắc nghiệm (`question`, `options[]`, `answer` là index đúng).
- `lessons.json` — danh mục bài học: `id`, `title`, `summary`, `file` (đường dẫn tới file
  `.md` tương ứng trong `data/`). Trường tùy chọn `"type": "flashcard"` biến bài thành bộ thẻ
  lật (kiểu Quizlet) thay vì hiển thị Markdown — xem mục "Bài dạng flashcard".
- `data/lesson-N.md` — nội dung chi tiết từng bài, viết bằng Markdown, render qua `marked.js`
  (CDN) khi người dùng bấm "Đọc bài".

## Quy ước khi thêm/sửa bài học

1. **`title`/`summary` trong `lessons.json` phải khớp với nội dung thật trong file `.md`**
   tương ứng — không copy-paste placeholder từ bài khác. Luôn đọc file `.md` trước khi viết
   title/summary.
2. Mỗi bài học mới cần đủ 3 phần đồng bộ: entry trong `lessons.json` (`id`, `title`,
   `summary`, `file`), file `data/lesson-N.md` nội dung, và `id` phải liên tục, không trùng.
3. File `.md` dùng heading `##`/`###` để chia mục nhỏ (không dùng `#` h1 vì title đã hiển thị
   riêng ở modal). Giữ văn phong ngắn gọn, dùng bullet list cho các ý liệt kê.
4. Khi thêm câu hỏi vào `quizData.js`, `answer` là **index** (bắt đầu từ 0) trong `options[]`,
   không phải giá trị đáp án.

### Bài dạng flashcard

- Đánh dấu `"type": "flashcard"` trong `lessons.json`; nút trên thẻ bài đổi thành "Học thẻ".
- Dữ liệu vẫn nằm trong file `.md`: **một bảng Markdown 2 cột**. Dòng tiêu đề bảng là nhãn
  của 2 mặt thẻ (vd. `Mặt trước | Mặt sau`), mỗi dòng sau là một thẻ. Nội dung ngoài bảng bị bỏ
  qua. Ô có thể dùng Markdown inline (in đậm, nghiêng). Không dùng ký tự `|` trong ô.
- Bộ thẻ (`renderDeck()` trong `script.js`): bấm thẻ để lật, nút ← → và phím ← → chuyển thẻ,
  Space lật thẻ, "Trộn thẻ" bật/tắt thứ tự ngẫu nhiên, thanh tiến độ + bộ đếm `01 / 11`.
  Chuyển thẻ luôn quay về mặt trước mà không chạy animation (tránh lộ đáp án thẻ sau).

## Quy ước code

- Không dùng framework/build tool — giữ nguyên vanilla JS/CSS. Không thêm bundler, package.json,
  hay dependency ngoài trừ khi thực sự cần thiết.
- JS thuần, không dùng TypeScript. Ưu tiên style hiện có trong `script.js` (DOM API thuần,
  không thêm thư viện ngoài `marked.js` đã có qua CDN).
- Nội dung trang là tiếng Việt — giữ nguyên ngôn ngữ tiếng Việt cho mọi text hiển thị
  (title, summary, câu hỏi, nội dung bài học).

## Design system (phong cách tạp chí / editorial)

Giao diện theo phong cách báo in hiện đại: tối giản, đơn sắc, chữ là thành phần thị giác chính.
Mọi UI mới phải theo đúng hệ thống dưới đây.

### Màu

- Chỉ dùng biến CSS trong `:root` — **không hard-code màu** trong rule mới.
  - `--paper` `#d8cfbb` (nền giấy kem đậm), `--paper-2` (nền phụ: dòng chẵn bảng, highlight)
  - `--ink` `#161513` (chữ, đường kẻ, khối đảo màu), `--muted` (chữ phụ, nhãn)
  - `--rule` (đường kẻ đậm), `--rule-soft` (đường kẻ mờ)
  - `--correct` / `--wrong` chỉ dùng cho kết quả trắc nghiệm
- Đơn sắc kem – đen. Không thêm màu nhấn mới (không gradient, không màu thương hiệu).
- Dark mode: chỉ override các biến trong `body.dark`; component không cần rule `.dark` riêng.

### Typography

- `--font-display` **Playfair Display** (800/900): tiêu đề, số lớn, band. Thường UPPERCASE,
  `letter-spacing` âm nhẹ (-.01 → -.02em), `line-height` ~1.05–1.1 (đủ chỗ cho dấu tiếng Việt).
- `--font-body` **Newsreader**: đoạn văn, nội dung bài học, đáp án.
- `--font-label` **Be Vietnam Pro** (600/700): nhãn nhỏ, nút — 11–12px, UPPERCASE,
  `letter-spacing` .1–.12em. Dùng class `.label` cho nhãn.
- Font nào thêm vào cũng phải hỗ trợ subset `vietnamese`.
- Tiêu đề lớn dùng `clamp()` để co theo màn hình.

### Bố cục & thành phần

- Container: class `.wrap` (max 1240px, gutter 24px / 16px trên mobile).
- Chia lưới bằng **đường kẻ 1px `--rule`** (border-left giữa cột, border-bottom giữa hàng),
  không dùng card bóng đổ, không bo góc (trừ nút tròn `.pill`, `#closeModal`, `.option-key`,
  `.deck-arrow`).
- Mở đầu mỗi section bằng `.section-head` (kẻ trên 4px + tiêu đề display lớn) hoặc `.band`
  (dải nền `--ink`, chữ `--paper`, display 900 uppercase).
- Số liệu nổi bật: pattern `.stat` (nhãn nhỏ + số display rất lớn).
- Nút: `.btn` (viền) và `.btn-solid` (nền ink); hover thì đảo màu. Không dùng emoji trong UI.
- Đánh số kiểu báo: `01`, `02`… (helper `pad()` trong `script.js`).
- Ảnh: luôn bọc trong `<figure class="figure">` + `figcaption` có nhãn `.label` ("Hình 01")
  và chú thích nghiêng. Ảnh mặc định ngả sepia, hover hiện màu gốc. Ảnh xen chữ dùng
  pattern `.feature` (ảnh + khối chữ, `.feature-reverse` để đảo bên), luôn có `alt` tiếng Việt.
- Ảnh lưu trong `images/`: `home-*` cho trang chủ, `lesson-N-*` cho ảnh trong bài
  (chèn vào `data/lesson-N.md` bằng cú pháp Markdown, đường dẫn tương đối `images/...`).
- Thẻ bài học hover/focus: đảo màu toàn thẻ (nền `--ink`, chữ `--paper`) + mũi tên trượt
  vào sau số thứ tự.
- Chuyển động tối thiểu (hover đảo màu, marquee footer) và tôn trọng
  `prefers-reduced-motion`.
- Mọi layout mới phải kiểm tra ở 3 mức: desktop, tablet (≤900px), mobile (≤576px), không có
  cuộn ngang trang.

## Khi sửa lỗi dữ liệu

Nếu phát hiện `title`/`summary` không khớp nội dung `.md`, hoặc nội dung giữa các bài bị lệch
thứ tự (do từng xảy ra khi thêm bài mới giữa chừng), luôn đối chiếu lại toàn bộ `lessons.json`
với nội dung thật trong `data/*.md` trước khi sửa, không chỉ sửa đơn lẻ từng entry.
