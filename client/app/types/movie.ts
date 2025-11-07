/**
 * Shared type definitions for the Movie application
 * These types match the backend API response structure
 */

/**
 * Movie interface for type safety
 * Matches the Movie type from the Express backend
 */
export interface Movie {
  _id: string;
  title: string;
  year?: number;
  plot?: string;
  fullplot?: string;
  released?: string;
  runtime?: number;
  poster?: string;
  genres?: string[];
  directors?: string[];
  writers?: string[];
  cast?: string[];
  countries?: string[];
  languages?: string[];
  rated?: string;
  awards?: {
    wins?: number;
    nominations?: number;
    text?: string;
  };
  imdb?: {
    rating?: number;
    votes?: number;
    id?: number;
  };
  tomatoes?: {
    viewer?: {
      rating?: number;
      numReviews?: number;
      meter?: number;
    };
    critic?: {
      rating?: number;
      numReviews?: number;
      meter?: number;
    };
    fresh?: number;
    rotten?: number;
    production?: string;
    lastUpdated?: string;
  };
  metacritic?: number;
  type?: string;
}

/**
 * API Response interface for the movies endpoint
 * Matches the SuccessResponse type from the Express backend
 */
export interface MoviesApiResponse {
  success: boolean;
  data: Movie[];
  message?: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}