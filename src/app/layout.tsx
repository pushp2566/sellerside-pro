import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'SellerSide Pro — A little less admin', description: 'Turn customer conversations into clear orders, payments, and thoughtful support.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
