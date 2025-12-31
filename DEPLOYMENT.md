# Deployment Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

Or connect your GitHub repo to Vercel for automatic deployments.

## Deploy to Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Build: `npm run build`
3. Deploy: `netlify deploy --prod --dir=dist`

Or drag and drop the `dist` folder to Netlify's dashboard.

## Environment Variables

No environment variables required for basic functionality.

## PWA Icons

Before deploying, add PWA icons to the `public` folder:
- `pwa-192x192.png` (192x192 pixels)
- `pwa-512x512.png` (512x512 pixels)

You can use any image editor or online tool to create these icons.

## Browser Requirements

- Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- HTTPS required for camera access (except localhost)
- Mobile browsers: iOS 11+, Android Chrome

## Known Limitations

- OpenCV.js Stitcher may not be available in all CDN builds - fallback to simple concatenation
- Camera access requires HTTPS in production
- Large panoramas may consume significant memory

## Performance Tips

- Use a device with sufficient RAM (2GB+ recommended)
- Close other browser tabs during processing
- For best results, use a device with a wide-angle camera

