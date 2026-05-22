import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../components/ThemeProvider';
import { LanguageProvider } from '../components/LanguageProvider';

const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Soltani MikroTik',
  description: 'تطبيق ويب لإدارة أجهزة مايكروتيك المتعددة ديناميكياً.',
  icons: {
    apple: '/icon.svg',
    icon: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={cairo.variable}>
      <body className="font-sans bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 min-h-screen transition-colors antialiased">
        <LanguageProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
