import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Nav from "@/components/Nav";
import Preloader from "@/components/Preloader";
import MondrianFluid from "@/components/canvas/MondrianFluid";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ujjwalagarwal.com"),
  title: {
    default: "Ujjwal Agarwal — Generative Artist & Creative Technologist",
    template: "%s — Ujjwal Agarwal",
  },
  description:
    "Ujjwal Agarwal is a generative artist, creative technologist and educator based in Bangalore. An exploration of time — of moments, of meaning.",
  openGraph: {
    title: "Ujjwal Agarwal — Generative Artist & Creative Technologist",
    description: "An exploration of time — of moments, of meaning.",
    type: "website",
    url: "https://www.ujjwalagarwal.com",
    siteName: "Ujjwal Agarwal",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Ujjwal Agarwal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ujjwal Agarwal — Generative Artist & Creative Technologist",
    description: "An exploration of time — of moments, of meaning.",
    images: ["/og.png"],
    creator: "@kalatalk",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${hanken.variable} ${jetbrains.variable}`}
    >
      <body className="grain" suppressHydrationWarning>
        <Preloader />
        <MondrianFluid />
        <SmoothScroll>
          <Nav />
          <main>{children}</main>
        </SmoothScroll>
      </body>
    </html>
  );
}
