/**
 * Utility functions for the application
 */

/**
 * Formats a movie year for display
 */
export function formatYear(year?: number): string {
  return year ? `(${year})` : '';
}

/**
 * Formats movie genres for display
 */
export function formatGenres(genres?: string[], maxGenres: number = 3): string {
  if (!genres || genres.length === 0) return '';
  return genres.slice(0, maxGenres).join(', ');
}

/**
 * Formats IMDB rating for display
 */
export function formatRating(rating?: number): string {
  return rating ? `⭐ ${rating}/10` : '';
}

/**
 * Truncates text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Generates a placeholder image URL for broken images
 */
export function getPlaceholderImage(width: number = 300, height: number = 450): string {
  return `data:image/svg+xml,%3Csvg width='${width}' height='${height}' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-family='Arial, sans-serif' font-size='16'%3ENo Poster Available%3C/text%3E%3C/svg%3E`;
}