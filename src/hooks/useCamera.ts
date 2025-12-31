import { useState, useRef, useCallback, useEffect } from 'react';

export interface CameraConstraints {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  frameRate?: number;
}

export interface UseCameraReturn {
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  error: string | null;
  startCamera: (constraints?: CameraConstraints) => Promise<void>;
  stopCamera: () => void;
  captureFrame: () => string | null;
}

export const useCamera = (): UseCameraReturn => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isRequestingRef = useRef(false);

  // Create canvas for frame capture
  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
  }, []);

  const startCamera = useCallback(async (constraints?: CameraConstraints) => {
    // Prevent multiple simultaneous requests
    if (isRequestingRef.current) {
      throw new Error('Camera request already in progress');
    }

    try {
      isRequestingRef.current = true;
      setError(null);
      setIsActive(false);
      
      // Stop existing stream first
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
        });
        setStream(null);
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available. Please use HTTPS or localhost.');
      }

      // Try with ideal constraints first
      const defaultConstraints: MediaStreamConstraints = {
        video: {
          facingMode: constraints?.facingMode || 'environment',
          width: { ideal: constraints?.width || 1280 },
          height: { ideal: constraints?.height || 720 },
          frameRate: { ideal: constraints?.frameRate || 30 },
        },
        audio: false,
      };

      let mediaStream: MediaStream;
      
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
      } catch (constraintError: any) {
        // If constraints fail, try with minimal constraints
        if (constraintError.name === 'OverconstrainedError' || constraintError.name === 'ConstraintNotSatisfiedError') {
          console.warn('Ideal constraints not satisfied, trying minimal constraints...');
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: constraints?.facingMode || 'environment' },
            audio: false,
          });
        } else {
          throw constraintError;
        }
      }

      setStream(mediaStream);
      setIsActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready with simpler approach
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn('Video play error:', playError);
          // Sometimes play() fails but video still works
        }
      }
    } catch (err: any) {
      let errorMessage = 'Failed to access camera';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        errorMessage = 'Camera operation was aborted. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error('Camera error:', err);
      setError(errorMessage);
      setIsActive(false);
      throw new Error(errorMessage);
    } finally {
      isRequestingRef.current = false;
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsActive(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return null;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL (JPEG, 0.92 quality for balance)
    return canvas.toDataURL('image/jpeg', 0.92);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return {
    stream,
    videoRef,
    isActive,
    error,
    startCamera,
    stopCamera,
    captureFrame,
  };
};

