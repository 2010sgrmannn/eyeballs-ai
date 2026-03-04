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
              background: "#111111",
              border: "1px solid #1F1F1F",
              color: "#FAFAFA",
              fontFamily: "Inter, sans-serif",
              borderRadius: "8px",
            },
          }}
        />
      </body>
    </html>
  );
}
