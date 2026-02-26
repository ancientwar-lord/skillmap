import type { Metadata } from 'next';
import ClientLayout from '@/components/ClientLayout';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Skillmap',
  description:
    'Apply your skills to real-world while you are learning.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased bg-slate-50 text-slate-900`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
