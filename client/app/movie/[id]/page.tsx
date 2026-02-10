'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchMovieById, updateMovie, deleteMovie } from '@/lib/api';
import { ActionButtons, EditMovieForm } from '../../components';
import { ErrorDisplay, LoadingSpinner } from '../../components/ui';
import { Movie } from '@/types/movie';
import { ROUTES } from '@/lib/constants';
import pageStyles from './page.module.css';

/**
 * Validates that a poster URL is valid for Next.js Image component.
 * Must be an absolute URL (http/https) or a relative path starting with /
 */
const isValidPosterUrl = (url: string | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
};

interface MovieDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function MovieDetailsPage({ params }: MovieDetailsPageProps) {
  const router = useRouter();
  const [movieId, setMovieId] = useState<string>('');
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize params
  useEffect(() => {
    params.then(({ id }) => {
      setMovieId(id);
    });
  }, [params]);

  // Fetch movie data
  useEffect(() => {
    if (!movieId) return;

    const loadMovie = async () => {
      setIsLoading(true);
      setError(null);
      
      const movieData = await fetchMovieById(movieId);
      
      if (movieData) {
        setMovie(movieData);
      } else {
        setError('Movie not found');
      }
      
      setIsLoading(false);
    };

    loadMovie();
  }, [movieId]);

