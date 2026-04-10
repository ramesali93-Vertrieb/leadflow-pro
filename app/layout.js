export const metadata = {
  title: "Leadflow Pro",
  description: "Vertriebssteuerung mit Supabase",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          fontFamily: "Arial, sans-serif",
          background: "#0f172a",
          color: "#e2e8f0",
        }}
      >
        {children}
      </body>
    </html>
  );
}
