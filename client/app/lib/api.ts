import { Movie, MoviesApiResponse } from '../types/movie';

/**
 * API configuration and helper functions
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Fetches movies from the Express API with pagination support
 * This function runs on the server during SSR
 */
export async function fetchMovies(
  limit: number = 20, 
  skip: number = 0
): Promise<{ movies: Movie[]; hasNextPage: boolean; hasPrevPage: boolean }> {
  try {
    // Request one extra movie to check if there's a next page
    const requestLimit = Math.min(limit + 1, 100);
    const response = await fetch(`${API_BASE_URL}/api/movies?limit=${requestLimit}&skip=${skip}`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch movies: ${response.status}`);
    }

    const result: MoviesApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error('API returned error response');
    }

    const hasNextPage = result.data.length > limit;
    const movies = hasNextPage ? result.data.slice(0, limit) : result.data;
    const hasPrevPage = skip > 0;

    return {
      movies,
      hasNextPage,
      hasPrevPage
    };
  } catch (error) {
    console.error('Error fetching movies:', error);
    
    // In development, throw the error to help with debugging
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
    
    // In production, return empty result with logged error to prevent page crash
    return {
      movies: [],
      hasNextPage: false,
      hasPrevPage: false
    };
  }
}

/**
 * Fetch a single movie by ID
 */
export async function fetchMovieById(id: string): Promise<Movie | null> {
  try {
    // Validate the ID format (basic validation)
    if (!id || id.length !== 24) {
      console.warn('Invalid movie ID format:', id);
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/api/movies/${id}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch movie ${id}: ${response.status}`);
      return null;
    }

    const result = await response.json();
    
    if (!result.success) {
      console.warn('API returned error response for movie:', id);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching movie:', error);
    return null;
  }
}

/**
 * Update a movie by ID
 */
export async function updateMovie(id: string, updateData: Partial<Movie>): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate the ID format
    if (!id || id.length !== 24) {
      return { success: false, error: 'Invalid movie ID format' };
    }

    // Remove the _id field from update data if present
    const { _id, ...dataToUpdate } = updateData;

    const response = await fetch(`${API_BASE_URL}/api/movies/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToUpdate),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || result.error?.message || `Failed to update movie: ${response.status}`
      };
    }

    if (!result.success) {
      return {
        success: false,
        error: result.message || result.error?.message || 'API returned error response'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating movie:', error);
    return { 
      success: false, 
      error: 'Network error occurred while updating movie' 
    };
  }
}

/**
 * Delete a movie by ID
 */
export async function deleteMovie(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate the ID format
    if (!id || id.length !== 24) {
      return { success: false, error: 'Invalid movie ID format' };
    }

    const response = await fetch(`${API_BASE_URL}/api/movies/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || result.error?.message || `Failed to delete movie: ${response.status}`
      };
    }

    if (!result.success) {
      return {
        success: false,
        error: result.message || result.error?.message || 'API returned error response'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting movie:', error);
    return { 
      success: false, 
      error: 'Network error occurred while deleting movie' 
    };
  }
}

/**
 * Create a new movie
 */
export async function createMovie(movieData: Omit<Movie, '_id'>): Promise<{ success: boolean; error?: string; movieId?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/movies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(movieData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || result.error?.message || `Failed to create movie: ${response.status}`
      };
    }

    if (!result.success) {
      return {
        success: false,
        error: result.message || result.error?.message || 'API returned error response'
      };
    }

    return { 
      success: true, 
      movieId: result.data._id || result.data.insertedId 
    };
  } catch (error) {
    console.error('Error creating movie:', error);
    return { 
      success: false, 
      error: 'Network error occurred while creating movie' 
    };
  }
}

/**
 * Create multiple movies in a batch operation
 */
export async function createMoviesBatch(moviesData: Omit<Movie, '_id'>[]): Promise<{ success: boolean; error?: string; insertedCount?: number; insertedIds?: string[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/movies/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(moviesData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || result.error?.message || `Failed to create movies: ${response.status}`
      };
    }

    if (!result.success) {
      return {
        success: false,
        error: result.message || result.error?.message || 'API returned error response'
      };
    }

    return { 
      success: true, 
      insertedCount: result.data.insertedCount,
      insertedIds: result.data.insertedIds ? Object.values(result.data.insertedIds) : []
    };
  } catch (error) {
    console.error('Error creating movies batch:', error);
    return { 
      success: false, 
      error: 'Network error occurred while creating movies' 
    };
  }
}

