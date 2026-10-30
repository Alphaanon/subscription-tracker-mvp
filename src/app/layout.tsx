import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workspace - Subscription Tracker",
  description: "Email-based subscription tracking without bank credentials",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
