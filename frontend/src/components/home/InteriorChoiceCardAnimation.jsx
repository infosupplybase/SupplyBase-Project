import { useEffect, useRef } from 'react';
import '../../styles/interior-choice-card-animation.css';

export default function InteriorChoiceCardAnimation() {
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
    <span className="interior-choice-card-video" aria-hidden="true">
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
          src="/assets/interior-by-choice/interior-by-choice-card.mp4?v=20261010161319"
          type="video/mp4"
        />
      </video>
    </span>
  );
}
