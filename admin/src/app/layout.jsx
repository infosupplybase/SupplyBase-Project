import { AuthProvider } from '../context/AuthContext';
import '../styles/index.css';

export const metadata = {
  title: 'Supplybase Admin',
  description: 'Staff back-office for Supplybase Projects — enquiries, bookings, projects and payments.',
  robots: { index: false, follow: false },
};

export const viewport = {
  themeColor: '#0B0B0D',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/assets/brand/favicon.png" />
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
