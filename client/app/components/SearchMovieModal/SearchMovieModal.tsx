'use client';

/**
 * Search Movie Modal Component
 * 
 * Modal for searching movies across multiple fields using MongoDB Search.
 * Supports plot, fullplot, directors, writers, cast fields with search operator options.
 */

import { useState } from 'react';
import styles from './SearchMovieModal.module.css';

interface SearchMovieModalProps {
  onSearch: (searchParams: SearchParams) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export type SearchType = 'mongodb-search' | 'vector-search';

export interface SearchParams {
  searchType: SearchType;
  // MongoDB Search fields
  plot?: string;
  fullplot?: string;
  directors?: string;
  writers?: string;
  cast?: string;
  limit?: number;
  skip?: number;
  searchOperator?: 'must' | 'should' | 'mustNot' | 'filter';
  // Vector Search fields
  q?: string;
}

interface SearchFormData {
  searchType: SearchType;
  // MongoDB Search fields
  plot: string;
  fullplot: string;
  directors: string;
  writers: string;
  cast: string;
  limit: string;
  searchOperator: 'must' | 'should' | 'mustNot' | 'filter';
  // Vector Search fields
  q: string;
}

const getInitialFormData = (): SearchFormData => ({
  searchType: 'mongodb-search',
  // MongoDB Search fields
  plot: '',
  fullplot: '',
  directors: '',
  writers: '',
  cast: '',
  limit: '20',
  searchOperator: 'must',
  // Vector Search fields
  q: '',
});

export default function SearchMovieModal({ 
  onSearch, 
  onCancel, 
  isLoading = false
}: SearchMovieModalProps) {
  const [formData, setFormData] = useState<SearchFormData>(getInitialFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.searchType === 'mongodb-search') {
      // Check if at least one search field has a value for MongoDB Search
      const hasSearchInput = formData.plot.trim() || 
                            formData.fullplot.trim() || 
                            formData.directors.trim() || 
                            formData.writers.trim() || 
                            formData.cast.trim();

      if (!hasSearchInput) {
        newErrors.general = 'Please enter search terms in at least one field';
      }
    } else if (formData.searchType === 'vector-search') {
      // Check if query field has a value for Vector Search
      if (!formData.q.trim()) {
        newErrors.q = 'Please enter a search query.';
      }
    }

    // Validate limit
    const limitNum = parseInt(formData.limit);
    if (!limitNum || limitNum < 1 || limitNum > 100) {
      newErrors.limit = 'Limit must be between 1 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Build search parameters based on search type
    const searchParams: SearchParams = {
      searchType: formData.searchType,
      limit: parseInt(formData.limit),
    };

    if (formData.searchType === 'mongodb-search') {
      // Add MongoDB Search specific parameters
      searchParams.searchOperator = formData.searchOperator;
      searchParams.skip = 0; // Always start from beginning for new search

      if (formData.plot.trim()) {
        searchParams.plot = formData.plot.trim();
      }
      if (formData.fullplot.trim()) {
        searchParams.fullplot = formData.fullplot.trim();
      }
      if (formData.directors.trim()) {
        searchParams.directors = formData.directors.trim();
      }
      if (formData.writers.trim()) {
        searchParams.writers = formData.writers.trim();
      }
      if (formData.cast.trim()) {
        searchParams.cast = formData.cast.trim();
      }
    } else if (formData.searchType === 'vector-search') {
      // Add Vector Search specific parameters
      searchParams.q = formData.q.trim();
    }

    onSearch(searchParams);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  const handleClear = () => {
    setFormData(getInitialFormData());
    setErrors({});
  };

  const searchOperatorOptions = [
    { value: 'must', label: 'Must match all fields (AND)', description: 'All specified fields must match' },
    { value: 'should', label: 'Should match any field (OR)', description: 'At least one field should match' },
    { value: 'mustNot', label: 'Must not match', description: 'Results must NOT contain these terms' },
    { value: 'filter', label: 'Filter results', description: 'Filter results by these criteria' },
  ];

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Search Movies</h2>
      <p className={styles.batchDescription}>
        {formData.searchType === 'mongodb-search' 
          ? 'Search across movie plots, directors, writers, and cast.'
          : 'Find movies with similar plots using semantic search.'
        }
      </p>
      
      {errors.general && (
        <div className={styles.generalError}>
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Search Type Selector */}
        <div className={styles.formGroup}>
          <label htmlFor="searchType" className={styles.label}>
            Search Type
          </label>
          <select
            id="searchType"
            value={formData.searchType}
            onChange={(e) => handleInputChange('searchType', e.target.value)}
            className={styles.input}
            disabled={isLoading}
          >
            <option value="mongodb-search">MongoDB Search</option>
            <option value="vector-search">MongoDB Vector Search</option>
          </select>
          <small className={styles.searchOperatorDescription}>
            {formData.searchType === 'mongodb-search' 
              ? 'Search across multiple fields by using text matching and compound operators'
              : 'Find movies with similar plots using AI-powered semantic search'
            }
          </small>
        </div>

        {/* Conditional Form Fields */}
        {formData.searchType === 'mongodb-search' ? (
          <>
            {/* Plot Search Section */}
            <div className={styles.fieldSection}>
              <h3 className={styles.sectionTitle}>Plot Search</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="plot" className={styles.label}>
                    Plot Keywords
                  </label>
                  <input
                    type="text"
                    id="plot"
                    value={formData.plot}
                    onChange={(e) => handleInputChange('plot', e.target.value)}
                    className={`${styles.input} ${errors.plot ? styles.inputError : ''}`}
                    disabled={isLoading}
                    placeholder="Search in short plot summaries"
                  />
                  {errors.plot && <span className={styles.error}>{errors.plot}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="fullplot" className={styles.label}>
                    Full Plot Keywords
                  </label>
                  <input
                    type="text"
                    id="fullplot"
                    value={formData.fullplot}
                    onChange={(e) => handleInputChange('fullplot', e.target.value)}
                    className={`${styles.input} ${errors.fullplot ? styles.inputError : ''}`}
                    disabled={isLoading}
                    placeholder="Search in detailed plot descriptions"
                  />
                  {errors.fullplot && <span className={styles.error}>{errors.fullplot}</span>}
                </div>
              </div>
            </div>

            {/* People Search Section */}
            <div className={styles.fieldSection}>
              <h3 className={styles.sectionTitle}>People Search</h3>
              <small className={styles.searchOperatorDescription} style={{ marginTop: '-0.5rem', marginBottom: '1rem', display: 'block' }}>
                Fuzzy matching enabled – tolerates minor typos
              </small>
              <div className={styles.formGridThreeCol}>
                <div className={styles.formGroup}>
                  <label htmlFor="directors" className={styles.label}>
                    Directors
                  </label>
                  <input
                    type="text"
                    id="directors"
                    value={formData.directors}
                    onChange={(e) => handleInputChange('directors', e.target.value)}
                    className={`${styles.input} ${errors.directors ? styles.inputError : ''}`}
                    disabled={isLoading}
                    placeholder="e.g. James Cameron"
                  />
                  {errors.directors && <span className={styles.error}>{errors.directors}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="writers" className={styles.label}>
                    Writers
                  </label>
                  <input
                    type="text"
                    id="writers"
                    value={formData.writers}
                    onChange={(e) => handleInputChange('writers', e.target.value)}
                    className={`${styles.input} ${errors.writers ? styles.inputError : ''}`}
                    disabled={isLoading}
                    placeholder="e.g. Aaron Sorkin"
                  />
                  {errors.writers && <span className={styles.error}>{errors.writers}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="cast" className={styles.label}>
                    Cast
                  </label>
                  <input
                    type="text"
                    id="cast"
                    value={formData.cast}
                    onChange={(e) => handleInputChange('cast', e.target.value)}
                    className={`${styles.input} ${errors.cast ? styles.inputError : ''}`}
                    disabled={isLoading}
                    placeholder="e.g. Tom Hanks"
                  />
                  {errors.cast && <span className={styles.error}>{errors.cast}</span>}
                </div>
              </div>
            </div>

            {/* Search Options Section */}
            <div className={styles.fieldSection}>
              <h3 className={styles.sectionTitle}>Search Options</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="searchOperator" className={styles.label}>
                    Search Logic
                  </label>
                  <select
                    id="searchOperator"
                    value={formData.searchOperator}
                    onChange={(e) => handleInputChange('searchOperator', e.target.value)}
                    className={styles.input}
                    disabled={isLoading}
                  >
                    {searchOperatorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <small className={styles.searchOperatorDescription}>
                    {searchOperatorOptions.find(opt => opt.value === formData.searchOperator)?.description}
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="limit" className={styles.label}>
                    Max Results
                  </label>
                  <input
                    type="number"
                    id="limit"
                    value={formData.limit}
                    onChange={(e) => handleInputChange('limit', e.target.value)}
                    className={`${styles.input} ${errors.limit ? styles.inputError : ''}`}
                    disabled={isLoading}
                    min="1"
                    max="100"
                  />
                  {errors.limit && <span className={styles.error}>{errors.limit}</span>}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Vector Search Fields */}
            <div className={styles.fieldSection}>
              <h3 className={styles.sectionTitle}>Semantic Search</h3>
              <div className={styles.formGroup}>
                <label htmlFor="q" className={styles.label}>
                  Search Query
                </label>
                <textarea
                  id="q"
                  value={formData.q}
                  onChange={(e) => handleInputChange('q', e.target.value)}
                  className={`${styles.input} ${errors.q ? styles.inputError : ''}`}
                  disabled={isLoading}
                  placeholder="e.g. 'A story about friendship and adventure in space'"
                  rows={3}
                />
                {errors.q && <span className={styles.error}>{errors.q}</span>}
                <small className={styles.searchOperatorDescription}>
                  Describe the plot, theme, or mood you're looking for. MongoDB will find movies with similar content.
                </small>
              </div>

              <div className={styles.formGroup} style={{ marginTop: '1rem', maxWidth: '200px' }}>
                <label htmlFor="limit_vector" className={styles.label}>
                  Max Results
                </label>
                <input
                  type="number"
                  id="limit_vector"
                  value={formData.limit}
                  onChange={(e) => handleInputChange('limit', e.target.value)}
                  className={`${styles.input} ${errors.limit ? styles.inputError : ''}`}
                  disabled={isLoading}
                  min="1"
                  max="50"
                />
                {errors.limit && <span className={styles.error}>{errors.limit}</span>}
              </div>
            </div>
          </>
        )}

        {/* Form Actions */}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={handleClear}
            className={`${styles.button} ${styles.clearButton}`}
            disabled={isLoading}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={`${styles.button} ${styles.cancelButton}`}
            disabled={isLoading}
          >
            Close
          </button>
          <button
            type="submit"
            className={`${styles.button} ${styles.saveButton}`}
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : `Search Movies`}
          </button>
        </div>
      </form>
    </div>
  );
}