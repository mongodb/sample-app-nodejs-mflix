'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import paginationStyles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

export default function Pagination({ 
  currentPage, 
  hasNextPage, 
  hasPrevPage, 
  limit 
}: PaginationProps) {
  const searchParams = useSearchParams();
  
  const createPageURL = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    if (limit !== 20) { // Only include limit if it's not the default
      params.set('limit', limit.toString());
    }
    return `/movies?${params.toString()}`;
  };

  // Don't show pagination if there's no navigation possible
  if (!hasNextPage && !hasPrevPage) {
    return null;
  }

  return (
    <nav className={paginationStyles.pagination} aria-label="Movies pagination">
      <div className={paginationStyles.paginationContainer}>
        {/* Previous Button */}
        {hasPrevPage ? (
          <Link
            href={createPageURL(currentPage - 1)}
            className={paginationStyles.pageButton}
            aria-label="Go to previous page"
          >
            ← Previous
          </Link>
        ) : (
          <span className={`${paginationStyles.pageButton} ${paginationStyles.disabled}`}>
            ← Previous
          </span>
        )}

        {/* Current Page Info */}
        <div className={paginationStyles.pageInfo}>
          Page {currentPage}
        </div>

        {/* Next Button */}
        {hasNextPage ? (
          <Link
            href={createPageURL(currentPage + 1)}
            className={paginationStyles.pageButton}
            aria-label="Go to next page"
          >
            Next →
          </Link>
        ) : (
          <span className={`${paginationStyles.pageButton} ${paginationStyles.disabled}`}>
            Next →
          </span>
        )}
      </div>

      {/* Additional Info */}
      <div className={paginationStyles.additionalInfo}>
        {limit} movies per page
      </div>
    </nav>
  );
}