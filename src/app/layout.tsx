import type { Metadata } from "next";
import "./globals.css";
import "@/styles/dashboard.css";

export const metadata: Metadata = {
  title: "NEUROSHADOW | AI Cognitive Collapse Prediction Dashboard",
  description:
    "Educational research dashboard using simulated cognitive indicators. Not a medical diagnosis system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
