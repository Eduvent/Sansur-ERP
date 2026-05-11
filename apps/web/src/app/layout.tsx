import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'SANSUR ERP',
  description: 'Sistema de gestion de inventario de ventiladores',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
