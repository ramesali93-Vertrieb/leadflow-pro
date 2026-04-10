import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Leadflow Pro",
  description: "Sales CRM",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
