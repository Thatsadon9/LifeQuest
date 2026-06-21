/**
 * Hero idle animation — cycles split frames in a fixed viewport so the
 * character stays anchored (no horizontal sprite-sheet drift).
 */
import { useEffect, useState } from 'react';

const FRAMES = [
  '/assets/hero-idle/frame-01.png',
  '/assets/hero-idle/frame-02.png',
  '/assets/hero-idle/frame-03.png',
  '/assets/hero-idle/frame-04.png',
  '/assets/hero-idle/frame-05.png',
  '/assets/hero-idle/frame-06.png',
] as const;

const FRAME_MS = 240;

export interface HeroIdleSpriteProps {
  paused?: boolean;
  className?: string;
  /** Accessible label for the animated portrait. */
  label?: string;
}

export function HeroIdleSprite({ paused = false, className = '', label }: HeroIdleSpriteProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setFrame((i) => (i + 1) % FRAMES.length);
    }, FRAME_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      className={`hero-idle-viewport ${className}`.trim()}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <img
        src={FRAMES[frame]}
        alt=""
        draggable={false}
        className="hero-idle-frame"
      />
    </div>
  );
}

export default HeroIdleSprite;
