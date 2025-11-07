
import pageStyles from "./page.module.css";
import movieStyles from "./movies.module.css";
import { MovieCardSkeleton, PageSelectorSkeleton, PaginationSkeleton } from "../components/LoadingSkeleton";

/**
 * Loading Component for Movies Page
 * 
 * This component is automatically displayed by Next.js while the movies page
 * is loading during Server Side Rendering or when navigating to the page.
 */
export default function Loading() {
  return (
    <div className={pageStyles.page}>
      <main className={pageStyles.main}>
        <h1 className={movieStyles.pageTitle}>Movies</h1>
        <p className={movieStyles.movieCount}>Loading movies from the sample_mflix database...</p>
        
        <PageSelectorSkeleton />
        
        {/* Movies Grid Skeleton */}
        <div className={movieStyles.moviesGrid}>
          {[...Array(20)].map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
        
        <PaginationSkeleton />
      </main>
    </div>
  );
}