import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Product Pulse AI — What People Really Think",
  description: "Instant AI-powered analysis of public opinion about any product. Real insights from real people, in seconds.",
  keywords: "product analysis, sentiment analysis, consumer opinion, product reviews AI",
  openGraph: {
    title: "Product Pulse AI",
    description: "Understand what people really think about any product",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="noise">{children}</body>
    </html>
  );
}
