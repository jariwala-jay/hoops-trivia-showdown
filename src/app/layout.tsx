import type { Metadata } from "next";
import { Inter, Montserrat } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import "./globals.css";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: "Hoops Trivia Showdown",
  description: "Stake your NBA NFTs and battle in the ultimate basketball trivia competition!",
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
        <body
          className={`${inter.variable} ${montserrat.variable} font-sans antialiased`}
        >
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
              },
            }}
          />
        </body>
    </html>
  );
}
