'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import styles from './FilterBar.module.css';
import { fetchGenres, fetchYearBounds, type MovieFilterParams } from '@/lib/api';

const SORT_OPTIONS = [
  { value: 'title', label: 'Title' },
  { value: 'year', label: 'Year' },
  { value: 'imdb.rating', label: 'IMDB Rating' },
];

interface FilterBarProps {
  onFilterChange: (filters: MovieFilterParams) => void;
  isLoading?: boolean;
  initialFilters?: MovieFilterParams;
}

/**
 * Compares two MovieFilterParams objects for equality.
 * Returns true if all filter values match.
 */
function areFiltersEqual(a: MovieFilterParams, b: MovieFilterParams): boolean {
  return (
    a.genre === b.genre &&
    a.year === b.year &&
    a.minRating === b.minRating &&
    a.maxRating === b.maxRating &&
    a.sortBy === b.sortBy &&
    a.sortOrder === b.sortOrder
  );
}

export default function FilterBar({
  onFilterChange,
  isLoading = false,
  initialFilters = {}
}: FilterBarProps) {
  const [filters, setFilters] = useState<MovieFilterParams>(initialFilters);
  const [genres, setGenres] = useState<string[]>([]);
  const [isLoadingGenres, setIsLoadingGenres] = useState(true);
  const [maxDatasetYear, setMaxDatasetYear] = useState<number | null>(null);
  const [minDatasetYear, setMinDatasetYear] = useState<number | null>(null);

  // Track previous initialFilters to detect changes
  const prevInitialFiltersRef = useRef<MovieFilterParams>(initialFilters);

  // Fetch genres from the API on mount
  useEffect(() => {
    async function loadGenres() {
      setIsLoadingGenres(true);
      const fetchedGenres = await fetchGenres();
      setGenres(fetchedGenres);
      setIsLoadingGenres(false);
    }
    loadGenres();
  }, []);

  // Fetch year bounds from the API on mount
  useEffect(() => {
    async function loadYearBounds() {
      console.log('FilterBar: Fetching year bounds...');
      const result = await fetchYearBounds();
      console.log('FilterBar: Year bounds result:', result);
      if (result.success) {
        if (result.maxYear) {
          console.log('FilterBar: Setting maxDatasetYear to', result.maxYear);
          setMaxDatasetYear(result.maxYear);
        }
        if (result.minYear) {
          console.log('FilterBar: Setting minDatasetYear to', result.minYear);
          setMinDatasetYear(result.minYear);
        }
      } else {
        console.warn('FilterBar: Failed to fetch year bounds:', result.error);
      }
    }
    loadYearBounds();
  }, []);

  // Sync internal state when initialFilters changes (e.g. from URL navigation)
  useEffect(() => {
    if (!areFiltersEqual(prevInitialFiltersRef.current, initialFilters)) {
      setFilters(initialFilters);
      prevInitialFiltersRef.current = initialFilters;
    }
  }, [initialFilters]);

  const handleFilterChange = useCallback((key: keyof MovieFilterParams, value: string | number | undefined) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value === '' || value === undefined) {
        delete newFilters[key];
      } else {
        (newFilters as Record<string, unknown>)[key] = value;
      }
      return newFilters;
    });
  }, []);

  const handleApplyFilters = useCallback(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    onFilterChange({});
  }, [onFilterChange]);

  const hasActiveFilters = Object.keys(filters).length > 0;

  const activeFilterChips: { key: string; label: string }[] = [];
  if (filters.genre) activeFilterChips.push({ key: 'genre', label: `Genre: ${filters.genre}` });
  if (filters.year) activeFilterChips.push({ key: 'year', label: `Year: ${filters.year}` });
  if (filters.minRating !== undefined) activeFilterChips.push({ key: 'minRating', label: `Min Rating: ${filters.minRating}` });
  if (filters.maxRating !== undefined) activeFilterChips.push({ key: 'maxRating', label: `Max Rating: ${filters.maxRating}` });
  if (filters.sortBy) {
    const sortLabel = SORT_OPTIONS.find(o => o.value === filters.sortBy)?.label || filters.sortBy;
    activeFilterChips.push({ key: 'sort', label: `Sort: ${sortLabel} (${filters.sortOrder || 'asc'})` });
  }

  const removeFilter = (key: string) => {
    if (key === 'sort') {
      handleFilterChange('sortBy', undefined);
      handleFilterChange('sortOrder', undefined);
    } else {
      handleFilterChange(key as keyof MovieFilterParams, undefined);
    }
  };

  return (
    <div className={styles.filterBar}>
      <div className={styles.filterHeader}>
        <h3 className={styles.filterTitle}>
          Filter Movies
        </h3>
        {hasActiveFilters && (
          <button className={styles.clearFiltersButton} onClick={handleClearFilters} type="button">
            Clear All
          </button>
        )}
      </div>

      <div className={styles.filterControls}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Genre</label>
          <select
            className={styles.filterSelect}
            value={filters.genre || ''}
            onChange={(e) => handleFilterChange('genre', e.target.value)}
            disabled={isLoading || isLoadingGenres}
          >
            <option value="">{isLoadingGenres ? 'Loading...' : 'All Genres'}</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          {maxDatasetYear && filters.year && filters.year > maxDatasetYear && (
            <span className={styles.yearWarning}>
              Dataset only contains movies up to {maxDatasetYear}
            </span>
          )}
          {minDatasetYear && filters.year && filters.year < minDatasetYear && (
            <span className={styles.yearWarning}>
              Dataset only contains movies from {minDatasetYear} onwards
            </span>
          )}
          <label className={styles.filterLabel}>Year</label>
          <input
            type="number"
            className={`${styles.filterInput} ${(maxDatasetYear && filters.year && filters.year > maxDatasetYear) || (minDatasetYear && filters.year && filters.year < minDatasetYear) ? styles.inputWarning : ''}`}
            placeholder="e.g. 2010"
            value={filters.year || ''}
            onChange={(e) => handleFilterChange('year', e.target.value ? parseInt(e.target.value) : undefined)}
            disabled={isLoading}
            min={minDatasetYear || undefined}
            max={maxDatasetYear || undefined}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>IMDB Rating</label>
          <div className={styles.ratingGroup}>
            <input
              type="number"
              className={`${styles.filterInput} ${styles.ratingInput}`}
              placeholder="Min"
              value={filters.minRating ?? ''}
              onChange={(e) => handleFilterChange('minRating', e.target.value ? parseFloat(e.target.value) : undefined)}
              disabled={isLoading}
              min={0}
              max={10}
              step={0.1}
            />
            <span className={styles.ratingDivider}>to</span>
            <input
              type="number"
              className={`${styles.filterInput} ${styles.ratingInput}`}
              placeholder="Max"
              value={filters.maxRating ?? ''}
              onChange={(e) => handleFilterChange('maxRating', e.target.value ? parseFloat(e.target.value) : undefined)}
              disabled={isLoading}
              min={0}
              max={10}
              step={0.1}
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sort By</label>
          <select
            className={styles.filterSelect}
            value={filters.sortBy || 'title'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value as MovieFilterParams['sortBy'])}
            disabled={isLoading}
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Order</label>
          <select
            className={styles.filterSelect}
            value={filters.sortOrder || 'asc'}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
            disabled={isLoading || !filters.sortBy}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        <button
          className={styles.applyButton}
          onClick={handleApplyFilters}
          disabled={isLoading}
          type="button"
        >
          {isLoading ? 'Loading...' : 'Apply Filters'}
        </button>
      </div>

      {activeFilterChips.length > 0 && (
        <div className={styles.activeFilters}>
          {activeFilterChips.map(chip => (
            <span key={chip.key} className={styles.filterChip}>
              {chip.label}
              <button
                className={styles.chipRemove}
                onClick={() => removeFilter(chip.key)}
                type="button"
                aria-label={`Remove ${chip.label} filter`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

