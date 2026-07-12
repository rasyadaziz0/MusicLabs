'use client';

import { useState, useEffect } from 'react';
import { GooeyToaster } from 'goey-toast';

export default function GooeyToasterProvider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <GooeyToaster
      position="top-center"
      theme="dark"
      closeButton={true}
      // @ts-ignore
      closeButtonPosition="top-right"
      showTimestamp={true}
      toastOptions={({
        preset: 'snappy',
        timing: { displayDuration: 6000 },
        springEffect: { bounce: 0.4 }
      } as any)}
    />
  );
}
