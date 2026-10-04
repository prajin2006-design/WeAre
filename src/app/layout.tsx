import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserContentProvider } from "@/lib/context/user-content-context";
import { ToastProvider } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WeAre — Stream Movies & Series",
  description:
    "WeAre is a modern streaming platform. Watch the latest movies, original series, and exclusive content in 4K HDR.",
  keywords: ["streaming", "movies", "series", "WeAre", "watch online", "cinema"],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased selection:bg-accent selection:text-black">
        <UserContentProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </UserContentProvider>
      </body>
    </html>
  );
}
