'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ROUTES } from '../../lib/constants';
import styles from './error.module.css';

export default function MovieDetailsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Movie details error:', error);
  }, [error]);

  return (
    <div className={styles.container}>
      <div className={styles.errorCard}>
        <h1 className={styles.title}>
          Something went wrong!
        </h1>
        <p className={styles.description}>
          We encountered an error while loading the movie details.
        </p>
        
        <div className={styles.buttonContainer}>
          <button
            onClick={reset}
            className={styles.retryButton}
          >
            Try Again
          </button>
          
          <Link 
            href={ROUTES.movies}
            className={styles.backLink}
          >
            Back to Movies
          </Link>
        </div>
        
        {process.env.NODE_ENV === 'development' && error.digest && (
          <p className={styles.errorId}>
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}