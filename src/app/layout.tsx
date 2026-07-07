import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "xhs-master-site",
  description: "多账号类型小红书 Prompt + Command only 运营策划台"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
