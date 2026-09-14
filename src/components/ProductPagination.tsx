import React from 'react';

export interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
}

export const ProductPagination: React.FC<ProductPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 20,
  onPageChange,
}) => {
  // If no items, do not render pagination
  if (totalItems <= 0) return null;

  // Calculate dynamic display numbers
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page list with smart ellipsis for high page counts
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      const pages: number[] = [];
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // When total pages > 7, use ellipsis
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages,
    ];
  };

  const pageNumbers = getPageNumbers();

  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  return (
    <div className="mt-10 sm:mt-14 pt-4 pb-2 flex flex-col items-center justify-center select-none" id="product-pagination-nav">
      {/* Pagination Controls Row */}
      <nav
        role="navigation"
        aria-label="Product Pagination"
        className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 max-w-full"
      >
        {/* Previous Button */}
        <button
          type="button"
          disabled={isPrevDisabled}
          onClick={() => !isPrevDisabled && onPageChange(currentPage - 1)}
          aria-label="Go to previous page"
          aria-disabled={isPrevDisabled}
          className={`h-9 sm:h-10 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center ${
            isPrevDisabled
              ? 'bg-zinc-50 text-zinc-300 border border-zinc-200/60 cursor-not-allowed opacity-60'
              : 'bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 border border-zinc-200/90 shadow-xs cursor-pointer active:scale-95'
          }`}
        >
          <span className="text-sm leading-none mr-1.5">←</span>
          <span>Previous</span>
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
          {pageNumbers.map((page, index) => {
            if (typeof page === 'string') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="min-w-[28px] sm:min-w-[34px] h-9 sm:h-10 flex items-center justify-center text-xs sm:text-sm font-extrabold text-zinc-400 select-none px-1"
                >
                  •••
                </span>
              );
            }

            const isActive = page === currentPage;

            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => onPageChange(page)}
                aria-label={`Page ${page}`}
                aria-current={isActive ? 'page' : undefined}
                className={`min-w-[36px] sm:min-w-[40px] h-9 sm:h-10 px-2 sm:px-3 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center ${
                  isActive
                    ? 'bg-[#0f172a] text-white font-extrabold border border-[#0f172a] shadow-sm cursor-default'
                    : 'bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 border border-zinc-200/90 font-bold shadow-xs cursor-pointer active:scale-95'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={isNextDisabled}
          onClick={() => !isNextDisabled && onPageChange(currentPage + 1)}
          aria-label="Go to next page"
          aria-disabled={isNextDisabled}
          className={`h-9 sm:h-10 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center ${
            isNextDisabled
              ? 'bg-zinc-50 text-zinc-300 border border-zinc-200/60 cursor-not-allowed opacity-60'
              : 'bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 border border-zinc-200/90 shadow-xs cursor-pointer active:scale-95'
          }`}
        >
          <span>Next</span>
          <span className="text-sm leading-none ml-1.5">→</span>
        </button>
      </nav>

      {/* Dynamic Information Text */}
      <p className="mt-3.5 sm:mt-4 text-xs sm:text-sm font-medium text-zinc-500 tracking-normal text-center">
        Showing{' '}
        <span className="font-semibold text-zinc-800">{startItem}</span> –{' '}
        <span className="font-semibold text-zinc-800">{endItem}</span> of{' '}
        <span className="font-semibold text-zinc-800">{totalItems}</span>{' '}
        {totalItems === 1 ? 'product' : 'products'}
      </p>
    </div>
  );
};
