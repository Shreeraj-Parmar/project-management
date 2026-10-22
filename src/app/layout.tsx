import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: { default: "DevBoard", template: "%s | DevBoard" },
  description: "DevBoard: a personal project workspace with kanban boards, environment variables, passwords, files, notes, spending and git in one place.",
  applicationName: "DevBoard",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c66e4",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
