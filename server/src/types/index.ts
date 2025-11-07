/**
 * TypeScript Type Definitions for MongoDB Documents
 *
 * These interfaces define the structure of documents in the sample_mflix database.
 * They help ensure type safety when working with MongoDB operations.
 */

import { ObjectId } from "mongodb";

/**
 * Interface for Movie documents in the movies collection
 *
 * This represents the structure of movie documents in the sample_mflix.movies collection.
 */
export interface Movie {
  _id?: ObjectId;
  title: string;
  year?: number;
  plot?: string;
  fullplot?: string;
  released?: Date;
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
    lastUpdated?: Date;
  };

  metacritic?: number;
  type?: string;
}

/**
 * Interface for Theater documents in the theaters collection
 */
export interface Theater {
  _id?: ObjectId;
  theaterId: number;
  location: {
    address: {
      street1: string;
      city: string;
      state: string;
      zipcode: string;
    };
    geo: {
      type: "Point";
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
}

/**
 * Interface for Comment documents in the comments collection
 */
export interface Comment {
  _id?: ObjectId;
  name: string;
  email: string;
  movie_id: ObjectId;
  text: string;
  date: Date;
}

/**
 * Interface for API request bodies when creating/updating movies
 */
export interface CreateMovieRequest {
  title: string;
  year?: number;
  plot?: string;
  fullplot?: string;
  genres?: string[];
  directors?: string[];
  writers?: string[];
  cast?: string[];
  countries?: string[];
  languages?: string[];
  rated?: string;
  runtime?: number;
  poster?: string;
}

/**
 * Interface for API request bodies when updating movies
 * All fields are optional for partial updates
 */
export interface UpdateMovieRequest {
  title?: string;
  year?: number;
  plot?: string;
  fullplot?: string;
  genres?: string[];
  directors?: string[];
  writers?: string[];
  cast?: string[];
  countries?: string[];
  languages?: string[];
  rated?: string;
  runtime?: number;
  poster?: string;
}

/**
 * Type for raw query parameters (Express passes all params as strings)
 */
export type RawSearchQuery = {
  q?: string;
  genre?: string;
  year?: string;
  minRating?: string;
  maxRating?: string;
  limit?: string;
  skip?: string;
  sortBy?: string;
  sortOrder?: string;
};

/**
 * Type for MongoDB filter objects used in movie queries
 */
export type MovieFilter = {
  $text?: { $search: string };
  genres?: { $regex: RegExp };
  year?: number;
  "imdb.rating"?: {
    $gte?: number;
    $lte?: number;
  };
};

export type SuccessResponse<T> = {
  success: true;
  message?: string;
  data: T;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type ErrorResponse = {
  success: false;
  message: string;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Interface for vector search results
 */
export interface VectorSearchResult {
  _id: string;
  title: string;
  plot?: string;
  poster?: string;
  year?: number;
  genres?: string[];
  directors?: string[];
  cast?: string[];
  score: number;
}

/**
 * Interface for director statistics aggregation results
 */
export interface DirectorStatisticsResult {
  director: string;
  movieCount: number;
  averageRating?: number;
}

/**
 * Interface for movies by year aggregation results
 */
export interface MoviesByYearResult {
  year: number;
  movieCount: number;
  averageRating?: number;
  highestRating?: number;
  lowestRating?: number;
  totalVotes?: number;
}

/**
 * Interface for movies with comments aggregation results
 */
export interface MovieWithCommentsResult {
  _id: string;
  title: string;
  year?: number;
  plot?: string;
  poster?: string;
  genres?: string[];
  imdbRating?: number;
  recentComments: CommentInfo[];
  totalComments: number;
  mostRecentCommentDate?: Date;
}

/**
 * Interface for comment information in aggregation results
 */
export interface CommentInfo {
  _id?: string;
  userName: string;
  userEmail: string;
  text: string;
  date: Date;
}

/**
 * Interface for search movies response with total count
 */
export interface SearchMoviesResponse {
  movies: Movie[];
  totalCount: number;
}

/**
 * Interface for movie search request parameters
 */
export interface MovieSearchRequest {
  plot?: string;
  fullplot?: string;
  directors?: string;
  writers?: string;
  cast?: string;
  limit?: number;
  skip?: number;
  searchOperator?: string;
}

/**
 * Type for raw search query parameters from MongoDB Search endpoint
 */
export type RawMovieSearchQuery = {
  plot?: string;
  fullplot?: string;
  directors?: string;
  writers?: string;
  cast?: string;
  limit?: string;
  skip?: string;
  searchOperator?: string;
};

/**
 * Interface for MongoDB Search phrase queries
 */
export interface SearchPhrase {
  phrase?: {
    query: string;
    path: string;
  };
  text?: {
    query: string;
    path: string;
    fuzzy?: { maxEdits: number; prefixLength: number };
  };
}

/**
 * Interface for aggregation comment data from MongoDB pipelines
 */
export interface AggregationComment {
  _id?: ObjectId;
  userName: string;
  userEmail: string;
  text: string;
  date: Date;
}

/**
 * Interface for Voyage AI API response structure
 */
export interface VoyageAIResponse {
  data: Array<{
    embedding: number[];
  }>;
}
