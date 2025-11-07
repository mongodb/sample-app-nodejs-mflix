'use client';

/**
 * Edit Movie Form Component
 * 
 * Form for editing movie details with validation
 */

import { useState, useEffect } from 'react';
import { Movie } from '../../types/movie';
import styles from './EditMovieForm.module.css';

interface EditMovieFormProps {
  movie: Movie;
  onSave: (updateData: Partial<Movie>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function EditMovieForm({ 
  movie, 
  onSave, 
  onCancel, 
  isLoading = false 
}: EditMovieFormProps) {
  const [formData, setFormData] = useState({
    title: movie.title || '',
    year: movie.year ? movie.year.toString() : '',
    plot: movie.plot || '',
    runtime: movie.runtime ? movie.runtime.toString() : '',
    rated: movie.rated || '',
    genres: movie.genres?.join(', ') || '',
    directors: movie.directors?.join(', ') || '',
    writers: movie.writers?.join(', ') || '',
    cast: movie.cast?.join(', ') || '',
    countries: movie.countries?.join(', ') || '',
    languages: movie.languages?.join(', ') || '',
    poster: movie.poster || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.year && (parseInt(formData.year) < 1800 || parseInt(formData.year) > new Date().getFullYear() + 5)) {
      newErrors.year = 'Please enter a valid year';
    }

    if (formData.runtime && (parseInt(formData.runtime) < 1 || parseInt(formData.runtime) > 1000)) {
      newErrors.runtime = 'Please enter a valid runtime in minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Convert form data back to movie structure
    const updateData: Partial<Movie> = {
      title: formData.title.trim(),
      year: formData.year ? parseInt(formData.year) : undefined,
      plot: formData.plot.trim() || undefined,
      runtime: formData.runtime ? parseInt(formData.runtime) : undefined,
      rated: formData.rated.trim() || undefined,
      genres: formData.genres ? formData.genres.split(',').map(g => g.trim()).filter(g => g) : undefined,
      directors: formData.directors ? formData.directors.split(',').map(d => d.trim()).filter(d => d) : undefined,
      writers: formData.writers ? formData.writers.split(',').map(w => w.trim()).filter(w => w) : undefined,
      cast: formData.cast ? formData.cast.split(',').map(c => c.trim()).filter(c => c) : undefined,
      countries: formData.countries ? formData.countries.split(',').map(c => c.trim()).filter(c => c) : undefined,
      languages: formData.languages ? formData.languages.split(',').map(l => l.trim()).filter(l => l) : undefined,
      poster: formData.poster.trim() || undefined,
    };

    // Remove undefined values
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    // Check if user entered anything for the batch update
    if (Object.keys(updateData).length === 0) {
      setErrors({ general: 'Please fill in at least one field to update' });
      return;
    }

    onSave(cleanedData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Edit Movie</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          {/* Title */}
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
              disabled={isLoading}
              required
            />
            {errors.title && <span className={styles.error}>{errors.title}</span>}
          </div>

          {/* Year */}
          <div className={styles.formGroup}>
            <label htmlFor="year" className={styles.label}>
              Year
            </label>
            <input
              type="number"
              id="year"
              value={formData.year}
              onChange={(e) => handleInputChange('year', e.target.value)}
              className={`${styles.input} ${errors.year ? styles.inputError : ''}`}
              disabled={isLoading}
              min="1800"
              max={new Date().getFullYear() + 5}
            />
            {errors.year && <span className={styles.error}>{errors.year}</span>}
          </div>

          {/* Runtime */}
          <div className={styles.formGroup}>
            <label htmlFor="runtime" className={styles.label}>
              Runtime (minutes)
            </label>
            <input
              type="number"
              id="runtime"
              value={formData.runtime}
              onChange={(e) => handleInputChange('runtime', e.target.value)}
              className={`${styles.input} ${errors.runtime ? styles.inputError : ''}`}
              disabled={isLoading}
              min="1"
              max="1000"
            />
            {errors.runtime && <span className={styles.error}>{errors.runtime}</span>}
          </div>

          {/* Rated */}
          <div className={styles.formGroup}>
            <label htmlFor="rated" className={styles.label}>
              Rating
            </label>
            <input
              type="text"
              id="rated"
              value={formData.rated}
              onChange={(e) => handleInputChange('rated', e.target.value)}
              className={styles.input}
              disabled={isLoading}
              placeholder="PG-13"
            />
          </div>

          {/* Poster URL */}
          <div className={styles.formGroup}>
            <label htmlFor="poster" className={styles.label}>
              Poster URL
            </label>
            <input
              type="url"
              id="poster"
              value={formData.poster}
              onChange={(e) => handleInputChange('poster', e.target.value)}
              className={styles.input}
              disabled={isLoading}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Plot */}
        <div className={styles.formGroup}>
          <label htmlFor="plot" className={styles.label}>
            Plot
          </label>
          <textarea
            id="plot"
            value={formData.plot}
            onChange={(e) => handleInputChange('plot', e.target.value)}
            className={styles.textarea}
            disabled={isLoading}
            rows={4}
            placeholder="Brief plot summary..."
          />
        </div>

        {/* Lists (comma-separated) */}
        <div className={styles.listFields}>
          <div className={styles.formGroup}>
            <label htmlFor="genres" className={styles.label}>
              Genres (comma-separated)
            </label>
            <input
              type="text"
              id="genres"
              value={formData.genres}
              onChange={(e) => handleInputChange('genres', e.target.value)}
              className={styles.input}
              disabled={isLoading}
              placeholder="e.g. Action, Drama, Comedy"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="directors" className={styles.label}>
              Directors (comma-separated)
            </label>
            <input
              type="text"
              id="directors"
              value={formData.directors}
              onChange={(e) => handleInputChange('directors', e.target.value)}
              className={styles.input}
              disabled={isLoading}
              placeholder="e.g. Director 1, Director 2"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="writers" className={styles.label}>
              Writers (comma-separated)
            </label>
            <input
              type="text"
              id="writers"
              value={formData.writers}
              onChange={(e) => handleInputChange('writers', e.target.value)}
              className={styles.input}
              disabled={isLoading}
              placeholder="e.g. Writer 1, Writer 2"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cast" className={styles.label}>
              Cast (comma-separated)
            </label>
            <input
              type="text"
              id="cast"
              value={formData.cast}
              onChange={(e) => handleInputChange('cast', e.target.value)}
              className={styles.input}
              disabled={isLoading}
              placeholder="e.g. Actor 1, Actor 2, Actor 3"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="countries" className={styles.label}>
              Countries (comma-separated)
            </label>
            <input
              type="text"
              id="countries"
              value={formData.countries}
              onChange={(e) => handleInputChange('countries', e.target.value)}
              className={styles.input}
              disabled={isLoading}
              placeholder="e.g. USA, UK, France"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="languages" className={styles.label}>
              Languages (comma-separated)
            </label>
            <input
              type="text"
              id="languages"
              value={formData.languages}
              onChange={(e) => handleInputChange('languages', e.target.value)}
              className={styles.input}
              disabled={isLoading}
              placeholder="e.g. English, Spanish, French"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={`${styles.button} ${styles.cancelButton}`}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`${styles.button} ${styles.saveButton}`}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}