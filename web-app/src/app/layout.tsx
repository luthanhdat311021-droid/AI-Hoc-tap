import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Feynman Learning AI - Trợ Lý Học Tập Tối Ưu",
  description: "Xây dựng tư duy học sâu bằng phương pháp Feynman. Tạo ghi chú cấu trúc, mindmap khái niệm và bộ thẻ ôn tập thông minh từ video, ảnh, PDF.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
