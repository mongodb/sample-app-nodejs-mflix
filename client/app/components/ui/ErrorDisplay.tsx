/**
 * Error component for displaying error states
 */

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({ 
  message = "Something went wrong", 
  onRetry 
}: ErrorDisplayProps) {
  return (
    <div className="error-display">
      <h2>Error</h2>
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} type="button">
          Try Again
        </button>
      )}
      
      <style jsx>{`
        .error-display {
          text-align: center;
          padding: 2rem;
          border: 1px solid #fee2e2;
          border-radius: 8px;
          background-color: #fef2f2;
          color: #991b1b;
        }
        
        .error-display h2 {
          margin: 0 0 1rem 0;
          color: #dc2626;
        }
        
        .error-display button {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .error-display button:hover {
          background: #b91c1c;
        }
      `}</style>
    </div>
  );
}