import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "hellomimir - Learn a Paper a Day",
  description:
    "One research paper a day, explained at your level. From 5th grade to high school.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
