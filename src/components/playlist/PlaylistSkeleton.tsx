import React from 'react';

export function PlaylistSkeleton() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-transparent pt-8 px-6 md:px-10 pb-32">
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10 mb-8">
        <div className="w-[200px] h-[200px] md:w-[260px] md:h-[260px] lg:w-[300px] lg:h-[300px] rounded-xl animate-shimmer flex-shrink-0" />
        <div className="flex flex-col gap-3 w-full max-w-xl mt-4 md:mt-0 text-center md:text-left items-center md:items-start">
          <div className="h-8 md:h-12 w-3/4 rounded-lg animate-shimmer" />
          <div className="h-5 md:h-6 w-1/2 rounded-md animate-shimmer" />
          <div className="h-4 md:h-5 w-1/3 rounded-md animate-shimmer mt-2" />
          <div className="flex items-center justify-center md:justify-start gap-4 mt-6 w-full">
            <div className="h-12 w-32 rounded-full animate-shimmer" />
            <div className="h-12 w-12 rounded-full animate-shimmer" />
          </div>
        </div>
      </div>
      <div className="space-y-4 w-full mt-8">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="h-14 rounded-lg animate-shimmer" />
        ))}
      </div>
    </div>
  );
}
