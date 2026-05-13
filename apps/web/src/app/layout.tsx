import './globals.css';
import type { Metadata } from 'next';
import { Instrument_Serif, Manrope, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SANSUR · Boletín de Operaciones',
  description: 'Atelier del aire — Sistema de gestión de ventiladores',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="grain">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
