import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DJ Booking Manager",
  description: "Gérez vos dates, contrats et logistique",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