  const handleEdit = () => {
    setIsEditMode(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSave = async (updateData: Partial<Movie>) => {
    if (!movie) return;

    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);

    const result = await updateMovie(movie._id, updateData);

    if (result.success) {
      // Refresh movie data
      const updatedMovie = await fetchMovieById(movie._id);
      if (updatedMovie) {
        setMovie(updatedMovie);
        setSuccessMessage('Movie updated successfully!');
        setIsEditMode(false);
      }
    } else {
      setError(result.error || 'Failed to update movie');
    }

    setIsUpdating(false);
  };

  const handleDelete = async () => {
    if (!movie) return;

    if (!confirm(`Are you sure you want to delete "${movie.title}"? This action cannot be undone.`)) {
      return;
    }

    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);

    const result = await deleteMovie(movie._id);

    if (result.success) {
      setSuccessMessage('Movie deleted successfully! Redirecting...');
      setTimeout(() => {
        router.push(ROUTES.movies);
      }, 2000);
    } else {
      setError(result.error || 'Failed to delete movie');
      setIsUpdating(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={pageStyles.page}>
        <main className={pageStyles.main}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <LoadingSpinner />
            <p>Loading movie details...</p>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error && !movie) {
    return (
      <div className={pageStyles.page}>
        <main className={pageStyles.main}>
          <div className={pageStyles.backLink}>
            <Link href={ROUTES.movies}>← Back to Movies</Link>
          </div>
          <ErrorDisplay 
            message={error} 
            onRetry={() => window.location.reload()} 
          />
        </main>
      </div>
    );
  }

  // No movie found
  if (!movie) {
    return (
      <div className={pageStyles.page}>
        <main className={pageStyles.main}>
          <div className={pageStyles.backLink}>
            <Link href={ROUTES.movies}>← Back to Movies</Link>
          </div>
          <ErrorDisplay 
            message="Movie not found" 
          />
        </main>
      </div>
    );
  }

  return (
    <div className={pageStyles.page}>
      <main className={pageStyles.main}>
        <div className={pageStyles.backLink}>
          <Link href={ROUTES.movies}>← Back to Movies</Link>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className={pageStyles.successMessage}>
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className={pageStyles.errorMessage}>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <ActionButtons
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isUpdating}
          disabled={isEditMode}
        />

        {/* Edit Form or Movie Details */}
        {isEditMode ? (
          <EditMovieForm
            movie={movie}
            onSave={handleSave}
            onCancel={handleCancelEdit}
            isLoading={isUpdating}
          />
        ) : (
          <div className={pageStyles.movieDetails}>
            <div className={pageStyles.posterSection}>
              {isValidPosterUrl(movie.poster) ? (
                <div className={pageStyles.posterContainer}>
                  <Image
                    src={movie.poster!}
                    alt={`${movie.title} poster`}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7Dh5zq6esmOk2cWkgaWKJZoSGEa5qKUlPP45++P//Z"
                  />
                </div>
              ) : (
                <div className={pageStyles.posterPlaceholder}>
                  No Poster Available
                </div>
              )}
            </div>

            <div className={pageStyles.movieInfo}>
              <h1 className={pageStyles.title}>{movie.title}</h1>
              
              <div className={pageStyles.basicInfo}>
                {movie.year && (
                  <div className={pageStyles.infoItem}>
                    <strong>Year:</strong> {movie.year}
                  </div>
                )}

                {movie.rated && (
                  <div className={pageStyles.infoItem}>
                    <strong>Rated:</strong> {movie.rated}
                  </div>
                )}

                {movie.runtime && (
                  <div className={pageStyles.infoItem}>
                    <strong>Runtime:</strong> {movie.runtime} minutes
                  </div>
                )}

                {movie.type && (
                  <div className={pageStyles.infoItem}>
                    <strong>Type:</strong> {movie.type}
                  </div>
                )}
              </div>

              {/* Ratings Section */}
              <div className={pageStyles.ratingsSection}>
                <h3>Ratings</h3>
                <div className={pageStyles.ratingsGrid}>
                  {movie.imdb?.rating && (
                    <div className={pageStyles.ratingCard}>
                      <strong>IMDB</strong>
                      <div className={pageStyles.ratingValue}>
                        ⭐ {movie.imdb.rating}/10
                      </div>
                      {movie.imdb.votes && (
                        <div className={pageStyles.ratingMeta}>
                          {movie.imdb.votes.toLocaleString()} votes
                        </div>
                      )}
                    </div>
                  )}

                  {movie.metacritic && (
                    <div className={pageStyles.ratingCard}>
                      <strong>Metacritic</strong>
                      <div className={pageStyles.ratingValue}>
                        {movie.metacritic}/100
                      </div>
                    </div>
                  )}

                  {movie.tomatoes?.viewer?.rating && (
                    <div className={pageStyles.ratingCard}>
                      <strong>Rotten Tomatoes</strong>
                      <div className={pageStyles.ratingValue}>
                        🍅 {movie.tomatoes.viewer.rating}/5
                      </div>
                      {movie.tomatoes.viewer.numReviews && (
                        <div className={pageStyles.ratingMeta}>
                          {movie.tomatoes.viewer.numReviews} reviews
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {movie.genres && movie.genres.length > 0 && (
                <div className={pageStyles.genres}>
                  <strong>Genres:</strong>
                  <div className={pageStyles.genreList}>
                    {movie.genres.map((genre, index) => (
                      <span key={index} className={pageStyles.genreTag}>
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {movie.plot && (
                <div className={pageStyles.plot}>
                  <h2>Plot</h2>
                  <p>{movie.plot}</p>
                </div>
              )}

              {movie.fullplot && movie.fullplot !== movie.plot && (
                <div className={pageStyles.fullplot}>
                  <h2>Full Plot</h2>
                  <p>{movie.fullplot}</p>
                </div>
              )}

              {/* Cast and Crew */}
              <div className={pageStyles.castCrew}>
                {movie.directors && movie.directors.length > 0 && (
                  <div className={pageStyles.crewSection}>
                    <h3>Directors</h3>
                    <p>{movie.directors.join(', ')}</p>
                  </div>
                )}

                {movie.writers && movie.writers.length > 0 && (
                  <div className={pageStyles.crewSection}>
                    <h3>Writers</h3>
                    <p>{movie.writers.join(', ')}</p>
                  </div>
                )}

                {movie.cast && movie.cast.length > 0 && (
                  <div className={pageStyles.crewSection}>
                    <h3>Cast</h3>
                    <p>{movie.cast.slice(0, 10).join(', ')}{movie.cast.length > 10 ? '...' : ''}</p>
                  </div>
                )}
              </div>

              {/* Additional Information */}
              <div className={pageStyles.additionalInfo}>
                <h3>Additional Information</h3>
                <div className={pageStyles.infoGrid}>
                  {movie.countries && movie.countries.length > 0 && (
                    <div className={pageStyles.infoItem}>
                      <strong>Countries:</strong> {movie.countries.join(', ')}
                    </div>
                  )}

                  {movie.languages && movie.languages.length > 0 && (
                    <div className={pageStyles.infoItem}>
                      <strong>Languages:</strong> {movie.languages.join(', ')}
                    </div>
                  )}

                  {movie.released && (
                    <div className={pageStyles.infoItem}>
                      <strong>Released:</strong> {new Date(movie.released).toLocaleDateString()}
                    </div>
                  )}

                  {movie.awards?.text && (
                    <div className={pageStyles.infoItem}>
                      <strong>Awards:</strong> {movie.awards.text}
                    </div>
                  )}

                  <div className={pageStyles.infoItem}>
                    <strong>Movie ID:</strong> {movie._id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}