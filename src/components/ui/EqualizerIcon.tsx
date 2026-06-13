import React from 'react';

export const EqualizerIcon = ({ isPlaying, color = 'white' }: { isPlaying: boolean; color?: 'white' | 'red' }) => {
  const bgClass = color === 'red' ? 'bg-[#FA243C]' : 'bg-white';
  
  return (
    <div className="flex items-end gap-[2px] h-3">
      <span 
        className={`w-[3px] ${bgClass} rounded-full ${isPlaying ? 'animate-[barBounce_0.8s_ease-in-out_infinite]' : ''}`} 
        style={{ height: isPlaying ? '60%' : '20%' }} 
      />
      <span 
        className={`w-[3px] ${bgClass} rounded-full ${isPlaying ? 'animate-[barBounce_0.8s_ease-in-out_infinite_0.2s]' : ''}`} 
        style={{ height: isPlaying ? '100%' : '20%' }} 
      />
      <span 
        className={`w-[3px] ${bgClass} rounded-full ${isPlaying ? 'animate-[barBounce_0.8s_ease-in-out_infinite_0.4s]' : ''}`} 
        style={{ height: isPlaying ? '40%' : '20%' }} 
      />
    </div>
  );
};
