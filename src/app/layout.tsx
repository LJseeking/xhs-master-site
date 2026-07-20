import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "小红书运营策划大师",
  description: "多账号类型小红书运营策划台",
  icons: {
    icon: "/xhs-master-logo.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
