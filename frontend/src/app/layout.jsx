import { AuthProvider } from '../context/AuthContext';
import '../styles/index.css';

/**
 * Site-wide metadata. The old Vite `index.html` had a comment noting these
 * tags were static across every page "because this Vite SPA does not do"
 * per-page rendering — Next's per-route `metadata` export is the fix for
 * that; individual pages can override `title`/`description` as needed.
 */
export const metadata = {
  title: 'Supplybase Projects | One Partner. Complete Project.',
  description:
    'Supplybase Projects — architectural design, civil construction, interior design, finishing and turnkey project execution. Labour + material + project management under one roof.',
  metadataBase: new URL('https://www.supplybase.co.in'),
  alternates: { canonical: '/' },
  icons: {
    icon: '/assets/brand/favicon.png',
    apple: '/assets/brand/favicon.png',
  },
  openGraph: {
    siteName: 'Supplybase Projects',
    title: 'Supplybase Projects | One Partner. Complete Project.',
    description:
      'From 3D architectural design to construction and finishing — we provide labour, materials and complete project execution under one roof.',
    type: 'website',
    url: 'https://www.supplybase.co.in/',
    images: [
      {
        url: 'https://www.supplybase.co.in/assets/brand/logo-full.jpg',
        width: 640,
        height: 640,
        alt: 'Supplybase Projects logo',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary',
    title: 'Supplybase Projects | One Partner. Complete Project.',
    description:
      'From 3D architectural design to construction and finishing — we provide labour, materials and complete project execution under one roof.',
    images: ['https://www.supplybase.co.in/assets/brand/logo-full.jpg'],
  },
};

export const viewport = {
  themeColor: '#0B0B0D',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Oswald:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
