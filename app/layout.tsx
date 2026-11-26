import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import PWARegister from '@/components/PWARegister';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#121212',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Ghost Bloggr — AI Blog Writing Studio',
  description:
    'Minimalist browser-based AI blog writing studio with rich text editing, custom agents, prompt library, Markdown export, and PWA support.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GhostBloggr',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Ghost Bloggr — AI Blog Writing Studio',
    description:
      'Minimalist browser-based AI blog writing studio with rich text editing, custom agents, prompt library, Markdown export, and PWA support.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ghost Bloggr — AI Blog Writing Studio',
    description:
      'Minimalist browser-based AI blog writing studio with rich text editing, custom agents, prompt library, Markdown export, and PWA support.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased selection:bg-[#EAEAEA]/20 dark:selection:bg-[#EAEAEA]/20" suppressHydrationWarning>
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
