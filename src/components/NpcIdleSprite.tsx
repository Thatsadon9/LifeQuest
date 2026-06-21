/**
 * Guide NPC idle — cycles sprite frames in a fixed viewport.
 */
import { useEffect, useState } from 'react';

const FRAMES = [
  '/assets/npc-guide-idle/frame-01.png',
  '/assets/npc-guide-idle/frame-02.png',
  '/assets/npc-guide-idle/frame-03.png',
  '/assets/npc-guide-idle/frame-05.png',
] as const;

const FRAME_MS = 300;

const SIZES = {
  sm: 'npc-idle-viewport-sm',
  md: 'npc-idle-viewport-md',
} as const;

export interface NpcIdleSpriteProps {
  paused?: boolean;
  size?: keyof typeof SIZES;
  className?: string;
  label?: string;
}

export function NpcIdleSprite({
  paused = false,
  size = 'md',
  className = '',
  label,
}: NpcIdleSpriteProps) {
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
      className={`${SIZES[size]} ${className}`.trim()}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {FRAMES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          draggable={false}
          aria-hidden={i !== frame}
          className="npc-idle-frame"
          style={{ opacity: i === frame ? 1 : 0 }}
        />
      ))}
    </div>
  );
}

export default NpcIdleSprite;
