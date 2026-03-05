import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "EYEBALLS.AI",
  description: "EYEBALLS.AI - Turn viral content into your next script",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#0e1115",
              border: "1px solid rgba(255, 255, 255, 0.07)",
              color: "#f0f2f5",
              fontFamily: "'DM Sans', sans-serif",
              borderRadius: "12px",
            },
          }}
        />
      </body>
    </html>
  );
}
