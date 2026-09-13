# 🎓 Feynman Learning AI Assistant (Ứng dụng Học tập AI theo Phương pháp Feynman)

Ứng dụng trợ lý học tập tối ưu cho thiết bị di động (Mobile-first) và máy tính, áp dụng **Phương pháp Feynman** để giúp người học thấu hiểu bản chất kiến thức và ghi nhớ lâu dài qua 3 bước: **Tải lên & Phân tích -> Tạo Mindmap Feynman -> Ôn tập đa hình thức**.

Dự án gồm **2 phần đồng bộ hoàn chỉnh**:
1. **Web App (Next.js 15, Vercel-ready)**: Nguồn dữ liệu & giao diện duy nhất (Single Source of Truth), tích hợp Google Gemini API & Smart Mock AI Generator.
2. **Android App (WebView Shell)**: Ứng dụng Android Native (Kotlin) bọc WebView load trực tiếp URL đã deploy trên Vercel. Khi trang web được cập nhật trên Vercel, ứng dụng Android tự động hiển thị phiên bản mới nhất mà không cần build lại APK.

---

## 🎨 Giao diện & Trải nghiệm (UI/UX)
- Thiết kế theo phong cách tối giản thực dụng (**Notion / Apple Notes Style**).
- Tone màu trung tính (Trắng `#FFFFFF`, Xám Slate, điểm nhấn xanh `#2563EB`).
- **Tuyệt đối không dùng mô-típ AI generic**: Không gradient tím-xanh mặc định, không glassmorphism, không icon 3D phô trương.
- **Tối ưu Mobile-first**: Tương tác chạm vuốt mượt mà, zoom & kéo thả node Mindmap bằng ngón tay.

---

## 📁 Cấu trúc thư mục

```
appAIhoctap/
├── web-app/                  # Mã nguồn Web Application (Next.js + TypeScript + Tailwind)
│   ├── src/
│   │   ├── app/              # App Router & API Routes (/api/ai/analyze, /api/ai/evaluate-feynman)
│   │   ├── components/       # Các UI Component (Header, UploadSection, StructuredNotes, FeynmanMindmap, ReviewSection...)
│   │   ├── services/         # aiService.ts (Gemini + Smart Mock) & storageService.ts (Offline-first)
│   │   └── types/            # Định nghĩa dữ liệu TypeScript (feynman.ts)
│   ├── public/
│   ├── package.json
│   └── next.config.ts
├── android-app/              # Mã nguồn dự án Android Studio (WebView Native Shell)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/feynman/ai/MainActivity.kt  # Cấu hình WebView, URL Vercel, Upload file, Offline screen
│   │   │   ├── res/                                 # Layout, colors, strings, file_paths
│   │   │   └── AndroidManifest.xml                  # Quyền INTERNET, CAMERA, READ_EXTERNAL_STORAGE, FileProvider
│   │   └── build.gradle.kts
│   └── build.gradle.kts
└── README.md                 # Tài liệu hướng dẫn sử dụng & triển khai
```

---

## 🚀 Hướng dẫn phần 1: WEB APP (Local Dev & Deploy Vercel)

### 1.1 Chạy ở môi trường Local (Dev Mode)

```bash
# 1. Di chuyển vào thư mục web-app
cd web-app

# 2. Cài đặt các thư viện phụ thuộc
npm install

# 3. Chạy môi trường dev
npm run dev
```
Trang web sẽ chạy tại địa chỉ `http://localhost:3000`.

### 1.2 Cấu hình API Key (Google Gemini API)
Ứng dụng hỗ trợ 2 cơ chế linh hoạt:
- **Cơ chế 1 (Lưu trên Web)**: Bấm vào biểu tượng ⚙️ (Cài đặt) trên thanh Header của ứng dụng để nhập `Gemini API Key` của bạn. Key sẽ được lưu an toàn trong `localStorage` của trình duyệt.
- **Cơ chế 2 (Biến môi trường)**: Tạo file `.env.local` tại thư mục `web-app/`:
  ```env
  GEMINI_API_KEY=AIzaSy...
  NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...
  ```
- **Chế độ Smart Mock AI Fallback**: Nếu không nhập API Key, ứng dụng vẫn hoạt động 100% bình thường với bộ sinh dữ liệu mẫu Feynman thông minh offline để bạn trải nghiệm ngay lập tức.

### 1.3 Deploy lên Vercel (CI/CD Tự động)

