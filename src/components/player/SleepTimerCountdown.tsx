import React from 'react';

export function SleepTimerCountdown({ endTime }: { endTime: number }) {
  const [timeLeft, setTimeLeft] = React.useState<string>('');

  React.useEffect(() => {
    const update = () => {
      const rem = endTime - Date.now();
      if (rem <= 0) {
        setTimeLeft('0:00');
        return;
      }
      const mins = Math.floor(rem / 60000);
      const secs = Math.floor((rem % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return <span style={{ fontFamily: 'monospace', color: '#FA243C' }}>{timeLeft}</span>;
}
