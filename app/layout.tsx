import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { PrototypeProvider } from '@/components/prototype-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://railsamanvay-sih26027.khushaldangar.chatgpt.site'),
  title: 'RailSamanvay | Weekly Block Planning',
  description:
    'Explainable, safety-constrained maintenance block planning decision support for Indian Railways.',
  openGraph: {
    type: 'website',
    title: 'RailSamanvay | Weekly Block Planning',
    description:
      'Explainable, safety-constrained maintenance block planning decision support for Indian Railways.',
    images: [
      {
        url: '/og.png',
        width: 1672,
        height: 941,
        alt: 'RailSamanvay maintenance block planning timeline',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RailSamanvay | Weekly Block Planning',
    description:
      'Explainable, safety-constrained maintenance block planning decision support for Indian Railways.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PrototypeProvider>{children}</PrototypeProvider>
      </body>
    </html>
  );
}
