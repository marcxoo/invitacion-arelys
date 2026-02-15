
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invitación - Baby Mini Mouse",
  description: "¡Te invitamos a celebrar!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Fredoka:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
