/**
 * Pixel-art hero portrait frame — scene background + idle sprite.
 */
import { HeroIdleSprite } from './HeroIdleSprite';

const SIZES = {
  /** Today box + character sheet header — fixed width, never full-bleed. */
  md: 'w-[7.5rem] shrink-0 sm:w-44 md:w-52',
  /** Larger portrait for wide layouts only. */
  lg: 'w-[8.5rem] shrink-0 sm:w-52 md:w-60 lg:w-64',
} as const;

export interface HeroPortraitProps {
  size?: keyof typeof SIZES;
  paused?: boolean;
  label?: string;
  className?: string;
}

export function HeroPortrait({
  size = 'md',
  paused = false,
  label,
  className = '',
}: HeroPortraitProps) {
  return (
    <div
      className={`relative aspect-square overflow-hidden border-[var(--brutal-ink)] ${SIZES[size]} ${className}`.trim()}
      style={{ imageRendering: 'pixelated' }}
    >
      <img
        src="/assets/hero-scene-bg.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <HeroIdleSprite
        paused={paused}
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        label={label}
      />
    </div>
  );
}

export default HeroPortrait;