/**
 * Delete multiple movies in a batch operation
 */
export async function deleteMoviesBatch(movieIds: string[]): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
  try {
    // Create filter to match the movie IDs
    // Note: The server will handle ObjectId conversion
    const filter = {
      _id: {
        $in: movieIds
      }
    };

    const response = await fetch(`${API_BASE_URL}/api/movies`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filter }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || result.error?.message || `Failed to delete movies: ${response.status}`
      };
    }

    if (!result.success) {
      return {
        success: false,
        error: result.message || result.error?.message || 'API returned error response'
      };
    }

    return { 
      success: true, 
      deletedCount: result.data.deletedCount
    };
  } catch (error) {
    console.error('Error deleting movies batch:', error);
    return { 
      success: false, 
      error: 'Network error occurred while deleting movies' 
    };
  }
}

/**
 * Update multiple movies in a batch operation
 */
export async function updateMoviesBatch(movieIds: string[], updateData: Partial<Movie>): Promise<{ success: boolean; error?: string; matchedCount?: number; modifiedCount?: number }> {
  try {
    // Create filter to match the movie IDs
    // Note: The server will handle ObjectId conversion
    const filter = {
      _id: {
        $in: movieIds
      }
    };

    const response = await fetch(`${API_BASE_URL}/api/movies`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filter, update: updateData }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || result.error?.message || `Failed to update movies: ${response.status}`
      };
    }

    if (!result.success) {
      return {
        success: false,
        error: result.message || result.error?.message || 'API returned error response'
      };
    }

    return { 
      success: true, 
      matchedCount: result.data.matchedCount,
      modifiedCount: result.data.modifiedCount
    };
  } catch (error) {
    console.error('Error updating movies batch:', error);
    return { 
      success: false, 
      error: 'Network error occurred while updating movies' 
    };
  }
}

/**
 * Aggregation API Functions for Aggregations
 */

// Type definitions for aggregation responses
export interface MovieWithComments {
  _id: string;
  title: string;
  year: number;
  genres: string[];
  imdbRating: number;
  totalComments: number;
  recentComments: Array<{
    userName: string;
    userEmail: string;
    text: string;
    date: string;
  }>;
}

export interface YearlyStats {
  year: number;
  movieCount: number;
  averageRating: number;
  highestRating: number;
  lowestRating: number;
  totalVotes: number;
}

export interface DirectorStats {
  director: string;
  movieCount: number;
  averageRating: number;
}

/**
 * Fetch movies with their most recent comments
 */
export async function fetchMoviesWithComments(
  limit: number = 5,
  movieId?: string
): Promise<{ success: boolean; error?: string; data?: MovieWithComments[] }> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit.toString());
    if (movieId) {
      queryParams.append('movieId', movieId);
    }

    console.log(`Fetching comments from: ${API_BASE_URL}/api/movies/aggregations/reportingByComments?${queryParams}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/movies/aggregations/reportingByComments?${queryParams}`, {
      signal: controller.signal,
      next: { revalidate: 300 },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    console.log(`Comments response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.error(`Comments API error: ${response.status} - ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('Comments result:', result.success ? `${result.data?.length || 0} items` : 'failed');
    
    if (!result.success) {
      return { 
        success: false, 
        error: result.error || 'API returned error response' 
      };
    }

    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error('Error fetching movies with comments:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timed out after 15 seconds'
      };
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error occurred while fetching movies with comments'
    };
  }
}

/**
 * Fetch movies aggregated by year with statistics
 */