1. Push mã nguồn dự án lên repo **GitHub** của bạn.
2. Truy cập [Vercel Dashboard](https://vercel.com) và chọn **Add New Project** -> Chọn Repo GitHub của dự án.
3. Cấu hình Vercel Project:
   - **Root Directory**: Đặt là `web-app`.
   - **Framework Preset**: Next.js (Tự động nhận diện).
   - **Environment Variables**: Thêm key `GEMINI_API_KEY` (nếu có).
4. Bấm **Deploy**. Vercel sẽ tự động build và cấp cho bạn URL công khai (Ví dụ: `https://app-ai-hoc-tap-feynman.vercel.app`).
5. **CI/CD đơn giản**: Mỗi khi bạn push commit mới lên GitHub, Vercel sẽ tự động build & deploy phiên bản mới nhất chỉ sau 1-2 phút!

---

## 📱 Hướng dẫn phần 2: ANDROID APP (WebView Shell)

Android App được đóng gói dưới dạng Android Native Shell sử dụng `WebView` load trực tiếp URL trang web đã deploy trên Vercel.

### 2.1 Cập nhật URL Vercel vào Android App
1. Mở thư mục `android-app` trong **Android Studio**.
2. Mở file [MainActivity.kt](file:///c:/Users/lutha/OneDrive/Desktop/appAIhoctap/android-app/app/src/main/java/com/feynman/ai/MainActivity.kt).
3. Tìm hằng số `VERCEL_URL` ở đầu class và thay đổi thành URL Vercel chính thức của bạn:

```kotlin
companion object {
    /**
     * Thay bằng URL Vercel chính thức sau khi deploy Web App
     */
    const val VERCEL_URL = "https://app-ai-hoc-tap-feynman.vercel.app"
}
```

### 2.2 Các tính năng Native được tích hợp trong Android App
- **Upload File & Camera**: Sử dụng `WebChromeClient.onShowFileChooser` kết hợp `FileProvider` cho phép chọn ảnh, PDF, video hoặc chụp ảnh từ Camera trực tiếp trong app.
- **Xử lý Mất kết nối Mạng (Offline Handling)**: Tự động phát hiện khi mất kết nối mạng và hiển thị giao diện thông báo lỗi offline thân thiện kèm nút **Thử lại**.
- **Kéo để làm mới (Pull-to-refresh)**: Hỗ trợ vuốt từ trên xuống để reload lại trang web.
- **Nút Back hệ thống**: Xử lý nút phím Back cứng trên điện thoại để điều hướng lùi lịch sử trang web trong WebView.

### 2.3 Đóng gói xuất file APK cài đặt

1. Mở dự án `android-app` bằng **Android Studio**.
2. Đợi Gradle Sync hoàn tất.
3. Trên thanh menu Android Studio, chọn:
   **Build** ➔ **Build Bundle(s) / APK(s)** ➔ **Build APK(s)**.
4. Sau khi build xong, Android Studio sẽ hiển thị thông báo với đường dẫn tới file `app-debug.apk` (thường ở `android-app/app/build/outputs/apk/debug/app-debug.apk`).
5. Copy file APK này vào điện thoại Android của bạn để cài đặt và trải nghiệm!

---

## ✨ Tóm tắt Tính năng Nổi bật

| Tính năng | Mô tả chi tiết theo Phương pháp Feynman |
| :--- | :--- |
| **Nhập liệu Đa phương thức** | Hỗ trợ Video, Hình ảnh chụp tài liệu, File PDF, hoặc dán Văn bản/Link |
| **Ghi chú Cấu trúc** | Chia theo Tiêu đề -> Ý chính -> Ý phụ -> Ví dụ thực tế. Highlight khái niệm quan trọng |
| **Feynman Mindmap** | Graph nối các khái niệm với nhãn quan hệ (dẫn đến, là ví dụ của, trái ngược với). Tap node để xem giải thích cho trẻ 7 tuổi |
| **Flashcard Spaced Repetition** | Ôn tập ghi nhớ thẻ lật 3D với 2 trạng thái "Đã nhớ" / "Chưa nhớ" |
| **Quiz Trắc nghiệm** | Bài tập trắc nghiệm có đáp án & giải thích chi tiết, tổng kết điểm số |
| **Tự giải thích Feynman** | Ô nhập văn bản + **Thu âm giọng nói trực tiếp**, AI đọc & chấm điểm (1-10), chỉ ra lỗi thiếu/sai và gợi ý diễn đạt đơn giản hơn |
