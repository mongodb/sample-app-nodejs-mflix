'use client';

import Image from 'next/image';
import Link from 'next/link';
import movieStyles from "./MovieCard.module.css";
import { Movie } from "@/types/movie";
import { ROUTES } from "@/lib/constants";
import React from "react";

/**
 * Movie Card Client Component
 *
 * This component handles the interactive parts of the movie card,
 * such as image error handling and selection checkbox.
 */

/**
 * Validates that a poster URL is valid for Next.js Image component.
 * Must be an absolute URL (http/https) or a relative path starting with /
 */
const isValidPosterUrl = (url: string | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
};

interface MovieCardProps {
  movie: Movie;
  isSelected?: boolean;
  onSelectionChange?: (movieId: string, isSelected: boolean) => void;
  showCheckbox?: boolean;
}

export default function MovieCard({ movie, isSelected = false, onSelectionChange, showCheckbox = false }: MovieCardProps) {
  const handleImageError = () => {
    // This will be handled by the Image component's onError prop
    console.warn(`Failed to load poster for: ${movie.title}`);
  };

  // Handle card click for selection (when checkbox is shown)
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't toggle selection if clicking on the "Get Details" link
    const target = e.target as HTMLElement;
    if (target.closest('a')) {
      return;
    }

    if (showCheckbox && onSelectionChange) {
      onSelectionChange(movie._id, !isSelected);
    }
  };

  return (
    <div
      className={`${movieStyles.movieCard} ${isSelected ? movieStyles.selected : ''} ${showCheckbox ? movieStyles.selectable : ''}`}
      onClick={handleCardClick}
    >
      <div className={movieStyles.moviePoster}>
        {isValidPosterUrl(movie.poster) ? (
          <Image
            src={movie.poster!}
            alt={`${movie.title} poster`}
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 280px"
            onError={handleImageError}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7Dh5zq6esmOk2cWkgaWKJZoSGEa5qKUlPP45++P//Z"
          />
        ) : (
          <div className={movieStyles.posterPlaceholder}>
            No Poster Available
          </div>
        )}
      </div>
      
      <div className={movieStyles.movieInfo}>
        <h3 className={movieStyles.movieTitle}>{movie.title}</h3>
        {movie.year && (
          <p className={movieStyles.movieYear}>({movie.year})</p>
        )}
        {movie.score !== undefined && (
          <p className={movieStyles.vectorScore}>
            🎯 Vector Score: {movie.score.toFixed(4)}
          </p>
        )}
        {movie.imdb?.rating && (
          <p className={movieStyles.movieRating}>⭐ {movie.imdb.rating}/10</p>
        )}
        {movie.genres && movie.genres.length > 0 && (
          <p className={movieStyles.movieGenres}>
            {movie.genres.slice(0, 3).join(', ')}
          </p>
        )}
      </div>
      
      <Link href={ROUTES.movie(movie._id)} className={movieStyles.detailsButton}>
        Get Details
      </Link>
    </div>
  );
}