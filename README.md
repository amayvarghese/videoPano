# 360° Panorama Capture

A complete React web application for capturing, stitching, and viewing 360-degree panoramic images using your device camera.

## Features

- 📷 **Video Capture**: Uses `getUserMedia()` with rear camera, wide FOV, 720p resolution
- 🎬 **Frame Extraction**: Extracts 18 evenly-spaced frames during 12-second pan (25-40% overlap)
- 🔧 **Stitching Pipeline**: OpenCV.js with ORB features, FLANN matching, RANSAC homography, cylindrical warping, multi-band blending
- 🌐 **360 Viewer**: Pannellum.js full-screen viewer with gyro support, hotspots, and fullscreen toggle
- 📱 **Mobile Optimized**: Touch controls, portrait/landscape handling, PWA-ready
- 🎨 **Dark Mode**: Toggle between light and dark themes
- 💾 **Export**: Save panoramas as PNG or JSON

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **OpenCV.js** for image stitching
- **Pannellum** for 360° viewing
- **PWA** support with service worker

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Start Capture**: Click "Start Capture" and wait for the countdown
2. **Pan Slowly**: Rotate your device RIGHT 360° over 12 seconds while keeping it steady
3. **Processing**: Wait for OpenCV.js to stitch the frames together
4. **View**: Explore your panorama in the interactive 360° viewer
5. **Export**: Download as PNG or JSON

## Project Structure

```
src/
  components/
    - PanoramaCapture.tsx    # Camera capture interface
    - FrameExtractor.tsx      # Frame extraction logic
    - OpenCVStitcher.tsx      # Stitching pipeline UI
    - PannellumViewer.tsx    # 360° viewer component
  hooks/
    - useCamera.ts            # Camera management hook
    - useOpenCV.ts            # OpenCV.js loading hook
    - useStitcher.ts          # Stitching logic hook
  App.tsx                     # Main app with state machine
  main.tsx                    # Entry point
  index.css                   # Global styles
```

## State Machine

The app follows a simple state machine:

- `idle` → Initial state, shows welcome screen
- `capturing` → Camera active, user pans device
- `processing` → OpenCV.js stitching frames
- `viewing` → Panorama displayed in Pannellum viewer

## Performance Optimizations

- Web Workers for OpenCV processing (future enhancement)
- Progressive frame downscaling (720p → stitch → upscale)
- GPU canvas acceleration
- Lazy-load OpenCV.js (2.5MB wasm)

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (iOS 11+)
- Mobile browsers with camera access

## OpenCV.js Loading

The app loads OpenCV.js from the official documentation CDN. If you encounter loading issues:

1. **Download locally**: Download `opencv.js` from [OpenCV releases](https://github.com/opencv/opencv/releases) and place it in `public/opencv.js`, then update `useOpenCV.ts` to load from `/opencv.js`

2. **Use alternative CDN**: Update the `OPENCV_JS_URL` in `src/hooks/useOpenCV.ts` to use:
   - `https://cdn.jsdelivr.net/gh/opencv/opencv@4.8.0/build/bin/opencv.js`
   - Or any other reliable CDN hosting OpenCV.js

## Deployment

The app is ready to deploy to:
- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **GitHub Pages**: Build and push `dist/` folder

## License

MIT

