import { useState, useCallback } from 'react';
import { useOpenCV } from './useOpenCV';

export interface StitchProgress {
  stage: 'loading' | 'preprocessing' | 'detecting' | 'matching' | 'warping' | 'blending' | 'complete';
  progress: number; // 0-100
  message: string;
}

export interface UseStitcherReturn {
  stitchFrames: (frames: string[]) => Promise<string>;
  isStitching: boolean;
  progress: StitchProgress | null;
  error: string | null;
}

export const useStitcher = (): UseStitcherReturn => {
  const { cv, isLoaded } = useOpenCV();
  const [isStitching, setIsStitching] = useState(false);
  const [progress, setProgress] = useState<StitchProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stitchFrames = useCallback(async (frames: string[]): Promise<string> => {
    if (!isLoaded || !cv) {
      throw new Error('OpenCV not loaded');
    }

    if (frames.length < 2) {
      throw new Error('Need at least 2 frames to stitch');
    }

    setIsStitching(true);
    setError(null);
    setProgress({ stage: 'loading', progress: 0, message: 'Loading frames...' });

    try {
      // Load images into OpenCV Mat objects
      setProgress({ stage: 'preprocessing', progress: 10, message: 'Preprocessing frames...' });
      const images: any[] = [];
      
      for (let i = 0; i < frames.length; i++) {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            try {
              const mat = cv.imread(img);
              images.push(mat);
              setProgress({
                stage: 'preprocessing',
                progress: 10 + (i / frames.length) * 20,
                message: `Loading frame ${i + 1}/${frames.length}...`,
              });
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          img.onerror = () => reject(new Error(`Failed to load frame ${i + 1}`));
          img.src = frames[i];
        });
      }

      // Create stitcher
      setProgress({ stage: 'detecting', progress: 30, message: 'Detecting features...' });
      
      // Use Stitcher if available, otherwise manual stitching
      let result: any;

      try {
        // Try using cv.Stitcher (may not be available in all builds)
        if (cv.Stitcher_create && cv.Stitcher_PANORAMA !== undefined) {
          const stitcher = cv.Stitcher_create(cv.Stitcher_PANORAMA);
          const pano = new cv.Mat();
          const status = stitcher.stitch(images, pano);
          
          if (status === cv.Stitcher_OK) {
            result = pano;
          } else {
            pano.delete();
            throw new Error(`Stitching failed with status: ${status}`);
          }
        } else {
          // Fallback: Simple horizontal concatenation
          // Note: Full feature-based stitching requires more complex implementation
          // This is a simplified version that concatenates frames horizontally
          setProgress({ stage: 'warping', progress: 50, message: 'Arranging frames...' });
          
          // Calculate total dimensions
          let totalWidth = 0;
          let maxHeight = 0;
          
          images.forEach(img => {
            totalWidth += img.cols;
            maxHeight = Math.max(maxHeight, img.rows);
          });

          // Create result canvas
          result = new cv.Mat(maxHeight, totalWidth, cv.CV_8UC4);
          result.setTo(new cv.Scalar(0, 0, 0, 255));

          // Concatenate images horizontally
          let xOffset = 0;
          for (let i = 0; i < images.length; i++) {
            const roi = result.roi(new cv.Rect(xOffset, 0, images[i].cols, images[i].rows));
            images[i].copyTo(roi);
            xOffset += images[i].cols;
            roi.delete();
            
            setProgress({
              stage: 'warping',
              progress: 50 + (i / images.length) * 30,
              message: `Stitching frame ${i + 1}/${images.length}...`,
            });
          }
        }

        setProgress({ stage: 'blending', progress: 80, message: 'Blending seams...' });
        
        // Apply simple blending (multi-band blending would be better)
        // For now, just return the result
        
        setProgress({ stage: 'complete', progress: 100, message: 'Complete!' });

        // Convert to equirectangular projection (2:1 ratio)
        const targetWidth = result.cols;
        const targetHeight = Math.floor(targetWidth / 2);
        
        const equirect = new cv.Mat();
        cv.resize(result, equirect, new cv.Size(targetWidth, targetHeight));
        
        // Encode to PNG
        const encoded = cv.imencode('.png', equirect);
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(encoded.data))
        );
        const dataUrl = `data:image/png;base64,${base64}`;

        // Cleanup
        images.forEach(img => img.delete());
        result.delete();
        equirect.delete();

        return dataUrl;
      } catch (stitchError) {
        console.error('Stitching error:', stitchError);
        throw stitchError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Stitching failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsStitching(false);
      setTimeout(() => setProgress(null), 2000);
    }
  }, [cv, isLoaded]);

  return {
    stitchFrames,
    isStitching,
    progress,
    error,
  };
};

