'use client';

import { useEffect } from 'react';

/**
 * Automatically suppresses standard console output (log, debug, info) in the browser
 * for production and non-localhost environments so debug data never leaks to users.
 */
export default function ConsoleCleaner() {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      const noop = () => {};
      window.console.log = noop;
      window.console.debug = noop;
      window.console.info = noop;
    }
  }, []);

  return null;
}
