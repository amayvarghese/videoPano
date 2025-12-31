import React from 'react';
import { useStitcher } from '../hooks/useStitcher';

interface OpenCVStitcherProps {
  frames: string[];
  onStitched: (panoramaDataUrl: string) => void;
  onError: (error: string) => void;
}

export const OpenCVStitcher: React.FC<OpenCVStitcherProps> = ({
  frames,
  onStitched,
  onError,
}) => {
  const { stitchFrames, isStitching, progress, error } = useStitcher();

  React.useEffect(() => {
    if (frames.length === 0) {
      return;
    }

    const processStitching = async () => {
      try {
        const panorama = await stitchFrames(frames);
        onStitched(panorama);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Stitching failed';
        onError(errorMessage);
      }
    };

    processStitching();
  }, [frames, stitchFrames, onStitched, onError]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-2xl text-center">
        <h2 className="text-3xl font-bold mb-8">Processing Panorama</h2>
        
        {isStitching && progress && (
          <div className="space-y-6">
            {/* Progress bar */}
            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progress.progress}%` }}
              />
            </div>

            {/* Stage indicator */}
            <div className="space-y-2">
              <p className="text-xl font-semibold">{progress.message}</p>
              <p className="text-sm text-gray-400 capitalize">{progress.stage}</p>
            </div>

            {/* Spinner */}
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            </div>

            {/* Stage steps */}
            <div className="grid grid-cols-5 gap-2 mt-8">
              {['preprocessing', 'detecting', 'matching', 'warping', 'blending'].map((stage, idx) => {
                const stageProgress = progress.stage === 'complete' ? 100 :
                  progress.stage === stage ? progress.progress :
                  ['preprocessing', 'detecting', 'matching', 'warping', 'blending'].indexOf(progress.stage) > idx ? 100 : 0;
                
                return (
                  <div key={stage} className="text-center">
                    <div className="w-full h-2 bg-gray-700 rounded-full mb-2">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${stageProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 capitalize">{stage}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-900 bg-opacity-30 rounded border border-red-700">
            <p className="text-red-200">Error: {error}</p>
          </div>
        )}

        {!isStitching && !error && progress?.stage === 'complete' && (
          <div className="mt-6 p-4 bg-green-900 bg-opacity-30 rounded border border-green-700">
            <p className="text-green-200">✓ Stitching complete!</p>
          </div>
        )}
      </div>
    </div>
  );
};

