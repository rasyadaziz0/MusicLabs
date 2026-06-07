export default function OtherProfileSkeleton() {
  return (
    <div className="pb-32 pt-2 max-w-[1400px] mx-auto animate-pulse">
      <div className="flex flex-col items-center pt-12 pb-8 px-6">
        <div className="w-[120px] h-[120px] md:w-[160px] md:h-[160px] rounded-full bg-white/5" />
        <div className="h-8 w-48 bg-white/5 rounded-lg mt-6" />
        <div className="h-4 w-36 bg-white/5 rounded mt-3" />
        <div className="flex gap-10 mt-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-7 w-12 bg-white/5 rounded" />
              <div className="h-3 w-16 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="px-5 md:px-8 mt-6 space-y-8">
        <div className="h-6 w-40 bg-white/5 rounded" />
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-[160px] aspect-square bg-white/5 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    </div>
  );
}
