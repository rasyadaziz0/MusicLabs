'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/utils/cropImage';
import { X, Loader2, Check } from 'lucide-react';

export interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  aspect?: number;
  circularCrop?: boolean;
}

export function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  aspect = 1,
  circularCrop = true,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([croppedBlob], 'cropped-profile.jpg', { type: 'image/jpeg' });
      onCropComplete(file);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a2a] w-full max-w-md rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col relative">
        <div className="flex items-center justify-between p-4 border-b border-white/10 relative z-10">
          <h3 className="text-white font-semibold text-lg tracking-tight">Adjust Photo</h3>
          <button onClick={onClose} disabled={isProcessing} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/70 transition-colors disabled:opacity-50">
            <X size={20} />
          </button>
        </div>
        
        <div className="relative w-full h-[400px] bg-black/50">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={circularCrop ? "round" : "rect"}
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
          />
        </div>
        
        <div className="p-5 flex flex-col gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <span className="text-white/50 text-[13px] font-medium w-10">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <button
            onClick={handleCrop}
            disabled={isProcessing}
            className="w-full py-3.5 bg-[#FA243C] hover:bg-[#FF6275] disabled:bg-white/10 disabled:text-white/40 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {isProcessing ? 'Processing...' : 'Apply changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
