'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import pageStyles from "./page.module.css";
import movieStyles from "./movies.module.css";
import { MovieCard, Pagination, PageSizeSelector, AddMovieForm, BatchEditMovieForm, SearchMovieModal, FilterBar } from "../components";
import { ErrorDisplay, LoadingSpinner } from "../components/ui";
import { fetchMovies, createMovie, createMoviesBatch, deleteMoviesBatch, updateMoviesBatch, searchMovies, vectorSearchMovies, MovieFilterParams } from "../lib/api";
import { Movie } from "@/types/movie";
import { APP_CONFIG, ROUTES } from "@/lib/constants";
import type { SearchParams } from "@/components/SearchMovieModal";

/**
 * Movies Page Component
 * 
 * Main page for browsing movies with the following features:
 * - Regular movie browsing with URL-based pagination
 * - MongoDB text search with server-side pagination
 * - Vector search with client-side pagination
 * - CRUD operations (create, update, delete movies)
 * - Batch operations on selected movies
 * 
 */
export default function Movies() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBatchEditForm, setShowBatchEditForm] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState<Set<string>>(new Set());
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [allVectorSearchResults, setAllVectorSearchResults] = useState<Movie[]>([]);
  const [vectorSearchPage, setVectorSearchPage] = useState(1);
  const [vectorSearchPageSize, setVectorSearchPageSize] = useState(20);
  const [searchHasNextPage, setSearchHasNextPage] = useState(false);
  const [searchHasPrevPage, setSearchHasPrevPage] = useState(false);
  const [searchTotalCount, setSearchTotalCount] = useState(0);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchLimit, setSearchLimit] = useState(20);
  const [currentSearchParams, setCurrentSearchParams] = useState<SearchParams | null>(null);

  // Parse filter parameters from URL for persistence
  const parseFiltersFromUrl = (): MovieFilterParams => {
    const filters: MovieFilterParams = {};

    const genre = searchParams.get('genre');
    const year = searchParams.get('year');
    const minRating = searchParams.get('minRating');
    const maxRating = searchParams.get('maxRating');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');

    if (genre) filters.genre = genre;
    if (year) filters.year = parseInt(year);
    if (minRating) filters.minRating = parseFloat(minRating);
    if (maxRating) filters.maxRating = parseFloat(maxRating);
    if (sortBy && ['title', 'year', 'imdb.rating'].includes(sortBy)) {
      filters.sortBy = sortBy as MovieFilterParams['sortBy'];
    }
    if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
      filters.sortOrder = sortOrder as 'asc' | 'desc';
    }

    return filters;
  };

  // Build URL with filter parameters
  const buildUrlWithFilters = (newPage: number, newLimit: number, filters: MovieFilterParams): string => {
    const params = new URLSearchParams();
    params.set('page', newPage.toString());
    params.set('limit', newLimit.toString());

    if (filters.genre) params.set('genre', filters.genre);
    if (filters.year !== undefined) params.set('year', filters.year.toString());
    if (filters.minRating !== undefined) params.set('minRating', filters.minRating.toString());
    if (filters.maxRating !== undefined) params.set('maxRating', filters.maxRating.toString());
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

    return `${ROUTES.movies}?${params.toString()}`;
  };

  // Get filters from URL on initial load and when URL changes
  const urlFilters = parseFiltersFromUrl();
  const hasUrlFilters = Object.keys(urlFilters).length > 0;

  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(
    parseInt(searchParams.get('limit') || APP_CONFIG.defaultMovieLimit.toString()),
    APP_CONFIG.maxMovieLimit
  );
  const skip = (page - 1) * limit;

  const loadMovies = async (filters?: MovieFilterParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchMovies(limit, skip, filters);
      setMovies(result.movies);
      setHasNextPage(result.hasNextPage);
      setHasPrevPage(result.hasPrevPage);
    } catch (err) {
      setError('Failed to load movies. Make sure the server is running on port 3001.');
      setMovies([]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    // Load movies with filters from URL when page/limit/filters change
    loadMovies(hasUrlFilters ? urlFilters : undefined);
  }, [searchParams]); // Re-run when any URL param changes

  // Handler for filter changes from FilterBar - updates URL
  const handleFilterChange = (filters: MovieFilterParams) => {
    const hasFilters = Object.keys(filters).length > 0;

    // Always reset to page 1 when filters change and update URL
    const newUrl = buildUrlWithFilters(1, limit, filters);
    router.push(newUrl);
  };

  const handleAddMovie = () => {
    setShowAddForm(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSaveMovie = async (moviesData: Omit<Movie, '_id'>[]) => {
    setIsCreating(true);
    setError(null);
    setSuccessMessage(null);

    // Choose between single and batch creation based on number of movies
    if (moviesData.length === 1) {
      // Single movie creation
      const result = await createMovie(moviesData[0]);

      if (result.success) {
        setSuccessMessage('Movie created successfully!');
        setShowAddForm(false);
        
        // Redirect to the new movie's page after a brief delay
        setTimeout(() => {
          router.push(ROUTES.movie(result.movieId!));
        }, 2000);
      } else {
        setError(result.error || 'Failed to create movie');
      }
    } else {
      // Batch movie creation
      const result = await createMoviesBatch(moviesData);

      if (result.success) {
        setSuccessMessage(`Successfully created ${result.insertedCount} movies!`);
        setShowAddForm(false);
        
        // Refresh the movies list after batch creation
        setTimeout(() => {
          loadMovies();
        }, 2000);
      } else {
        setError(result.error || 'Failed to create movies');
      }
    }

    setIsCreating(false);
  };

  const handleMovieSelection = (movieId: string, isSelected: boolean) => {
    setSelectedMovies(prev => {
      const newSelection = new Set(prev);
      if (isSelected) {
        newSelection.add(movieId);
      } else {
        newSelection.delete(movieId);
      }
      return newSelection;
    });
  };

  const handleBatchDelete = () => {
    if (selectedMovies.size > 0) {
      setShowDeleteConfirmation(true);
    }
  };

  const handleBatchUpdate = () => {
    if (selectedMovies.size > 0) {
      setShowBatchEditForm(true);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleCancelBatchEdit = () => {
    setShowBatchEditForm(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSaveBatchEdit = async (updateData: Partial<Movie>) => {
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);

    const movieIds = Array.from(selectedMovies);
    const result = await updateMoviesBatch(movieIds, updateData);

    if (result.success) {
      setSuccessMessage(`Successfully updated ${result.modifiedCount} out of ${result.matchedCount} movies!`);
      setShowBatchEditForm(false);
      setSelectedMovies(new Set()); // Clear selection
      
      // Refresh the movies list
      setTimeout(() => {
        loadMovies();
      }, 1500);
    } else {
      setError(result.error || 'Failed to update movies');
    }

    setIsUpdating(false);
  };

  const confirmBatchDelete = async () => {
    setIsDeleting(true);
    setError(null);
    setSuccessMessage(null);
    setShowDeleteConfirmation(false);

    const movieIds = Array.from(selectedMovies);
    const result = await deleteMoviesBatch(movieIds);

    if (result.success) {
      setSuccessMessage(`Successfully deleted ${result.deletedCount} movies!`);
      setSelectedMovies(new Set()); // Clear selection
      
      // Refresh the movies list
      setTimeout(() => {
        loadMovies();
      }, 1500);
    } else {
      setError(result.error || 'Failed to delete movies');
    }

    setIsDeleting(false);
  };

  const cancelBatchDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const handleSearch = () => {
    setShowSearchModal(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancelSearch = () => {
    setShowSearchModal(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSearchSubmit = async (searchParams: SearchParams) => {
    setIsSearching(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let result;

      if (searchParams.searchType === 'vector-search') {
        // Vector Search: Use the limit from search params as the fetch limit
        const vectorSearchParams = {
          q: searchParams.q!,
          limit: searchParams.limit || 50, // This is how many results to fetch from backend
        };
        
        result = await vectorSearchMovies(vectorSearchParams);
        
        if (result.success) {
          const allResults = result.movies || [];
          const pageSize = APP_CONFIG.vectorSearchPageSize; // Fixed page size for UI display
          
          setAllVectorSearchResults(allResults);
          setVectorSearchPage(1);
          setVectorSearchPageSize(pageSize);
          
          // Calculate first page of results for immediate display
          const firstPageResults = allResults.slice(0, pageSize);
          setSearchResults(firstPageResults);
          
          // Set pagination state for vector search
          setSearchTotalCount(allResults.length);
        }
      } else {
        // MongoDB Search
        const searchSkip = 0; // Always start from page 1 for new searches
        const searchLimitToUse = searchParams.limit || 20;
        
        const searchParamsWithPagination = {
          ...searchParams,
          limit: searchLimitToUse,
          skip: searchSkip,
        };

        result = await searchMovies(searchParamsWithPagination);
        
        if (result.success) {
          setSearchResults(result.movies || []);
          setSearchHasNextPage(result.hasNextPage || false);
          setSearchHasPrevPage(result.hasPrevPage || false);
          setSearchTotalCount(result.totalCount || 0);
        }
      }

      if (result.success) {
        setIsSearchMode(true);
        setSearchPage(1);
        setSearchLimit(searchParams.limit || 20);
        setCurrentSearchParams(searchParams);
        setShowSearchModal(false);
        setSelectedMovies(new Set()); // Clear selection when switching to search mode
        
        if (searchParams.searchType === 'vector-search') {
          const returnedCount = result.movies?.length || 0;
          
          if (returnedCount === 0) {
            setSuccessMessage('Vector search completed, but no movies matched your query. Try different search terms.');
          } else {
            setSuccessMessage(`Found ${returnedCount} results using vector search.`);
          }
        } else {
          // MongoDB text search success message
          const totalCount = (result as any).totalCount || 0;
          
          if (totalCount === 0) {
            setSuccessMessage('Search completed, but no movies matched your criteria. Try different search terms.');
          } else {
            setSuccessMessage(`Found ${totalCount} results using MongoDB search.`);
          }
        }
      } else {
        setError(result.error || 'Failed to search movies');
      }
    } catch (err) {
      setError('An unexpected error occurred while searching');
    }

    setIsSearching(false);
  };

  /**
   * Clears search mode and returns to regular movie browsing
   * Resets all search-related state including vector search pagination
   */
  const handleClearSearch = () => {
    setIsSearchMode(false);
    setSearchResults([]);
    setAllVectorSearchResults([]);
    setVectorSearchPage(1);
    setSearchHasNextPage(false);
    setSearchHasPrevPage(false);
    setSearchTotalCount(0);
    setSearchPage(1);
    setCurrentSearchParams(null);
    setSelectedMovies(new Set());
    setError(null);
    setSuccessMessage(null);
    // The current movies will show the regular paginated results
  };

  // Get the movies to display based on current mode
  const displayMovies = isSearchMode ? searchResults : movies;

  /**
   * Helper function for vector search client-side pagination
   * Calculates pagination data for the current vector search results
   */
  const getVectorSearchPageData = () => {
    if (!isSearchMode || currentSearchParams?.searchType !== 'vector-search') {
      return { paginatedResults: [], hasNext: false, hasPrev: false, totalPages: 0 };
    }

    const totalResults = allVectorSearchResults.length;
    const totalPages = Math.ceil(totalResults / vectorSearchPageSize);
    const hasNext = vectorSearchPage < totalPages;
    const hasPrev = vectorSearchPage > 1;
    
    const startIndex = (vectorSearchPage - 1) * vectorSearchPageSize;
    const endIndex = startIndex + vectorSearchPageSize;
    const paginatedResults = allVectorSearchResults.slice(startIndex, endIndex);
    
    return {
      paginatedResults,
      hasNext,
      hasPrev,
      totalPages
    };
  };

  /**
   * Handles page navigation for vector search results (client-side pagination)
   * Slices the cached results and updates the display
   */
  const handleVectorSearchPageChange = (newPage: number) => {
    if (!isSearchMode || currentSearchParams?.searchType !== 'vector-search') return;
    
    const totalPages = Math.ceil(allVectorSearchResults.length / vectorSearchPageSize);
    if (newPage < 1 || newPage > totalPages) return;
    
    setVectorSearchPage(newPage);
    
    // Update the displayed results based on the new page
    const startIndex = (newPage - 1) * vectorSearchPageSize;
    const endIndex = startIndex + vectorSearchPageSize;
    const paginatedResults = allVectorSearchResults.slice(startIndex, endIndex);
    
    setSearchResults(paginatedResults);
    setSearchHasNextPage(newPage < totalPages);
    setSearchHasPrevPage(newPage > 1);
    
    // Clear selection and scroll to top for better UX
    setSelectedMovies(new Set());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchPageChange = async (newPage: number) => {
    if (!currentSearchParams) return;
    
    // This function handles MongoDB search pagination (server-side)
    // Vector search uses handleVectorSearchPageChange for client-side pagination
    if (currentSearchParams.searchType === 'vector-search') {
      return;
    }
    
    // Validate page number and prevent invalid navigation
    if (newPage < 1) return;
    if (isSearching) return;
    if (newPage > searchPage && !searchHasNextPage) return;
    
    setIsSearching(true);
    setError(null);
    
    const searchSkip = (newPage - 1) * searchLimit;
    const searchParamsWithPagination = {
      ...currentSearchParams,
      limit: searchLimit,
      skip: searchSkip,
    };

    try {
      const result = await searchMovies(searchParamsWithPagination);
      
      if (result.success) {
        setSearchResults(result.movies || []);
        setSearchHasNextPage(result.hasNextPage || false);
        setSearchHasPrevPage(result.hasPrevPage || false);
        setSearchTotalCount(result.totalCount || 0);
        setSearchPage(newPage);
        
        // Clear any previously selected movies when changing pages
        setSelectedMovies(new Set());
        
        // Scroll to top to show new results
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(result.error || 'Failed to load search results');
      }
    } catch (error) {
      console.error('Search pagination error:', error);
      setError('Failed to load search results');
    }
    
    setIsSearching(false);
  };

  if (isLoading && !showAddForm) {
    return (
      <div className={pageStyles.page}>
        <main className={pageStyles.main}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <LoadingSpinner />
            <p>Loading movies...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={pageStyles.page}>
      <main className={pageStyles.main}>
        <div className={movieStyles.pageHeader}>
          <h1 className={movieStyles.pageTitle}>
            {isSearchMode ? `Search Results` : hasUrlFilters ? 'Filtered Movies' : 'Movies'}
          </h1>
          
          <div className={movieStyles.headerActions}>
            {/* Search and Clear Search Controls */}
            {!showAddForm && !showBatchEditForm && !showSearchModal && (
              <div className={movieStyles.searchControls}>
                {isSearchMode && (
                  <button
                    onClick={handleClearSearch}
                    className={movieStyles.clearSearchButton}
                    type="button"
                  >
                    ← Back to All Movies
                  </button>
                )}
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className={movieStyles.searchButton}
                  type="button"
                >
                  {isSearching ? 'Searching...' : 'Search Movies'}
                </button>
              </div>
            )}

            {!isSearchMode && (
              <button
                onClick={handleAddMovie}
                disabled={showAddForm || showBatchEditForm || showSearchModal || isCreating}
                className={movieStyles.addButton}
                type="button"
              >
                {isCreating ? 'Creating...' : '+ Add Movie'}
              </button>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className={movieStyles.successMessage}>
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className={movieStyles.errorMessage}>
            {error}
          </div>
        )}

        {/* Add Movie Form */}
        {showAddForm && (
          <AddMovieForm
            onSave={handleSaveMovie}
            onCancel={handleCancelAdd}
            isLoading={isCreating}
          />
        )}

        {/* Search Movie Modal */}
        {showSearchModal && (
          <SearchMovieModal
            onSearch={handleSearchSubmit}
            onCancel={handleCancelSearch}
            isLoading={isSearching}
          />
        )}

        {/* Batch Edit Movie Form */}
        {showBatchEditForm && (
          <BatchEditMovieForm
            selectedCount={selectedMovies.size}
            onSave={handleSaveBatchEdit}
            onCancel={handleCancelBatchEdit}
            isLoading={isUpdating}
          />
        )}

        {/* Page Size Selector - only show for regular mode */}
        {!showAddForm && !showBatchEditForm && !showSearchModal && !isSearchMode && <PageSizeSelector currentLimit={limit} />}

        {/* Filter Bar - display when not in search mode and not showing forms */}
        {!showAddForm && !showBatchEditForm && !showSearchModal && !isSearchMode && (
          <FilterBar
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
            initialFilters={urlFilters}
          />
        )}

        {/* Movies Content */}
        {!showAddForm && !showBatchEditForm && !showSearchModal && (
          <>
            {error && displayMovies.length === 0 ? (
              <ErrorDisplay
                message={error}
                onRetry={isSearchMode ? () => handleSearchSubmit(currentSearchParams!) : () => loadMovies(hasUrlFilters ? urlFilters : undefined)}
              />
            ) : displayMovies.length === 0 ? (
              <div className={movieStyles.noMovies}>
                <p>
                  {isSearchMode
                    ? 'No movies found matching your search criteria. Try different search terms.'
                    : hasUrlFilters
                    ? 'No movies found matching your filter criteria. Try adjusting your filters.'
                    : 'No movies found. Make sure the server is running on port 3001.'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className={movieStyles.moviesGrid}>
                  {displayMovies.map((movie) => (
                    <MovieCard 
                      key={movie._id} 
                      movie={movie} 
                      isSelected={selectedMovies.has(movie._id)}
                      onSelectionChange={handleMovieSelection}
                      showCheckbox={!showAddForm && !showBatchEditForm && !showSearchModal}
                    />
                  ))}
                </div>
                
                {/* Show pagination based on current mode */}
                {isSearchMode ? (
                  currentSearchParams?.searchType === 'mongodb-search' ? (
                    <nav className={movieStyles.pagination} aria-label="Search results pagination">
                      <div className={movieStyles.paginationContainer}>
                        {/* Previous Button */}
                        {searchHasPrevPage && !isSearching ? (
                          <button
                            onClick={() => handleSearchPageChange(searchPage - 1)}
                            className={movieStyles.pageButton}
                            disabled={isSearching}
                            aria-label="Go to previous page"
                          >
                            ← Previous
                          </button>
                        ) : (
                          <span className={`${movieStyles.pageButton} ${movieStyles.disabled}`}>
                            ← Previous
                          </span>
                        )}

                        {/* Current Page Info */}
                        <div className={movieStyles.pageInfo}>
                          Page {searchPage} {searchTotalCount > 0 ? `of ${Math.ceil(searchTotalCount / searchLimit)}` : ''}
                        </div>

                        {/* Next Button */}
                        {searchHasNextPage && !isSearching ? (
                          <button
                            onClick={() => handleSearchPageChange(searchPage + 1)}
                            className={movieStyles.pageButton}
                            disabled={isSearching}
                            aria-label="Go to next page"
                          >
                            Next →
                          </button>
                        ) : (
                          <span className={`${movieStyles.pageButton} ${movieStyles.disabled}`}>
                            Next →
                          </span>
                        )}
                      </div>

                      {/* Additional Info */}
                      <div className={movieStyles.additionalInfo}>
                        {searchLimit} movies per page • {searchTotalCount} total results
                      </div>
                    </nav>
                  ) : (
                    /* Vector search results with client-side pagination */
                    (() => {
                      const { hasNext, hasPrev, totalPages } = getVectorSearchPageData();
                      
                      if (totalPages > 1) {
                        return (
                          <nav className={movieStyles.pagination} aria-label="Vector search results pagination">
                            <div className={movieStyles.paginationContainer}>
                              {/* Previous Button */}
                              {hasPrev ? (
                                <button
                                  onClick={() => handleVectorSearchPageChange(vectorSearchPage - 1)}
                                  className={movieStyles.pageButton}
                                  aria-label="Go to previous page"
                                >
                                  ← Previous
                                </button>
                              ) : (
                                <span className={`${movieStyles.pageButton} ${movieStyles.disabled}`}>
                                  ← Previous
                                </span>
                              )}

                              {/* Current Page Info */}
                              <div className={movieStyles.pageInfo}>
                                Page {vectorSearchPage} of {totalPages}
                              </div>

                              {/* Next Button */}
                              {hasNext ? (
                                <button
                                  onClick={() => handleVectorSearchPageChange(vectorSearchPage + 1)}
                                  className={movieStyles.pageButton}
                                  aria-label="Go to next page"
                                >
                                  Next →
                                </button>
                              ) : (
                                <span className={`${movieStyles.pageButton} ${movieStyles.disabled}`}>
                                  Next →
                                </span>
                              )}
                            </div>

                            {/* Additional Info */}
                            <div className={movieStyles.additionalInfo}>
                              {vectorSearchPageSize} movies per page • {allVectorSearchResults.length} total results
                            </div>
                          </nav>
                        );
                      } else {
                        return (
                          <div className={movieStyles.searchInfo}>
                            Showing {allVectorSearchResults.length} results (vector search)
                          </div>
                        );
                      }
                    })()
                  )
                ) : (
                  <Pagination
                    currentPage={page}
                    hasNextPage={hasNextPage}
                    hasPrevPage={hasPrevPage}
                    limit={limit}
                  />
                )}
              </>
            )}
          </>
        )}

        {/* Batch Delete Confirmation Dialog */}
        {showDeleteConfirmation && (
          <div className={movieStyles.confirmationOverlay}>
            <div className={movieStyles.confirmationDialog}>
              <h3 className={movieStyles.confirmationTitle}>Confirm Batch Delete</h3>
              <p className={movieStyles.confirmationMessage}>
                Are you sure you want to delete {selectedMovies.size} selected movie{selectedMovies.size !== 1 ? 's' : ''}?
                This action cannot be undone.
              </p>
              <div className={movieStyles.confirmationActions}>
                <button
                  onClick={cancelBatchDelete}
                  className={movieStyles.cancelButton}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBatchDelete}
                  className={movieStyles.confirmDeleteButton}
                  type="button"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contextual Bottom Selection Bar */}
        {selectedMovies.size > 0 && !showAddForm && !showBatchEditForm && !showSearchModal && (
          <div className={movieStyles.selectionBar}>
            <div className={movieStyles.selectionBarContent}>
              <div className={movieStyles.selectionInfo}>
                <span className={movieStyles.selectionCount}>
                  {selectedMovies.size} movie{selectedMovies.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedMovies(new Set())}
                  className={movieStyles.deselectAllButton}
                  type="button"
                >
                  Deselect all
                </button>
              </div>
              <div className={movieStyles.selectionActions}>
                <button
                  onClick={handleBatchUpdate}
                  disabled={isUpdating}
                  className={movieStyles.editSelectedButton}
                  type="button"
                >
                  {isUpdating ? 'Updating...' : 'Edit Selected'}
                </button>
                <button
                  onClick={handleBatchDelete}
                  disabled={isDeleting}
                  className={movieStyles.deleteSelectedButton}
                  type="button"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Selected'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
