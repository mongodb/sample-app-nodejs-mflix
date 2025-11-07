import styles from './LoadingSkeleton.module.css';

interface SkeletonProps {
  variant?: 'text' | 'title' | 'largeTitle' | 'button' | 'card' | 'avatar' | 'input';
  size?: 'small' | 'medium' | 'large' | 'full' | 'half';
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({ 
  variant = 'text', 
  size,
  width, 
  height, 
  className = '' 
}: SkeletonProps) {
  const baseClass = styles[`skeleton${variant.charAt(0).toUpperCase() + variant.slice(1)}`];
  const sizeClass = size ? styles[`skeleton${size.charAt(0).toUpperCase() + size.slice(1)}`] : '';
  
  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div 
      className={`${baseClass} ${sizeClass} ${className}`.trim()}
      style={style}
    />
  );
}

export function MovieCardSkeleton() {
  return (
    <div className={styles.movieCardSkeleton}>
      <Skeleton variant="card" className={styles.posterSkeleton} />
      <div className={styles.movieInfoSkeleton}>
        <Skeleton variant="title" size="large" />
        <Skeleton variant="text" size="medium" />
        <Skeleton variant="text" size="small" />
        <Skeleton variant="button" />
      </div>
    </div>
  );
}

export function PageSelectorSkeleton() {
  return (
    <div className={styles.pageSelectorSkeleton}>
      <Skeleton variant="text" width="120px" />
      <Skeleton variant="input" width="60px" />
    </div>
  );
}

export function PaginationSkeleton() {
  return (
    <div className={styles.paginationSkeleton}>
      <div className={styles.paginationButtonsSkeleton}>
        <Skeleton variant="button" width="80px" />
        <Skeleton variant="text" width="60px" />
        <Skeleton variant="button" width="80px" />
      </div>
    </div>
  );
}

export function RatingCardSkeleton() {
  return (
    <div className={styles.ratingCardSkeleton}>
      <Skeleton variant="text" width="60px" height="14px" />
      <Skeleton variant="text" width="40px" height="20px" />
      <Skeleton variant="text" width="80px" height="12px" />
    </div>
  );
}

export function MovieDetailsSkeleton() {
  return (
    <>
      {/* Back link skeleton */}
      <Skeleton variant="text" width="100px" height="20px" />
      
      {/* Title skeleton */}
      <Skeleton variant="largeTitle" size="half" />
      
      {/* Basic info skeleton */}
      <div className={styles.skeletonContainer}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={styles.skeletonRow}>
            <Skeleton variant="text" size="small" />
            <Skeleton variant="text" size="medium" />
          </div>
        ))}
      </div>
      
      {/* Ratings skeleton */}
      <div className={styles.ratingsGrid}>
        {[...Array(3)].map((_, i) => (
          <RatingCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Plot skeleton */}
      <div className={styles.skeletonContainer}>
        <Skeleton variant="title" width="60px" />
        <Skeleton variant="text" size="full" />
        <Skeleton variant="text" size="large" />
        <Skeleton variant="text" size="large" />
      </div>
    </>
  );
}