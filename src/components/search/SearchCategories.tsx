'use client';

import Link from 'next/link';

const categories = [
  { title: 'AcadMusic Radio', bg: '#FA243C' },
  { title: 'Sleep', bg: '#29326D' },
  { title: 'Chill', bg: '#1A6B4A' },
  { title: 'New in Electronic', bg: '#D3286E' },
  { title: 'K-Pop', bg: '#FF6275' },
  { title: 'Pop', bg: '#FA58B6' },
  { title: 'Hip-Hop/Rap', bg: '#162E93' },
  { title: 'Replay Monthly', bg: 'linear-gradient(135deg, #FF9B26, #FA58B6, #2F2FE4)', href: '/recap' },
  { title: 'Rock', bg: '#1A1953' },
  { title: 'R&B', bg: '#FA243C' },
  { title: 'Jazz', bg: '#10B981' },
  { title: 'Dance', bg: '#34D399' },
];

export function SearchCategories() {
  return (
    <div className="space-y-6">
      <h2 className="text-[20px] font-bold text-white">Browse Categories</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
        {categories.map((category) => {
          const inner = (
            <>
              <h3 className="text-[15px] font-bold text-white absolute bottom-4 left-4 right-4 leading-tight">{category.title}</h3>
              {/* Subtle shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </>
          );

          const classes = "aspect-[16/10] rounded-[12px] p-4 relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02]";

          if (category.href) {
            return (
              <Link
                key={category.title}
                href={category.href}
                className={classes}
                style={{ background: category.bg }}
              >
                {inner}
              </Link>
            );
          }

          return (
            <div
              key={category.title}
              className={classes}
              style={{ background: category.bg }}
            >
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

