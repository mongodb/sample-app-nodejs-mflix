import pageStyles from './page.module.css';
import { MovieDetailsSkeleton } from '@/components';

export default function MovieDetailsLoading() {
  return (
    <div className={pageStyles.page}>
      <main className={pageStyles.main}>
        <div className={pageStyles.movieDetails}>
          <div className={pageStyles.posterSection}>
            <div className={pageStyles.posterPlaceholder}>
              Loading...
            </div>
          </div>

          <div className={pageStyles.movieInfo}>
            <MovieDetailsSkeleton />
          </div>
        </div>
      </main>
    </div>
  );
}