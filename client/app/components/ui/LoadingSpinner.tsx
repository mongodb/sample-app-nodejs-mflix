'use client';

/**
 * Loading spinner component
 */

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export default function LoadingSpinner({ 
  size = 'medium', 
  message = 'Loading...' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8', 
    large: 'w-12 h-12'
  };

  return (
    <div className="loading-container">
      <div className={`loading-spinner ${sizeClasses[size]}`}></div>
      {message && <p className="loading-message">{message}</p>}
      
      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 2rem;
        }
        
        .loading-spinner {
          border: 2px solid #f3f3f3;
          border-top: 2px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .w-4 { width: 1rem; height: 1rem; }
        .w-8 { width: 2rem; height: 2rem; }
        .w-12 { width: 3rem; height: 3rem; }
        
        .loading-message {
          color: #666;
          margin: 0;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}