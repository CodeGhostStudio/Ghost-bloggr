'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const HOTLINK_LOGO_URL =
  'https://i.ibb.co/B10YY29/ce189eda-ae80-4d76-9c64-c72b0e7e7d73-removalai-preview.png';
const LOCAL_FALLBACK_LOGO_URL =
  '/assets/aistudio/ce189eda-ae80-4d76-9c64-c72b0e7e7d73_removalai_preview_f5235e22.png';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

interface GhostBloggrLogoProps {
  size?: LogoSize;
  onDarkSurface?: boolean;
  priority?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<LogoSize, string> = {
  xs: 'h-7 w-auto',
  sm: 'h-9 w-auto',
  md: 'h-10 sm:h-11 w-auto',
  lg: 'h-12 w-auto',
  icon: 'h-8 w-8',
};

export default function GhostBloggrLogo({
  size = 'md',
  onDarkSurface = false,
  priority = false,
  className = '',
}: GhostBloggrLogoProps) {
  const [src, setSrc] = useState(HOTLINK_LOGO_URL);

  return (
    <Image
      src={src}
      alt="Ghost Bloggr"
      width={523}
      height={600}
      priority={priority}
      referrerPolicy="no-referrer"
      onError={() => {
        if (src !== LOCAL_FALLBACK_LOGO_URL) {
          setSrc(LOCAL_FALLBACK_LOGO_URL);
        }
      }}
      className={`${SIZE_CLASSES[size]} object-contain select-none ${
        onDarkSurface ? '' : 'invert dark:invert-0'
      } ${className}`.trim()}
    />
  );
}
