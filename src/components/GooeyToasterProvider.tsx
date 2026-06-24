'use client';

import { GooeyToaster } from 'goey-toast';
import 'goey-toast/styles.css';

export default function GooeyToasterProvider() {
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
