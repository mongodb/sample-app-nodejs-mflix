'use client';

/**
 * Add Movie Form Component
 * 
 * Form for creating new movies with validation.
 * Supports both single movie creation and batch creation.
 */

import { useState } from 'react';
import { Movie } from '../../types/movie';
import styles from '../EditMovieForm/EditMovieForm.module.css';

interface AddMovieFormProps {
  onSave: (movieData: Omit<Movie, '_id'>[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface MovieFormData {
  title: string;
  year: string;
  plot: string;
  runtime: string;
  rated: string;
  genres: string;
  directors: string;
  writers: string;
  cast: string;
  countries: string;
  languages: string;
  poster: string;
}

const getInitialFormData = (): MovieFormData => ({
  title: '',
  year: '',
  plot: '',
  runtime: '',
  rated: '',
  genres: '',
  directors: '',
  writers: '',
  cast: '',
  countries: '',
  languages: '',
  poster: '',
});

export default function AddMovieForm({ 
  onSave, 
  onCancel, 
  isLoading = false 
}: AddMovieFormProps) {
  const [movieForms, setMovieForms] = useState<MovieFormData[]>([getInitialFormData()]);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  const validateForm = (formData: MovieFormData, index: number) => {
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

    return newErrors;
  };

  const validateAllForms = () => {
    const allErrors: Record<number, Record<string, string>> = {};
    let hasErrors = false;

    movieForms.forEach((formData, index) => {
      const formErrors = validateForm(formData, index);
      if (Object.keys(formErrors).length > 0) {
        allErrors[index] = formErrors;
        hasErrors = true;
      }
    });

    setErrors(allErrors);
    return !hasErrors;
  };

  const convertFormDataToMovie = (formData: MovieFormData): Omit<Movie, '_id'> => {
    const movieData: Omit<Movie, '_id'> = {
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
    return Object.fromEntries(
      Object.entries(movieData).filter(([_, value]) => value !== undefined)
    ) as Omit<Movie, '_id'>;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAllForms()) {
      return;
    }

    // Convert all form data to movie objects
    const moviesData = movieForms.map(convertFormDataToMovie);
    onSave(moviesData);
  };

  const handleInputChange = (index: number, field: string, value: string) => {
    setMovieForms(prev => prev.map((form, i) => 
      i === index ? { ...form, [field]: value } : form
    ));

    // Clear error when user starts typing
    if (errors[index]?.[field]) {
      setErrors(prev => ({
        ...prev,
        [index]: { ...prev[index], [field]: '' }
      }));
    }
  };

  const handleAddMore = () => {
    setMovieForms(prev => [...prev, getInitialFormData()]);
  };

  const handleRemoveForm = (index: number) => {
    if (movieForms.length > 1) {
      setMovieForms(prev => prev.filter((_, i) => i !== index));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        // Reindex errors for forms after the removed one
        Object.keys(newErrors).forEach(key => {
          const keyNum = parseInt(key);
          if (keyNum > index) {
            newErrors[keyNum - 1] = newErrors[keyNum];
            delete newErrors[keyNum];
          }
        });
        return newErrors;
      });
    }
  };

  const renderMovieForm = (formData: MovieFormData, index: number) => {
    const formErrors = errors[index] || {};

    return (
      <div key={index} className={styles.movieFormWrapper}>
        {movieForms.length > 1 && (
          <div className={styles.formHeader}>
            <h3 className={styles.formSubtitle}>Movie {index + 1}</h3>
            <button
              type="button"
              onClick={() => handleRemoveForm(index)}
              className={styles.removeButton}
              disabled={isLoading}
              aria-label="Remove this movie form"
            >
              ✕
            </button>
          </div>
        )}

        <div className={styles.formGrid}>
          {/* Title */}
          <div className={styles.formGroup}>
            <label htmlFor={`title-${index}`} className={styles.label}>
              Title *
            </label>
            <input
              type="text"
              id={`title-${index}`}
              value={formData.title}
              onChange={(e) => handleInputChange(index, 'title', e.target.value)}
              className={`${styles.input} ${formErrors.title ? styles.inputError : ''}`}
              disabled={isLoading}
              required
            />
            {formErrors.title && <span className={styles.error}>{formErrors.title}</span>}
          </div>

          {/* Year */}
          <div className={styles.formGroup}>
            <label htmlFor={`year-${index}`} className={styles.label}>
              Year
            </label>
            <input
              type="number"
              id={`year-${index}`}
              value={formData.year}
              onChange={(e) => handleInputChange(index, 'year', e.target.value)}
              className={`${styles.input} ${formErrors.year ? styles.inputError : ''}`}
              disabled={isLoading}
              min="1800"
              max={new Date().getFullYear() + 5}
            />
            {formErrors.year && <span className={styles.error}>{formErrors.year}</span>}
          </div>

          {/* Runtime */}
          <div className={styles.formGroup}>
            <label htmlFor={`runtime-${index}`} className={styles.label}>
              Runtime (minutes)
            </label>
            <input
              type="number"
              id={`runtime-${index}`}
              value={formData.runtime}
              onChange={(e) => handleInputChange(index, 'runtime', e.target.value)}
              className={`${styles.input} ${formErrors.runtime ? styles.inputError : ''}`}
              disabled={isLoading}
              min="1"
              max="1000"
            />
            {formErrors.runtime && <span className={styles.error}>{formErrors.runtime}</span>}
          </div>

          {/* Rated */}
          <div className={styles.formGroup}>
            <label htmlFor={`rated-${index}`} className={styles.label}>
              Rating
            </label>
            <input
              type="text"
              id={`rated-${index}`}
              value={formData.rated}
              onChange={(e) => handleInputChange(index, 'rated', e.target.value)}
              className={styles.input}
              disabled={isLoading}
              placeholder="e.g., PG-13, R, G"
            />
          </div>

          {/* Poster URL */}
          <div className={styles.formGroup}>
            <label htmlFor={`poster-${index}`} className={styles.label}>
              Poster URL
            </label>
            <input
              type="url"
              id={`poster-${index}`}
              value={formData.poster}
              onChange={(e) => handleInputChange(index, 'poster', e.target.value)}
              className={styles.input}
              disabled={isLoading}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Plot */}
        <div className={styles.formGroup}>
          <label htmlFor={`plot-${index}`} className={styles.label}>
            Plot
          </label>
          <textarea
            id={`plot-${index}`}
            value={formData.plot}
            onChange={(e) => handleInputChange(index, 'plot', e.target.value)}
            className={styles.textarea}
            disabled={isLoading}
            rows={4}
            placeholder="Brief plot summary..."
          />
        </div>

        {/* Lists (comma-separated) */}
        <div className={styles.listFields}>
          <div className={styles.formGroup}>
            <label htmlFor={`genres-${index}`} className={styles.label}>
              Genres (comma-separated)
            </label>
            <input
              type="text"
              id={`genres-${index}`}
              value={formData.genres}
              onChange={(e) => handleInputChange(index, 'genres', e.target.value)}
              className={styles.input}
              disabled={isLoading}
              placeholder="Action, Drama, Comedy"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor={`directors-${index}`} className={styles.label}>
              Directors (comma-separated)
            </label>
            <input
              type="text"
              id={`directors-${index}`}
              value={formData.directors}
              onChange={(e) => handleInputChange(index, 'directors', e.target.value)}
              className={styles.input}
              disabled={isLoading}
              placeholder="Director 1, Director 2"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor={`writers-${index}`} className={styles.label}>
              Writers (comma-separated)
            </label>
            <input
              type="text"
              id={`writers-${index}`}
              value={formData.writers}
              onChange={(e) => handleInputChange(index, 'writers', e.target.value)}
              className={styles.input}
              disabled={isLoading}
              placeholder="Writer 1, Writer 2"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor={`cast-${index}`} className={styles.label}>
              Cast (comma-separated)
            </label>
            <input
              type="text"
              id={`cast-${index}`}
              value={formData.cast}
              onChange={(e) => handleInputChange(index, 'cast', e.target.value)}
              className={styles.input}
              disabled={isLoading}
              placeholder="Actor 1, Actor 2, Actor 3"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor={`countries-${index}`} className={styles.label}>
              Countries (comma-separated)
            </label>
            <input
              type="text"
              id={`countries-${index}`}
              value={formData.countries}
              onChange={(e) => handleInputChange(index, 'countries', e.target.value)}
              className={styles.input}
              disabled={isLoading}
              placeholder="USA, UK, France"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor={`languages-${index}`} className={styles.label}>
              Languages (comma-separated)
            </label>
            <input
              type="text"
              id={`languages-${index}`}
              value={formData.languages}
              onChange={(e) => handleInputChange(index, 'languages', e.target.value)}
              className={styles.input}
              disabled={isLoading}
              placeholder="English, Spanish, French"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>
        Add {movieForms.length === 1 ? 'New Movie' : `${movieForms.length} Movies`}
      </h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        {movieForms.map((formData, index) => renderMovieForm(formData, index))}

        {/* Add More Button */}
        <div className={styles.addMoreSection}>
          <button
            type="button"
            onClick={handleAddMore}
            className={styles.addMoreButton}
            disabled={isLoading}
          >
            + Add Another Movie
          </button>
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
            {isLoading 
              ? (movieForms.length === 1 ? 'Creating...' : 'Creating Movies...') 
              : (movieForms.length === 1 ? 'Create Movie' : `Create ${movieForms.length} Movies`)
            }
          </button>
        </div>
      </form>
    </div>
  );
}