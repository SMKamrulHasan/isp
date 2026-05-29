/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface CameraViewProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
  className?: string;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, onClose, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);

  const startCamera = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: isFrontCamera ? 'user' : 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      setError("Camera access denied or not available.");
      console.error(err);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [isFrontCamera]);

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onCapture(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={cn("fixed inset-0 bg-plum-950 z-50 flex flex-col", className)}>
      {/* Top Bar */}
      <div className="flex justify-between items-center p-6 bg-black/40 backdrop-blur-xl border-b border-white/5">
        <button onClick={onClose} className="p-3 glass rounded-2xl text-white hover:bg-white/10 transition-all">
          <X size={24} />
        </button>
        <div className="text-white font-semibold tracking-[0.4em] uppercase text-[10px]">Capture Frame</div>
        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-white/30 text-center p-10 font-semibold uppercase tracking-widest text-xs">
            {error}
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        {/* Viewfinder Overlay */}
        <div className="absolute inset-0 border-[40px] border-plum-950/40 pointer-events-none">
          <div className="w-full h-full border border-white/10 rounded-[48px]" />
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="p-12 bg-black/80 backdrop-blur-xl flex items-center justify-around border-t border-white/5">
        <label className="p-6 glass rounded-[32px] text-white/40 cursor-pointer hover:bg-white/10 transition-all hover:text-white group">
          <ImageIcon size={28} className="group-hover:scale-110 transition-transform" />
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>

        <button 
          onClick={captureFrame}
          className="w-28 h-28 trending-gradient rounded-full flex items-center justify-center active:scale-90 transition-all shadow-2xl shadow-accent-orange/40 group relative"
        >
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-20 group-active:animate-none" />
          <div className="w-24 h-24 border-4 border-white/30 rounded-full group-hover:border-white/60 transition-all flex items-center justify-center relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-full" />
          </div>
        </button>

        <button 
          onClick={() => setIsFrontCamera(!isFrontCamera)}
          className="p-6 glass rounded-[32px] text-white/40 hover:bg-white/10 transition-all hover:text-white group"
        >
          <RefreshCw size={28} className="group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>
    </div>
  );
};
