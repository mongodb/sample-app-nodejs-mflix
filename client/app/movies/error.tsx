'use client';

import { ErrorDisplay } from '../components/ui';

/**
 * Error boundary for movies page
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay 
      message={error.message || "Failed to load movies"}
      onRetry={reset}
    />
  );
}