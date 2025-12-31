import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    cv: any;
  }
}

export interface UseOpenCVReturn {
  cv: any;
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  loadOpenCV: () => Promise<void>;
}

// OpenCV.js from official repository
// Note: This is a large file (~8MB), consider using a local build for production
const OPENCV_JS_URL = 'https://docs.opencv.org/4.8.0/opencv.js';

export const useOpenCV = (): UseOpenCVReturn => {
  const [cv, setCv] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOpenCV = useCallback(async () => {
    if (window.cv) {
      setCv(window.cv);
      setIsLoaded(true);
      return;
    }

    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if OpenCV is already loading
      const existingScript = document.querySelector('script[src*="opencv.js"]');
      if (existingScript) {
        // Wait for it to load
        await new Promise<void>((resolve, reject) => {
          const checkInterval = setInterval(() => {
            if (window.cv) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);

          setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('OpenCV loading timeout'));
          }, 30000);
        });
      } else {
        // Load OpenCV.js
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = OPENCV_JS_URL;
          script.async = true;
          script.onload = () => {
            // OpenCV.js sets cv on window when ready
            const checkCv = setInterval(() => {
              if (window.cv && window.cv.Mat) {
                clearInterval(checkCv);
                resolve();
              }
            }, 50);

            setTimeout(() => {
              clearInterval(checkCv);
              reject(new Error('OpenCV initialization timeout'));
            }, 30000);
          };
          script.onerror = () => reject(new Error('Failed to load OpenCV.js'));
          document.head.appendChild(script);
        });
      }

      setCv(window.cv);
      setIsLoaded(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load OpenCV';
      setError(errorMessage);
      console.error('OpenCV loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Auto-load on mount
  useEffect(() => {
    if (!isLoaded && !isLoading && !error) {
      loadOpenCV();
    }
  }, [isLoaded, isLoading, error, loadOpenCV]);

  return {
    cv,
    isLoaded,
    isLoading,
    error,
    loadOpenCV,
  };
};

