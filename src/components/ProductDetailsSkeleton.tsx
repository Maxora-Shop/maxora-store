import React from 'react';

export const ProductDetailsSkeleton: React.FC = () => {
  return (
    <div className="py-4 sm:py-6 space-y-8 animate-pulse">
      {/* Breadcrumbs Skeleton */}
      <div className="flex items-center gap-2">
        <div className="w-12 h-4 bg-zinc-200 rounded-md" />
        <div className="w-3 h-4 bg-zinc-100 rounded-md" />
        <div className="w-20 h-4 bg-zinc-200 rounded-md" />
        <div className="w-3 h-4 bg-zinc-100 rounded-md" />
        <div className="w-36 h-4 bg-zinc-200 rounded-md" />
      </div>

      {/* Top Two Column Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Gallery Skeleton */}
        <div className="lg:col-span-6 space-y-4">
          <div className="w-full aspect-square rounded-3xl bg-zinc-200/80 border border-zinc-200" />
          <div className="flex items-center gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-200/80 shrink-0" />
            ))}
          </div>
        </div>

        {/* Right: Info Skeleton */}
        <div className="lg:col-span-6 space-y-6">
          <div className="w-24 h-5 bg-zinc-200 rounded-full" />
          <div className="w-4/5 h-8 bg-zinc-200 rounded-xl" />
          <div className="w-1/2 h-4 bg-zinc-200 rounded-md" />
          <div className="w-full h-24 bg-zinc-100 rounded-2xl border border-zinc-200" />
          <div className="w-32 h-6 bg-zinc-200 rounded-full" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="h-14 bg-zinc-200 rounded-2xl" />
            <div className="h-14 bg-zinc-200 rounded-2xl" />
          </div>
          <div className="w-full h-36 bg-zinc-100 rounded-2xl border border-zinc-200" />
        </div>
      </div>

      {/* Bottom Description Skeleton */}
      <div className="mt-12 pt-8 border-t border-zinc-200 space-y-6">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-28 h-10 bg-zinc-200 rounded-xl" />
          ))}
        </div>
        <div className="w-full h-64 bg-zinc-100 rounded-3xl border border-zinc-200" />
      </div>
    </div>
  );
};
