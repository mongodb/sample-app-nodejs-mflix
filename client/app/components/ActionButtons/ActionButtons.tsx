'use client';

/**
 * Action Buttons Component
 * 
 * Provides Edit and Delete actions for movie details page
 */

import styles from './ActionButtons.module.css';

interface ActionButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function ActionButtons({ 
  onEdit, 
  onDelete, 
  isLoading = false, 
  disabled = false 
}: ActionButtonsProps) {
  return (
    <div className={styles.actionButtons}>
      <button
        onClick={onEdit}
        disabled={disabled || isLoading}
        className={`${styles.button} ${styles.editButton}`}
        type="button"
      >
        {isLoading ? 'Loading...' : 'Edit Movie'}
      </button>
      
      <button
        onClick={onDelete}
        disabled={disabled || isLoading}
        className={`${styles.button} ${styles.deleteButton}`}
        type="button"
      >
        {isLoading ? 'Loading...' : 'Delete Movie'}
      </button>
    </div>
  );
}