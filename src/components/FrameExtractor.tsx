import React, { useRef, useEffect } from 'react';

interface FrameExtractorProps {
  video: HTMLVideoElement | null;
  onFrameExtracted: (frameDataUrl: string) => void;
  interval: number; // milliseconds between frames
  enabled: boolean;
}

export const FrameExtractor: React.FC<FrameExtractorProps> = ({
  video,
  onFrameExtracted,
  interval,
  enabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !video || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const extractFrame = () => {
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        onFrameExtracted(dataUrl);
      }
    };

    // Extract first frame immediately
    extractFrame();

    // Then extract at intervals
    intervalRef.current = window.setInterval(extractFrame, interval);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [video, onFrameExtracted, interval, enabled]);

  return (
    <canvas
      ref={canvasRef}
      className="hidden"
      style={{ display: 'none' }}
    />
  );
};

