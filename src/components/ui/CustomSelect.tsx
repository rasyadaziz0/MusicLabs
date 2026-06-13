'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectProps<T extends string | number> {
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onChange: (value: T) => void;
  className?: string;
  align?: 'left' | 'right';
}

export function CustomSelect<T extends string | number>({ value, options, onChange, className = '', align = 'left' }: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 w-full min-w-[140px] items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white transition-colors hover:bg-white/10 focus:border-[#FA243C]/40 focus:outline-none"
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-300 text-white/50 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'} top-full mt-2 w-full max-h-[300px] overflow-y-auto overflow-x-hidden rounded-xl border border-white/10 bg-[#1c1c1e] p-1.5 shadow-2xl z-50 scrollbar-hide`}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  if (!option.disabled) {
                    onChange(option.value);
                    setIsOpen(false);
                  }
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  option.disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10'
                } ${
                  value === option.value ? 'text-[#FA243C] font-semibold bg-white/5' : 'text-white/80'
                }`}
              >
                {option.label}
                {value === option.value && <Check size={16} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
