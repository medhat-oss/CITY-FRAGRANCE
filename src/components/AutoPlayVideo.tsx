'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef, type VideoHTMLAttributes } from 'react';

export interface AutoPlayVideoProps extends VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
}

const AutoPlayVideo = forwardRef<HTMLVideoElement, AutoPlayVideoProps>(function AutoPlayVideo(
  { src, className, ...props },
  forwardedRef
) {
  const localRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(forwardedRef, () => localRef.current as HTMLVideoElement);

  useEffect(() => {
    const video = localRef.current;
    if (!video) return;

    // Enforce muted property directly on DOM element (solves Chrome & iOS Safari policy rejection)
    video.defaultMuted = true;
    video.muted = true;

    // Explicitly call .play() to bypass React hydration timing quirks
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log('Autoplay prevented:', error);
      });
    }
  }, [src]);

  return (
    <video
      ref={localRef}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      suppressHydrationWarning
      className={className}
      {...props}
    />
  );
});

export default AutoPlayVideo;
