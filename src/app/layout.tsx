import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Voting",
  description: "Community voting",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
        try {
          var s = localStorage.getItem('theme');
          document.documentElement.classList.toggle('dark', s ? s==='dark' : true);
        } catch {}
        `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster />
        <ThemeToggle />
      </body>
    </html>
  );
}
