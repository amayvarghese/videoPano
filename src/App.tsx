import React, { useState, useEffect } from 'react';
import { PanoramaCapture } from './components/PanoramaCapture';
import { OpenCVStitcher } from './components/OpenCVStitcher';
import { PannellumViewer } from './components/PannellumViewer';

type AppState = 'idle' | 'capturing' | 'processing' | 'viewing';

interface AppError {
  message: string;
  timestamp: number;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('idle');
  const [frames, setFrames] = useState<string[]>([]);
  const [panorama, setPanorama] = useState<string | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  // Initialize dark mode
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') !== 'false';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleFramesCaptured = (capturedFrames: string[]) => {
    setFrames(capturedFrames);
    setState('processing');
    setError(null);
  };

  const handleStitched = (panoramaDataUrl: string) => {
    setPanorama(panoramaDataUrl);
    setState('viewing');
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError({
      message: errorMessage,
      timestamp: Date.now(),
    });
    // Don't reset state on error, allow user to retry
  };

  const handleNewCapture = () => {
    setState('idle');
    setFrames([]);
    setPanorama(null);
    setError(null);
  };

  const handleExportPNG = () => {
    if (!panorama) return;

    const link = document.createElement('a');
    link.download = `panorama-${Date.now()}.png`;
    link.href = panorama;
    link.click();
  };

  const handleExportJSON = () => {
    if (!panorama) return;

    const data = {
      panorama: panorama,
      frames: frames.length,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `panorama-${Date.now()}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header with dark mode toggle */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            360° Panorama Capture
          </h1>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Error display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex justify-between items-start">
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-semibold mb-1">Error</h3>
              <p className="text-red-700 dark:text-red-300 text-sm">{error.message}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main content based on state */}
      <main>
        {state === 'idle' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Capture 360° Panorama
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Use your device camera to create stunning panoramic images
              </p>
              <button
                onClick={() => setState('capturing')}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-lg transition-colors shadow-lg"
              >
                Start Capture
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <div className="text-4xl mb-4">📷</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Capture</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Record 18 frames while slowly rotating 360° around the scene center
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <div className="text-4xl mb-4">🔧</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Stitch</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  OpenCV.js processes frames with feature detection and blending
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <div className="text-4xl mb-4">🌐</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">View</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Explore your panorama in an interactive 360° viewer
                </p>
              </div>
            </div>
          </div>
        )}

        {state === 'capturing' && (
          <PanoramaCapture
            onFramesCaptured={handleFramesCaptured}
            onError={handleError}
          />
        )}

        {state === 'processing' && (
          <OpenCVStitcher
            frames={frames}
            onStitched={handleStitched}
            onError={handleError}
          />
        )}

        {state === 'viewing' && panorama && (
          <div className="relative">
            <PannellumViewer
              image={panorama}
              config={{
                type: 'equirectangular',
                autoLoad: true,
                showControls: true,
                compass: true,
                keyboardZoom: true,
                mouseZoom: true,
              }}
            />
            
            {/* Floating action buttons */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
              <button
                onClick={handleExportPNG}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export PNG
              </button>
              <button
                onClick={handleExportJSON}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export JSON
              </button>
              <button
                onClick={handleNewCapture}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg shadow-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                New Capture
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            Built with React, Vite, TypeScript, Tailwind CSS, OpenCV.js, and Pannellum
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;

