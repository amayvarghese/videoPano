import React, { useEffect, useState } from 'react';
import { useCamera } from '../hooks/useCamera';

interface PanoramaCaptureProps {
  onFramesCaptured: (frames: string[]) => void;
  onError: (error: string) => void;
}

export const PanoramaCapture: React.FC<PanoramaCaptureProps> = ({
  onFramesCaptured,
  onError,
}) => {
  const { videoRef, isActive, error: cameraError, startCamera, stopCamera, captureFrame } = useCamera();
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [frames, setFrames] = useState<string[]>([]);

  const [cameraInitialized, setCameraInitialized] = useState(false);

  useEffect(() => {
    // Start camera on mount
    const initCamera = async () => {
      try {
        await startCamera({
          facingMode: 'environment',
          width: 1280,
          height: 720,
        });
        setCameraInitialized(true);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to start camera';
        console.error('Camera initialization error:', err);
        onError(`Camera Error: ${errorMsg}. Please check permissions and try again.`);
        setCameraInitialized(false);
      }
    };

    initCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera, onError]);

  useEffect(() => {
    if (cameraError) {
      onError(cameraError);
    }
  }, [cameraError, onError]);

  const startCapture = async () => {
    if (!isActive) {
      onError('Camera not ready');
      return;
    }

    setIsCapturing(true);
    setProgress(0);
    setFrames([]);
    
    // Countdown before capture
    setCountdown(3);
    for (let i = 3; i > 0; i--) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCountdown(i - 1);
    }
    setCountdown(null);

    // Capture parameters: 12 seconds, 18 frames (1.5 fps)
    const duration = 12000; // 12 seconds
    const frameCount = 18;
    const interval = duration / frameCount; // ~667ms per frame

    const capturedFrames: string[] = [];

    for (let i = 0; i < frameCount; i++) {
      const frame = captureFrame();
      if (frame) {
        capturedFrames.push(frame);
        setFrames([...capturedFrames]);
      }

      setProgress(((i + 1) / frameCount) * 100);

      if (i < frameCount - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    setIsCapturing(false);
    
    if (capturedFrames.length >= 2) {
      onFramesCaptured(capturedFrames);
    } else {
      onError('Failed to capture enough frames');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-6">360° Panorama Capture</h1>
        
        {/* Camera Preview */}
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-6">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            onLoadedMetadata={() => {
              console.log('Video metadata loaded:', {
                width: videoRef.current?.videoWidth,
                height: videoRef.current?.videoHeight,
              });
            }}
            onError={(e) => {
              console.error('Video element error:', e);
              onError('Video playback error. Please check your camera permissions.');
            }}
          />
          
          {/* Overlay instructions - only show when camera is active and not capturing */}
          {!isCapturing && countdown === null && isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 pointer-events-none">
              <div className="text-center p-6 bg-black bg-opacity-50 rounded-lg">
                <p className="text-xl mb-4">Position yourself in the center</p>
                <p className="text-lg text-gray-300">Hold device steady at eye level</p>
              </div>
            </div>
          )}

          {/* Camera not active overlay */}
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
              <div className="text-center p-6">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
                <p className="text-xl mb-2">Initializing Camera...</p>
                <p className="text-sm text-gray-400">Please allow camera access when prompted</p>
                {cameraError && (
                  <div className="mt-4 p-4 bg-red-900 bg-opacity-50 rounded">
                    <p className="text-red-200 text-sm">{cameraError}</p>
                    <button
                      onClick={async () => {
                        try {
                          await startCamera({
                            facingMode: 'environment',
                            width: 1280,
                            height: 720,
                          });
                          setCameraInitialized(true);
                        } catch (err) {
                          onError(err instanceof Error ? err.message : 'Failed to start camera');
                        }
                      }}
                      className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                    >
                      Retry Camera Access
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Countdown overlay */}
          {countdown !== null && countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
              <div className="text-8xl font-bold">{countdown}</div>
            </div>
          )}

          {/* Progress overlay */}
          {isCapturing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
              <div className="w-64 h-64 relative mb-4">
                <svg className="transform -rotate-90 w-full h-full">
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-700"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 120}`}
                    strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                    className="text-blue-500 transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{Math.round(progress)}%</span>
                </div>
              </div>
              <p className="text-xl font-semibold">Pan RIGHT slowly</p>
              <p className="text-sm text-gray-300 mt-2">Rotate 360° around the scene center</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        {!isCapturing && countdown === null && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Instructions:</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Hold your device steady at eye level</li>
              <li>Position yourself at the center of the scene</li>
              <li>Click "Start Capture" and wait for countdown</li>
              <li>Slowly rotate RIGHT 360° over 12 seconds</li>
              <li>Keep the device level and steady</li>
              <li>Maintain consistent speed</li>
            </ol>
            <div className="mt-4 p-4 bg-yellow-900 bg-opacity-30 rounded border border-yellow-700">
              <p className="text-sm text-yellow-200">
                ⚠️ <strong>Tip:</strong> Rotate around the camera's nodal point to minimize parallax errors.
              </p>
            </div>
          </div>
        )}

        {/* Capture button */}
        {!isCapturing && countdown === null && (
          <button
            onClick={startCapture}
            disabled={!isActive}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-lg transition-colors"
          >
            {isActive ? 'Start Capture (12s)' : 'Initializing Camera...'}
          </button>
        )}

        {/* Frame count */}
        {frames.length > 0 && (
          <div className="mt-4 text-center text-gray-400">
            Captured {frames.length} frames
          </div>
        )}
      </div>
    </div>
  );
};

