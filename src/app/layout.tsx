import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Curataur — Curated Video Insights",
    template: "%s — Curataur",
  },
  description:
    "Curated YouTube videos with synced transcripts, AI summaries, and full-text search across every video.",
  openGraph: {
    type: "website",
    siteName: "Curataur",
    title: "Curataur — Curated Video Insights",
    description:
      "Curated YouTube videos with synced transcripts, AI summaries, and full-text search across every video.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Curataur — Curated Video Insights",
    description:
      "Curated YouTube videos with synced transcripts, AI summaries, and full-text search across every video.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <Toaster richColors closeButton position="top-right" />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
