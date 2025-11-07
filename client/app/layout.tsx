import Link from 'next/link';
import type { Metadata } from 'next';
import "./globals.css";
import styles from './layout.module.css';
import { ROUTES, APP_CONFIG } from './lib/constants';

export const metadata: Metadata = {
  title: 'Sample MFlix - MongoDB Movie Database',
  description: 'Explore movies from the MongoDB sample_mflix database',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav className={styles.navigation}>
          <div className={styles.navContainer}>
            <Link 
              href={ROUTES.home}
              className={styles.logo}
            >
              {APP_CONFIG.name}
            </Link>
            <div className={styles.navLinks}>
              <Link 
                href={ROUTES.home}
                className={styles.navLink}
              >
                Home
              </Link>
              <Link 
                href={ROUTES.movies}
                className={styles.navLink}
              >
                Movies
              </Link>
              <Link 
                href={ROUTES.aggregations}
                className={styles.navLink}
              >
                Aggregations
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}