import React, { useEffect, useRef, useState } from 'react';

// Pannellum types
declare global {
  interface Window {
    pannellum: any;
  }
}

interface PannellumViewerProps {
  image: string;
  config?: {
    type?: 'equirectangular';
    autoLoad?: boolean;
    showControls?: boolean;
    gyroscope?: boolean;
    compass?: boolean;
    autoRotate?: number;
    [key: string]: any;
  };
  onViewerReady?: (viewer: any) => void;
}

export const PannellumViewer: React.FC<PannellumViewerProps> = ({
  image,
  config = {},
  onViewerReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Pannellum CSS and JS
  useEffect(() => {
    // Load CSS
    if (!document.querySelector('link[href*="pannellum.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/pannellum@2.6.1/build/pannellum.css';
      document.head.appendChild(link);
    }

    // Load JS
    if (!window.pannellum) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.6.1/build/pannellum.js';
      script.async = true;
      script.onload = () => {
        setIsLoaded(true);
      };
      script.onerror = () => {
        setError('Failed to load Pannellum');
      };
      document.body.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, []);

  // Initialize viewer
  useEffect(() => {
    if (!isLoaded || !window.pannellum || !containerRef.current || !image) {
      return;
    }

    try {
      // Destroy existing viewer
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }

      // Create new viewer
      const defaultConfig = {
        type: 'equirectangular',
        panorama: image,
        autoLoad: true,
        showControls: true,
        compass: true,
        keyboardZoom: true,
        mouseZoom: true,
        ...config,
      };

      viewerRef.current = window.pannellum.viewer(containerRef.current, defaultConfig);
      
      if (onViewerReady) {
        onViewerReady(viewerRef.current);
      }
    } catch (err) {
      console.error('Pannellum initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize viewer');
    }

    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (err) {
          console.error('Error destroying viewer:', err);
        }
      }
    };
  }, [isLoaded, image, config, onViewerReady]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white p-4">
        <div className="text-center">
          <p className="text-red-400 mb-2">Error loading viewer</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p>Loading viewer...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: '100vh' }}
    />
  );
};

