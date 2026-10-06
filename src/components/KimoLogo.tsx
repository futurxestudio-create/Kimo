import React from 'react';

interface KimoLogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light';
}

export const KimoLogo: React.FC<KimoLogoProps> = ({
  className = '',
  showSubtitle = true,
  size = 'md',
  variant = 'dark',
}) => {
  const heightClasses = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-11',
    xl: 'h-14',
  };

  const primaryColor = variant === 'light' ? '#FFFFFF' : '#4C237A';
  const accentLilac = '#B588F7';
  const subtitleColor = variant === 'light' ? '#EADDFB' : '#6D3ACD';

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Official KiMO SVG Vector Mark */}
      <svg
        viewBox="0 0 290 95"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${heightClasses[size]} w-auto object-contain transition-transform`}
        aria-label="KiMO"
      >
        <defs>
          <linearGradient id="kimoSmileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8A42D8" />
            <stop offset="100%" stopColor="#B588F7" />
          </linearGradient>
        </defs>

        {/* Letter 'K' - Bold, Rounded, Chunky */}
        <path
          d="M20 12C20 6.477 24.477 2 30 2C35.523 2 40 6.477 40 12V78C40 83.523 35.523 88 30 88C24.477 88 20 83.523 20 78V12Z"
          fill={primaryColor}
        />
        <path
          d="M74 18C78.418 14.686 84.72 15.582 88.034 20C91.348 24.418 90.452 30.72 86.034 34.034L51 60L87.034 81.966C91.452 84.665 92.836 90.435 90.137 94.853C87.438 99.271 81.668 100.655 77.25 97.956L35 72V47L74 18Z"
          fill={primaryColor}
        />

        {/* Letter 'i' - Stem with curved bottom flow */}
        <path
          d="M98 38C98 32.477 102.477 28 108 28C113.523 28 118 32.477 118 38V74C118 79.523 113.523 84 108 84C102.477 84 98 79.523 98 74V38Z"
          fill={primaryColor}
        />
        {/* 'i' Dot Circle */}
        <circle cx="108" cy="12" r="10" fill={primaryColor} />

        {/* Letter 'M' - Rounded triple arch */}
        <path
          d="M136 38C136 32.477 140.477 28 146 28C151.523 28 156 32.477 156 38V76C156 81.523 151.523 86 146 86C140.477 86 136 81.523 136 76V38Z"
          fill={primaryColor}
        />
        <path
          d="M152 42C156 32 166 26 177 26C188 26 195 32 198 40C202 32 211 26 222 26C236 26 244 35 244 50V76C244 81.523 239.523 86 234 86C228.477 86 224 81.523 224 76V52C224 44 219 40 212 40C205 40 199 45 199 53V76C199 81.523 194.523 86 189 86C183.477 86 179 81.523 179 76V52C179 44 174 40 167 40C161 40 156 45 156 53V76C156 81.523 151.523 86 146 86C140.477 86 136 81.523 136 76V42H152Z"
          fill={primaryColor}
        />

        {/* Letter 'o' - Chunky round ring */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M272 26C287.464 26 300 38.536 300 54C300 69.464 287.464 82 272 82C256.536 82 244 69.464 244 54C244 38.536 256.536 26 272 26ZM272 42C265.373 42 260 47.373 260 54C260 60.627 265.373 66 272 66C278.627 66 284 60.627 284 54C284 47.373 278.627 42 272 42Z"
          fill={primaryColor}
        />

        {/* Playful Accent Smile Curve under KiMO */}
        <path
          d="M24 70C45 92 105 106 155 88C175 80 188 72 195 64C198.5 60 203 62 201 66C192 78 174 88 150 94C95 108 35 96 15 74C11 69 19 65 24 70Z"
          fill="url(#kimoSmileGradient)"
        />

        {/* Playful Sparkle / Apostrophe mark next to 'o' */}
        <path
          d="M288 12C288 8 293 4 297 7C301 10 305 18 303 24C301 30 294 30 292 26C290 22 288 17 288 12Z"
          fill={accentLilac}
        />
        <path
          d="M298 4C300 2 304 3 306 6C308 9 310 16 308 20C306 24 302 24 300 21C298 18 296 14 298 4Z"
          fill={accentLilac}
          opacity="0.8"
        />
      </svg>

      {/* Subtitle "3D STUDIO" */}
      {showSubtitle && (
        <div className="flex flex-col justify-center border-l-2 border-[#B588F7]/40 pl-2 py-0.5 leading-none">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#350463] font-brand">
            3D STUDIO
          </span>
          <span className="text-[8px] font-bold uppercase tracking-wider text-[#6D3ACD]/80">
            Manufactura Aditiva
          </span>
        </div>
      )}
    </div>
  );
};
