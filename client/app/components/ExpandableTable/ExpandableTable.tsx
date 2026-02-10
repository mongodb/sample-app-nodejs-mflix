'use client';

import React, { useState } from 'react';
import styles from './ExpandableTable.module.css';

interface ExpandableTableProps {
  children: React.ReactNode;
  initialRowCount?: number;
  totalRowCount: number;
}

export default function ExpandableTable({ 
  children, 
  initialRowCount = 10, 
  totalRowCount 
}: ExpandableTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const showExpandButton = totalRowCount > initialRowCount;

  return (
    <div className={styles.container}>
      <div className={`${styles.tableWrapper} ${showExpandButton ? (isExpanded ? styles.expanded : styles.collapsed) : ''}`}>
        {children}
      </div>
      {showExpandButton && (
        <div className={styles.buttonContainer}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.expandButton}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Show fewer rows' : 'Show more rows'}
          >
            {isExpanded ? (
              <>
                <span className={styles.buttonIcon}>▲</span>
                Show Less
              </>
            ) : (
              <>
                <span className={styles.buttonIcon}>▼</span>
                Show More ({totalRowCount - initialRowCount} more rows)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

