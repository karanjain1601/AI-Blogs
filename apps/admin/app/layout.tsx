import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Notes Admin",
  // Never index the admin site.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Inter, sans-serif',
          background: "#0b0d10",
          color: "#e6e8eb",
        }}
      >
        {children}
      </body>
    </html>
  );
}