export async function fetchMoviesByYear(): Promise<{ success: boolean; error?: string; data?: YearlyStats[] }> {
  try {
    console.log(`Fetching year stats from: ${API_BASE_URL}/api/movies/aggregations/reportingByYear`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/movies/aggregations/reportingByYear`, {
      signal: controller.signal,
      next: { revalidate: 300 },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    console.log(`Year stats response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.error(`Year stats API error: ${response.status} - ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('Year stats result:', result.success ? `${result.data?.length || 0} years` : 'failed');
    
    if (!result.success) {
      return { 
        success: false, 
        error: result.error || 'API returned error response' 
      };
    }

    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error('Error fetching movies by year:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timed out after 15 seconds'
      };
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error occurred while fetching movies by year'
    };
  }
}

/**
 * Fetch directors with most movies and their statistics
 */
export async function fetchDirectorStats(limit: number = 20): Promise<{ success: boolean; error?: string; data?: DirectorStats[] }> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit.toString());

    console.log(`Fetching director stats from: ${API_BASE_URL}/api/movies/aggregations/reportingByDirectors?${queryParams}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/movies/aggregations/reportingByDirectors?${queryParams}`, {
      signal: controller.signal,
      next: { revalidate: 300 },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    console.log(`Director stats response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.error(`Director stats API error: ${response.status} - ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('Director stats result:', result.success ? `${result.data?.length || 0} directors` : 'failed');
    
    if (!result.success) {
      return { 
        success: false, 
        error: result.error || 'API returned error response' 
      };
    }

    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error('Error fetching director stats:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timed out after 15 seconds'
      };
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error occurred while fetching director stats'
    };
  }
}

/**
 * Search movies using MongoDB Search across multiple fields with pagination support
 */
export async function searchMovies(searchParams: {
  plot?: string;
  fullplot?: string;
  directors?: string;
  writers?: string;
  cast?: string;
  limit?: number;
  skip?: number;
  searchOperator?: 'must' | 'should' | 'mustNot' | 'filter';
}): Promise<{ success: boolean; error?: string; movies?: Movie[]; hasNextPage?: boolean; hasPrevPage?: boolean; totalCount?: number }> {
  try {
    // Build query parameters
    const limit = searchParams.limit || 20;
    const skip = searchParams.skip || 0;
    
    const queryParams = new URLSearchParams();
    
    if (searchParams.plot) queryParams.append('plot', searchParams.plot);
    if (searchParams.fullplot) queryParams.append('fullplot', searchParams.fullplot);
    if (searchParams.directors) queryParams.append('directors', searchParams.directors);
    if (searchParams.writers) queryParams.append('writers', searchParams.writers);
    if (searchParams.cast) queryParams.append('cast', searchParams.cast);
    queryParams.append('limit', limit.toString());
    queryParams.append('skip', skip.toString());
    if (searchParams.searchOperator) queryParams.append('searchOperator', searchParams.searchOperator);

    const response = await fetch(`${API_BASE_URL}/api/movies/search?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || result.error?.message || `Failed to search movies: ${response.status}`
      };
    }

    if (!result.success) {
      return {
        success: false,
        error: result.message || result.error?.message || 'API returned error response'
      };
    }

    const responseData = result.data || {};
    const movies = responseData.movies || [];
    const totalCount = responseData.totalCount || 0;
    const hasNextPage = skip + limit < totalCount;
    const hasPrevPage = skip > 0;

    return {
      success: true,
      movies,
      hasNextPage,
      hasPrevPage,
      totalCount
    };
  } catch (error) {
    console.error('Error searching movies:', error);
    return { 
      success: false, 
      error: 'Network error occurred while searching movies' 
    };
  }
}

/**
 * Search movies using MongoDB Vector Search to find movies with similar plots
 */
export async function vectorSearchMovies(searchParams: {
  q: string;
  limit?: number;
}): Promise<{ success: boolean; error?: string; movies?: Movie[]; results?: any[] }> {
  try {
    const limit = searchParams.limit || 10;
    
    const queryParams = new URLSearchParams();
    queryParams.append('q', searchParams.q);
    queryParams.append('limit', limit.toString());

    const response = await fetch(`${API_BASE_URL}/api/movies/vector-search?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        error: result.error || `Failed to perform vector search: ${response.status}` 
      };
    }

    if (!result.success) {
      return { 
        success: false, 
        error: result.error || 'API returned error response' 
      };
    }

    // Transform VectorSearchResult objects to Movie objects for backend compatibility
    const movies: Movie[] = (result.data || []).map((item: any) => {
      // Convert VectorSearchResult to Movie format
      return {
        _id: item._id || item.id, // Handle both _id (Python) and id (Java) field names
        title: item.title || '',
        plot: item.plot || '',
        poster: item.poster,
        year: item.year,
        genres: item.genres || [],
        directors: item.directors || [],
        cast: item.cast || [],
        // Add default values for fields not included in VectorSearchResult
        fullplot: undefined,
        released: undefined,
        runtime: undefined,
        writers: [],
        countries: [],
        languages: [],
        rated: undefined,
        awards: undefined,
        imdb: undefined,
        tomatoes: undefined,
        metacritic: undefined,
        type: undefined
      } as Movie;
    });

    return { 
      success: true, 
      movies,
      results: result.data || []
    };
  } catch (error) {
    console.error('Error performing vector search:', error);
    return { 
      success: false, 
      error: 'Network error occurred while performing vector search' 
    };
  }
}