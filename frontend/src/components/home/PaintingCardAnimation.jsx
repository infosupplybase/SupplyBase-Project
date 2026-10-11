import { useEffect, useRef } from 'react';
import '../../styles/painting-card-animation.css';

export default function PaintingCardAnimation() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

    let visible = false;

    const updatePlayback = () => {
      if (visible && !reducedMotion.matches && !document.hidden) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver(
          ([entry]) => {
            visible = entry.isIntersecting;
            updatePlayback();
          },
          { threshold: 0.2 }
        )
      : null;

    if (observer) {
      observer.observe(video);
    } else {
      visible = true;
      updatePlayback();
    }

    reducedMotion.addEventListener('change', updatePlayback);
    document.addEventListener('visibilitychange', updatePlayback);
    video.addEventListener('loadeddata', updatePlayback);

    return () => {
      observer?.disconnect();
      reducedMotion.removeEventListener('change', updatePlayback);
      document.removeEventListener('visibilitychange', updatePlayback);
      video.removeEventListener('loadeddata', updatePlayback);
      video.pause();
    };
  }, []);

  return (
    <span className="painting-card-video" aria-hidden="true">
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="metadata"
        tabIndex={-1}
        disablePictureInPicture
      >
        <source
          src="/assets/painting/painting-card.mp4?v=20261010154425"
          type="video/mp4"
        />
      </video>
    </span>
  );
}
