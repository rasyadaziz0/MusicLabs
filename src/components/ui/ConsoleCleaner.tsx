'use client';

import { useEffect } from 'react';

export default function ConsoleCleaner() {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      const noop = () => { };
      window.console.log = noop;
      window.console.debug = noop;
      window.console.info = noop;
    }
  }, []);

  return null;
}
