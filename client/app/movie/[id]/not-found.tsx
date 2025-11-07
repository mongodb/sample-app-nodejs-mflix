import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.container}>
      <h1 className={styles.errorCode}>404</h1>
      <h2 className={styles.title}>Movie Not Found</h2>
      <p className={styles.description}>
        The movie you're looking for doesn't exist or may have been removed.
      </p>
      <a href="/movies" className={styles.backLink}>
        ← Back to Movies
      </a>
    </div>
  );
}