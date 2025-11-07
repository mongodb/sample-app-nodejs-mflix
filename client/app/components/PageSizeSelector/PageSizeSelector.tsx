'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import pageSizeStyles from './PageSizeSelector.module.css';

interface PageSizeSelectorProps {
  currentLimit: number;
}

export default function PageSizeSelector({ currentLimit }: PageSizeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const pageSizeOptions = [10, 20, 50];

  const handlePageSizeChange = (newLimit: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('limit', newLimit.toString());
    params.set('page', '1'); // Reset to first page when changing page size
    router.push(`/movies?${params.toString()}`);
  };

  return (
    <div className={pageSizeStyles.pageSizeSelector}>
      <label htmlFor="pageSize" className={pageSizeStyles.label}>
        Movies per page:
      </label>
      <select
        id="pageSize"
        value={currentLimit}
        onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
        className={pageSizeStyles.select}
      >
        {pageSizeOptions.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  );
}