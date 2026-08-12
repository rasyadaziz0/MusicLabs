'use client';

import { GooeyToaster } from 'goey-toast';
import { useEffect, useState } from 'react';

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
